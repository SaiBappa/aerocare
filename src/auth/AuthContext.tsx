import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Session } from '@supabase/supabase-js';

export type UserRole = 'staff' | 'dashboard' | 'admin' | 'stakeholder';

export interface AppUser {
    id: string;
    email: string;
    display_name: string;
    role: UserRole;
    active: number;
}

interface AuthContextValue {
    user: AppUser | null;
    session: Session | null;
    login: (password: string, email?: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isLoading: boolean;
    canWrite: boolean;
    canDelete: boolean;
    hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(mapUserFromSession(session));
            setIsLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(mapUserFromSession(session));
        });

        return () => subscription.unsubscribe();
    }, []);

    const mapUserFromSession = (session: Session | null): AppUser | null => {
        if (!session?.user) return null;
        return {
            id: session.user.id,
            email: session.user.email || '',
            display_name: session.user.user_metadata?.display_name || session.user.email,
            role: session.user.app_metadata?.role as UserRole || 'staff',
            active: session.user.app_metadata?.active ?? 1
        };
    };

    const login = async (password: string, email?: string): Promise<{ success: boolean; error?: string }> => {
        if (!email) {
            // To be backwards compatible with the old login signature where it was 'username', 'password'
            // We can't really do anything without email, so let's enforce email
            return { success: false, error: 'Email is required' };
        }
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user.app_metadata?.active === 0) {
            await supabase.auth.signOut();
            return { success: false, error: 'Account is suspended' };
        }

        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const role = user?.role;
    // canWrite and canDelete based on role
    // Admins and Dashboard users can generally write (depending on what they do), maybe Staff can't
    const canWrite = role === 'admin' || role === 'dashboard';
    const canDelete = role === 'admin';

    const hasRole = (roles: UserRole[]) => {
        if (!role) return false;
        // admin can do everything by our RBAC design
        if (role === 'admin') return true;
        return roles.includes(role);
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            login,
            logout,
            isLoading,
            canWrite,
            canDelete,
            hasRole
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
