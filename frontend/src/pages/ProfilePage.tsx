import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertTriangle } from 'lucide-react';
import { getUserProfile, apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../lib/types';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
        setDisplayName(data.display_name);
        setAvatarUrl(data.avatar_url ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest<UserProfile>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: displayName || undefined,
          avatar_url: avatarUrl || undefined,
        }),
      });
      await refreshUser();
      setMessage('Profile updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure? This will deactivate your account.')) return;
    try {
      await apiRequest('/users/me', { method: 'DELETE' });
      await logout();
      navigate('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deactivation failed');
    }
  };

  if (loading) {
    return (
      <main className="pt-24 px-6 max-w-4xl mx-auto">
        <p className="font-body text-on-surface-variant">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface mb-2">
          Profile
        </h1>
        <p className="font-body text-on-surface-variant text-lg">
          {profile?.email}
        </p>
      </header>

      {error && <p className="mb-4 text-error text-sm">{error}</p>}
      {message && <p className="mb-4 text-primary text-sm">{message}</p>}

      <section className="bg-surface-container-lowest rounded-xl shadow-editorial overflow-hidden mb-8">
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface ring-1 ring-outline-variant">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-2xl font-bold text-outline">
                      {displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-on-surface/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none">
                  <Camera className="w-8 h-8 text-surface" />
                </div>
              </div>
            </div>

            <div className="w-full md:w-2/3 space-y-6">
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1.5">
                  Display Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-lg focus:ring-2 focus:ring-primary/40 font-body text-on-surface"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface mb-1.5">
                  Avatar URL
                </label>
                <input
                  className="w-full px-4 py-3 bg-surface-container-high border-none rounded-lg focus:ring-2 focus:ring-primary/40 font-body text-on-surface"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="jewel-button px-8 py-3 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low rounded-xl border border-error/10 overflow-hidden">
        <div className="px-8 py-4 bg-error-container/30 border-b border-error/5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-error" />
          <h2 className="font-headline text-sm font-bold text-on-error-container tracking-wider uppercase">
            Danger Zone
          </h2>
        </div>
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-body text-sm text-on-surface-variant max-w-md">
            Deactivating your account revokes all sessions.
          </p>
          <button
            type="button"
            onClick={handleDeactivate}
            className="px-6 py-2.5 bg-error text-on-error font-label font-bold rounded-lg"
          >
            Deactivate Account
          </button>
        </div>
      </section>
    </main>
  );
}
