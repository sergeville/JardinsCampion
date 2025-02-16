import { useState, useEffect } from 'react';
import { AuthError } from '@/lib/errors/types';
import { IUser } from '@/models/User';

interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  error: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    error: null,
    isLoading: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      const response = await fetch('/api/auth/verify');
      if (!response.ok) {
        setState({
          isAuthenticated: false,
          user: null,
          error: 'Authentication failed',
          isLoading: false,
        });
        return;
      }

      const data = await response.json();
      setState({
        isAuthenticated: true,
        user: data.user,
        error: null,
        isLoading: false,
      });
    };

    checkAuth();
  }, []);

  return state;
}
