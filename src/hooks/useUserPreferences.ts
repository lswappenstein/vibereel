import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { api } from '@/lib/api';
import type { Database } from '@/lib/supabase';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPreferences() {
      if (!user) {
        setPreferences(null);
        setLoading(false);
        return;
      }

      try {
        const data = await api.preferences.get(user.id);
        setPreferences(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch preferences'));
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, [user]);

  const updatePreferences = async (updates: Partial<Database['public']['Tables']['user_preferences']['Update']>) => {
    if (!user) throw new Error('User must be logged in to update preferences');

    try {
      const updatedPreferences = await api.preferences.update(user.id, updates);
      setPreferences(updatedPreferences);
      setError(null);
      return updatedPreferences;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update preferences');
      setError(error);
      throw error;
    }
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
  };
} 