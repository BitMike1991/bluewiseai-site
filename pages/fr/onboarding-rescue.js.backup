// pages/fr/onboarding-rescue.js
import { useState } from 'react';

export default function LeadRescueOnboardingFR() {
  const [form, setForm] = useState({
    businessType: 'hvac', // 'hvac' | 'plumbing' | 'roofing' | 'chimney' | 'electrician' | 'other'
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    services: [],
    serviceArea: '',
    hoursWeek: '',
    hoursWeekend: '',
    urgentJobs: '',
    ignoreJobs: '',
    tone: 'friendly',
    summaryEmail: '',
    logo: null,
    // HVAC-specific
    hvacSystemTypes: [],
    hvacPeakMonths: '',
    hvacMaintenanceContracts: 'yes',
    // Plumbing-specific
    plumbingFocusAreas: [],
    plumbingEmergency24_7: 'yes',
    plumbingResponseTime: '',
    // Roofing-specific
    roofingRoofTypes: '',
    roofingEmergencyStorm: 'yes',
    roofingHeightLimits: '',
    // Chimney-specific
    chimneyServices: '',
    chimneySeason: '',
    chimneyInstallations: '',
    // Electrician-specific
    electricianWorkTypes: '',
    electricianEmergency24_7: 'yes',
    electricianLicenses: '',
    // Other Trade
    otherTradeDescription: '',
    otherEmergency: 'yes',
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    // Services communs
    if (name === 'services' && type === 'checkbox') {
      setForm((prev) => {
        const updated = checked
          ? [...prev.services, value]
          : prev.services.filter((s) => s !== value);
        return { ...prev, services: updated };
      });
      return;
    }

    // HVAC
    if (name === 'hvacSystemTypes' && type === 'checkbox') {
      setForm((prev) => {
        const updated = checked
          ? [...prev.hvacSystemTypes, value]
          : prev.hvacSystemTypes.filter((s) => s !== value);
        return { ...prev, hvacSystemTypes: updated };
      });
      return;
    }

    // Plomberie
    if (name === 'plumbingFocusAreas' && type === 'checkbox') {
      setForm((prev) => {
        const updated = checked
          ? [...prev.plumbingFocusAreas, value]
          : prev.plumbingFocusAreas.filter((s) => s !== value);
        return { ...prev, plumbingFocusAreas: updated };
      });
      return;
    }

    if (type === 'file') {
      setForm((prev) => ({ ...prev, logo: files?.[0] || null }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Envoi en cours…');

    try {
      const businessTypeLabels = {
        hvac: 'Chauffage / Climatisation (HVAC)',
        plumbing: 'Plomberie',
        roofing: 'Toiture',
        chimney: 'Cheminée / Foyer',
        electrician: 'Électricien',
        other: 'Autre métier / Multi-service',
      };

      let specificDetails = '';

      switch (form.businessType) {
        case 'hvac':
          specificDetails = `
--------------------------------
Détails spécifiques — HVAC
--------------------------------

Types de systèmes travaillés :
${(form.hvacSystemTypes || []).map((s) => `- ${s}`).join('\n') || '- Non spécifié'}

Mois de forte saison :
${form.hvacPeakMonths || 'Non spécifié'}

Contrats d’entretien offerts :
${form.hvacMaintenanceContracts || 'Non spécifié'}
`.trim();
          break;

        case 'plumbing':
          specificDetails = `
--------------------------------
Détails spécifiques — Plomberie
--------------------------------

Domaines principaux :
${(form.plumbingFocusAreas || []).map((s) => `- ${s}`).join('\n') || '- Non spécifié'}

Service d'urgence 24/7 :
${form.plumbingEmergency24_7 || 'Non spécifié'}

Temps de réponse typique pour urgences :
${form.plumbingResponseTime || 'Non spécifié'}
`.trim();
          break;

        case 'roofing':
          specificDetails = `
--------------------------------
Détails spécifiques — Toiture
--------------------------------

Types de toitures travaillées :
${form.roofingRoofTypes || 'Non spécifié'}

Réparation d’urgence / dégâts de tempête :
${form.roofingEmergencyStorm || 'Non spécifié'}

Limites d’hauteur / inclinaison :
${form.roofingHeightLimits || 'Non spécifié'}
`.trim();
          break;

        case 'chimney':
          specificDetails = `
--------------------------------
Détails spécifiques — Cheminée / Foyer
--------------------------------

Services offerts :
${form.chimneyServices || 'Non spécifié'}

Mois de haute saison :
${form.chimneySeason || 'Non spécifié'}

Services d’installation (poêles / inserts / conduits) :
${form.chimneyInstallations || 'Non spécifié'}
`.trim();
          break;

        case 'electrician':
          specificDetails = `
--------------------------------
Détails spécifiques — Électricien
--------------------------------

Types de travaux électriques :
${form.electricianWorkTypes || 'Non spécifié'}

Service d’urgence 24/7 :
${form.electricianEmergency24_7 || 'Non spécifié'}

Permis / certifications :
${form.electricianLicenses || 'Non spécifié'}
`.trim();
          break;

        case 'other':
        default:
          specificDetails = `
--------------------------------
Détails spécifiques — Autre métier
--------------------------------

Description du métier :
${form.otherTradeDescription || 'Non spécifié'}

Urgences acceptées :
${form.otherEmergency || 'Non spécifié'}
`.trim();
          break;
      }

      const message = `
BlueWise AI — Nouvelle demande d’onboarding Lead Rescue

Type d’entreprise :
- ${businessTypeLabels[form.businessType]}

Entreprise :
- Nom : ${form.businessName}
- Propriétaire : ${form.ownerName}
- Courriel à intégrer : ${form.email}
- Téléphone (appels manqués) : ${form.phone}

Services offerts :
${(form.services || []).map((s) => `- ${s}`).join('\n') || '- Aucun'}

Zone de service :
${form.serviceArea}

Heures d’opération :
- Semaine : ${form.hoursWeek}
- Weekend : ${form.hoursWeekend || 'N/A'}

Types d’urgences :
${form.urgentJobs}

Messages / demandes à ignorer :
${form.ignoreJobs || 'N/A'}

Ton préféré :
${form.tone}

Courriel du résumé quotidien (8h AM) :
${form.summaryEmail}

${specificDetails}
`.trim();

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.ownerName || form.businessName,
          email: form.summaryEmail || form.email,
          message,
        }),
      });

      if (!res.ok) {
        console.error('Erreur API contact:', await res.text());
        setStatus('Erreur — veuillez réessayer.');
        return;
      }

      setStatus('Soumis ! Je vais analyser vos informations et préparer votre système.');
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

  // 🔹 Services dynamiques par métier
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
      'Installation d’insert',
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
      'Contrats d’entretien',
      'Autre (décrire ci-dessous)',
    ],
  };

  const serviceOptions =
    serviceOptionsByType[businessType] || serviceOptionsByType.other;

  return (
    <div
      className="
        min-h-screen
        bg-[url('/styles/backgroundpages.png')]
        bg-cover bg-center
        text-white
      "
    >
      <div className="min-h-screen py-16 px-4 backdrop-brightness-110">
        <section
          className="
            max-w-3xl mx-auto space-y-10 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          <h1 className="text-4xl font-heading text-center drop-shadow-md">
            BlueWise AI — Onboarding Lead Rescue
          </h1>

          <p className="text-center text-slate-100 drop-shadow-sm">
            Remplissez ce formulaire pour configurer votre système d’automatisation 24/7 pour votre entreprise (HVAC, plomberie, toiture, cheminée, électricité ou autre). Setup en 72h.
          </p>

          {/* Sélecteur de métier */}
          <div className="flex flex-wrap justify-center gap-3">
            {businessTypeButtons.map((btn) => {
              const active = form.businessType === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, businessType: btn.id }))
                  }
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold border
                    transition-all duration-200
                    ${
                      active
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom entreprise */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Nom de l’entreprise
              </label>
              <input
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border"
              />
            </div>

            {/* Propriétaire */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Nom du propriétaire
              </label>
              <input
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Courriel à intégrer
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Numéro pour redirection des appels manqués
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border"
              />
            </div>

            {/* Services dynamiques */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Services offerts
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 text-sm">
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

            {/* Zone de service */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Zone desservie (villes, codes postaux, rayon)
              </label>
              <textarea
                name="serviceArea"
                rows="2"
                value={form.serviceArea}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border"
              />
            </div>

            {/* Heures semaine */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Heures d’opération (semaine)
              </label>
              <input
                name="hoursWeek"
                value={form.hoursWeek}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border"
              />
            </div>

            {/* Heures weekend */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Heures d’opération (weekend)
              </label>
              <input
                name="hoursWeekend"
                value={form.hoursWeekend}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border"
              />
            </div>

            {/* Urgences */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Quels travaux sont considérés comme urgents ?
              </label>
              <textarea
                name="urgentJobs"
                rows="2"
                value={form.urgentJobs}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border"
              />
            </div>

            {/* À ignorer */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Types de demandes à ignorer
              </label>
              <textarea
                name="ignoreJobs"
                rows="2"
                value={form.ignoreJobs}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border"
              />
            </div>

            {/* Sections spécifiques selon le métier */}
            {isHVAC && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails HVAC</h2>

                <div>
                  <label className="block text-sm font-medium">
                    Types de systèmes travaillés
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Fournaise',
                      'Climatisation',
                      'Thermopompe',
                      'Mini-split',
                      'Unités de toit',
                      'Ventilation / HRV',
                    ].map((system) => (
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

                <div>
                  <label className="block text-sm font-medium">
                    Mois les plus occupés
                  </label>
                  <input
                    name="hvacPeakMonths"
                    value={form.hvacPeakMonths}
                    onChange={handleChange}
                    placeholder="Ex : Mai à Septembre et Décembre à Février"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-black bg-white/95 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Offrez-vous des contrats d’entretien ?
                  </label>
                  <select
                    name="hvacMaintenanceContracts"
                    value={form.hvacMaintenanceContracts}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-black bg-white/95 border"
                  >
                    <option value="yes">Oui, régulièrement</option>
                    <option value="no">Non</option>
                    <option value="sometimes">Parfois</option>
                  </select>
                </div>
              </div>
            )}

            {isPlumbing && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails Plomberie</h2>

                <div>
                  <label className="block text-sm font-medium">
                    Domaine principal
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Résidentiel',
                      'Commercial',
                      'Débouchage',
                      'Égout / conduite principale',
                      'Chauffe-eau',
                      'Rénos cuisine / salle de bain',
                    ].map((area) => (
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

                <div>
                  <label className="block text-sm font-medium">
                    Service d’urgence 24/7
                  </label>
                  <select
                    name="plumbingEmergency24_7"
                    value={form.plumbingEmergency24_7}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-black bg-white/95 border"
                  >
                    <option value="yes">Oui, 24/7</option>
                    <option value="limited">Limité</option>
                    <option value="no">Non</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Temps de réponse urgence
                  </label>
                  <input
                    name="plumbingResponseTime"
                    value={form.plumbingResponseTime}
                    onChange={handleChange}
                    placeholder="Ex : 1 à 2 heures dans la zone"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-black bg-white/95 border"
                  />
                </div>
              </div>
            )}

            {isRoofing && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails Toiture</h2>

                <div>
                  <label className="block text-sm font-medium">
                    Types de toits
                  </label>
                  <input
                    name="roofingRoofTypes"
                    value={form.roofingRoofTypes}
                    onChange={handleChange}
                    placeholder="Ex : bardeaux, métal, toit plat"
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Urgences / dégâts de tempête
                  </label>
                  <select
                    name="roofingEmergencyStorm"
                    value={form.roofingEmergencyStorm}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  >
                    <option value="yes">Oui</option>
                    <option value="limited">Limité</option>
                    <option value="no">Non</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Limites d’hauteur / inclinaison
                  </label>
                  <input
                    name="roofingHeightLimits"
                    value={form.roofingHeightLimits}
                    onChange={handleChange}
                    placeholder="Ex : max 2 étages"
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  />
                </div>
              </div>
            )}

            {isChimney && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails Cheminée</h2>

                <div>
                  <label className="block text-sm font-medium">
                    Services offerts
                  </label>
                  <input
                    name="chimneyServices"
                    value={form.chimneyServices}
                    onChange={handleChange}
                    placeholder="Ex : ramonage, inspection, gainage"
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Haute saison
                  </label>
                  <input
                    name="chimneySeason"
                    value={form.chimneySeason}
                    onChange={handleChange}
                    placeholder="Ex : Septembre – Décembre"
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Installations offertes
                  </label>
                  <input
                    name="chimneyInstallations"
                    value={form.chimneyInstallations}
                    onChange={handleChange}
                    placeholder="Ex : installation poêle / insert"
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  />
                </div>
              </div>
            )}

            {isElectrician && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails Électricien</h2>

                <div>
                  <label className="block text-sm font-medium">
                    Types de travaux
                  </label>
                  <input
                    name="electricianWorkTypes"
                    value={form.electricianWorkTypes}
                    onChange={handleChange}
                    placeholder="Ex : résidentiel, commercial, panneaux"
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Urgence 24/7
                  </label>
                  <select
                    name="electricianEmergency24_7"
                    value={form.electricianEmergency24_7}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  >
                    <option value="yes">Oui, 24/7</option>
                    <option value="limited">Limité</option>
                    <option value="no">Non</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Licences / certifications
                  </label>
                  <input
                    name="electricianLicenses"
                    value={form.electricianLicenses}
                    onChange={handleChange}
                    placeholder="Ex : Maître électricien"
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  />
                </div>
              </div>
            )}

            {isOther && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Détails — Autre métier</h2>

                <div>
                  <label className="block text-sm font-medium">
                    Décrivez votre métier
                  </label>
                  <textarea
                    name="otherTradeDescription"
                    rows={3}
                    value={form.otherTradeDescription}
                    onChange={handleChange}
                    placeholder="Ex : rénovation, paysagement, multiservices"
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Urgences acceptées ?
                  </label>
                  <select
                    name="otherEmergency"
                    value={form.otherEmergency}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
                  >
                    <option value="yes">Oui</option>
                    <option value="limited">Limité</option>
                    <option value="no">Non</option>
                  </select>
                </div>
              </div>
            )}

            {/* Ton */}
            <div>
              <label className="block text-sm font-medium">
                Ton préféré des réponses
              </label>
              <select
                name="tone"
                value={form.tone}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
              >
                <option value="friendly">Amical</option>
                <option value="professional">Professionnel</option>
                <option value="fast">Rapide & efficace</option>
              </select>
            </div>

            {/* Email résumé */}
            <div>
              <label className="block text-sm font-medium">
                Courriel pour le résumé quotidien (8h AM)
              </label>
              <input
                name="summaryEmail"
                type="email"
                value={form.summaryEmail}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 bg-white text-black border"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium">
                Téléversez votre logo (optionnel)
              </label>
              <input
                type="file"
                name="logo"
                onChange={handleChange}
                className="mt-1 text-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="
                inline-flex items-center justify-center
                bg-blue-600 hover:bg-blue-500
                text-white font-semibold
                px-6 py-3 rounded-2xl
                shadow-[0_0_22px_rgba(59,130,246,0.85)]
                hover:-translate-y-0.5
                hover:shadow-[0_0_28px_rgba(59,130,246,0.95)]
                transition-all duration-300
              "
            >
              Soumettre & démarrer la configuration
            </button>

            {status && (
              <p className="text-sm text-slate-100 drop-shadow-sm">{status}</p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
