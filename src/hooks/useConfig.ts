import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SiteConfig {
    TOKEN_CONTRACT_ADDRESS: string | null;
    TOKEN_LOCKED: boolean;
    PUMP_FUN_LINK: string | null;
    LIVE_STREAM_LINK: string | null;
    TELEGRAM_LINK: string;
    X_LINK: string;
}

// Default config values
const DEFAULT_CONFIG: SiteConfig = {
    TOKEN_CONTRACT_ADDRESS: null,
    TOKEN_LOCKED: false,
    PUMP_FUN_LINK: null,
    LIVE_STREAM_LINK: null,
    TELEGRAM_LINK: "https://t.me/freelats",
    X_LINK: "https://x.com/freelats",
};

// Global config state
let globalConfig = { ...DEFAULT_CONFIG };
const listeners = new Set<(config: SiteConfig) => void>();

// Load config from database
async function loadConfig() {
    try {
        const { data, error } = await supabase
            .from('site_config')
            .select('key, value');

        if (data && !error) {
            const newConfig = { ...DEFAULT_CONFIG };

            data.forEach(item => {
                switch (item.key) {
                    case 'token_contract_address':
                        newConfig.TOKEN_CONTRACT_ADDRESS = item.value;
                        newConfig.TOKEN_LOCKED = !!item.value; // Auto-lock if CA is set
                        break;
                    case 'pump_fun_link':
                        newConfig.PUMP_FUN_LINK = item.value;
                        break;
                    case 'live_stream_link':
                        newConfig.LIVE_STREAM_LINK = item.value;
                        break;
                }
            });

            globalConfig = newConfig;
            notifyListeners();
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

function notifyListeners() {
    listeners.forEach(listener => listener(globalConfig));
}

// Initialize config loading
loadConfig();

// Setup real-time subscription
const subscription = supabase
    .channel('config_changes')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'site_config'
        },
        async () => {
            await loadConfig();
        }
    )
    .subscribe();

// Listen for manual update events
if (typeof window !== 'undefined') {
    window.addEventListener('configUpdated', () => {
        loadConfig();
    });
}

// Hook for React components
export function useConfig(): SiteConfig {
    const [config, setConfig] = useState(globalConfig);

    useEffect(() => {
        listeners.add(setConfig);
        // Set initial value
        setConfig(globalConfig);

        return () => {
            listeners.delete(setConfig);
        };
    }, []);

    return config;
}

// For backward compatibility - export a static CONFIG object
export const CONFIG = new Proxy({} as SiteConfig, {
    get: (target, prop) => {
        return globalConfig[prop as keyof SiteConfig];
    }
});