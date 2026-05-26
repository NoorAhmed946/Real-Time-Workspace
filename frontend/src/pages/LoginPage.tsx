import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getGoogleLoginUrl } from '../lib/api';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

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
    <main
      ref={pageRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-surface dark:bg-[#03060f] text-on-surface dark:text-slate-100 font-body antialiased transition-colors duration-300"
    >
      {/* Global Cursor Following Spotlight Gradient */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none -z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, var(--color-spotlight-1), var(--color-spotlight-2) 40%, transparent 80%)`,
          }}
        />
      )}

      {/* Ambient Dark Blue and Purple Blurs */}
      <div className="absolute inset-0 -z-20 pointer-events-none opacity-20 dark:opacity-30 transition-opacity duration-300">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-300/20 dark:bg-blue-900/30 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-indigo-300/15 dark:bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="bg-white dark:bg-slate-950/65 backdrop-blur-2xl rounded-2xl p-10 border border-outline-variant/60 dark:border-slate-800/80 shadow-editorial dark:shadow-[0_0_50px_-12px_rgba(0,112,234,0.15)] transition-all duration-300">
          {/* Custom Brand Rotating Minimal Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 relative">
              <div className="absolute inset-0.5 bg-white dark:bg-[#03060f] rounded-[14px] flex items-center justify-center transition-colors duration-300">
                <div className="relative w-7 h-7">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-full opacity-60"
                  />
                  <div className="absolute inset-1.5 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-lg shadow-md flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white tracking-tighter">S</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface dark:text-white mb-3">
              Welcome back to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">SyncLayer</span>
            </h1>
            <p className="font-body text-on-surface-variant dark:text-slate-450 text-sm leading-relaxed">
              Securely access your collaborative documents.
            </p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-error-container/20 dark:bg-red-950/40 border border-error/20 dark:border-red-800/40 text-sm text-error dark:text-red-300 text-center font-body">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-outline-variant dark:border-slate-800 text-on-surface dark:text-slate-100 font-label font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] hover:scale-[1.01] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-on-surface dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="text-center px-4">
              <p className="font-body text-xs leading-relaxed text-on-surface-variant dark:text-slate-405">
                You will be redirected to Google to sign in.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-8 right-8">
        <button
          type="button"
          className="w-12 h-12 rounded-full bg-surface-container-high dark:bg-slate-900/80 hover:bg-surface-container-highest dark:hover:bg-slate-800/80 flex items-center justify-center text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-slate-200 transition-all shadow-md border border-outline-variant/60 dark:border-slate-800/80 backdrop-blur-md active:scale-95 cursor-pointer"
          aria-label="Help and Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}
