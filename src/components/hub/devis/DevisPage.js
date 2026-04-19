import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, ChevronDown, ChevronRight, AlertTriangle, Check, Loader, Trash2, Copy, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/hub/ui';
import s from './devis.module.css';

const STEPS = ['upload', 'review', 'generate'];

function formatCurrency(n) {
  if (n == null || isNaN(n)) return '0,00 $';
  return Number(n).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 });
}

function detectFileType(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('soumission') || lower.includes('pur37') || /^\d+\.pdf$/.test(lower)) return 'soumission';
  return 'bon_commande';
}

function parseFrac(str) {
  if (!str) return 0;
  const s = String(str).trim().replace(/[""]/g, '');
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  const m = s.match(/^(\d+)\s*(\d+)\s*\/\s*(\d+)$/);
  if (m) return parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]);
  const f = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (f) return parseInt(f[1]) / parseInt(f[2]);
  return parseFloat(s) || 0;
}

function computeClientPrice(item, pricing) {
  if (!item.unitPrice) return { clientUnit: 0, clientTotal: 0, cost: 0 };
  const listPrice = Number(item.unitPrice);
  // Step 1: Apply dealer discount to get Jeremy's cost
  const cost = listPrice * (1 - (pricing.escomptePct / 100));
  // Step 2: Apply markup on cost
  const afterMarkup = cost * (1 + (pricing.markupPct / 100));
  // Step 3: Add linear inch surcharge (perimeter = 2 × (width + height))
  const w = parseFrac(item.dimensions?.width);
  const h = parseFrac(item.dimensions?.height);
  const perimeter = 2 * (w + h);
  const linearSurcharge = perimeter * pricing.perLinearInch;
  const rawPrice = afterMarkup + linearSurcharge;
  // Step 4: Apply minimum
  const clientUnit = Math.max(rawPrice, pricing.minPerWindow);
  const qty = Number(item.qty) || 1;
  return {
    cost: Math.round(cost * 100) / 100,
    clientUnit: Math.round(clientUnit * 100) / 100,
    clientTotal: Math.round(clientUnit * qty * 100) / 100,
  };
}

const DEFAULT_PRICING = { escomptePct: 0, markupPct: 20, perLinearInch: 3, minPerWindow: 400 };

export default function DevisPage() {
  const [step, setStep] = useState('upload');
  const [files, setFiles] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [soumission, setSoumission] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedDevis, setGeneratedDevis] = useState({});
  const [pricing, setPricing] = useState({ ...DEFAULT_PRICING });
  const [copiedKey, setCopiedKey] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback((newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfs.length === 0) return;
    setFiles(prev => [...prev, ...pdfs.map(f => ({ file: f, name: f.name, type: detectFileType(f.name) }))]);
  }, []);

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  async function handleParse() {
    setParsing(true);
    setParseError(null);
    try {
      // Step 1: Upload + extract text (fast, <5s)
      const form = new FormData();
      for (const f of files) {
        const safeName = f.name.replace(/[^\x20-\x7E]/g, '_').replace(/\s+/g, '_');
        const renamedFile = new File([f.file], safeName, { type: f.file.type || 'application/pdf' });
        form.append('files', renamedFile);
      }

      let extractRes;
      try {
        extractRes = await fetch('/api/devis/extract', { method: 'POST', body: form });
      } catch (fetchErr) {
        throw new Error('Erreur reseau — verifiez votre connexion');
      }
      let extractData;
      try { extractData = await extractRes.json(); } catch { throw new Error('Erreur serveur (extraction, status ' + extractRes.status + ')'); }
      if (!extractRes.ok) throw new Error(extractData.error || 'Erreur extraction PDF');

      const docs = extractData.docs || [];
      if (docs.length === 0) throw new Error('Aucun texte extrait des PDFs');

      // Step 2: Send texts to GPT for parsing + price matching (Edge, 30s)
      let parseRes;
      try {
        parseRes = await fetch('/api/devis/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs }),
        });
      } catch (fetchErr) {
        throw new Error('Erreur reseau lors de l\'analyse IA');
      }
      let parseData;
      try { parseData = await parseRes.json(); } catch { throw new Error('Erreur serveur (analyse, status ' + parseRes.status + ')'); }
      if (!parseRes.ok) throw new Error(parseData.error || 'Erreur analyse IA');

      const ordersList = parseData.orders || [];
      if (ordersList.length === 0) throw new Error('Aucun bon de commande detecte dans les documents');

      // Auto-detect escompte from soumission
      const soum = parseData.soumission || null;
      if (soum?.escomptePct && soum.escomptePct > 0) {
        setPricing(p => ({ ...p, escomptePct: soum.escomptePct }));
      }

      setProjects(ordersList.map(p => ({
        ...p,
        clientName: p.clientName || p.clientFinal || '',
        clientAddress: p.clientAddress || '',
        clientPhone: p.clientPhone || '',
        clientEmail: p.clientEmail || '',
        installationCost: '',
      })));
      setSoumission(soum);
      setStep('review');
    } catch (err) {
      setParseError(err.message);
    } finally {
      setParsing(false);
    }
  }

  function updateProject(idx, field, value) {
    setProjects(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  function getProjectTotals(project) {
    const fenTotal = (project.items || []).reduce((sum, item) => {
      const { clientTotal } = computeClientPrice(item, pricing);
      return sum + clientTotal;
    }, 0);
    const install = Number(project.installationCost) || 0;
    const sousTotal = fenTotal + install;
    const tps = sousTotal * 0.05;
    const tvq = sousTotal * 0.09975;
    const ttc = sousTotal + tps + tvq;
    return { fenTotal, install, sousTotal, tps, tvq, ttc };
  }

  const allValid = projects.length > 0 && projects.every(p => p.clientName);

  async function handleGenerate() {
    setGenerating(true);
    try {
      // Build line_items in universal API shape, including installation as a line_item
      const payload = projects.map((p, i) => {
        const fenItems = (p.items || []).map(item => {
          const { clientUnit, clientTotal } = computeClientPrice(item, pricing);
          return {
            description: `${item.type || 'Item'}${item.model && item.model !== 'N/A' ? ' ' + item.model : ''}`,
            qty: item.qty || 1,
            unit_price: clientUnit,
            total: clientTotal,
            // PÜR-specific optional fields for SVG sketch + table display
            model: item.model,
            ouvrant: item.ouvrant,
            dimensions: item.dimensions,
            type: item.type,
            specs: item.specs,
          };
        });

        const installCost = Number(p.installationCost) || 0;
        const allItems = installCost > 0
          ? [...fenItems, {
              description: 'Installation, finition et moulures extérieures',
              qty: 1,
              unit_price: installCost,
              total: installCost,
            }]
          : fenItems;

        const subtotal = allItems.reduce((s, it) => s + (it.total || 0), 0);

        return {
          projectId: p.projectId || `projet-${i + 1}`,
          clientName: p.clientName,
          clientPhone: p.clientPhone || null,
          clientEmail: p.clientEmail || null,
          clientAddress: p.clientAddress || null,
          projectDescription: 'Fourniture et installation de portes et fenêtres',
          items: allItems,
          subtotal,
          notes: null,
        };
      });

      const res = await fetch('/api/devis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      const results = {};
      for (const d of data.devis || []) {
        results[d.projectId] = d;
      }
      setGeneratedDevis(results);
    } catch (err) {
      // Store error for each project so step 3 shows it
      const results = {};
      for (let i = 0; i < projects.length; i++) {
        const key = projects[i].projectId || `projet-${i + 1}`;
        results[key] = { ok: false, error: err.message };
      }
      setGeneratedDevis(results);
    }
    setStep('generate');
    setGenerating(false);
  }

  async function copyLink(url, key) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback: select input
    }
  }

  return (
    <div className={s.page}>
      {/* Step indicators */}
      <div className={s.steps}>
        {STEPS.map((st, i) => (
          <div key={st} className={`${s.stepDot} ${step === st ? s.stepDotActive : STEPS.indexOf(step) > i ? s.stepDotDone : ''}`}>
            <span className={s.stepNum}>{i + 1}</span>
            <span className={s.stepLabel}>{st === 'upload' ? 'Documents' : st === 'review' ? 'Revision' : 'Devis'}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className={s.section}>
          <h2 className={s.sectionTitle}>Televersement des documents</h2>
          <p className={s.sectionSub}>Glissez les bons de commande PUR + la soumission Royalty</p>

          <div
            className={s.dropZone}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add(s.dropZoneActive); }}
            onDragLeave={(e) => e.currentTarget.classList.remove(s.dropZoneActive)}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove(s.dropZoneActive); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={s.dropIcon} size={40} />
            <p className={s.dropText}>Glisser vos PDF ici</p>
            <p className={s.dropHint}>ou cliquer pour selectionner</p>
            <input ref={fileInputRef} type="file" accept=".pdf" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
          </div>

          {files.length > 0 && (
            <div className={s.fileList}>
              {files.map((f, i) => (
                <div key={i} className={s.fileCard}>
                  <FileText size={18} />
                  <span className={s.fileName}>{f.name}</span>
                  <span className={`${s.fileBadge} ${f.type === 'soumission' ? s.fileBadgeSoumission : s.fileBadgeBon}`}>
                    {f.type === 'soumission' ? 'Soumission' : 'Bon de commande'}
                  </span>
                  <button className={s.fileRemove} onClick={() => removeFile(i)} title="Retirer"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {parseError && <div className={s.error}><AlertTriangle size={16} /> {parseError}</div>}

          <Button
            onClick={handleParse}
            disabled={files.length === 0 || parsing}
            style={{ marginTop: 16, width: '100%' }}
          >
            {parsing ? <><Loader size={16} className={s.spin} /> Analyse en cours...</> : `Analyser ${files.length} document${files.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}

      {/* STEP 2: Review */}
      {step === 'review' && (
        <div className={s.section}>
          <h2 className={s.sectionTitle}>{projects.length} projet{projects.length > 1 ? 's' : ''} detecte{projects.length > 1 ? 's' : ''}</h2>
          <p className={s.sectionSub}>Verifiez les items, ajustez les prix et entrez le cout d'installation</p>

          {/* Escompte auto-detected — show only if > 0 */}
          {pricing.escomptePct > 0 && (
            <div className={s.pricingBar}>
              <span className={s.pricingLabel}>Escompte fournisseur detecte: {pricing.escomptePct}%</span>
            </div>
          )}

          <div className={s.projectList}>
            {projects.map((proj, pi) => {
              const totals = getProjectTotals(proj);
              const expanded = expandedProject === pi;
              const unmatchedCount = (proj.items || []).filter(it => !it.matched && it.matched !== undefined).length;

              return (
                <div key={pi} className={s.projectCard}>
                  <button className={s.projectHeader} onClick={() => setExpandedProject(expanded ? null : pi)}>
                    <div className={s.projectHeaderLeft}>
                      {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <span className={s.projectId}>{proj.projectId || `Projet ${pi + 1}`}</span>
                      <span className={s.projectCount}>{(proj.items || []).length} items</span>
                      {unmatchedCount > 0 && <span className={s.projectWarn}><AlertTriangle size={12} /> {unmatchedCount} sans prix</span>}
                    </div>
                    <span className={s.projectTotal}>{formatCurrency(totals.ttc)}</span>
                  </button>

                  <div className={s.projectBody}>
                    <div className={s.projectFields}>
                      <label className={s.fieldLabel}>
                        Client
                        <input className={s.fieldInput} value={proj.clientName} onChange={(e) => updateProject(pi, 'clientName', e.target.value)} placeholder="Nom du client" />
                      </label>
                      <label className={s.fieldLabel}>
                        Adresse
                        <input className={s.fieldInput} value={proj.clientAddress} onChange={(e) => updateProject(pi, 'clientAddress', e.target.value)} placeholder="Adresse du chantier" />
                      </label>
                      <label className={s.fieldLabel}>
                        Téléphone
                        <input className={s.fieldInput} type="tel" value={proj.clientPhone} onChange={(e) => updateProject(pi, 'clientPhone', e.target.value)} placeholder="(514) 555-1234" />
                      </label>
                      <label className={s.fieldLabel}>
                        Courriel
                        <input className={s.fieldInput} type="email" value={proj.clientEmail} onChange={(e) => updateProject(pi, 'clientEmail', e.target.value)} placeholder="client@exemple.com" />
                      </label>
                      <label className={s.fieldLabel}>
                        Travaux supp. ($)
                        <input className={s.fieldInput} type="number" value={proj.installationCost} onChange={(e) => updateProject(pi, 'installationCost', e.target.value)} placeholder="0 (optionnel)" min="0" step="100" />
                      </label>
                    </div>

                    {/* Totals */}
                    <div className={s.totalsBar}>
                      <span>Fourni + installe: {formatCurrency(totals.fenTotal)}</span>
                      {totals.install > 0 && <span>Travaux supp.: {formatCurrency(totals.install)}</span>}
                      <span>TPS: {formatCurrency(totals.tps)}</span>
                      <span>TVQ: {formatCurrency(totals.tvq)}</span>
                      <span className={s.totalBold}>Total TTC: {formatCurrency(totals.ttc)}</span>
                    </div>

                    {/* Items table */}
                    {expanded && (
                      <div className={s.itemsTable}>
                        <div className={s.itemsHeader}>
                          <span>#</span>
                          <span>Description</span>
                          <span>Qte</span>
                          <span>Prix unit.</span>
                          <span>Total</span>
                        </div>
                        {(proj.items || []).map((item, ii) => {
                          const { clientUnit, clientTotal } = computeClientPrice(item, pricing);
                          const hasPrice = !!item.unitPrice;
                          const dim = item.dimensions ? `${item.dimensions.width}" x ${item.dimensions.height}"` : '';
                          return (
                            <div key={ii} className={`${s.itemRow} ${!hasPrice ? s.itemUnmatched : ''}`}>
                              <span>{item.index || ii + 1}</span>
                              <span>
                                <strong>{item.type || 'Item'}</strong>
                                {item.model && item.model !== 'N/A' ? ` ${item.model}` : ''}
                                {dim && <br />}
                                {dim && <span style={{ fontSize: 10, opacity: 0.6 }}>{dim}</span>}
                              </span>
                              <span>{item.qty || 1}</span>
                              {hasPrice ? (
                                <>
                                  <span>{formatCurrency(clientUnit)}</span>
                                  <span style={{ fontWeight: 600 }}>{formatCurrency(clientTotal)}</span>
                                </>
                              ) : (
                                <>
                                  <span className={s.priceInputWrap}>
                                    <span className={s.flag}>A VERIFIER</span>
                                    <input
                                      type="number"
                                      placeholder="Prix liste $"
                                      className={s.priceInput}
                                      onChange={(e) => {
                                        const val = Number(e.target.value) || 0;
                                        updateProject(pi, 'items', (proj.items || []).map((it, idx) =>
                                          idx === ii ? { ...it, unitPrice: val, matched: val > 0 } : it
                                        ));
                                      }}
                                      min="0"
                                      step="10"
                                    />
                                  </span>
                                  <span style={{ fontWeight: 600 }}>{clientTotal ? formatCurrency(clientTotal) : '—'}</span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={s.actionBar}>
            <Button variant="ghost" onClick={() => setStep('upload')}>Retour</Button>
            <Button onClick={handleGenerate} disabled={!allValid || generating}>
              {generating ? <><Loader size={16} className={s.spin} /> Generation...</> : `Generer ${projects.length} devis`}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Generated */}
      {step === 'generate' && (
        <div className={s.section}>
          <h2 className={s.sectionTitle}>Devis generes</h2>
          <p className={s.sectionSub}>Partagez le lien ou ouvrez l&apos;aperçu</p>

          <div className={s.projectList}>
            {projects.map((proj, pi) => {
              const key = proj.projectId || `projet-${pi + 1}`;
              const result = generatedDevis[key];
              return (
                <div key={pi} className={s.resultCard}>
                  <div className={s.resultLeft}>
                    {result?.ok ? <Check size={18} className={s.resultOk} /> : <AlertTriangle size={18} className={s.resultErr} />}
                    <div>
                      <p className={s.resultName}>{proj.clientName || key}</p>
                      <p className={s.resultSub}>
                        {result?.ok ? `${result.quote_number} — ${formatCurrency(result.total_ttc)}` : key}
                      </p>
                    </div>
                  </div>
                  {result?.ok ? (
                    <div className={s.resultActions}>
                      <Button size="sm" onClick={() => copyLink(result.public_url, key)} title="Copier le lien">
                        <Copy size={14} /> {copiedKey === key ? 'Copié!' : 'Copier lien'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(result.public_url, '_blank')} title="Aperçu du devis">
                        <ExternalLink size={14} /> Aperçu
                      </Button>
                      <Button size="sm" variant="ghost" disabled title="Disponible bientôt — P6">
                        <MessageSquare size={14} /> SMS
                      </Button>
                    </div>
                  ) : (
                    <span className={s.resultErrText}>{result?.error || 'Erreur'}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className={s.actionBar}>
            <Button variant="ghost" onClick={() => setStep('review')}>Modifier</Button>
            <Button variant="ghost" onClick={() => { setStep('upload'); setFiles([]); setProjects([]); setGeneratedDevis({}); }}>Nouveau lot</Button>
          </div>
        </div>
      )}
    </div>
  );
}
