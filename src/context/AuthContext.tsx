import { createContext, useContext, useEffect, useState } from 'react';
import { pocketbase } from '@/lib/pocketbase';
import { User } from '@/lib/pocketbase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    // Subscribe to auth state changes
    pocketbase.authStore.onChange(() => {
      checkUser();
    });
  }, []);

  async function checkUser() {
    try {
      if (pocketbase.authStore.isValid) {
        const currentUser = pocketbase.authStore.model as User;
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    await pocketbase.collection('users').authWithPassword(email, password);
    await checkUser();
  }

  async function register(email: string, password: string, name: string) {
    await pocketbase.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
    });
    await login(email, password);
  }

  async function logout() {
    pocketbase.authStore.clear();
    setUser(null);
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}