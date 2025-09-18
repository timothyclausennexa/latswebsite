-- MAYO MEN TIMER AND TRADING SYSTEM (FIXED)
-- This creates the tables and functions for the real-time timer and buy/sell tracking

-- Drop existing table if it exists (for clean install)
DROP TABLE IF EXISTS public.timer_state CASCADE;
DROP TABLE IF EXISTS public.buy_sell_events CASCADE;

-- Create timer_state table for storing the current timer
CREATE TABLE public.timer_state (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensure only one row
    time_seconds INTEGER NOT NULL DEFAULT 360000, -- 100 hours in seconds
    is_running BOOLEAN DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    timer_started_at TIMESTAMP WITH TIME ZONE,
    manual_override BOOLEAN DEFAULT false
);

-- Insert initial timer state
INSERT INTO public.timer_state (time_seconds, is_running)
VALUES (360000, false)
ON CONFLICT (id) DO NOTHING;

-- Create buy_sell_events table for tracking trades
CREATE TABLE public.buy_sell_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(10) CHECK (event_type IN ('buy', 'sell')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    sol_amount DECIMAL(10,4),
    impact_hours DECIMAL(5,2) NOT NULL, -- Hours added/removed from timer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_buy_sell_events_created_at ON public.buy_sell_events(created_at DESC);
CREATE INDEX idx_buy_sell_events_type ON public.buy_sell_events(event_type);

-- Enable RLS
ALTER TABLE public.timer_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buy_sell_events ENABLE ROW LEVEL SECURITY;

-- Timer state policies
DROP POLICY IF EXISTS "Anyone can read timer state" ON public.timer_state;
DROP POLICY IF EXISTS "Admins can update timer state" ON public.timer_state;

CREATE POLICY "Anyone can read timer state"
ON public.timer_state
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can update timer state"
ON public.timer_state
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    )
);

-- Buy/sell events policies
DROP POLICY IF EXISTS "Anyone can read buy sell events" ON public.buy_sell_events;
DROP POLICY IF EXISTS "Admins can insert buy sell events" ON public.buy_sell_events;

CREATE POLICY "Anyone can read buy sell events"
ON public.buy_sell_events
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can insert buy sell events"
ON public.buy_sell_events
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    )
);

-- Function to update timer based on buy/sell
CREATE OR REPLACE FUNCTION public.process_trade_event(
    p_event_type TEXT,
    p_amount DECIMAL,
    p_sol_amount DECIMAL DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_impact_hours DECIMAL;
    v_impact_seconds INTEGER;
    v_new_time INTEGER;
    v_event_id BIGINT;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized'
        );
    END IF;

    -- Calculate impact based on event type
    IF p_event_type = 'buy' THEN
        v_impact_hours := 2.0; -- Buys add 2 hours
    ELSIF p_event_type = 'sell' THEN
        v_impact_hours := -0.5; -- Sells remove 0.5 hours
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid event type'
        );
    END IF;

    v_impact_seconds := (v_impact_hours * 3600)::INTEGER;

    -- Insert the event
    INSERT INTO public.buy_sell_events (event_type, amount, sol_amount, impact_hours, created_by)
    VALUES (p_event_type, p_amount, p_sol_amount, v_impact_hours, auth.uid())
    RETURNING id INTO v_event_id;

    -- Update the timer
    UPDATE public.timer_state
    SET
        time_seconds = GREATEST(0, time_seconds + v_impact_seconds),
        last_updated = NOW()
    WHERE id = 1
    RETURNING time_seconds INTO v_new_time;

    RETURN json_build_object(
        'success', true,
        'event_id', v_event_id,
        'new_time_seconds', v_new_time,
        'impact_hours', v_impact_hours
    );
END;
$$;

-- Function to manually set timer
CREATE OR REPLACE FUNCTION public.set_timer_manually(
    p_hours INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_seconds INTEGER;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized'
        );
    END IF;

    v_new_seconds := p_hours * 3600;

    -- Update the timer
    UPDATE public.timer_state
    SET
        time_seconds = v_new_seconds,
        last_updated = NOW(),
        manual_override = true
    WHERE id = 1;

    RETURN json_build_object(
        'success', true,
        'new_time_seconds', v_new_seconds,
        'new_time_hours', p_hours
    );
END;
$$;

-- Function to start/stop timer
CREATE OR REPLACE FUNCTION public.toggle_timer(
    p_running BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized'
        );
    END IF;

    -- Update the timer state
    UPDATE public.timer_state
    SET
        is_running = p_running,
        timer_started_at = CASE WHEN p_running THEN NOW() ELSE timer_started_at END,
        last_updated = NOW()
    WHERE id = 1;

    RETURN json_build_object(
        'success', true,
        'is_running', p_running
    );
END;
$$;

-- Function to get current timer state
CREATE OR REPLACE FUNCTION public.get_timer_state()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result RECORD;
    v_elapsed_seconds INTEGER;
    v_current_seconds INTEGER;
BEGIN
    SELECT * INTO v_result FROM public.timer_state WHERE id = 1;

    -- If timer is running, calculate elapsed time
    IF v_result.is_running AND v_result.timer_started_at IS NOT NULL THEN
        v_elapsed_seconds := EXTRACT(EPOCH FROM (NOW() - v_result.timer_started_at))::INTEGER;
        v_current_seconds := GREATEST(0, v_result.time_seconds - v_elapsed_seconds);
    ELSE
        v_current_seconds := v_result.time_seconds;
    END IF;

    RETURN json_build_object(
        'current_time_seconds', v_current_seconds,
        'is_running', v_result.is_running,
        'last_updated', v_result.last_updated,
        'manual_override', v_result.manual_override
    );
END;
$$;

-- Enable realtime for timer updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.timer_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buy_sell_events;

-- Grant necessary permissions
GRANT ALL ON public.timer_state TO authenticated;
GRANT ALL ON public.buy_sell_events TO authenticated;
GRANT USAGE ON SEQUENCE public.buy_sell_events_id_seq TO authenticated;