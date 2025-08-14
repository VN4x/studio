"use client";

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { storage } from '@/lib/storage';
import type { AppUser } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const currentUser = storage.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple authentication - in a real app, this would be more secure
    const validCredentials = [
      { email: 'manager@clearvue.dev', password: '****' },
      { email: 'team@clearvue.dev', password: '*****' }
    ];

    const isValid = validCredentials.some(
      cred => cred.email === email && cred.password === password
    );

    if (isValid) {
      const foundUser = storage.getUserByEmail(email);
      if (foundUser) {
        setUser(foundUser);
        storage.setCurrentUser(foundUser);
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    storage.clearCurrentUser();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary animate-pulse">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
