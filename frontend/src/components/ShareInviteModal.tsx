import React, { useState } from 'react';
import { X } from 'lucide-react';
import { createInvitation } from '../lib/api';

interface ShareInviteModalProps {
  documentId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ShareInviteModal({
  documentId,
  onClose,
  onSuccess,
}: ShareInviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('EDITOR');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await createInvitation({
        document_id: documentId,
        invitee_email: email.trim(),
        role,
        message: message.trim() || undefined,
      });
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      setMessage('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-editorial p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-surface-container-high"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-headline text-xl font-bold text-on-surface mb-4">
          Invite collaborator
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-high rounded-lg border-none focus:ring-2 focus:ring-primary/40"
              placeholder="collaborator@example.com"
            />
          </div>
          <div>
            <label className="block font-label text-sm font-semibold mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'VIEWER' | 'EDITOR')}
              className="w-full px-4 py-2.5 bg-surface-container-high rounded-lg border-none"
            >
              <option value="EDITOR">Editor — can edit</option>
              <option value="VIEWER">Viewer — read only</option>
            </select>
          </div>
          <div>
            <label className="block font-label text-sm font-semibold mb-1">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-surface-container-high rounded-lg border-none resize-none"
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          {success && <p className="text-sm text-primary">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full jewel-button py-2.5 disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}
