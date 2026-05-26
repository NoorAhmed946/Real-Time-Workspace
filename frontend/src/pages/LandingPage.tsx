import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bolt, Shield, Users, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden group rounded-3xl ${className}`}
    >
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 -z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 112, 234, 0.22), rgba(99, 102, 241, 0.05) 40%, transparent 80%)`
        }}
      />
      {children}
    </div>
  );
}

export default function LandingPage() {
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

  return (
    <div 
      ref={pageRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pt-16 bg-surface dark:bg-[#03060f] text-on-surface dark:text-slate-100 min-h-screen relative overflow-hidden font-body antialiased flex flex-col transition-colors duration-300"
    >
      {/* Global Cursor Following Spotlight Gradient */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none -z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, var(--color-spotlight-1), var(--color-spotlight-2) 35%, transparent 80%)`
          }}
        />
      )}

      {/* Hero Section */}
      <section className="relative min-h-[870px] flex items-center justify-center px-6 overflow-hidden">
        {/* Ambient Dark Blue and Purple Blurs */}
        <div className="absolute inset-0 -z-20 pointer-events-none opacity-20 dark:opacity-40 transition-opacity duration-300">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-300/30 dark:bg-blue-900/35 rounded-full blur-[140px]" />
          <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-indigo-300/20 dark:bg-indigo-900/25 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-5xl w-full text-center space-y-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-3.5 py-1 rounded-full bg-surface-container-high/80 dark:bg-slate-900/80 border border-outline-variant/30 dark:border-slate-805/40 mb-4 transition-colors duration-300"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2"></span>
            <span className="text-[10px] font-bold tracking-widest uppercase font-label text-on-surface-variant dark:text-slate-400">v2.0 Collaboration Engine Live</span>
          </motion.div>

          <div className="relative w-full py-4">
            {/* Top-Left Glowing Circle behind "Collaborate in Real-Time" */}
            <div 
              className="absolute top-[-20%] left-[5%] md:left-[18%] w-[220px] h-[220px] md:w-[380px] md:h-[380px] rounded-full pointer-events-none -z-10 opacity-60 dark:opacity-100 transition-opacity duration-300"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(0, 89, 187, 0.08) 50%, transparent 80%)',
                filter: 'blur(30px)',
              }}
            />
            {/* Bottom-Right Glowing Circle behind "with SyncLayer" */}
            <div 
              className="absolute bottom-[-20%] right-[5%] md:right-[18%] w-[220px] h-[220px] md:w-[380px] md:h-[380px] rounded-full pointer-events-none -z-10 opacity-60 dark:opacity-100 transition-opacity duration-300"
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 80%)',
                filter: 'blur(30px)',
              }}
            />

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface dark:text-white leading-[1.1] relative z-10 transition-colors duration-300"
            >
              Collaborate in Real-Time <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 italic">
                with SyncLayer
              </span>
            </motion.h1>
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-body text-lg md:text-xl text-on-surface-variant dark:text-slate-400 max-w-2xl mx-auto leading-relaxed transition-colors duration-300"
          >
            The simplest way to edit documents together, seamlessly. Designed for focus, engineered for speed.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/login" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-label font-bold text-lg rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
              Get Started
            </Link>
            <button className="px-8 py-4 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-headline font-bold text-lg rounded-xl border border-outline-variant/60 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm dark:shadow-none transition-all cursor-pointer">
              Watch Demo
            </button>
          </motion.div>

          {/* Product Preview Card (Dark Mode Editor Layout) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative mx-auto max-w-4xl"
          >
            <div className="aspect-video bg-white dark:bg-slate-950/80 rounded-2xl shadow-editorial dark:shadow-2xl border border-outline-variant/60 dark:border-slate-800/40 p-2 overflow-hidden transition-all duration-300">
              <div className="w-full h-full rounded-xl bg-slate-55 dark:bg-[#0b0f19] flex overflow-hidden border border-outline-variant/30 dark:border-slate-900 transition-colors duration-300">
                <div className="w-16 h-full bg-slate-100 dark:bg-slate-955/80 flex flex-col items-center py-6 gap-6 border-r border-outline-variant/30 dark:border-slate-800/40 transition-colors duration-300">
                  <div className="w-6 h-6 bg-blue-500 rounded opacity-60"></div>
                  <div className="w-6 h-6 bg-slate-300 dark:bg-slate-700 rounded opacity-30"></div>
                  <div className="w-6 h-6 bg-slate-300 dark:bg-slate-700 rounded opacity-30"></div>
                </div>
                <div className="flex-1 p-10 text-left bg-gradient-to-br from-white to-slate-50 dark:from-[#0c101c] dark:to-[#080b13] transition-colors duration-300">
                  <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800/50 rounded-md mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-slate-200/60 dark:bg-slate-800/30 rounded"></div>
                    <div className="h-4 w-full bg-slate-200/60 dark:bg-slate-800/30 rounded"></div>
                    <div className="h-4 w-5/6 bg-slate-200/60 dark:bg-slate-800/30 rounded"></div>
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-[8px] text-blue-500 dark:text-blue-400 font-bold">JD</div>
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800/40 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 space-y-4">
          <h2 className="font-headline text-3xl md:text-5xl font-bold text-on-surface dark:text-white transition-colors duration-300">Engineered for Modern Teams</h2>
          <p className="text-on-surface-variant dark:text-slate-400 font-body text-lg transition-colors duration-300">Powerful features wrapped in an elegant, minimal interface.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <SpotlightCard className="md:col-span-8 bg-white dark:bg-slate-950/80 p-10 border border-outline-variant/60 dark:border-slate-800/40 hover:shadow-2xl transition-all duration-500 shadow-sm dark:shadow-none">
            <div className="max-w-md relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-6 transition-colors duration-300">Ultra-Low Latency</span>
              <h3 className="font-headline text-2xl font-bold text-on-surface dark:text-white mb-4 transition-colors duration-300">Real-time Sync</h3>
              <p className="text-on-surface-variant dark:text-slate-400 font-body leading-relaxed transition-colors duration-300">Experience zero-lag collaboration. See every keystroke and cursor movement as it happens, powered by our proprietary conflict-resolution engine.</p>
            </div>
            <div className="mt-12 h-40 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-6 flex gap-4 overflow-hidden border border-outline-variant/40 dark:border-slate-800/50 transition-all duration-300">
              <div className="flex-1 space-y-3">
                <div className="h-2 w-full bg-blue-500/20 rounded-full"></div>
                <div className="h-2 w-3/4 bg-blue-500/10 rounded-full"></div>
                <div className="h-2 w-1/2 bg-blue-500/5 rounded-full"></div>
              </div>
              <div className="w-24 h-full bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center transition-colors duration-300">
                <Bolt className="w-8 h-8 text-blue-600 dark:text-blue-400 fill-blue-500/20" />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="md:col-span-4 bg-white dark:bg-slate-950/80 p-10 border border-outline-variant/60 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 shadow-sm dark:shadow-none transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-800 flex items-center justify-center mb-8 transition-all duration-300">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-headline text-2xl font-bold text-on-surface dark:text-white mb-4 transition-colors duration-300">Secure Sharing</h3>
            <p className="text-on-surface-variant dark:text-slate-400 font-body leading-relaxed transition-colors duration-300">End-to-end encryption for every document. Share with confidence knowing your intellectual property is protected by military-grade security.</p>
          </SpotlightCard>

          <SpotlightCard className="md:col-span-4 bg-white dark:bg-slate-950/80 p-10 border border-outline-variant/60 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 shadow-sm dark:shadow-none transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-outline-variant/50 dark:border-slate-800 flex items-center justify-center mb-8 transition-all duration-300">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-headline text-2xl font-bold text-on-surface dark:text-white mb-4 transition-colors duration-300">Role-based Permissions</h3>
            <p className="text-on-surface-variant dark:text-slate-400 font-body leading-relaxed transition-colors duration-300">Granular control over who can view, edit, or comment. Manage large-scale teams with intuitive permission tiers.</p>
          </SpotlightCard>

          <SpotlightCard className="md:col-span-8 bg-gradient-to-br from-white to-slate-50 dark:from-[#121620] dark:to-[#0a0c12] border border-outline-variant/60 dark:border-slate-800/80 p-10 shadow-editorial dark:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/15 transition-all duration-500 -z-20"></div>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 relative z-10">
                <h3 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface dark:text-white mb-4 transition-colors duration-300">The Editorial Choice for High-Performance Teams</h3>
                <p className="text-on-surface-variant dark:text-slate-300/90 font-body leading-relaxed mb-6 text-sm md:text-base transition-colors duration-300">
                  Experience zero-latency document synchronization powered by state-of-the-art CRDT algorithms. Write, review, and merge ideas with your global team instantly, without ever experiencing save conflicts or connection drops.
                </p>
                <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:text-blue-500 dark:hover:text-blue-300 transition-colors group/btn">
                  Explore the Editor <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="w-full md:w-1/3 aspect-square bg-gradient-to-br from-blue-100 to-indigo-105 dark:from-primary-container/80 dark:to-secondary-container/80 rounded-2xl shadow-inner relative z-10 overflow-hidden flex items-center justify-center border border-white/5 transition-all duration-300">
                <div className="absolute inset-2 bg-white/70 dark:bg-slate-950/65 backdrop-blur-sm rounded-xl p-4 flex flex-col justify-between transition-colors duration-300">
                  <div className="space-y-2">
                    <div className="h-1.5 w-1/2 bg-blue-600/40 dark:bg-blue-400/40 rounded-full"></div>
                    <div className="h-1.5 w-5/6 bg-slate-400/30 rounded-full"></div>
                    <div className="h-1.5 w-3/4 bg-slate-400/30 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      <div className="w-4 h-4 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center text-[5px] text-white font-bold">A</div>
                      <div className="w-4 h-4 rounded-full bg-teal-500 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center text-[5px] text-white font-bold">B</div>
                    </div>
                    <span className="text-[7px] text-blue-600 dark:text-blue-400 font-mono tracking-widest uppercase bg-blue-50 dark:bg-blue-950 px-1 rounded-sm transition-colors duration-300">CRDT Active</span>
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 relative z-10">
        <SpotlightCard className="max-w-4xl mx-auto bg-gradient-to-br from-white to-slate-50 dark:from-[#0c1224] dark:to-[#060914] border border-outline-variant/60 dark:border-slate-800/80 rounded-[2rem] p-12 md:p-20 text-center shadow-editorial dark:shadow-2xl transition-all duration-300">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <h2 className="font-headline text-3xl md:text-5xl font-extrabold text-on-surface dark:text-white mb-8 relative z-10 transition-colors duration-300">
            Ready to elevate your <br/> writing workflow?
          </h2>
          <p className="text-on-surface-variant dark:text-slate-400 font-body text-lg mb-12 max-w-lg mx-auto relative z-10 transition-colors duration-300">
            Join thousands of creators using SyncLayer to build the future of collaborative documentation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all">
              Create Your Free Account
            </Link>
          </div>
        </SpotlightCard>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-outline-variant/60 dark:border-slate-900 px-6 bg-white dark:bg-slate-950/80 mt-auto relative z-10 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Top multi-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16">
            <div className="md:col-span-4 space-y-4">
              <span className="font-headline text-2xl font-black tracking-tighter text-on-surface dark:text-white transition-colors duration-300">
                SyncLayer
              </span>
              <p className="text-on-surface-variant dark:text-slate-400 text-sm font-body max-w-sm leading-relaxed transition-colors duration-300">
                The real-time collaborative workspace engineered for modern high-performance teams. Experience publication-grade typography, instant offline-first synchronization, and seamless conflict resolution.
              </p>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-xs font-bold tracking-wider text-on-surface dark:text-slate-200 uppercase font-headline transition-colors duration-300">Product</h4>
              <ul className="space-y-2.5">
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-650 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">Features</Link></li>
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-655 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">Security</Link></li>
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-655 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">Pricing</Link></li>
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-655 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">Release Notes</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-bold tracking-wider text-on-surface dark:text-slate-200 uppercase font-headline transition-colors duration-300">Resources</h4>
              <ul className="space-y-2.5">
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-655 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">Documentation</Link></li>
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-655 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">API Reference</Link></li>
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-655 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">Community Guide</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-4">
              <h4 className="text-xs font-bold tracking-wider text-on-surface dark:text-slate-200 uppercase font-headline transition-colors duration-300">Company</h4>
              <ul className="space-y-2.5">
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-655 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">About Us</Link></li>
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-655 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">Careers</Link></li>
                <li><Link to="/login" className="text-sm text-on-surface-variant hover:text-blue-655 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-body">Contact Support</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="pt-8 border-t border-outline-variant/60 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-300">
            <p className="text-on-surface-variant dark:text-slate-400 text-sm font-label text-center md:text-left transition-colors duration-300">
              © 2026 SyncLayer Editorial. All rights reserved.
            </p>
            <div className="flex gap-8">
              <Link to="/login" className="text-on-surface-variant hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors text-sm font-label">Privacy Policy</Link>
              <Link to="/login" className="text-on-surface-variant hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors text-sm font-label">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
