import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setTokens } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setError(err);
      return;
    }

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setError('Missing authentication tokens from server.');
      return;
    }

    setTokens(accessToken, refreshToken);
    refreshUser().then(() => {
      navigate('/documents', { replace: true });
    });
  }, [searchParams, navigate, refreshUser]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-error font-body mb-4">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="jewel-button px-6 py-2"
        >
          Back to login
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
      <p className="font-headline text-xl font-bold text-on-surface">Signing in...</p>
    </main>
  );
}
