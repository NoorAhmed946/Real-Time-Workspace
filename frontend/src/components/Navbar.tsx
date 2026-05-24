import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { isAuthenticated } from '../lib/auth';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthPage = ['/login', '/auth/callback', '/signing-in'].includes(location.pathname);
  const showAppNav = isAuthenticated() && !isAuthPage;
  const isLanding = location.pathname === '/';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navBackgroundClass = isLanding
    ? (scrolled
        ? 'bg-[#03060f]/80 backdrop-blur-md border-b border-slate-900 shadow-lg shadow-black/20'
        : 'bg-transparent border-b border-transparent')
    : 'bg-surface/85 backdrop-blur-md shadow-sm border-b border-outline-variant/15';

  return (
    <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-6 py-3 h-16 z-50 transition-all duration-300 ${navBackgroundClass}`}>
      <div className="flex items-center gap-8">
        <Link to={showAppNav ? '/documents' : '/'} className={`font-headline text-xl font-black tracking-tighter hover:opacity-90 transition-opacity ${isLanding ? 'text-white' : 'text-slate-900'}`}>
          SyncLayer
        </Link>
        {showAppNav && (
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/documents" active={location.pathname.startsWith('/documents')}>
              Documents
            </NavLink>
            <NavLink to="/invitations" active={location.pathname === '/invitations'}>
              Invitations
            </NavLink>
            <NavLink to="/profile" active={location.pathname === '/profile'}>
              Profile
            </NavLink>
          </div>
        )}
      </div>

      {showAppNav ? (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center px-3 py-1.5 bg-slate-100 rounded-lg">
            <Search className="w-4 h-4 text-outline mr-2" />
            <span className="text-xs text-outline font-label">Quick search...</span>
          </div>
          <button
            type="button"
            className="p-2 hover:bg-slate-200/50 rounded-lg transition-all active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <span className="hidden sm:inline font-headline text-sm font-medium tracking-tight text-slate-900">
              {user?.display_name ?? 'User'}
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-slate-200">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-outline">
                  {(user?.display_name ?? 'U').charAt(0)}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="font-label text-xs font-semibold text-slate-600 hover:text-slate-900"
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
              className={`text-sm font-semibold font-label transition-colors ${isLanding ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
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
  active,
}: {
  to: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`font-headline text-sm font-medium tracking-tight transition-colors relative pb-1 ${
        active ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="nav-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700"
        />
      )}
    </Link>
  );
}
