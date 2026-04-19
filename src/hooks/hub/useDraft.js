import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import useSupabase from './useSupabase';

/**
 * Generic draft persistence hook — direct port of the commande/toiture inline persistence.
 *
 * @param {Object} opts
 * @param {string} opts.table - Supabase table name (e.g. 'commande_drafts')
 * @param {number} opts.customerId - customer_id for this tool (PUR = 9)
 * @param {string} opts.localStorageKey - localStorage key
 * @param {function} opts.emptyCheck - (state) => boolean — true if state is "empty" (not worth saving)
 * @param {function} opts.getPayload - () => object — returns the current state to persist
 * @param {function} opts.getMetaFields - (payload) => object — extra columns (project_ref, client_name, supplier)
 */
export default function useDraft({
  table,
  customerId,
  localStorageKey,
  emptyCheck,
  getPayload,
  getMetaFields,
}) {
  const supabase = useSupabase();
  const router = useRouter();

  const [draftId, setDraftId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const saveTimer = useRef(null);
  const savePaused = useRef(false);
  const draftIdRef = useRef(null);

  // Keep ref in sync
  useEffect(() => { draftIdRef.current = draftId; }, [draftId]);

  // ── Save to localStorage (immediate) ──
  const saveToLocal = useCallback(() => {
    try {
      const payload = getPayload();
      payload._draftId = draftIdRef.current;
      localStorage.setItem(localStorageKey, JSON.stringify(payload));
    } catch (e) { /* silently fail */ }
  }, [getPayload, localStorageKey]);

  // ── Save to Supabase (async) ──
  const saveToSupabase = useCallback(async () => {
    const payload = getPayload();
    const meta = getMetaFields ? getMetaFields(payload) : {};

    const body = {
      customer_id: customerId,
      state_json: payload,
      updated_at: new Date().toISOString(),
      ...meta,
    };

    try {
      setSaveStatus('saving');
      let data;
      if (draftIdRef.current) {
        data = await supabase.update(table, draftIdRef.current, body);
      } else {
        data = await supabase.insert(table, body);
      }

      if (data?.[0]?.id) {
        const newId = data[0].id;
        draftIdRef.current = newId;
        setDraftId(newId);
        // Sync draftId to localStorage
        saveToLocal();
        // Update URL param
        const url = new URL(window.location);
        url.searchParams.set('draft', newId);
        window.history.replaceState({}, '', url);
      }

      setSaveStatus('saved');
    } catch (e) {
      setSaveStatus('error');
    }
  }, [getPayload, getMetaFields, customerId, table, supabase, saveToLocal]);

  // ── Trigger save (debounced) ──
  const triggerSave = useCallback(() => {
    if (savePaused.current) return;
    saveToLocal();

    // Don't save empty drafts to Supabase
    const payload = getPayload();
    if (emptyCheck(payload)) return;

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveToSupabase, 1500);
  }, [saveToLocal, saveToSupabase, getPayload, emptyCheck]);

  // ── Load from Supabase ──
  const loadDraft = useCallback(async (id) => {
    try {
      const data = await supabase.get(table, `id=eq.${id}&select=*`);
      if (data?.[0]) {
        draftIdRef.current = data[0].id;
        setDraftId(data[0].id);
        return data[0].state_json;
      }
    } catch (e) { /* offline fallback */ }
    return null;
  }, [supabase, table]);

  // ── Load from localStorage ──
  const loadFromLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed._draftId) {
          draftIdRef.current = parsed._draftId;
          setDraftId(parsed._draftId);
        }
        return parsed;
      }
    } catch (e) { /* corrupt data */ }
    return null;
  }, [localStorageKey]);

  // ── List drafts ──
  const listDrafts = useCallback(async (limit = 20) => {
    try {
      return await supabase.get(
        table,
        `customer_id=eq.${customerId}&order=updated_at.desc&limit=${limit}&select=id,project_ref,client_name,supplier,updated_at`
      );
    } catch (e) {
      return [];
    }
  }, [supabase, table, customerId]);

  // ── Reset draft ──
  const resetDraft = useCallback(() => {
    draftIdRef.current = null;
    setDraftId(null);
    setSaveStatus('idle');
    clearTimeout(saveTimer.current);
    try { localStorage.removeItem(localStorageKey); } catch (e) { /* ok */ }
    // Clear URL param
    const url = new URL(window.location);
    url.searchParams.delete('draft');
    window.history.replaceState({}, '', url);
  }, [localStorageKey]);

  // ── Pause/resume saves (for restore) ──
  const pauseSaves = useCallback(() => { savePaused.current = true; }, []);
  const resumeSaves = useCallback(() => { savePaused.current = false; }, []);

  // ── beforeunload safety net ──
  useEffect(() => {
    const handler = () => saveToLocal();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveToLocal]);

  // ── Auto-load on mount: URL ?draft= → localStorage fallback ──
  // Caller handles this — hook just provides the functions

  return {
    draftId,
    saveStatus,
    triggerSave,
    loadDraft,
    loadFromLocal,
    listDrafts,
    resetDraft,
    pauseSaves,
    resumeSaves,
    saveToLocal,
  };
}
