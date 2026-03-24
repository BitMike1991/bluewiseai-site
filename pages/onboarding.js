import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Check, ChevronRight, ChevronLeft, Building2, Wrench, Bot, Settings, Send, Phone, Mail, MapPin, Clock, MessageSquare, AlertTriangle, Globe, Sparkles, Loader2 } from 'lucide-react';

const INDUSTRIES = [
  { value: 'plumbing', label: 'Plomberie', icon: '🔧' },
  { value: 'hvac', label: 'Chauffage / Climatisation (HVAC)', icon: '❄️' },
  { value: 'electrical', label: 'Electricien', icon: '⚡' },
  { value: 'roofing', label: 'Toiture', icon: '🏠' },
  { value: 'painting', label: 'Peinture', icon: '🎨' },
  { value: 'renovation', label: 'Renovation generale', icon: '🔨' },
  { value: 'construction', label: 'Construction', icon: '🏗️' },
  { value: 'landscaping', label: 'Amenagement paysager', icon: '🌿' },
  { value: 'chimney', label: 'Ramonage / Cheminee', icon: '🔥' },
  { value: 'cpa_accounting', label: 'Comptabilite / CPA', icon: '📊' },
  { value: 'cleaning', label: 'Nettoyage / Entretien', icon: '✨' },
  { value: 'flooring', label: 'Planchers / Revetements', icon: '🪵' },
  { value: 'other', label: 'Autre', icon: '💼' },
];

const STEPS = [
  { id: 1, title: 'Votre entreprise', icon: Building2 },
  { id: 2, title: 'Vos services', icon: Wrench },
  { id: 3, title: 'Votre agent IA', icon: Bot },
  { id: 4, title: 'Preferences', icon: Settings },
  { id: 5, title: 'Confirmation', icon: Send },
];

function ProgressBar({ current, steps }) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-12">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = step.id === current;
        const isDone = step.id < current;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDone ? 'bg-accent text-white' :
                isActive ? 'bg-accent/20 border-2 border-accent text-accent' :
                'bg-surface2 text-txt3 border border-border'
              }`}>
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`mt-2 text-xs font-medium hidden sm:block ${
                isActive ? 'text-accent' : isDone ? 'text-txt' : 'text-txt3'
              }`}>{step.title}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-all duration-500 ${
                isDone ? 'bg-accent' : 'bg-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, hint, required, children, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-txt">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-txt3">{hint}</p>}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-surface border border-border rounded-lg px-4 py-3 text-txt placeholder-txt3
        focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200
        ${props.className || ''}`}
    />
  );
}

function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full bg-surface border border-border rounded-lg px-4 py-3 text-txt placeholder-txt3
        focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200 resize-none
        ${props.className || ''}`}
    />
  );
}

function Select({ options, ...props }) {
  return (
    <select
      {...props}
      className={`w-full bg-surface border border-border rounded-lg px-4 py-3 text-txt
        focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200 cursor-pointer
        ${props.className || ''}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function TagInput({ value = [], onChange, placeholder, suggestions = [] }) {
  const [input, setInput] = useState('');

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const removeTag = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-accent/15 text-accent border border-accent/30 rounded-full px-3 py-1 text-sm">
            {tag}
            <button type="button" onClick={() => removeTag(i)} className="hover:text-white transition-colors cursor-pointer">&times;</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => addTag(input)}
          className="px-4 py-2 bg-surface2 border border-border rounded-lg text-txt2 hover:text-accent hover:border-accent/50 transition-all cursor-pointer"
        >+</button>
      </div>
      {suggestions.length > 0 && value.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-xs bg-surface2 border border-border rounded-full px-2.5 py-1 text-txt3 hover:text-accent hover:border-accent/30 transition-all cursor-pointer"
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function StepCard({ title, description, children, visible }) {
  return (
    <div className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute pointer-events-none'}`}>
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-txt font-heading">{title}</h2>
        <p className="mt-2 text-txt2">{description}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

const SERVICE_SUGGESTIONS = {
  plumbing: ['Debouchage', 'Reparation de fuites', 'Installation de chauffe-eau', 'Plomberie generale', 'Camera d\'inspection', 'Drain francais'],
  hvac: ['Installation thermopompe', 'Entretien annuel', 'Reparation fournaise', 'Climatisation', 'Ventilation', 'Nettoyage de conduits'],
  electrical: ['Installation electrique', 'Panneau electrique', 'Eclairage', 'Filage', 'Prise de courant', 'Borne de recharge EV'],
  roofing: ['Toiture en bardeaux', 'Reparation de toiture', 'Inspection', 'Deneigement', 'Gouttiere', 'Membrane elastomere'],
  painting: ['Peinture interieure', 'Peinture exterieure', 'Teinture de patio', 'Epoxy de plancher', 'Crepi', 'Sablage de plancher'],
  renovation: ['Renovation de cuisine', 'Renovation de salle de bain', 'Sous-sol', 'Agrandissement', 'Demolition', 'Ceramique'],
  construction: ['Construction neuve', 'Fondation', 'Charpente', 'Coffrages', 'Excavation', 'Beton'],
  landscaping: ['Amenagement paysager', 'Pave uni', 'Cloture', 'Terrassement', 'Gazon', 'Irrigation'],
  chimney: ['Ramonage', 'Inspection WETT', 'Installation de poele', 'Reparation de cheminee', 'Chemisage'],
  cpa_accounting: ['Impots des particuliers', 'Impots des entreprises', 'Tenue de livres', 'Incorporation', 'TPS/TVQ', 'Planification fiscale'],
  cleaning: ['Nettoyage residentiel', 'Nettoyage commercial', 'Apres-construction', 'Tapis', 'Vitres', 'Decontamination'],
  flooring: ['Plancher de bois franc', 'Ceramique', 'Vinyle', 'Epoxy', 'Sablage', 'Teinture'],
  other: [],
};

const QUESTION_SUGGESTIONS = {
  plumbing: ['C\'est quoi le probleme exactement?', 'C\'est urgent ou ca peut attendre?', 'Vous etes dans quel secteur?'],
  hvac: ['C\'est pour une installation ou une reparation?', 'Quel type de systeme vous avez?', 'Votre maison fait combien de pieds carres?'],
  construction: ['C\'est quoi le type de projet?', 'Vous avez deja des plans?', 'C\'est pour quand le debut des travaux?'],
  default: ['C\'est quoi votre besoin exactement?', 'C\'est pour quand?', 'Vous etes dans quel secteur?'],
};

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Step 1
    businessName: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerPhone: '',
    ownerEmail: '',
    city: '',
    industry: 'construction',
    otherIndustry: '',

    // Step 2
    services: [],
    territory: '',
    hoursWeekday: 'Lun-Ven 8h-17h',
    hoursWeekend: '',
    qualifyingQuestions: [],
    residentialCommercial: 'both',

    // Step 3
    language: 'fr',
    tone: 'professionnel',
    greetingMessage: '',
    emergencyEnabled: true,
    emergencyKeywords: [],
    customInstructions: '',
    upsells: [],

    // Step 4
    bookingLink: '',
    preferredContact: 'phone',
    paymentMethods: ['interac'],
    neverSay: '',
    noPricing: true,
  });

  const u = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const industryServices = SERVICE_SUGGESTIONS[form.industry] || [];
  const industryQuestions = QUESTION_SUGGESTIONS[form.industry] || QUESTION_SUGGESTIONS.default;

  const validate = () => {
    if (step === 1) {
      if (!form.businessName) return 'Le nom de votre entreprise est requis';
      if (!form.ownerFirstName) return 'Votre prenom est requis';
      if (!form.ownerPhone) return 'Votre numero de telephone est requis';
      if (!form.ownerEmail) return 'Votre courriel est requis';
      if (!form.city) return 'Votre ville est requise';
    }
    if (step === 2) {
      if (form.services.length === 0) return 'Ajoutez au moins un service';
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prev = () => {
    setError('');
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');

    const intake = {
      version: '3.0',
      submitted_at: new Date().toISOString(),
      business_name: form.businessName,
      owner_name: `${form.ownerFirstName} ${form.ownerLastName}`.trim(),
      owner_phone: form.ownerPhone,
      owner_email: form.ownerEmail,
      city: form.city,
      industry: form.industry === 'other' ? form.otherIndustry : form.industry,
      language: form.language,
      tone: form.tone,
      services: form.services,
      territory: form.territory || `${form.city} et environs`,
      hours: form.hoursWeekday + (form.hoursWeekend ? ` | Fin de semaine: ${form.hoursWeekend}` : ''),
      qualifying_questions: form.qualifyingQuestions,
      residential_commercial: form.residentialCommercial,
      greeting_voice: form.greetingMessage || `Bonjour, ${form.businessName}, comment est-ce que je peux vous aider?`,
      emergency_enabled: form.emergencyEnabled,
      emergency_keywords: form.emergencyKeywords,
      custom_instructions: form.customInstructions,
      upsells: form.upsells,
      booking_link: form.bookingLink,
      preferred_contact: form.preferredContact,
      payment_methods: form.paymentMethods,
      never_say: form.neverSay,
      no_pricing: form.noPricing,
    };

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboarding_intake: intake,
          businessName: form.businessName,
          ownerName: intake.owner_name,
          ownerEmail: form.ownerEmail,
          ownerMobile: form.ownerPhone,
          timezone: 'America/Toronto',
          primaryLanguage: form.language,
          businessType: intake.industry,
          tone: form.tone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Head>
          <title>Bienvenue! | BlueWise AI</title>
        </Head>
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
          <div className="max-w-lg text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-txt font-heading">C&apos;est beau!</h1>
            <p className="text-txt2 text-lg">
              Votre formulaire a ete soumis avec succes. Notre equipe va configurer votre systeme et vous contacter dans les prochaines 24 heures.
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 text-left space-y-3">
              <h3 className="text-accent font-semibold">Prochaines etapes:</h3>
              <ul className="space-y-2 text-txt2 text-sm">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" /> Configuration de votre numero de telephone</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" /> Creation de votre agent vocal IA</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" /> Installation de l&apos;application Groundwire sur votre telephone</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" /> Configuration de votre espace Slack</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" /> Appel de verification ensemble (15 min)</li>
              </ul>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Onboarding | BlueWise AI</title>
        <meta name="description" content="Configurez votre systeme BlueWise AI en 5 minutes" />
      </Head>

      <div className="min-h-screen bg-bg relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-txt2">Configuration en 5 minutes</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-txt font-heading">
              Configurez votre <span className="text-accent">agent IA</span>
            </h1>
            <p className="mt-3 text-txt2 max-w-xl mx-auto">
              Repondez a ces questions pour qu&apos;on puisse creer un assistant vocal et un systeme de gestion parfaitement adapte a votre entreprise.
            </p>
          </div>

          <ProgressBar current={step} steps={STEPS} />

          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-10 relative min-h-[400px]">
            {error && (
              <div className="mb-6 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 flex items-center gap-2 text-danger text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Step 1 */}
            <StepCard
              visible={step === 1}
              title="Parlez-nous de votre entreprise"
              description="Les bases pour configurer votre systeme."
            >
              <Field label="Nom de l'entreprise" required>
                <Input
                  value={form.businessName}
                  onChange={e => u('businessName', e.target.value)}
                  placeholder="ex: Plomberie Martin & Fils"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Prenom du proprietaire" required>
                  <Input
                    value={form.ownerFirstName}
                    onChange={e => u('ownerFirstName', e.target.value)}
                    placeholder="ex: Jean-Philippe"
                  />
                </Field>
                <Field label="Nom de famille" required={false}>
                  <Input
                    value={form.ownerLastName}
                    onChange={e => u('ownerLastName', e.target.value)}
                    placeholder="ex: Tremblay"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Telephone cellulaire" required hint="Votre numero personnel — pas celui de l'entreprise. C'est la que vous recevrez les alertes.">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt3" />
                    <Input
                      value={form.ownerPhone}
                      onChange={e => u('ownerPhone', e.target.value)}
                      placeholder="+1 514 555-1234"
                      type="tel"
                      className="pl-10"
                    />
                  </div>
                </Field>
                <Field label="Courriel" required>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt3" />
                    <Input
                      value={form.ownerEmail}
                      onChange={e => u('ownerEmail', e.target.value)}
                      placeholder="jean@plomberiemartin.com"
                      type="email"
                      className="pl-10"
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ville" required>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt3" />
                    <Input
                      value={form.city}
                      onChange={e => u('city', e.target.value)}
                      placeholder="ex: Montreal, Laval, Longueuil"
                      className="pl-10"
                    />
                  </div>
                </Field>
                <Field label="Industrie" required>
                  <Select
                    value={form.industry}
                    onChange={e => u('industry', e.target.value)}
                    options={INDUSTRIES.map(i => ({ value: i.value, label: `${i.icon}  ${i.label}` }))}
                  />
                </Field>
              </div>

              {form.industry === 'other' && (
                <Field label="Decrivez votre industrie">
                  <Input
                    value={form.otherIndustry}
                    onChange={e => u('otherIndustry', e.target.value)}
                    placeholder="ex: Demenagement, Nettoyage de piscine, etc."
                  />
                </Field>
              )}
            </StepCard>

            {/* Step 2 */}
            <StepCard
              visible={step === 2}
              title="Vos services et territoire"
              description="Qu'est-ce que vous offrez? L'agent IA va s'en servir pour qualifier les appels."
            >
              <Field label="Services offerts" required hint="Ajoutez vos services un par un. L'agent IA les mentionnera aux clients.">
                <TagInput
                  value={form.services}
                  onChange={v => u('services', v)}
                  placeholder="Tapez un service et appuyez sur Entree"
                  suggestions={industryServices}
                />
              </Field>

              <Field label="Territoire desservi" hint="L'agent IA repondra 'Oui on couvre cette zone' ou 'Desole, on se deplace pas la'.">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt3" />
                  <Input
                    value={form.territory}
                    onChange={e => u('territory', e.target.value)}
                    placeholder="ex: Rive-Nord de Montreal, Laval, Laurentides"
                    className="pl-10"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Heures d'ouverture (semaine)" hint="L'agent IA sait quand vous etes disponible.">
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt3" />
                    <Input
                      value={form.hoursWeekday}
                      onChange={e => u('hoursWeekday', e.target.value)}
                      placeholder="ex: Lun-Ven 7h-17h"
                      className="pl-10"
                    />
                  </div>
                </Field>
                <Field label="Fin de semaine (optionnel)">
                  <Input
                    value={form.hoursWeekend}
                    onChange={e => u('hoursWeekend', e.target.value)}
                    placeholder="ex: Sam 8h-12h / Urgences seulement"
                  />
                </Field>
              </div>

              <Field label="Questions de qualification" hint="L'agent IA pose ces questions pour qualifier les leads avant de vous transmettre l'appel.">
                <TagInput
                  value={form.qualifyingQuestions}
                  onChange={v => u('qualifyingQuestions', v)}
                  placeholder="ex: C'est pour quand les travaux?"
                  suggestions={industryQuestions}
                />
              </Field>

              <Field label="Type de clientele">
                <div className="flex gap-3">
                  {[
                    { value: 'residential', label: 'Residentiel' },
                    { value: 'commercial', label: 'Commercial' },
                    { value: 'both', label: 'Les deux' },
                  ].map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => u('residentialCommercial', o.value)}
                      className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                        form.residentialCommercial === o.value
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-surface border-border text-txt2 hover:border-accent/30'
                      }`}
                    >{o.label}</button>
                  ))}
                </div>
              </Field>
            </StepCard>

            {/* Step 3 */}
            <StepCard
              visible={step === 3}
              title="Personnalisez votre agent IA"
              description="Comment voulez-vous que votre assistant vocal se comporte au telephone?"
            >
              <Field label="Langue principale">
                <div className="flex gap-3">
                  {[
                    { value: 'fr', label: 'Francais (Quebec)' },
                    { value: 'en', label: 'English' },
                    { value: 'both', label: 'Bilingue' },
                  ].map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => u('language', o.value)}
                      className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                        form.language === o.value
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-surface border-border text-txt2 hover:border-accent/30'
                      }`}
                    >{o.label}</button>
                  ))}
                </div>
                {form.language === 'both' && (
                  <p className="text-xs text-accent mt-2">L&apos;agent detecte automatiquement la langue du client et switch.</p>
                )}
              </Field>

              <Field label="Ton de l'agent" hint="Comment voulez-vous que l'agent parle a vos clients?">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'professionnel', label: 'Pro & serieux' },
                    { value: 'chaleureux', label: 'Chaleureux' },
                    { value: 'decontracte', label: 'Decontracte' },
                    { value: 'direct', label: 'Direct & efficace' },
                  ].map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => u('tone', o.value)}
                      className={`py-3 px-2 rounded-lg border text-sm transition-all cursor-pointer ${
                        form.tone === o.value
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-surface border-border text-txt2 hover:border-accent/30'
                      }`}
                    >{o.label}</button>
                  ))}
                </div>
              </Field>

              <Field label="Message d'accueil (optionnel)" hint="La premiere phrase que l'agent dit en decrochant. Laissez vide pour le defaut.">
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-txt3" />
                  <Input
                    value={form.greetingMessage}
                    onChange={e => u('greetingMessage', e.target.value)}
                    placeholder={`Defaut: "Bonjour, ${form.businessName || 'votre entreprise'}, comment est-ce que je peux vous aider?"`}
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field label="Ventes additionnelles (upsells)" hint="L'agent proposera naturellement ces services quand c'est pertinent.">
                <TagInput
                  value={form.upsells}
                  onChange={v => u('upsells', v)}
                  placeholder="ex: Inspection gratuite, Contrat d'entretien annuel"
                  suggestions={[]}
                />
              </Field>

              <div className="bg-surface2 border border-border rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-txt">Alertes d&apos;urgence</p>
                    <p className="text-xs text-txt3">L&apos;agent vous envoie un SMS immediat si un client mentionne un de ces mots.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => u('emergencyEnabled', !form.emergencyEnabled)}
                    className={`w-12 h-6 rounded-full transition-all cursor-pointer ${
                      form.emergencyEnabled ? 'bg-accent' : 'bg-border'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      form.emergencyEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                {form.emergencyEnabled && (
                  <TagInput
                    value={form.emergencyKeywords}
                    onChange={v => u('emergencyKeywords', v)}
                    placeholder="ex: urgent, inondation, degat d'eau"
                    suggestions={['urgent', 'urgence', 'degat d\'eau', 'inondation', 'fuite de gaz', 'pas de chauffage']}
                  />
                )}
              </div>

              <Field label="Instructions speciales (optionnel)" hint="Regles specifiques pour votre agent. Soyez precis — l'agent les suit a la lettre.">
                <Textarea
                  value={form.customInstructions}
                  onChange={e => u('customInstructions', e.target.value)}
                  placeholder="ex: Toujours mentionner que l'estimation est gratuite. Ne jamais donner de prix au telephone. Si le client demande pour la garantie, dire qu'on garantit nos travaux 5 ans."
                  rows={3}
                />
              </Field>
            </StepCard>

            {/* Step 4 */}
            <StepCard
              visible={step === 4}
              title="Preferences et restrictions"
              description="Comment vous voulez qu'on gere vos leads et vos communications?"
            >
              <Field label="Lien de reservation (optionnel)" hint="Si vous avez un Calendly, Google Calendar, ou autre — l'agent proposera de booker directement.">
                <Input
                  value={form.bookingLink}
                  onChange={e => u('bookingLink', e.target.value)}
                  placeholder="ex: https://calendly.com/votre-nom"
                />
              </Field>

              <Field label="Mode de contact prefere des clients">
                <div className="flex gap-3">
                  {[
                    { value: 'phone', label: 'Telephone' },
                    { value: 'text', label: 'Texto/SMS' },
                    { value: 'email', label: 'Courriel' },
                  ].map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => u('preferredContact', o.value)}
                      className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                        form.preferredContact === o.value
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-surface border-border text-txt2 hover:border-accent/30'
                      }`}
                    >{o.label}</button>
                  ))}
                </div>
              </Field>

              <Field label="Modes de paiement acceptes" hint="Selectionnez tous ceux qui s'appliquent.">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'interac', label: 'Virement Interac' },
                    { value: 'cash', label: 'Comptant' },
                    { value: 'cheque', label: 'Cheque' },
                    { value: 'credit', label: 'Carte de credit' },
                    { value: 'financing', label: 'Financement' },
                    { value: 'stripe', label: 'Paiement en ligne (Stripe)' },
                  ].map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        const has = form.paymentMethods.includes(o.value);
                        u('paymentMethods', has
                          ? form.paymentMethods.filter(v => v !== o.value)
                          : [...form.paymentMethods, o.value]);
                      }}
                      className={`py-3 px-3 rounded-lg border text-sm text-left transition-all cursor-pointer ${
                        form.paymentMethods.includes(o.value)
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-surface border-border text-txt2 hover:border-accent/30'
                      }`}
                    >{o.label}</button>
                  ))}
                </div>
              </Field>

              <div className="flex items-center justify-between bg-surface2 border border-border rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium text-txt">Pas de prix au telephone</p>
                  <p className="text-xs text-txt3">L&apos;agent ne donnera jamais de prix exact. Il dira &quot;on peut vous faire une soumission gratuite&quot;.</p>
                </div>
                <button
                  type="button"
                  onClick={() => u('noPricing', !form.noPricing)}
                  className={`w-12 h-6 rounded-full transition-all cursor-pointer ${
                    form.noPricing ? 'bg-accent' : 'bg-border'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    form.noPricing ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <Field label="L'agent ne doit JAMAIS dire... (optionnel)" hint="Mots ou phrases a eviter absolument.">
                <Textarea
                  value={form.neverSay}
                  onChange={e => u('neverSay', e.target.value)}
                  placeholder="ex: Ne jamais mentionner la competition. Ne jamais promettre de delai."
                  rows={2}
                />
              </Field>
            </StepCard>

            {/* Step 5 — Review */}
            <StepCard
              visible={step === 5}
              title="Verifiez vos informations"
              description="Assurez-vous que tout est correct avant de soumettre."
            >
              <div className="space-y-4">
                <ReviewSection title="Entreprise" onEdit={() => setStep(1)}>
                  <ReviewLine label="Nom" value={form.businessName} />
                  <ReviewLine label="Proprietaire" value={`${form.ownerFirstName} ${form.ownerLastName}`} />
                  <ReviewLine label="Telephone" value={form.ownerPhone} />
                  <ReviewLine label="Courriel" value={form.ownerEmail} />
                  <ReviewLine label="Ville" value={form.city} />
                  <ReviewLine label="Industrie" value={INDUSTRIES.find(i => i.value === form.industry)?.label || form.otherIndustry} />
                </ReviewSection>

                <ReviewSection title="Services" onEdit={() => setStep(2)}>
                  <ReviewLine label="Services" value={form.services.join(', ')} />
                  <ReviewLine label="Territoire" value={form.territory || `${form.city} et environs`} />
                  <ReviewLine label="Heures" value={form.hoursWeekday} />
                  <ReviewLine label="Questions" value={form.qualifyingQuestions.join(' | ') || 'Defaut'} />
                </ReviewSection>

                <ReviewSection title="Agent IA" onEdit={() => setStep(3)}>
                  <ReviewLine label="Langue" value={form.language === 'fr' ? 'Francais' : form.language === 'en' ? 'English' : 'Bilingue'} />
                  <ReviewLine label="Ton" value={form.tone} />
                  <ReviewLine label="Accueil" value={form.greetingMessage || `Bonjour, ${form.businessName}...`} />
                  <ReviewLine label="Urgences" value={form.emergencyEnabled ? form.emergencyKeywords.join(', ') || 'Active' : 'Desactive'} />
                </ReviewSection>

                <ReviewSection title="Preferences" onEdit={() => setStep(4)}>
                  <ReviewLine label="Paiements" value={form.paymentMethods.join(', ')} />
                  <ReviewLine label="Contact prefere" value={form.preferredContact} />
                  <ReviewLine label="Prix au telephone" value={form.noPricing ? 'Non — soumission seulement' : 'Oui'} />
                </ReviewSection>
              </div>
            </StepCard>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prev}
                  className="flex items-center gap-2 px-5 py-3 text-txt2 hover:text-txt transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Precedent
                </button>
              ) : <div />}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={next}
                  className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-all cursor-pointer"
                >
                  Continuer <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Soumettre</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-txt3 mt-8">
            BlueWise AI &mdash; Vos donnees sont securisees et ne seront jamais partagees.
          </p>
        </div>
      </div>
    </>
  );
}

function ReviewSection({ title, onEdit, children }) {
  return (
    <div className="bg-surface2 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-accent">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-txt3 hover:text-accent transition-colors cursor-pointer"
        >Modifier</button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewLine({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-txt3">{label}</span>
      <span className="text-txt text-right max-w-[60%]">{value}</span>
    </div>
  );
}
