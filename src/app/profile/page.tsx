'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { ATTENTION_LEVELS } from '@/lib/attentionLevels';
import { VIBES } from '@/lib/filters';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const { preferences, loading, error, updatePreferences } = useUserPreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Handle authentication redirect in useEffect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  const handleAttentionLevelChange = async (level: string) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(null);
      await updatePreferences({
        preferred_attention_level: level === preferences?.preferred_attention_level ? null : level
      });
      setSaveSuccess('Attention level preference updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError('Failed to update attention level preference');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVibeChange = async (vibe: string) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(null);
      const currentVibes = preferences?.preferred_vibes || [];
      const newVibes = currentVibes.includes(vibe)
        ? currentVibes.filter(v => v !== vibe)
        : [...currentVibes, vibe];
      await updatePreferences({ preferred_vibes: newVibes });
      setSaveSuccess('Vibe preferences updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError('Failed to update vibe preferences');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setSaveError('Failed to sign out. Please try again.');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>Error loading preferences: {error.message}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={`px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors ${
            isSigningOut ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg border border-green-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {saveSuccess}
          </div>
        </div>
      )}

      {/* Error Message */}
      {saveError && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {saveError}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Account Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Email Address</label>
              <p className="mt-1 text-lg">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Member Since</label>
              <p className="mt-1 text-lg">{new Date(user.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
        </div>

        {/* Attention Level Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Preferred Attention Level</h2>
          <p className="text-gray-600 mb-6">
            Select your default attention level for personalized content recommendations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ATTENTION_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => handleAttentionLevelChange(level.id)}
                disabled={isSaving}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  preferences?.preferred_attention_level === level.id
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md'
                    : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-3xl mb-2">{level.icon}</div>
                <h3 className="font-medium text-lg">{level.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Vibe Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Preferred Vibes</h2>
          <p className="text-gray-600 mb-6">
            Select multiple vibes that match your content preferences. These will be used to tailor your recommendations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VIBES.map((vibe) => (
              <button
                key={vibe.id}
                onClick={() => handleVibeChange(vibe.id)}
                disabled={isSaving}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  preferences?.preferred_vibes?.includes(vibe.id)
                    ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-md'
                    : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-3xl mb-2">{vibe.icon}</div>
                <h3 className="font-medium text-lg">{vibe.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{vibe.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/collections')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              View My Collections
            </button>
            <button
              onClick={() => router.push('/recommendations')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Get Recommendations
            </button>
            <button
              onClick={() => router.push('/discover')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              Discover Movies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 