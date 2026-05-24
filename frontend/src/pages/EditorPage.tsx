import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Share2, CloudCheck, Loader2 } from 'lucide-react';
import { getDocument } from '../lib/api';
import ShareInviteModal from '../components/ShareInviteModal';
import {
  useRealtimeEditor,
  type ConnectionStatus,
} from '../hooks/useRealtimeEditor';
import type { DocumentWithPermissions } from '../lib/types';

function statusLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'connecting':
      return 'Connecting…';
    case 'connected':
      return 'Connected';
    case 'syncing':
      return 'Syncing…';
    case 'reconnecting':
      return 'Reconnecting…';
    case 'disconnected':
      return 'Disconnected';
    default:
      return status;
  }
}

function statusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'bg-emerald-500';
    case 'syncing':
      return 'bg-amber-500';
    case 'disconnected':
      return 'bg-error';
    default:
      return 'bg-primary animate-pulse';
  }
}

function EditorWorkspace({
  doc,
  documentId,
}: {
  doc: DocumentWithPermissions;
  documentId: string;
}) {
  const canEdit = doc.user_role === 'EDITOR' || doc.user_role === 'OWNER';
  const canInvite = canEdit;
  const [showShare, setShowShare] = useState(false);

  const {
    content,
    setContentFromUser,
    status,
    version,
    ready,
    conflictMessage,
  } = useRealtimeEditor(documentId, canEdit);

  const roleLabel = doc.user_role ?? 'VIEWER';

  return (
    <>
      <div className="w-full bg-surface-container-low px-8 py-6 flex items-center justify-between border-b border-outline-variant">
        <div className="flex items-center gap-6 flex-wrap">
          <h1 className="font-headline font-bold text-2xl tracking-tight text-on-surface">
            {doc.title}
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label text-[10px] font-bold tracking-widest uppercase">
              {roleLabel}
            </span>
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-lowest rounded-full shadow-editorial">
              <span className={`relative flex h-2 w-2 rounded-full ${statusColor(status)}`} />
              <span className="font-label text-xs font-medium text-on-surface-variant">
                {statusLabel(status)}
                {!ready && status === 'connected' ? ' (loading doc)' : ''}
              </span>
            </div>
          </div>
        </div>
        {canInvite && (
          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 bg-primary-container text-on-primary px-4 py-2 rounded-lg font-label text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
      </div>

      {conflictMessage && (
        <div className="bg-amber-100 text-amber-900 px-8 py-2 text-sm font-label text-center">
          {conflictMessage}
        </div>
      )}

      {!canEdit && (
        <div className="bg-tertiary-fixed/20 text-on-surface px-8 py-2 text-sm font-label text-center">
          Read-only — you have {roleLabel} access
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 md:p-12 flex justify-center bg-surface">
        <div className="w-full max-w-4xl bg-surface-container-lowest shadow-editorial min-h-[400px] rounded-xl p-8 flex flex-col relative">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/80 rounded-xl z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <textarea
            className="w-full flex-1 min-h-[300px] font-body text-lg leading-relaxed text-on-surface bg-transparent resize-none placeholder:text-outline-variant focus:outline-none"
            placeholder={canEdit ? 'Start typing…' : 'View only'}
            value={content}
            onChange={(e) => setContentFromUser(e.target.value)}
            readOnly={!canEdit || !ready}
          />
        </div>
      </div>

      <footer className="h-10 bg-surface-container-low px-6 flex items-center justify-between border-t border-outline-variant">
        <span className="text-outline font-label text-[11px] tracking-wide uppercase">
          Version {version}
        </span>
        <div className="flex items-center gap-2 text-primary font-label text-[11px] font-bold">
          <CloudCheck className="w-3 h-3" />
          {ready ? 'SYNCED' : 'CONNECTING'}
        </div>
      </footer>

      {showShare && (
        <ShareInviteModal
          documentId={documentId}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDocument(id);
        setDoc(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!id) {
    return (
      <main className="pt-24 px-6">
        <p className="text-error">Invalid document ID.</p>
        <Link to="/documents" className="text-primary mt-4 inline-block">
          Back to documents
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="pt-24 px-6">
        <p className="font-body text-on-surface-variant">Loading document...</p>
      </main>
    );
  }

  if (error || !doc) {
    return (
      <main className="pt-24 px-6">
        <p className="text-error mb-4">{error ?? 'Document not found'}</p>
        <Link to="/documents" className="text-primary">
          Back to documents
        </Link>
      </main>
    );
  }

  return (
    <main className="mt-16 flex-1 flex flex-col overflow-hidden bg-surface h-[calc(100vh-64px)]">
      <EditorWorkspace doc={doc} documentId={id} />
    </main>
  );
}
