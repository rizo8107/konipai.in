import { createContext, useContext, useEffect, useState } from 'react';
import { User, getCurrentUser, isAuthenticated, onAuthStateChange, signIn, signOut, signUp, signInWithGoogle } from '@/lib/pocketbase';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
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

    const handleSignInWithGoogle = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            setUser(getCurrentUser());
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (email: string, password: string, name: string) => {
        try {
            setLoading(true);
            console.log('Starting signup process for:', email);
            
            // Create the user
            const userData = {
                email,
                password,
                passwordConfirm: password,
                name,
                emailVisibility: true
            };
            
            const user = await signUp(email, password, name);
            console.log('User created successfully:', user.id);
            
            // Authenticate the user
            await signIn(email, password);
            console.log('User authenticated after signup');
            
            // Update the user state
            setUser(getCurrentUser());
        } catch (error: any) {
            console.error('Signup error:', error);
            
            // Extract error message from PocketBase response
            let errorMessage = 'Failed to create account. Please try again.';
            if (error.response?.data) {
                const messages = [];
                for (const field in error.response.data) {
                    messages.push(`${field}: ${error.response.data[field].message}`);
                }
                errorMessage = messages.join(', ');
            }
            
            throw new Error(errorMessage);
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
        signInWithGoogle: handleSignInWithGoogle,
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