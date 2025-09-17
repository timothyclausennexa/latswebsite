import React from 'react';
import { supabase } from './supabaseClient';

interface SiteConfig {
    TOKEN_CONTRACT_ADDRESS: string | null;
    PUMP_FUN_LINK: string | null;
    LIVE_STREAM_LINK: string | null;
}

class ConfigManager {
    private config: SiteConfig = {
        TOKEN_CONTRACT_ADDRESS: null,
        PUMP_FUN_LINK: null,
        LIVE_STREAM_LINK: null
    };

    private listeners: Set<(config: SiteConfig) => void> = new Set();
    private initialized = false;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        // Load initial config
        await this.loadConfig();

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
                async (payload) => {
                    console.log('Config update received:', payload);
                    await this.loadConfig();
                    this.notifyListeners();
                }
            )
            .subscribe();

        // Listen for manual update events
        window.addEventListener('configUpdated', () => {
            this.loadConfig();
        });

        this.initialized = true;
    }

    private async loadConfig() {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('key, value');

            if (data && !error) {
                data.forEach(item => {
                    switch (item.key) {
                        case 'token_contract_address':
                            this.config.TOKEN_CONTRACT_ADDRESS = item.value;
                            break;
                        case 'pump_fun_link':
                            this.config.PUMP_FUN_LINK = item.value;
                            break;
                        case 'live_stream_link':
                            this.config.LIVE_STREAM_LINK = item.value;
                            break;
                    }
                });

                this.notifyListeners();
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.config));
    }

    public getConfig(): SiteConfig {
        return { ...this.config };
    }

    public subscribe(listener: (config: SiteConfig) => void) {
        this.listeners.add(listener);
        // Immediately call with current config
        listener(this.config);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    public async waitForInit(): Promise<void> {
        if (this.initialized) return;

        // Wait for initialization
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.initialized) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
}

// Create singleton instance
export const configManager = new ConfigManager();

// Export a hook for React components
export const useConfig = () => {
    const [config, setConfig] = React.useState(configManager.getConfig());

    React.useEffect(() => {
        const unsubscribe = configManager.subscribe(setConfig);
        return unsubscribe;
    }, []);

    return config;
};

// For backward compatibility with existing code
export const CONFIG = new Proxy({} as SiteConfig, {
    get: (target, prop) => {
        const config = configManager.getConfig();
        return config[prop as keyof SiteConfig];
    }
});