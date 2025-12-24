// pages/fr/onboarding-rescue.js
// Comprehensive Lead Rescue Onboarding Form (v2 - Matches ChatGPT Checklist)
import { useState } from 'react';

export default function LeadRescueOnboardingFR() {
  const [form, setForm] = useState({
    // A. Business Basics
    businessType: 'hvac',
    businessName: '',
    ownerName: '',
    ownerEmail: '',
    ownerMobile: '',
    timezone: 'America/Toronto',
    primaryLanguage: 'french',
    replyInInboundLanguage: true,

    // B. Phone & Call Forwarding (HARD GATE)
    businessPhone: '',
    canEnableCallForwarding: '',
    callForwardingManager: '',
    ringSeconds: '25',
    callForwardingAck: false,

    // C. SMS/MMS & Consent
    smsConsentAck: false,
    smsOptOutAck: false,
    allowMMS: 'yes',

    // D. Email/Inbox
    inboxEmail: '',
    emailProvider: 'google',
    emailIntegrationMethod: 'forwarding',
    secondaryInboxes: '',

    // E. Lead Qualification Rules
    services: [],
    serviceArea: '',
    jobTypesWanted: '',
    jobTypesNotWanted: '',
    residentialCommercial: 'both',
    disqualifiers: '',
    existingCustomerFastRoute: true,

    // F. Booking/Callback
    nextStepPreference: 'manual',
    bookingLink: '',
    callbackWindows: '',

    // G. Brand Voice & Restrictions
    tone: 'friendly',
    noPricingAck: false,
    noTimingAck: false,
    signatureText: '',
    neverSayText: '',

    // H. Notifications & Daily Summary
    dailySummaryDelivery: 'email',
    dailySummaryEmail: '',
    dailySummarySMS: '',
    summaryIncludeNewLeads: true,
    summaryIncludeMissedCalls: true,
    summaryIncludeReplies: true,
    summaryIncludeCallbacks: true,

    // I. Hours & Operations
    hoursWeek: '',
    hoursWeekend: '',

    // J. Assets
    logo: null,

    // K. Industry-Specific (conditional)
    // HVAC
    hvacSystemTypes: [],
    hvacPeakMonths: '',
    hvacMaintenanceContracts: 'yes',
    // Plumbing
    plumbingFocusAreas: [],
    plumbingEmergency24_7: 'yes',
    plumbingResponseTime: '',
    // Roofing
    roofingRoofTypes: '',
    roofingEmergencyStorm: 'yes',
    roofingHeightLimits: '',
    // Chimney
    chimneyServices: '',
    chimneySeason: '',
    chimneyInstallations: '',
    // Electrician
    electricianWorkTypes: '',
    electricianEmergency24_7: 'yes',
    electricianLicenses: '',
    // Other
    otherTradeDescription: '',
    otherEmergency: 'yes',
  });

  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      // Handle array checkboxes (services, hvacSystemTypes, etc.)
      if (name === 'services') {
        setForm((prev) => ({
          ...prev,
          services: checked
            ? [...prev.services, value]
            : prev.services.filter((s) => s !== value),
        }));
        return;
      }
      if (name === 'hvacSystemTypes') {
        setForm((prev) => ({
          ...prev,
          hvacSystemTypes: checked
            ? [...prev.hvacSystemTypes, value]
            : prev.hvacSystemTypes.filter((s) => s !== value),
        }));
        return;
      }
      if (name === 'plumbingFocusAreas') {
        setForm((prev) => ({
          ...prev,
          plumbingFocusAreas: checked
            ? [...prev.plumbingFocusAreas, value]
            : prev.plumbingFocusAreas.filter((s) => s !== value),
        }));
        return;
      }
      // Handle boolean checkboxes
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (type === 'file') {
      setForm((prev) => ({ ...prev, logo: files?.[0] || null }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errs = [];

    // Required fields
    if (!form.businessName) errs.push('Nom de l\'entreprise requis');
    if (!form.ownerName) errs.push('Nom du propriétaire requis');
    if (!form.ownerEmail) errs.push('Courriel du propriétaire requis');
    if (!form.ownerMobile) errs.push('Téléphone mobile du propriétaire requis');
    if (!form.businessPhone) errs.push('Numéro d\'entreprise requis');
    if (!form.inboxEmail) errs.push('Courriel à intégrer requis');
    if (!form.serviceArea) errs.push('Zone desservie requise');
    if (!form.jobTypesWanted) errs.push('Types de travaux recherchés requis');
    if (!form.hoursWeek) errs.push('Heures d\'opération (semaine) requises');

    // HARD GATE: Call forwarding
    if (form.canEnableCallForwarding === '') {
      errs.push('Vous devez indiquer si vous pouvez activer la redirection d\'appels');
    } else if (form.canEnableCallForwarding === 'no') {
      errs.push('BLOCAGE: La redirection d\'appels après X sonneries est REQUISE pour le système Lead Rescue. Veuillez contacter votre fournisseur télécom et revenir quand c\'est activé.');
    } else if (!form.callForwardingAck) {
      errs.push('Vous devez confirmer que vous comprenez comment fonctionne la redirection d\'appels');
    }

    // Required acknowledgments
    if (!form.smsConsentAck) errs.push('Vous devez confirmer le consentement SMS/MMS');
    if (!form.smsOptOutAck) errs.push('Vous devez confirmer l\'ajout d\'une ligne de désabonnement');
    if (!form.noPricingAck) errs.push('Vous devez confirmer que l\'IA ne citera jamais de prix');
    if (!form.noTimingAck) errs.push('Vous devez confirmer que l\'IA ne garantira jamais de délais');

    // Daily summary email if delivery includes email
    if ((form.dailySummaryDelivery === 'email' || form.dailySummaryDelivery === 'both') && !form.dailySummaryEmail) {
      errs.push('Courriel pour résumé quotidien requis');
    }

    // Daily summary SMS if delivery includes SMS
    if ((form.dailySummaryDelivery === 'sms' || form.dailySummaryDelivery === 'both') && !form.dailySummarySMS) {
      errs.push('Numéro SMS pour résumé quotidien requis');
    }

    // Booking link if using booking method
    if (form.nextStepPreference === 'booking' && !form.bookingLink) {
      errs.push('Lien de réservation requis si vous utilisez cette méthode');
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setStatus('Veuillez corriger les erreurs ci-dessus');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setStatus('Envoi en cours…');
    setErrors([]);

    try {
      const payload = {
        // This will be stored as JSONB in customers.onboarding_intake or similar
        onboarding_intake: {
          version: '2.0',
          submitted_at: new Date().toISOString(),
          ...form,
        },
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error('Erreur API onboarding:', await res.text());
        setStatus('Erreur — veuillez réessayer.');
        return;
      }

      setStatus('✅ Soumis ! Je vais analyser vos informations et préparer votre système Lead Rescue. Vous recevrez un courriel sous 24h avec les prochaines étapes.');
    } catch (error) {
      console.error(error);
      setStatus('Erreur réseau — réessayez.');
    }
  };

  const { businessType } = form;
  const isHVAC = businessType === 'hvac';
  const isPlumbing = businessType === 'plumbing';
  const isRoofing = businessType === 'roofing';
  const isChimney = businessType === 'chimney';
  const isElectrician = businessType === 'electrician';
  const isOther = businessType === 'other';

  const businessTypeButtons = [
    { id: 'hvac', label: 'HVAC' },
    { id: 'plumbing', label: 'Plomberie' },
    { id: 'roofing', label: 'Toiture' },
    { id: 'chimney', label: 'Cheminée / Foyer' },
    { id: 'electrician', label: 'Électricien' },
    { id: 'other', label: 'Autre' },
  ];

  const serviceOptionsByType = {
    hvac: [
      'Installation HVAC',
      'Réparation HVAC',
      'Entretien AC',
      'Service fournaise',
      'Thermopompe',
      'Mini-split / Ductless',
      'Urgence HVAC',
    ],
    plumbing: [
      'Installation plomberie',
      'Réparation plomberie',
      'Débouchage drain',
      'Chauffe-eau',
      'Égout / conduite principale',
      'Rénos cuisine / salle de bain',
      'Urgence plomberie',
    ],
    roofing: [
      'Réparation de toit / fuite',
      'Toiture neuve / Réfection',
      'Gouttières',
      'Inspection de toit',
      'Urgence – dégâts de tempête',
    ],
    chimney: [
      'Ramoneur / inspection',
      'Installation poêle / foyer',
      'Réparation cheminée / gainage',
      'Installation d'insert',
      'Pare-étincelle / étanchéité',
    ],
    electrician: [
      'Dépannage électrique',
      'Panneau / disjoncteur',
      'Éclairage / luminaires',
      'Bornes recharge EV',
      'Câblage rénovation / construction',
      'Génératrice',
      'Urgence électrique',
    ],
    other: [
      'Appel de service général',
      'Petits travaux / handyman',
      'Soumission / estimation',
      'Contrats d'entretien',
      'Autre (décrire ci-dessous)',
    ],
  };

  const serviceOptions = serviceOptionsByType[businessType] || serviceOptionsByType.other;

  return (
    <div className="min-h-screen bg-[url('/styles/backgroundpages.png')] bg-cover bg-center text-white">
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section className="max-w-4xl mx-auto space-y-10 px-6 sm:px-12 py-10 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-md shadow-[0_0_45px_rgba(15,23,42,0.9)]">
          <h1 className="text-4xl font-heading text-center drop-shadow-md">
            BlueWise AI — Onboarding Lead Rescue
          </h1>

          <p className="text-center text-slate-100 drop-shadow-sm">
            Remplissez ce formulaire complet pour configurer votre système d'automatisation 24/7.
            <br />
            <span className="text-sm text-slate-300">Setup en 72h. Tous les champs requis sont marqués *</span>
          </p>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="bg-red-900/40 border border-red-500/60 rounded-xl p-4">
              <h3 className="font-semibold text-red-200 mb-2">⚠️ Veuillez corriger les erreurs suivantes :</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-100">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Industry Selector */}
          <div className="flex flex-wrap justify-center gap-3">
            {businessTypeButtons.map((btn) => {
              const active = form.businessType === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, businessType: btn.id }))}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200
                    ${active
                      ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.85)]'
                      : 'bg-slate-800/70 text-slate-200 border-slate-600 hover:bg-slate-700'
                    }
                  `}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ====== SECTION A: Business Basics ====== */}
            <div className="space-y-4 border border-blue-500/30 rounded-2xl p-6 bg-slate-900/60">
              <h2 className="text-xl font-semibold text-blue-300">A. Informations de base *</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Nom de l'entreprise *</label>
                  <input
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Nom du propriétaire / contact principal *</label>
                  <input
                    name="ownerName"
                    value={form.ownerName}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Courriel du propriétaire *</label>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={form.ownerEmail}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Téléphone mobile du propriétaire *</label>
                  <input
                    type="tel"
                    name="ownerMobile"
                    value={form.ownerMobile}
                    onChange={handleChange}
                    required
                    placeholder="Pour notifications urgentes"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Fuseau horaire *</label>
                  <select
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  >
                    <option value="America/Toronto">America/Toronto (ET)</option>
                    <option value="America/Montreal">America/Montreal (ET)</option>
                    <option value="America/Halifax">America/Halifax (AT)</option>
                    <option value="America/Winnipeg">America/Winnipeg (CT)</option>
                    <option value="America/Edmonton">America/Edmonton (MT)</option>
                    <option value="America/Vancouver">America/Vancouver (PT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Langue principale *</label>
                  <select
                    name="primaryLanguage"
                    value={form.primaryLanguage}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  >
                    <option value="french">Français</option>
                    <option value="english">Anglais</option>
                    <option value="bilingual">Bilingue (FR/EN)</option>
                  </select>
                </div>
              </div>

              {form.primaryLanguage === 'bilingual' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="replyInInboundLanguage"
                    checked={form.replyInInboundLanguage}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <label className="text-sm">Répondre dans la langue de l'appel/message entrant (recommandé)</label>
                </div>
              )}
            </div>

            {/* ====== SECTION B: Phone & Call Forwarding (HARD GATE) ====== */}
            <div className="space-y-4 border border-red-500/50 rounded-2xl p-6 bg-red-950/20">
              <h2 className="text-xl font-semibold text-red-300">B. Téléphone & Redirection d'appels * (REQUIS)</h2>
              <p className="text-sm text-slate-300">
                Le système Lead Rescue nécessite que vos appels manqués soient redirigés vers un numéro IA après X sonneries.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Numéro principal de l'entreprise *</label>
                  <input
                    type="tel"
                    name="businessPhone"
                    value={form.businessPhone}
                    onChange={handleChange}
                    required
                    placeholder="Ex: +1 514 555-1234"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Pouvez-vous activer la redirection d'appels après X sonneries ? *</label>
                  <select
                    name="canEnableCallForwarding"
                    value={form.canEnableCallForwarding}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="yes">Oui, je peux l'activer</option>
                    <option value="no">Non, impossible</option>
                  </select>
                </div>
              </div>

              {form.canEnableCallForwarding === 'yes' && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Qui gère la redirection ?</label>
                      <select
                        name="callForwardingManager"
                        value={form.callForwardingManager}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                      >
                        <option value="">-- Sélectionner --</option>
                        <option value="owner">Moi (propriétaire)</option>
                        <option value="staff">Un employé</option>
                        <option value="telecom">Fournisseur télécom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Sonneries avant redirection</label>
                      <select
                        name="ringSeconds"
                        value={form.ringSeconds}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                      >
                        <option value="15">15 secondes (3-4 sonneries)</option>
                        <option value="20">20 secondes (4-5 sonneries)</option>
                        <option value="25">25 secondes (5-6 sonneries) — Recommandé</option>
                        <option value="30">30 secondes (6-7 sonneries)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-blue-950/30 p-4 rounded-xl">
                    <input
                      type="checkbox"
                      name="callForwardingAck"
                      checked={form.callForwardingAck}
                      onChange={handleChange}
                      required
                      className="w-4 h-4 mt-1"
                    />
                    <label className="text-sm">
                      <strong>Je confirme :</strong> Les appels sonneront normalement sur mon numéro principal. Si personne ne répond après {form.ringSeconds} secondes, l'appel sera redirigé vers un numéro IA qui répondra automatiquement.
                    </label>
                  </div>
                </>
              )}

              {form.canEnableCallForwarding === 'no' && (
                <div className="bg-red-900/40 border border-red-500/60 rounded-xl p-4">
                  <p className="text-red-100 font-semibold">
                    ⚠️ BLOCAGE : La redirection d'appels après X sonneries est REQUISE pour le système Lead Rescue. Veuillez contacter votre fournisseur télécom pour activer cette fonctionnalité, puis revenez compléter ce formulaire.
                  </p>
                </div>
              )}
            </div>

            {/* ====== SECTION C: SMS/MMS & Consent ====== */}
            <div className="space-y-4 border border-slate-700/70 rounded-2xl p-6 bg-slate-900/60">
              <h2 className="text-xl font-semibold text-slate-200">C. SMS / MMS & Consentement *</h2>

              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-blue-950/30 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    name="smsConsentAck"
                    checked={form.smsConsentAck}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 mt-1"
                  />
                  <label className="text-sm">
                    <strong>Je confirme :</strong> L'IA n'enverra de SMS/MMS qu'aux personnes qui nous ont contactés (appel manqué ou SMS entrant). Respect de la loi anti-spam canadienne.
                  </label>
                </div>

                <div className="flex items-start gap-2 bg-blue-950/30 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    name="smsOptOutAck"
                    checked={form.smsOptOutAck}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 mt-1"
                  />
                  <label className="text-sm">
                    <strong>Je confirme :</strong> Nous inclurons une ligne de désabonnement (ex: "Répondez STOP pour ne plus recevoir de messages").
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium">Les clients peuvent envoyer des photos par SMS/MMS ? *</label>
                  <select
                    name="allowMMS"
                    value={form.allowMMS}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  >
                    <option value="yes">Oui (ex: photos de dégâts, systèmes)</option>
                    <option value="no">Non</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ====== SECTION D: Email / Inbox ====== */}
            <div className="space-y-4 border border-slate-700/70 rounded-2xl p-6 bg-slate-900/60">
              <h2 className="text-xl font-semibold text-slate-200">D. Courriel / Boîte de réception *</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Courriel principal à intégrer *</label>
                  <input
                    type="email"
                    name="inboxEmail"
                    value={form.inboxEmail}
                    onChange={handleChange}
                    required
                    placeholder="Ex: info@votreentreprise.com"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                  <p className="text-xs text-slate-400 mt-1">L'IA triera et répondra aux courriels entrants ici.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium">Fournisseur de courriel *</label>
                  <select
                    name="emailProvider"
                    value={form.emailProvider}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  >
                    <option value="google">Google Workspace / Gmail</option>
                    <option value="microsoft">Microsoft 365 / Outlook</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Méthode d'intégration *</label>
                  <select
                    name="emailIntegrationMethod"
                    value={form.emailIntegrationMethod}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  >
                    <option value="forwarding">Redirection (plus simple)</option>
                    <option value="api">API (plus tard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Courriels secondaires (optionnel)</label>
                  <input
                    type="text"
                    name="secondaryInboxes"
                    value={form.secondaryInboxes}
                    onChange={handleChange}
                    placeholder="Ex: service@..., urgence@..."
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>
              </div>
            </div>

            {/* ====== SECTION E: Services & Lead Qualification ====== */}
            <div className="space-y-4 border border-slate-700/70 rounded-2xl p-6 bg-slate-900/60">
              <h2 className="text-xl font-semibold text-slate-200">E. Services & Qualification des leads *</h2>

              <div>
                <label className="block text-sm font-medium">Services offerts</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm">
                  {serviceOptions.map((service) => (
                    <label key={service} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="services"
                        value={service}
                        checked={form.services.includes(service)}
                        onChange={handleChange}
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Zone desservie *</label>
                <textarea
                  name="serviceArea"
                  rows="2"
                  value={form.serviceArea}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Montréal, Laval, Longueuil, 25km de rayon"
                  className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Types de travaux que vous VOULEZ *</label>
                  <textarea
                    name="jobTypesWanted"
                    rows="3"
                    value={form.jobTypesWanted}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Réparation HVAC, installation, urgences"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Types de travaux à NE PAS accepter</label>
                  <textarea
                    name="jobTypesNotWanted"
                    rows="3"
                    value={form.jobTypesNotWanted}
                    onChange={handleChange}
                    placeholder="Ex: Garanties extended, projets DIY, hors zone"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Résidentiel / Commercial *</label>
                  <select
                    name="residentialCommercial"
                    value={form.residentialCommercial}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  >
                    <option value="residential">Résidentiel seulement</option>
                    <option value="commercial">Commercial seulement</option>
                    <option value="both">Les deux</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Disqualificateurs (filtres automatiques)</label>
                  <input
                    type="text"
                    name="disqualifiers"
                    value={form.disqualifiers}
                    onChange={handleChange}
                    placeholder="Ex: garantie expirée, bricolage, hors heures"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="existingCustomerFastRoute"
                  checked={form.existingCustomerFastRoute}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <label className="text-sm">Si l'appelant est un client existant, gardez l'échange bref et routez rapidement (recommandé)</label>
              </div>
            </div>

            {/* ====== SECTION F: Booking / Callback ====== */}
            <div className="space-y-4 border border-slate-700/70 rounded-2xl p-6 bg-slate-900/60">
              <h2 className="text-xl font-semibold text-slate-200">F. Réservation / Rappel</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Prochaine étape après qualification *</label>
                  <select
                    name="nextStepPreference"
                    value={form.nextStepPreference}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  >
                    <option value="manual">Nous rappelons manuellement</option>
                    <option value="booking">Utiliser un lien de réservation</option>
                  </select>
                </div>

                {form.nextStepPreference === 'booking' && (
                  <div>
                    <label className="block text-sm font-medium">URL du lien de réservation</label>
                    <input
                      type="url"
                      name="bookingLink"
                      value={form.bookingLink}
                      onChange={handleChange}
                      placeholder="Ex: https://calendly.com/..."
                      className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                    />
                  </div>
                )}
              </div>

              {form.nextStepPreference === 'manual' && (
                <div>
                  <label className="block text-sm font-medium">Fenêtres de rappel préférées</label>
                  <input
                    type="text"
                    name="callbackWindows"
                    value={form.callbackWindows}
                    onChange={handleChange}
                    placeholder="Ex: Matin (8h-12h), Après-midi (13h-17h)"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>
              )}
            </div>

            {/* ====== SECTION G: Brand Voice & Restrictions ====== */}
            <div className="space-y-4 border border-amber-500/50 rounded-2xl p-6 bg-amber-950/20">
              <h2 className="text-xl font-semibold text-amber-300">G. Ton & Restrictions de l'IA * (IMPORTANT)</h2>

              <div>
                <label className="block text-sm font-medium">Ton des réponses *</label>
                <select
                  name="tone"
                  value={form.tone}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                >
                  <option value="friendly">Amical / Chaleureux</option>
                  <option value="professional">Professionnel / Formel</option>
                  <option value="direct">Direct / Efficace</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-amber-950/30 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    name="noPricingAck"
                    checked={form.noPricingAck}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 mt-1"
                  />
                  <label className="text-sm">
                    <strong>Je confirme :</strong> L'IA ne citera JAMAIS de prix. Elle dira toujours "Un technicien vous contactera pour une évaluation et un prix précis."
                  </label>
                </div>

                <div className="flex items-start gap-2 bg-amber-950/30 p-4 rounded-xl">
                  <input
                    type="checkbox"
                    name="noTimingAck"
                    checked={form.noTimingAck}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 mt-1"
                  />
                  <label className="text-sm">
                    <strong>Je confirme :</strong> L'IA ne garantira JAMAIS de délais précis. Elle dira "sous 24-48h" ou "selon disponibilité", jamais "dans 2 heures".
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Signature SMS/Email (optionnel)</label>
                  <input
                    type="text"
                    name="signatureText"
                    value={form.signatureText}
                    onChange={handleChange}
                    placeholder="Ex: — L'équipe HVAC Pro"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Ce que l'IA ne doit JAMAIS dire</label>
                  <input
                    type="text"
                    name="neverSayText"
                    value={form.neverSayText}
                    onChange={handleChange}
                    placeholder="Ex: garanties gratuites, financement"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>
              </div>
            </div>

            {/* ====== SECTION H: Notifications & Daily Summary ====== */}
            <div className="space-y-4 border border-slate-700/70 rounded-2xl p-6 bg-slate-900/60">
              <h2 className="text-xl font-semibold text-slate-200">H. Notifications & Résumé quotidien *</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Livraison du résumé quotidien (8h AM) *</label>
                  <select
                    name="dailySummaryDelivery"
                    value={form.dailySummaryDelivery}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  >
                    <option value="email">Courriel seulement</option>
                    <option value="sms">SMS seulement</option>
                    <option value="both">Les deux (courriel + SMS)</option>
                  </select>
                </div>

                {(form.dailySummaryDelivery === 'email' || form.dailySummaryDelivery === 'both') && (
                  <div>
                    <label className="block text-sm font-medium">Courriel pour résumé quotidien *</label>
                    <input
                      type="email"
                      name="dailySummaryEmail"
                      value={form.dailySummaryEmail}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                    />
                  </div>
                )}

                {(form.dailySummaryDelivery === 'sms' || form.dailySummaryDelivery === 'both') && (
                  <div>
                    <label className="block text-sm font-medium">Numéro SMS pour résumé quotidien *</label>
                    <input
                      type="tel"
                      name="dailySummarySMS"
                      value={form.dailySummarySMS}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Inclure dans le résumé quotidien :</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="summaryIncludeNewLeads"
                      checked={form.summaryIncludeNewLeads}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Nouveaux leads
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="summaryIncludeMissedCalls"
                      checked={form.summaryIncludeMissedCalls}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Appels manqués
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="summaryIncludeReplies"
                      checked={form.summaryIncludeReplies}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Réponses en attente
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="summaryIncludeCallbacks"
                      checked={form.summaryIncludeCallbacks}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    Rappels planifiés
                  </label>
                </div>
              </div>
            </div>

            {/* ====== SECTION I: Hours & Operations ====== */}
            <div className="space-y-4 border border-slate-700/70 rounded-2xl p-6 bg-slate-900/60">
              <h2 className="text-xl font-semibold text-slate-200">I. Heures d'opération *</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Heures (semaine) *</label>
                  <input
                    name="hoursWeek"
                    value={form.hoursWeek}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Lun-Ven 8h-18h"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Heures (weekend)</label>
                  <input
                    name="hoursWeekend"
                    value={form.hoursWeekend}
                    onChange={handleChange}
                    placeholder="Ex: Sam 9h-15h, Dim fermé"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95"
                  />
                </div>
              </div>
            </div>

            {/* ====== SECTION J: Industry-Specific Details ====== */}
            {isHVAC && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails HVAC (optionnel)</h2>

                <div>
                  <label className="block text-sm font-medium">Types de systèmes travaillés</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {['Fournaise', 'Climatisation', 'Thermopompe', 'Mini-split', 'Unités de toit', 'Ventilation / HRV'].map((system) => (
                      <label key={system} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="hvacSystemTypes"
                          value={system}
                          checked={form.hvacSystemTypes.includes(system)}
                          onChange={handleChange}
                        />
                        {system}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Mois les plus occupés</label>
                    <input
                      name="hvacPeakMonths"
                      value={form.hvacPeakMonths}
                      onChange={handleChange}
                      placeholder="Ex: Mai-Sept, Déc-Fév"
                      className="mt-1 w-full rounded-xl px-4 py-2 text-black bg-white/95"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Contrats d'entretien offerts ?</label>
                    <select
                      name="hvacMaintenanceContracts"
                      value={form.hvacMaintenanceContracts}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl px-4 py-2 text-black bg-white/95"
                    >
                      <option value="yes">Oui</option>
                      <option value="no">Non</option>
                      <option value="sometimes">Parfois</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {isPlumbing && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails Plomberie (optionnel)</h2>

                <div>
                  <label className="block text-sm font-medium">Domaines principaux</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {['Résidentiel', 'Commercial', 'Débouchage', 'Égout / conduite principale', 'Chauffe-eau', 'Rénos cuisine / salle de bain'].map((area) => (
                      <label key={area} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="plumbingFocusAreas"
                          value={area}
                          checked={form.plumbingFocusAreas.includes(area)}
                          onChange={handleChange}
                        />
                        {area}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Service d'urgence 24/7</label>
                    <select
                      name="plumbingEmergency24_7"
                      value={form.plumbingEmergency24_7}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl px-4 py-2 text-black bg-white/95"
                    >
                      <option value="yes">Oui, 24/7</option>
                      <option value="limited">Limité</option>
                      <option value="no">Non</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Temps de réponse urgence</label>
                    <input
                      name="plumbingResponseTime"
                      value={form.plumbingResponseTime}
                      onChange={handleChange}
                      placeholder="Ex: 1-2 heures"
                      className="mt-1 w-full rounded-xl px-4 py-2 text-black bg-white/95"
                    />
                  </div>
                </div>
              </div>
            )}

            {isRoofing && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails Toiture (optionnel)</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Types de toits</label>
                    <input
                      name="roofingRoofTypes"
                      value={form.roofingRoofTypes}
                      onChange={handleChange}
                      placeholder="Ex: bardeaux, métal, toit plat"
                      className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Urgences / dégâts de tempête</label>
                    <select
                      name="roofingEmergencyStorm"
                      value={form.roofingEmergencyStorm}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                    >
                      <option value="yes">Oui</option>
                      <option value="limited">Limité</option>
                      <option value="no">Non</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Limites d'hauteur</label>
                    <input
                      name="roofingHeightLimits"
                      value={form.roofingHeightLimits}
                      onChange={handleChange}
                      placeholder="Ex: max 2 étages"
                      className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {isChimney && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails Cheminée (optionnel)</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Services offerts</label>
                    <input
                      name="chimneyServices"
                      value={form.chimneyServices}
                      onChange={handleChange}
                      placeholder="Ex: ramonage, inspection, gainage"
                      className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Haute saison</label>
                    <input
                      name="chimneySeason"
                      value={form.chimneySeason}
                      onChange={handleChange}
                      placeholder="Ex: Sept-Déc"
                      className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Installations offertes</label>
                    <input
                      name="chimneyInstallations"
                      value={form.chimneyInstallations}
                      onChange={handleChange}
                      placeholder="Ex: poêle, insert"
                      className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {isElectrician && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails Électricien (optionnel)</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Types de travaux</label>
                    <input
                      name="electricianWorkTypes"
                      value={form.electricianWorkTypes}
                      onChange={handleChange}
                      placeholder="Ex: résidentiel, commercial, panneaux"
                      className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Urgence 24/7</label>
                    <select
                      name="electricianEmergency24_7"
                      value={form.electricianEmergency24_7}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                    >
                      <option value="yes">Oui, 24/7</option>
                      <option value="limited">Limité</option>
                      <option value="no">Non</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Licences / certifications</label>
                    <input
                      name="electricianLicenses"
                      value={form.electricianLicenses}
                      onChange={handleChange}
                      placeholder="Ex: Maître électricien"
                      className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {isOther && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails — Autre métier (optionnel)</h2>

                <div>
                  <label className="block text-sm font-medium">Décrivez votre métier</label>
                  <textarea
                    name="otherTradeDescription"
                    rows={3}
                    value={form.otherTradeDescription}
                    onChange={handleChange}
                    placeholder="Ex: rénovation, paysagement, multiservices"
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Urgences acceptées ?</label>
                  <select
                    name="otherEmergency"
                    value={form.otherEmergency}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black"
                  >
                    <option value="yes">Oui</option>
                    <option value="limited">Limité</option>
                    <option value="no">Non</option>
                  </select>
                </div>
              </div>
            )}

            {/* ====== SECTION K: Assets ====== */}
            <div className="space-y-4 border border-slate-700/70 rounded-2xl p-6 bg-slate-900/60">
              <h2 className="text-xl font-semibold text-slate-200">K. Logo (optionnel)</h2>

              <div>
                <label className="block text-sm font-medium">Téléversez votre logo</label>
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  accept="image/*"
                  className="mt-1 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Utilisé dans les courriels et signatures. PNG ou JPG recommandé.</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'Envoi en cours…'}
              className="
                w-full inline-flex items-center justify-center
                bg-blue-600 hover:bg-blue-500
                disabled:bg-slate-600 disabled:cursor-not-allowed
                text-white font-semibold
                px-6 py-4 rounded-2xl text-lg
                shadow-[0_0_22px_rgba(59,130,246,0.85)]
                hover:-translate-y-0.5
                hover:shadow-[0_0_28px_rgba(59,130,246,0.95)]
                transition-all duration-300
              "
            >
              {status === 'Envoi en cours…' ? 'Envoi en cours…' : 'Soumettre & démarrer la configuration'}
            </button>

            {status && (
              <p className={`text-center text-sm drop-shadow-sm ${status.startsWith('✅') ? 'text-green-300' : 'text-slate-100'}`}>
                {status}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
