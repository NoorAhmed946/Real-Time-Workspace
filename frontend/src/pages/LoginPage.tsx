import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getGoogleLoginUrl } from '../lib/api';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { authorization_url } = await getGoogleLoginUrl();
      window.location.href = authorization_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start Google login');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-surface">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed blur-[120px] rounded-full"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-secondary-fixed blur-[100px] rounded-full"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="bg-surface-container-lowest rounded-xl p-10 shadow-editorial border border-outline-variant/10">
          <div className="text-center mb-10">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-3">
              Welcome back to SyncLayer
            </h1>
            <p className="font-body text-on-surface-variant text-sm tracking-wide">
              Securely access your collaborative documents.
            </p>
          </div>

          <div className="space-y-6">
            {error && (
              <p className="text-sm text-error text-center font-body">{error}</p>
            )}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-label font-semibold text-sm transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-60"
            >
              <svg aria-hidden="true" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              {loading ? 'Redirecting...' : 'Continue with Google'}
            </button>

            <div className="text-center px-4">
              <p className="font-body text-xs leading-relaxed text-on-surface-variant">
                You will be redirected to Google to sign in.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-8 right-8">
        <button
          type="button"
          className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all shadow-sm border border-outline-variant/20"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}
