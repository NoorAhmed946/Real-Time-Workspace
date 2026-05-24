import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bolt, Shield, Users, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[870px] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-container rounded-full blur-[120px]"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary-container rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-5xl w-full text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/20 mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-tertiary mr-2"></span>
            <span className="text-[10px] font-bold tracking-widest uppercase font-label text-on-surface-variant">v2.0 Collaboration Engine Live</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface leading-[1.1]"
          >
            Collaborate in Real-Time <br/>
            <span className="text-primary italic">with SyncLayer</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed"
          >
            The simplest way to edit documents together, seamlessly. Designed for focus, engineered for speed.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/login" className="px-8 py-4 jewel-button text-lg rounded-xl">
              Get Started
            </Link>
            <button className="px-8 py-4 bg-surface-container-lowest text-primary font-headline font-bold text-lg rounded-xl border border-outline-variant/30 hover:bg-surface-container-low transition-all">
              Watch Demo
            </button>
          </motion.div>

          {/* Product Preview Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 relative mx-auto max-w-4xl"
          >
            <div className="aspect-video bg-surface-container-lowest rounded-2xl shadow-editorial border border-outline-variant/10 p-2 overflow-hidden">
              <div className="w-full h-full rounded-xl bg-surface-container-low flex overflow-hidden">
                <div className="w-16 h-full bg-surface-container-high flex flex-col items-center py-6 gap-6 border-r border-outline-variant/10">
                  <div className="w-6 h-6 bg-primary rounded opacity-50"></div>
                  <div className="w-6 h-6 bg-outline rounded opacity-30"></div>
                  <div className="w-6 h-6 bg-outline rounded opacity-30"></div>
                </div>
                <div className="flex-1 p-10 text-left bg-white">
                  <div className="h-8 w-3/4 bg-surface-container rounded-md mb-6 opacity-40"></div>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-surface-container rounded opacity-30"></div>
                    <div className="h-4 w-full bg-surface-container rounded opacity-30"></div>
                    <div className="h-4 w-5/6 bg-surface-container rounded opacity-30"></div>
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-6 h-6 rounded-full bg-tertiary-container flex items-center justify-center text-[8px] text-white">JD</div>
                      <div className="h-4 w-32 bg-tertiary-fixed rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="font-headline text-3xl md:text-5xl font-bold text-on-surface">Engineered for Modern Teams</h2>
          <p className="text-on-surface-variant font-body text-lg">Powerful features wrapped in an elegant, minimal interface.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 group relative bg-surface-container-lowest p-10 rounded-3xl overflow-hidden hover:shadow-editorial transition-all duration-500 border border-outline-variant/10">
            <div className="max-w-md relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase mb-6">Ultra-Low Latency</span>
              <h3 className="font-headline text-2xl font-bold text-on-surface mb-4">Real-time Sync</h3>
              <p className="text-on-surface-variant font-body leading-relaxed">Experience zero-lag collaboration. See every keystroke and cursor movement as it happens, powered by our proprietary conflict-resolution engine.</p>
            </div>
            <div className="mt-12 h-40 bg-surface-container-low rounded-2xl p-6 flex gap-4 overflow-hidden">
              <div className="flex-1 space-y-3">
                <div className="h-2 w-full bg-primary/20 rounded-full"></div>
                <div className="h-2 w-3/4 bg-primary/10 rounded-full"></div>
                <div className="h-2 w-1/2 bg-primary/5 rounded-full"></div>
              </div>
              <div className="w-24 h-full bg-primary/10 rounded-xl flex items-center justify-center">
                <Bolt className="w-8 h-8 text-primary fill-primary" />
              </div>
            </div>
          </div>

          <div className="md:col-span-4 bg-surface-container p-10 rounded-3xl border border-outline-variant/10 hover:bg-surface-container-high transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8">
              <Shield className="w-6 h-6 text-on-surface" />
            </div>
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-4">Secure Sharing</h3>
            <p className="text-on-surface-variant font-body leading-relaxed">End-to-end encryption for every document. Share with confidence knowing your intellectual property is protected by military-grade security.</p>
          </div>

          <div className="md:col-span-4 bg-surface-container p-10 rounded-3xl border border-outline-variant/10 hover:bg-surface-container-high transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8">
              <Users className="w-6 h-6 text-on-surface" />
            </div>
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-4">Role-based Permissions</h3>
            <p className="text-on-surface-variant font-body leading-relaxed">Granular control over who can view, edit, or comment. Manage large-scale teams with intuitive permission tiers.</p>
          </div>

          <div className="md:col-span-8 bg-on-surface p-10 rounded-3xl flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h3 className="font-headline text-2xl font-bold text-surface mb-4">The Editorial Choice</h3>
              <p className="text-surface-variant/70 font-body leading-relaxed mb-6">SyncLayer isn't just a text editor. It's an environment where typography and layout are prioritized, giving your drafts the dignity of a finished publication.</p>
              <button className="flex items-center gap-2 text-primary-fixed font-semibold hover:gap-4 transition-all">
                Explore the Editor <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full md:w-1/3 aspect-square bg-gradient-to-br from-primary-container to-secondary-container rounded-2xl shadow-inner opacity-80"></div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto glass-panel rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <h2 className="font-headline text-3xl md:text-5xl font-extrabold text-on-surface mb-8 relative z-10">
            Ready to elevate your <br/> writing workflow?
          </h2>
          <p className="text-on-surface-variant font-body text-lg mb-12 max-w-lg mx-auto relative z-10">
            Join thousands of creators using SyncLayer to build the future of collaborative documentation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link to="/login" className="w-full sm:w-auto px-10 py-5 jewel-button text-xl rounded-2xl hover:scale-105">
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-outline-variant/10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="font-headline text-xl font-black tracking-tighter text-slate-900">SyncLayer</span>
            <p className="text-on-surface-variant text-sm font-label">© 2024 SyncLayer Editorial. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-label" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-label" href="#">Terms of Service</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-label" href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
