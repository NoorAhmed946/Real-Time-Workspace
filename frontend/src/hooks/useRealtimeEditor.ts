import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { apiRequest, getWebSocketUrl } from '../lib/api';
import { base64ToUint8, uint8ToBase64 } from '../lib/base64';

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'syncing'
  | 'disconnected';

interface DocumentStateResponse {
  document_id: string;
  version: number;
  state: string | null;
}

const UPDATE_THROTTLE_MS = 50;
const SNAPSHOT_INTERVAL_MS = 5000;
const SNAPSHOT_DEBOUNCE_MS = 1500;

export function useRealtimeEditor(
  documentId: string | undefined,
  canEdit: boolean,
) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const ydocRef = useRef<Y.Doc | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const snapshotVersionRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const lastUpdateSentRef = useRef(0);
  const snapshotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceSnapshotRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canEditRef = useRef(canEdit);

  canEditRef.current = canEdit;

  const sendSnapshot = useCallback(() => {
    const ws = wsRef.current;
    const ydoc = ydocRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !ydoc || !canEditRef.current) return;

    const stateBytes = Y.encodeStateAsUpdate(ydoc);
    ws.send(
      JSON.stringify({
        type: 'snapshot',
        document_id: documentId,
        state: uint8ToBase64(stateBytes),
        base_version: snapshotVersionRef.current,
      }),
    );
  }, [documentId]);

  const reloadState = useCallback(async () => {
    if (!documentId) return;
    const ydoc = ydocRef.current;
    if (!ydoc) return;

    setStatus('syncing');
    setConflictMessage('Sync conflict detected, reloading latest version…');

    try {
      const data = await apiRequest<DocumentStateResponse>(
        `/documents/${documentId}/state`,
      );
      applyingRemoteRef.current = true;
      ydoc.transact(() => {
        const yText = yTextRef.current;
        if (!yText) return;
        if (data.state) {
          Y.applyUpdate(ydoc, base64ToUint8(data.state), 'reload');
        } else {
          yText.delete(0, yText.length);
        }
        setContent(yText.toString());
      }, 'reload');
      snapshotVersionRef.current = data.version;
      setVersion(data.version);
    } catch {
      setConflictMessage('Failed to reload document state.');
    } finally {
      applyingRemoteRef.current = false;
      setConflictMessage(null);
      setStatus('connected');
    }
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return;

    const ydoc = new Y.Doc();
    const yText = ydoc.getText('content');
    ydocRef.current = ydoc;
    yTextRef.current = yText;

    setReady(false);
    setStatus('connecting');
    setContent('');
    snapshotVersionRef.current = 0;

    const wsUrl = getWebSocketUrl(documentId);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const scheduleDebouncedSnapshot = () => {
      if (!canEditRef.current) return;
      if (debounceSnapshotRef.current) clearTimeout(debounceSnapshotRef.current);
      debounceSnapshotRef.current = setTimeout(() => {
        sendSnapshot();
      }, SNAPSHOT_DEBOUNCE_MS);
    };

    const onYDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote' || origin === 'reload' || origin === 'init') return;
      if (!canEditRef.current) return;

      const now = Date.now();
      if (now - lastUpdateSentRef.current < UPDATE_THROTTLE_MS) return;
      lastUpdateSentRef.current = now;

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'update',
            document_id: documentId,
            delta: uint8ToBase64(update),
            base_version: snapshotVersionRef.current,
          }),
        );
      }
      scheduleDebouncedSnapshot();
    };

    ydoc.on('update', onYDocUpdate);

    yText.observe(() => {
      if (applyingRemoteRef.current) return;
      setContent(yText.toString());
    });

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'init') {
          applyingRemoteRef.current = true;
          ydoc.transact(() => {
            if (msg.state) {
              Y.applyUpdate(ydoc, base64ToUint8(msg.state), 'init');
            }
            setContent(yText.toString());
          }, 'init');
          snapshotVersionRef.current = msg.version ?? 0;
          setVersion(snapshotVersionRef.current);
          applyingRemoteRef.current = false;
          setReady(true);
          setStatus('connected');
        } else if (msg.type === 'update' && msg.delta) {
          applyingRemoteRef.current = true;
          Y.applyUpdate(ydoc, base64ToUint8(msg.delta), 'remote');
          applyingRemoteRef.current = false;
        } else if (msg.type === 'snapshot_accepted') {
          snapshotVersionRef.current = msg.new_version ?? snapshotVersionRef.current;
          setVersion(snapshotVersionRef.current);
          setStatus('connected');
        } else if (msg.type === 'error' && msg.reason === 'version_conflict') {
          reloadState();
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      setReady(false);
    };

    ws.onerror = () => {
      setStatus('disconnected');
    };

    if (canEditRef.current) {
      snapshotTimerRef.current = setInterval(sendSnapshot, SNAPSHOT_INTERVAL_MS);
    }

    return () => {
      ydoc.off('update', onYDocUpdate);
      if (snapshotTimerRef.current) clearInterval(snapshotTimerRef.current);
      if (debounceSnapshotRef.current) clearTimeout(debounceSnapshotRef.current);
      ws.close();
      wsRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
      yTextRef.current = null;
    };
  }, [documentId, sendSnapshot, reloadState]);

  useEffect(() => {
    if (!ready || !canEdit) return;
    if (!snapshotTimerRef.current) {
      snapshotTimerRef.current = setInterval(sendSnapshot, SNAPSHOT_INTERVAL_MS);
    }
    return () => {
      if (snapshotTimerRef.current) {
        clearInterval(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }
    };
  }, [ready, canEdit, sendSnapshot]);

  const setContentFromUser = useCallback(
    (value: string) => {
      if (!canEditRef.current) return;
      const yText = yTextRef.current;
      const ydoc = ydocRef.current;
      if (!yText || !ydoc || !ready) return;

      setContent(value);
      ydoc.transact(() => {
        const current = yText.toString();
        if (current === value) return;
        yText.delete(0, yText.length);
        if (value) yText.insert(0, value);
      });
    },
    [ready],
  );

  return {
    content,
    setContentFromUser,
    status,
    version,
    ready,
    conflictMessage,
  };
}
