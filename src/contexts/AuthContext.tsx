import { createContext, useContext, useEffect, useState } from 'react';
import { User, getCurrentUser, isAuthenticated, onAuthStateChange, signIn, signOut, signUp } from '@/lib/pocketbase';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signOut: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(getCurrentUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('AuthProvider: initializing auth state');
        const checkAuth = async () => {
            try {
                const currentUser = getCurrentUser();
                console.log('AuthProvider: current user:', currentUser ? 'exists' : 'null');
                setUser(currentUser);
            } catch (error) {
                console.error('AuthProvider: error getting current user:', error);
            } finally {
                console.log('AuthProvider: setting loading to false');
                setLoading(false);
            }
        };

        // Immediately check authentication state
        checkAuth();

        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChange((authenticated) => {
            console.log('AuthProvider: auth state changed, authenticated:', authenticated);
            setUser(authenticated ? getCurrentUser() : null);
            setLoading(false);
        });

        return () => {
            // This is just a placeholder - onAuthStateChange doesn't actually return an unsubscribe function
            // but it's good practice to handle cleanup if the API changes in the future
        };
    }, []);

    const handleSignIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            await signIn(email, password);
            setUser(getCurrentUser());
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (email: string, password: string, name: string) => {
        try {
            setLoading(true);
            await signUp(email, password, name);
            await signIn(email, password);
            setUser(getCurrentUser());
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        setLoading(true);
        signOut();
        setUser(null);
        setLoading(false);
    };

    const value = {
        user,
        isAuthenticated: isAuthenticated(),
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 