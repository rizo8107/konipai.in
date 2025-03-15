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
        // Subscribe to auth state changes
        onAuthStateChange((authenticated) => {
            setUser(authenticated ? getCurrentUser() : null);
            setLoading(false);
        });
    }, []);

    const handleSignIn = async (email: string, password: string) => {
        await signIn(email, password);
        setUser(getCurrentUser());
    };

    const handleSignUp = async (email: string, password: string, name: string) => {
        await signUp(email, password, name);
        await handleSignIn(email, password);
    };

    const handleSignOut = () => {
        signOut();
        setUser(null);
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