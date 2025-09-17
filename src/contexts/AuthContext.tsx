import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        const user = session?.user;
        if (!user) {
            setProfile(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error.message);
                setProfile(null);
            } else if (data) {
                setProfile(data as UserProfile);
            }
        } catch (error) {
            console.error('Exception fetching profile:', error);
            setProfile(null);
        }
    }, [session]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event, session ? session.user.email : 'null session');
            setSession(session);
        });

        // Fetch initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('🔐 Initial session loaded:', session ? session.user.email : 'null session');
            setSession(session);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (session) {
            fetchProfile();
        } else {
            setProfile(null);
        }
    }, [session, fetchProfile]);
    
    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
    };

    const value = {
        user: session?.user ?? null,
        profile,
        loading: loading || (!!session && !profile), // Consider loading until profile is also fetched
        signOut,
        fetchProfile,
        refreshProfile: fetchProfile,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
