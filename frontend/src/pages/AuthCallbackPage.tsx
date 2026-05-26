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
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#03060f] text-slate-100 font-body">
        <div className="bg-slate-950/65 backdrop-blur-2xl rounded-2xl p-8 border border-slate-800/80 shadow-[0_0_50px_-12px_rgba(0,112,234,0.15)] text-center max-w-[400px] w-full">
          <p className="text-red-400 font-body mb-6 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-label font-bold text-sm shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Back to login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#03060f] text-slate-100 font-body">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-headline text-lg font-bold tracking-tight text-slate-300 animate-pulse">Completing sign in...</p>
      </div>
    </main>
  );
}
