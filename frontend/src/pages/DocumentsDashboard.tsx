import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FilePlus, Plus, Trash2, Pencil, Check, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createDocument, listDocuments, deleteDocument, updateDocument } from '../lib/api';
import type { Document as RtcdDocument } from '../lib/types';

export default function DocumentsDashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<RtcdDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  /* ---- Create-document modal state ---- */
  const [showModal, setShowModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const modalInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listDocuments({
        include_shared: true,
        include_archived: false,
        page: 1,
        page_size: 50,
      });
      setDocuments(res.documents);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  /* Open the naming modal */
  const openCreateModal = () => {
    setNewDocTitle('');
    setShowModal(true);
    // Auto-focus is handled via useEffect below
  };

  useEffect(() => {
    if (showModal && modalInputRef.current) {
      modalInputRef.current.focus();
    }
  }, [showModal]);

  /* Actually create the document with the chosen name */
  const handleCreate = async () => {
    const title = newDocTitle.trim() || 'Untitled Document';
    setCreating(true);
    setShowModal(false);
    try {
      const doc = await createDocument({ title });
      navigate(`/documents/${doc.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    try {
      await deleteDocument(docId, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete document');
      loadDocuments();
    }
  };

  const handleRename = async (docId: string, newTitle: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, title: newTitle } : d)),
    );
    try {
      await updateDocument(docId, { title: newTitle });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename document');
      loadDocuments();
    }
  };

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="pt-24 pb-12 px-6 lg:px-10">
      {/* Left-aligned header */}
      <section className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
          My Documents
        </h1>
        <p className="font-body text-on-surface-variant text-lg mt-2">
          Open a document to collaborate in real time.
        </p>
      </section>

      {/* Search bar */}
      <div className="relative mb-8 max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full pl-12 pr-4 py-3.5 bg-surface-container-high/60 border border-outline-variant rounded-xl text-on-surface font-body placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all"
        />
      </div>

      {error && (
        <p className="mb-6 text-error font-body text-sm">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-16">
          <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-body text-on-surface-variant">Loading documents...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-body text-on-surface-variant mb-6">
            {search ? `No documents matching "${search}"` : 'No documents yet.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={openCreateModal}
              disabled={creating}
              className="jewel-button px-6 py-3"
            >
              {creating ? 'Creating...' : 'Create your first document'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((doc) => (
              <div key={doc.id}>
                <DocumentCard
                  doc={doc}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              </div>
            ))}
          </AnimatePresence>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.02 }}
            onClick={openCreateModal}
            disabled={creating}
            className="group border-2 border-dashed border-outline-variant hover:border-primary/40 rounded-xl flex flex-col items-center justify-center p-8 transition-all duration-300 cursor-pointer bg-surface/50 disabled:opacity-60 min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FilePlus className="w-6 h-6 text-primary" />
            </div>
            <span className="font-headline font-bold text-on-surface">
              {creating ? 'Creating...' : 'Create Document'}
            </span>
          </motion.button>
        </div>
      )}

      {/* Floating action button */}
      <button
        type="button"
        onClick={openCreateModal}
        disabled={creating}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full jewel-button shadow-xl flex items-center justify-center disabled:opacity-60"
        aria-label="Create document"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* ---- Create Document Modal ---- */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden"
            >
              <div className="p-6">
                <h2 className="font-headline text-xl font-bold text-on-surface mb-1">
                  New Document
                </h2>
                <p className="font-body text-sm text-on-surface-variant mb-5">
                  Give your document a name to get started.
                </p>
                <input
                  ref={modalInputRef}
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setShowModal(false);
                  }}
                  placeholder="e.g. Project Roadmap"
                  className="w-full px-4 py-3 bg-surface-container-high border border-outline-variant rounded-xl text-on-surface font-body placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all"
                />
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-low/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-label font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="jewel-button px-5 py-2.5 text-sm"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Document Card – with delete confirmation + inline rename           */
/* ------------------------------------------------------------------ */

interface DocumentCardProps {
  doc: RtcdDocument;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

function DocumentCard({ doc, onDelete, onRename }: DocumentCardProps) {
  const tag = doc.is_public ? 'PUBLIC' : 'PRIVATE';

  /* ---- Delete confirmation state ---- */
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* ---- Inline rename state ---- */
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(doc.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== doc.title) {
      onRename(doc.id, trimmed);
    } else {
      setEditTitle(doc.title);
    }
    setEditing(false);
  };

  const cancelRename = () => {
    setEditTitle(doc.title);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-editorial hover:shadow-lg transition-all duration-300"
    >
      <div className="p-5 flex flex-col h-full min-h-[200px]">
        {/* Top row: tag + action buttons */}
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label text-xs font-semibold tracking-wider uppercase">
            {tag}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Rename button */}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-md hover:bg-surface-container-high text-outline hover:text-primary transition-colors"
              aria-label="Rename document"
              title="Rename"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-md hover:bg-error-container text-outline hover:text-error transition-colors"
              aria-label="Delete document"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title — inline editable */}
        {editing ? (
          <div className="flex items-center gap-1.5 mb-2">
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') cancelRename();
              }}
              className="flex-1 min-w-0 px-2 py-1 rounded-md bg-surface-container-high border border-outline-variant text-on-surface font-headline text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={commitRename}
              className="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
              aria-label="Confirm rename"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={cancelRename}
              className="p-1 rounded-md hover:bg-surface-container-high text-outline transition-colors"
              aria-label="Cancel rename"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <h3 className="font-headline text-xl font-bold mb-2 line-clamp-2 text-on-surface">
            {doc.title}
          </h3>
        )}

        {doc.description && (
          <p className="font-body text-on-surface-variant text-sm flex-grow line-clamp-2">
            {doc.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-5 border-t border-surface-container-high flex items-center justify-between">
          <span className="font-label text-xs text-outline">
            Updated {new Date(doc.updated_at).toLocaleDateString()}
          </span>
          <Link
            to={`/documents/${doc.id}`}
            className="px-5 py-2 text-primary font-label font-bold hover:bg-surface-container-high rounded-lg transition-all"
          >
            Open
          </Link>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-surface-container-lowest/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6 rounded-xl"
          >
            <p className="font-headline font-bold text-on-surface text-center text-sm">
              Delete &ldquo;{doc.title}&rdquo;?
            </p>
            <p className="font-body text-on-surface-variant text-xs text-center">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-lg font-label font-bold text-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onDelete(doc.id)}
                className="px-4 py-2 rounded-lg font-label font-bold text-sm bg-error text-on-error hover:opacity-90 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
