import { useState, useCallback } from 'react';
import { buildItemSpecs, getCategoryLabel } from '@/lib/hub/item-specs';
import { formatDim } from '@/lib/hub/fraction';
import { Button, Modal, SaveStatus } from '@/components/hub/ui';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import s from './preview.module.css';

export default function ExportActions({ state, draft }) {
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [draftsList, setDraftsList] = useState([]);
  const [savingJob, setSavingJob] = useState(false);
  // P-A: success modal (replaces inline toast for clarity)
  // P-B: leadMatched + leadName fields added
  const [successModal, setSuccessModal] = useState(null); // { jobIdHuman, url, updated, leadMatched, leadName }
  // inline error toast (stays small)
  const [errorToast, setErrorToast] = useState(null);

  // ── Copy text ──
  const handleCopy = useCallback(() => {
    const lines = [];
    lines.push('BON DE COMMANDE — PÜR CONSTRUCTION');
    lines.push(`N° ${state.orderNumber || '---'}`);
    lines.push('');
    lines.push(`Client: ${state.project.client || '—'}`);
    lines.push(`Réf: ${state.project.ref || '—'}`);
    lines.push(`Adresse: ${state.project.address || '—'}`);
    lines.push(`Livraison: ${state.project.date || '—'}`);
    lines.push(`Priorité: ${state.project.urgency || 'Standard'}`);
    lines.push(`Contact: ${state.project.contact || '—'}`);
    lines.push('');

    const renderItem = (item, i) => {
      lines.push(`${i + 1}. [${(item.supplier || 'R').toUpperCase()[0]}] ${getCategoryLabel(item.category)} — ${item.config_code || item.entry_door_style}`);
      lines.push(`   ${formatDim(item.width)}" × ${formatDim(item.height)}" × ${item.qty}`);
      const specs = buildItemSpecs(item);
      specs.forEach((spec) => lines.push(`   ${spec}`));
      if (item.note) lines.push(`   Note: ${item.note}`);
      lines.push('');
    };

    if (state.supplier === 'both') {
      const rItems = state.items.filter((it) => (it.supplier || 'royalty') === 'royalty');
      const tItems = state.items.filter((it) => it.supplier === 'touchette');
      if (rItems.length) {
        lines.push('======== R ========');
        lines.push('');
        rItems.forEach((item, i) => renderItem(item, i));
      }
      if (tItems.length) {
        lines.push('======== T ========');
        lines.push('');
        tItems.forEach((item, i) => renderItem(item, i));
      }
    } else {
      state.items.forEach((item, i) => renderItem(item, i));
    }

    const text = lines.join('\n');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      // Textarea fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }, [state]);

  // ── Download HTML ──
  const handleDownload = useCallback(() => {
    // Force save to Supabase first
    draft.triggerSave();

    const docEl = document.querySelector('[data-doc-export]');
    if (!docEl) return;

    // Extract all CSS from page stylesheets
    let css = '';
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) css += rule.cssText + '\n';
        } catch (e) { /* cross-origin */ }
      }
    } catch (e) { /* fallback */ }

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Bon de commande ${state.orderNumber || ''}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>${docEl.innerHTML}</body></html>`;

    const supplier = state.supplier || 'R';
    const ref = state.project?.ref || 'draft';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `commande-${supplier}-${ref}-${date}.html`;

    // Method 1: Blob
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    } catch (e) { /* fallback */ }

    // Method 2: Data URI
    try {
      const encoded = encodeURIComponent(html);
      const a = document.createElement('a');
      a.href = 'data:text/html;charset=utf-8,' + encoded;
      a.download = filename;
      a.click();
      return;
    } catch (e) { /* fallback */ }

    // Method 3: Window.open (last resort)
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    } else {
      alert('Téléchargement échoué. Brouillon sauvé — récupère via le bouton Brouillons.');
    }
  }, [state, draft]);

  // ── Print ──
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Créer le devis (P-A) ──
  const handleSaveAsJob = useCallback(async () => {
    // Client-side validation before POST
    if (!state.project?.client?.trim()) {
      setErrorToast('Entrer le nom du client avant de créer le devis.');
      setTimeout(() => setErrorToast(null), 5000);
      return;
    }
    if (!state.items || state.items.length === 0) {
      setErrorToast('Ajouter au moins un item avant de créer le devis.');
      setTimeout(() => setErrorToast(null), 5000);
      return;
    }

    setSavingJob(true);
    setErrorToast(null);
    setSuccessModal(null);

    try {
      const res = await fetch('/api/commande/save-as-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_id: draft.draftId || null,
          commande_state: {
            project: state.project,
            items: state.items,
            supplier: state.supplier,
            // P-B: pass prefill_lead_id so server skips matching and reuses CRM lead directly
            prefill_lead_id: state.prefillLeadId || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorToast(data.error || 'Erreur serveur — réessaie.');
        setTimeout(() => setErrorToast(null), 6000);
      } else {
        // Show success modal with CRM deep-link
        setSuccessModal({
          jobIdHuman: data.job_id_human,
          quoteNumber: data.quote_number,
          url: data.url,
          updated: data.updated,
          leadMatched: data.lead_matched ?? null,
          leadName: data.lead_name || null,
        });
      }
    } catch (err) {
      setErrorToast('Erreur réseau — réessaie.');
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setSavingJob(false);
    }
  }, [state, draft]);

  // ── Drafts modal ──
  const handleOpenDrafts = useCallback(async () => {
    const list = await draft.listDrafts();
    setDraftsList(list || []);
    setDraftsOpen(true);
  }, [draft]);

  const handleLoadDraft = useCallback(async (id) => {
    setDraftsOpen(false);
    const saved = await draft.loadDraft(id);
    if (saved) {
      window.location.search = `?draft=${id}`;
    }
  }, [draft]);

  return (
    <>
      <div className={s.exportBar}>
        <SaveStatus status={draft.saveStatus} />
        <div className={s.exportBtns}>
          <Button variant="secondary" size="sm" onClick={handleDownload}>T&eacute;l&eacute;charger</Button>
          <Button variant="secondary" size="sm" onClick={handleCopy}>Copier texte</Button>
          <Button variant="secondary" size="sm" onClick={handlePrint}>Imprimer</Button>
          <Button variant="secondary" size="sm" onClick={handleOpenDrafts}>Brouillons</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAsJob}
            disabled={savingJob}
          >
            {savingJob ? 'Création...' : 'Créer le devis'}
          </Button>
        </div>
      </div>

      {/* Inline error toast (small, auto-dismiss) */}
      {errorToast && (
        <div
          style={{
            margin: '0 0 10px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          }}
        >
          <XCircle size={14} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{errorToast}</span>
        </div>
      )}

      {/* P-A: Success modal — persistent until dismissed */}
      {successModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setSuccessModal(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '32px 28px 24px',
              maxWidth: '420px',
              width: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <CheckCircle size={48} color="#16a34a" strokeWidth={1.5} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#111' }}>
              {successModal.updated ? 'Devis mis à jour' : 'Devis créé'}
            </h3>
            <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#555', fontWeight: 600 }}>
              {successModal.jobIdHuman}
            </p>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#888' }}>
              {successModal.quoteNumber}
            </p>
            {successModal.leadMatched != null && (
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: successModal.leadMatched ? '#15803d' : '#555', background: successModal.leadMatched ? '#dcfce7' : '#f3f4f6', borderRadius: '6px', padding: '6px 10px' }}>
                {successModal.leadMatched
                  ? `Lié au lead existant${successModal.leadName ? ` — ${successModal.leadName}` : ''}`
                  : `Nouveau lead créé${successModal.leadName ? ` — ${successModal.leadName}` : ''}`
                }
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <a
                href={successModal.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  background: '#111',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Ouvrir dans CRM <ExternalLink size={13} />
              </a>
              <button
                onClick={() => setSuccessModal(null)}
                style={{
                  padding: '10px 18px',
                  background: '#f3f4f6',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={draftsOpen}
        onClose={() => setDraftsOpen(false)}
        title="Brouillons sauvegard&eacute;s"
      >
        {draftsList.length === 0 ? (
          <p style={{ opacity: 0.5, fontSize: 13 }}>Aucun brouillon</p>
        ) : (
          <div className={s.draftsList}>
            {draftsList.map((d) => (
              <button
                key={d.id}
                className={s.draftRow}
                onClick={() => handleLoadDraft(d.id)}
              >
                <span className={s.draftRef}>{d.project_ref || '(sans réf)'}</span>
                <span className={s.draftClient}>{d.client_name || ''}</span>
                <span className={s.draftSupplier}>{d.supplier}</span>
                <span className={s.draftDate}>{new Date(d.updated_at).toLocaleString('fr-CA')}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
