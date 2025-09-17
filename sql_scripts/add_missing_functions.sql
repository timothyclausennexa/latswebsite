-- Add missing database functions

-- Create function to add coins to user profile
CREATE OR REPLACE FUNCTION public.add_coins(coins_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET coins = coins + coins_to_add,
        updated_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to buy skin
CREATE OR REPLACE FUNCTION public.buy_skin(skin_id TEXT)
RETURNS JSON AS $$
DECLARE
    user_profile public.profiles;
    skin_data public.skins;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM public.profiles WHERE id = auth.uid();

    IF user_profile IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User profile not found');
    END IF;

    -- Get skin data
    SELECT * INTO skin_data FROM public.skins WHERE id = skin_id;

    IF skin_data IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Skin not found');
    END IF;

    -- Check if user already owns the skin
    IF skin_id = ANY(user_profile.owned_skins) THEN
        RETURN json_build_object('success', false, 'message', 'You already own this skin');
    END IF;

    -- Check if user has enough coins
    IF user_profile.coins < skin_data.price THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient coins');
    END IF;

    -- Purchase the skin
    UPDATE public.profiles
    SET coins = coins - skin_data.price,
        owned_skins = array_append(owned_skins, skin_id),
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN json_build_object(
        'success', true,
        'message', 'Skin purchased successfully!',
        'remaining_coins', user_profile.coins - skin_data.price
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to equip skin
CREATE OR REPLACE FUNCTION public.equip_skin(skin_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile public.profiles;
BEGIN
    SELECT * INTO user_profile FROM public.profiles WHERE id = auth.uid();

    IF user_profile IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Check if user owns the skin
    IF NOT (skin_id = ANY(user_profile.owned_skins)) THEN
        RAISE EXCEPTION 'You do not own this skin';
    END IF;

    -- Equip the skin
    UPDATE public.profiles
    SET current_skin = skin_id,
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;