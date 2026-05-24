import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import {
  cancelInvitation,
  listReceivedInvitations,
  listSentInvitations,
  respondToInvitation,
} from '../lib/api';
import type { Invitation, InvitationWithDetails } from '../lib/types';

type Tab = 'received' | 'sent';

export default function InvitationsDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('received');
  const [received, setReceived] = useState<InvitationWithDetails[]>([]);
  const [sent, setSent] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recv, sentRes] = await Promise.all([
        listReceivedInvitations(),
        listSentInvitations({ page: 1, page_size: 50 }),
      ]);
      setReceived(recv);
      setSent(sentRes.invitations);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="font-headline text-[3.5rem] font-extrabold tracking-tight leading-none text-on-surface mb-2">
          Invitations
        </h1>
        <p className="text-on-surface-variant font-label text-lg">
          Accept invites to access shared documents.
        </p>
      </header>

      <div className="flex gap-8 mb-8 border-b border-surface-variant">
        <button
          type="button"
          onClick={() => setTab('received')}
          className={`pb-4 font-headline text-sm tracking-wide border-b-2 transition-colors ${
            tab === 'received'
              ? 'text-primary font-bold border-primary'
              : 'text-on-surface-variant font-medium border-transparent hover:text-on-surface'
          }`}
        >
          Received
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`pb-4 font-headline text-sm tracking-wide border-b-2 transition-colors ${
            tab === 'sent'
              ? 'text-primary font-bold border-primary'
              : 'text-on-surface-variant font-medium border-transparent hover:text-on-surface'
          }`}
        >
          Sent
        </button>
      </div>

      {error && <p className="mb-6 text-error font-body text-sm">{error}</p>}

      {loading ? (
        <p className="font-body text-on-surface-variant">Loading invitations...</p>
      ) : tab === 'received' ? (
        <div className="space-y-6">
          {received.length === 0 ? (
            <p className="font-body text-on-surface-variant">No pending invitations.</p>
          ) : (
            received.map((inv) => (
              <div key={inv.id}>
              <ReceivedInvitationCard
                item={inv}
                busy={actionId === inv.id}
                onAccept={async () => {
                  setActionId(inv.id);
                  try {
                    const result = await respondToInvitation(inv.id, true);
                    if (result.document_id) {
                      navigate(`/documents/${result.document_id}`);
                    } else {
                      await load();
                    }
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to accept');
                  } finally {
                    setActionId(null);
                  }
                }}
                onDecline={async () => {
                  setActionId(inv.id);
                  try {
                    await respondToInvitation(inv.id, false);
                    await load();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to decline');
                  } finally {
                    setActionId(null);
                  }
                }}
              />
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sent.length === 0 ? (
            <p className="font-body text-on-surface-variant">No sent invitations.</p>
          ) : (
            sent.map((inv) => (
              <div key={inv.id}>
              <SentInvitationCard
                item={inv}
                busy={actionId === inv.id}
                onCancel={
                  inv.status === 'PENDING'
                    ? async () => {
                        setActionId(inv.id);
                        try {
                          await cancelInvitation(inv.id);
                          await load();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Failed to cancel');
                        } finally {
                          setActionId(null);
                        }
                      }
                    : undefined
                }
              />
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}

function ReceivedInvitationCard({
  item,
  busy,
  onAccept,
  onDecline,
}: {
  item: InvitationWithDetails;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const expires = new Date(item.expires_at);
  const isUrgent = expires.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-surface-container-lowest p-6 rounded-xl shadow-editorial"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-primary-container text-on-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">
              {item.document_title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="text-sm font-label text-on-surface-variant flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.invited_by_name} ({item.invited_by_email})
              </span>
              <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                {item.role}
              </span>
              <span
                className={`text-xs font-label flex items-center gap-1 ${
                  isUrgent ? 'text-tertiary' : 'text-on-surface-variant'
                }`}
              >
                {isUrgent ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                Expires {expires.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            className="px-5 py-2.5 bg-surface-container-high text-on-surface font-label text-sm font-semibold rounded-lg hover:bg-surface-container-highest transition-all disabled:opacity-60"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="px-5 py-2.5 jewel-button text-sm disabled:opacity-60"
          >
            {busy ? '...' : 'Accept'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SentInvitationCard({
  item,
  busy,
  onCancel,
}: {
  item: Invitation;
  busy: boolean;
  onCancel?: () => void;
}) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-editorial flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <p className="font-headline font-bold text-on-surface">{item.invitee_email}</p>
        <p className="text-sm text-on-surface-variant font-label mt-1">
          Role: {item.role} · Status: {item.status}
        </p>
      </div>
      {onCancel && (
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="px-5 py-2.5 bg-surface-container-high font-label text-sm font-semibold rounded-lg disabled:opacity-60"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
