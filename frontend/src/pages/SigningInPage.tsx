import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

export default function SigningInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
      <div className="relative w-full max-w-sm flex flex-col items-center text-center space-y-8">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150"></div>
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute inset-0 border-4 border-surface-container-highest rounded-full"></div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full"
            />
            <div className="flex items-center justify-center w-16 h-16 bg-surface-container-lowest rounded-full shadow-sm">
              <ShieldCheck className="w-8 h-8 text-primary fill-primary/10" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
            Signing in...
          </h1>
          <p className="font-body text-on-surface-variant text-sm max-w-[280px] mx-auto leading-relaxed">
            Connecting to your editorial workspace. This will only take a moment.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 px-8 opacity-20">
          <div className="h-2 w-full bg-surface-container-highest rounded-full"></div>
          <div className="h-2 w-2/3 bg-surface-container-highest rounded-full mx-auto"></div>
        </div>
      </div>

      <footer className="fixed bottom-8 w-full text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface-container-low rounded-full">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
          <span className="font-label text-xs font-medium text-on-surface-variant tracking-wide">
            SECURE AUTHENTICATION ACTIVE
          </span>
        </div>
      </footer>
    </main>
  );
}
