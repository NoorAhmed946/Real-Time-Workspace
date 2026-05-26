import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, FileText, Mail, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { isAuthenticated } from '../lib/auth';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = React.useState(false);

  // Read initial theme preference from local storage or system preference
  const [isDarkTheme, setIsDarkTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync theme to document element class and local storage
  React.useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  const isAuthPage = ['/login', '/auth/callback', '/signing-in'].includes(location.pathname);
  const isLanding = location.pathname === '/';
  const showAppNav = isAuthenticated() && !isAuthPage && !isLanding;
  const isDarkNav = isLanding || isAuthPage;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navBackgroundClass = isDarkNav
    ? (scrolled
        ? 'bg-[#03060f]/80 backdrop-blur-md border-b border-slate-900 shadow-lg shadow-black/20'
        : 'bg-transparent border-b border-transparent')
    : 'bg-surface/85 backdrop-blur-md shadow-sm border-b border-outline-variant/15';

  return (
    <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-6 py-3 h-16 z-50 transition-all duration-300 ${navBackgroundClass}`}>
      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center hover:bg-slate-200/40 dark:hover:bg-slate-800/40 ${
            isDarkTheme 
              ? 'text-slate-300 hover:text-white' 
              : isDarkNav 
                ? 'text-yellow-400 hover:text-yellow-350' 
                : 'text-amber-500 hover:text-amber-600'
          }`}
          title={isDarkTheme ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <Link to={showAppNav ? '/documents' : '/'} className={`font-headline text-xl font-black tracking-tighter hover:opacity-90 transition-opacity bg-clip-text text-transparent bg-gradient-to-r ${
          isDarkNav 
            ? 'from-blue-400 via-indigo-300 to-cyan-400' 
            : 'from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-cyan-400'
        }`}>
          SyncLayer
        </Link>
        {showAppNav && (
          <>
            {/* Divider between SyncLayer and nav links */}
            <div className="hidden md:block h-5 w-px bg-outline-variant/40 mx-2" />

            <div className="hidden md:flex items-center gap-8">
              <NavLink to="/documents" icon={<FileText className="w-4 h-4" />} active={location.pathname.startsWith('/documents')}>
                Documents
              </NavLink>
              <NavLink to="/invitations" icon={<Mail className="w-4 h-4" />} active={location.pathname === '/invitations'}>
                Invitations
              </NavLink>
              <NavLink to="/profile" icon={<User className="w-4 h-4" />} active={location.pathname === '/profile'}>
                Profile
              </NavLink>
            </div>
          </>
        )}
      </div>

      {showAppNav ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-2 hover:bg-surface-container-high rounded-lg transition-all active:scale-95 text-on-surface-variant"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
            <span className="hidden sm:inline font-headline text-sm font-medium tracking-tight text-on-surface">
              {user?.display_name ?? 'User'}
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-on-surface-variant">
                  {(user?.display_name ?? 'U').charAt(0)}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="font-label text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        !isAuthPage && (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className={`px-5 py-2.5 border text-sm font-bold font-label rounded-xl transition-all hover:scale-[1.02] active:scale-95 ${
                isLanding 
                  ? 'border-slate-800 text-slate-350 hover:bg-slate-900/60 hover:text-white' 
                  : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              Log In
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 bg-primary text-on-primary hover:bg-primary-container text-sm font-bold font-label rounded-xl shadow-editorial transition-all hover:scale-[1.02] active:scale-95"
            >
              Get Started
            </Link>
          </div>
        )
      )}
    </nav>
  );
}

function NavLink({
  to,
  children,
  icon,
  active,
}: {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 font-headline text-sm font-medium tracking-tight transition-colors relative pb-1 ${
        active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      {icon}
      {children}
      {active && (
        <motion.div
          layoutId="nav-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        />
      )}
    </Link>
  );
}
