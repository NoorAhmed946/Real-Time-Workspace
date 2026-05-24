import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, FilePlus, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { createDocument, listDocuments } from '../lib/api';
import type { Document as RtcdDocument } from '../lib/types';

export default function DocumentsDashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<RtcdDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

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

  const handleCreate = async () => {
    setCreating(true);
    try {
      const doc = await createDocument({ title: 'Untitled Document' });
      navigate(`/documents/${doc.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">
            My Documents
          </h1>
          <p className="font-body text-on-surface-variant text-lg max-w-xl">
            Open a document to collaborate in real time.
          </p>
        </div>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
          <input
            className="w-full pl-10 pr-4 py-3 bg-surface-container-high border-none rounded-lg focus:ring-2 focus:ring-primary/40 text-on-surface placeholder:text-outline transition-all"
            placeholder="Search documents..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {error && (
        <p className="mb-6 text-error font-body text-sm">{error}</p>
      )}

      {loading ? (
        <p className="font-body text-on-surface-variant">Loading documents...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-body text-on-surface-variant mb-6">No documents yet.</p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="jewel-button px-6 py-3"
          >
            {creating ? 'Creating...' : 'Create your first document'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doc) => (
            <div key={doc.id}>
              <DocumentCard doc={doc} />
            </div>
          ))}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            onClick={handleCreate}
            disabled={creating}
            className="group border-2 border-dashed border-outline-variant hover:border-primary/40 rounded-xl flex flex-col items-center justify-center p-8 transition-all duration-300 cursor-pointer bg-surface/50 disabled:opacity-60"
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

      <button
        type="button"
        onClick={handleCreate}
        disabled={creating}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full jewel-button shadow-xl flex items-center justify-center disabled:opacity-60"
        aria-label="Create document"
      >
        <Plus className="w-8 h-8" />
      </button>
    </main>
  );
}

function DocumentCard({ doc }: { doc: RtcdDocument }) {
  const tag = doc.is_public ? 'PUBLIC' : 'PRIVATE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-editorial hover:shadow-lg transition-all duration-300"
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label text-xs font-semibold tracking-wider uppercase">
            {tag}
          </span>
        </div>
        <h3 className="font-headline text-xl font-bold mb-2 line-clamp-2">{doc.title}</h3>
        {doc.description && (
          <p className="font-body text-on-surface-variant text-sm flex-grow line-clamp-2">
            {doc.description}
          </p>
        )}
        <div className="mt-6 pt-6 border-t border-surface-container-high flex items-center justify-between">
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
    </motion.div>
  );
}
