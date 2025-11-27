// pages/fr/onboarding-rescue.js
import { useState } from "react";

export default function LeadRescueOnboardingFr() {
  const [form, setForm] = useState({
    businessType: "hvac", // "hvac" ou "plomberie"
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    services: [],
    serviceArea: "",
    hoursWeek: "",
    hoursWeekend: "",
    urgentJobs: "",
    ignoreJobs: "",
    tone: "friendly",
    summaryEmail: "",
    logo: null,
    // Spécifique HVAC
    hvacSystemTypes: [],
    hvacPeakMonths: "",
    hvacMaintenanceContracts: "yes",
    // Spécifique plomberie
    plumbingFocusAreas: [],
    plumbingEmergency24_7: "yes",
    plumbingResponseTime: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    // Services partagés
    if (name === "services" && type === "checkbox") {
      setForm((prev) => {
        const updated = checked
          ? [...prev.services, value]
          : prev.services.filter((s) => s !== value);
        return { ...prev, services: updated };
      });
      return;
    }

    // Types de systèmes HVAC
    if (name === "hvacSystemTypes" && type === "checkbox") {
      setForm((prev) => {
        const updated = checked
          ? [...prev.hvacSystemTypes, value]
          : prev.hvacSystemTypes.filter((s) => s !== value);
        return { ...prev, hvacSystemTypes: updated };
      });
      return;
    }

    // Focales plomberie
    if (name === "plumbingFocusAreas" && type === "checkbox") {
      setForm((prev) => {
        const updated = checked
          ? [...prev.plumbingFocusAreas, value]
          : prev.plumbingFocusAreas.filter((s) => s !== value);
        return { ...prev, plumbingFocusAreas: updated };
      });
      return;
    }

    if (type === "file") {
      setForm((prev) => ({ ...prev, logo: files?.[0] || null }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Envoi en cours…");

    try {
      const message = `
BlueWise AI Lead Rescue System — Onboarding (FR)

Type d’entreprise :
- ${
        form.businessType === "hvac"
          ? "Chauffage / Climatisation (HVAC)"
          : "Plomberie"
      }

Entreprise :
- Nom : ${form.businessName}
- Propriétaire : ${form.ownerName}
- Courriel à intégrer : ${form.email}
- Téléphone pour les appels manqués : ${form.phone}

Services offerts :
${
  (form.services || []).map((s) => `- ${s}`).join("\n") ||
  "- Aucun service sélectionné"
}

Zone desservie :
${form.serviceArea}

Heures d’opération :
- Semaine : ${form.hoursWeek}
- Fin de semaine : ${form.hoursWeekend || "N/A"}

Ce qui compte comme un travail urgent :
${form.urgentJobs}

Messages ou demandes à ignorer :
${form.ignoreJobs || "Aucun"}

Ton / style des réponses :
${form.tone}

Courriel pour le rapport quotidien (8 h) :
${form.summaryEmail}

--------------------------------
${
  form.businessType === "hvac"
    ? "Détails spécifiques — HVAC (chauffage / climatisation)"
    : "Détails spécifiques — Plomberie"
}
--------------------------------

${
  form.businessType === "hvac"
    ? `
Types de systèmes sur lesquels vous travaillez :
${
  (form.hvacSystemTypes || []).map((s) => `- ${s}`).join("\n") ||
  "- Non précisé"
}

Mois / saisons les plus occupés :
${form.hvacPeakMonths || "Non précisé"}

Offrez-vous des contrats d’entretien ?
${form.hvacMaintenanceContracts || "Non précisé"}
`.trim()
    : `
Principales spécialités :
${
  (form.plumbingFocusAreas || []).map((s) => `- ${s}`).join("\n") ||
  "- Non précisé"
}

Offrez-vous un service d’urgence 24/7 ?
${form.plumbingEmergency24_7 || "Non précisé"}

Délai de réponse typique pour les urgences :
${form.plumbingResponseTime || "Non précisé"}
`.trim()
}
`.trim();

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.ownerName || form.businessName,
          email: form.summaryEmail || form.email,
          message,
        }),
      });

      if (!res.ok) {
        console.error("Erreur API /contact:", await res.text());
        setStatus("Oups, une erreur est survenue sur le serveur.");
        return;
      }

      setStatus(
        "Soumis ! Je vais analyser vos informations et commencer la configuration."
      );
    } catch (error) {
      console.error(error);
      setStatus("Erreur réseau — veuillez réessayer.");
    }
  };

  const isHVAC = form.businessType === "hvac";

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
            BlueWise AI Lead Rescue System — Onboarding
          </h1>

          <p className="text-center text-slate-100 drop-shadow-sm">
            Remplissez ce formulaire pour que je puisse configurer votre système
            d’automatisation 24/7 pour votre entreprise de chauffage / climatisation
            ou de plomberie en moins de 72 heures.
          </p>

          {/* Sélecteur de type d’entreprise */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, businessType: "hvac" }))
              }
              className={`
                px-4 py-2 rounded-full text-sm font-semibold border
                ${
                  isHVAC
                    ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.85)]"
                    : "bg-slate-800/70 text-slate-200 border-slate-600 hover:bg-slate-700"
                }
              `}
            >
              Chauffage / Climatisation
            </button>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, businessType: "plomberie" }))
              }
              className={`
                px-4 py-2 rounded-full text-sm font-semibold border
                ${
                  !isHVAC
                    ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.85)]"
                    : "bg-slate-800/70 text-slate-200 border-slate-600 hover:bg-slate-700"
                }
              `}
            >
              Plomberie
            </button>
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
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
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
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Courriel */}
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
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Numéro pour les appels manqués
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Services partagés */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Services offerts
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 text-sm">
                {[
                  "Installation HVAC",
                  "Réparation HVAC",
                  "Service d’urgence HVAC",
                  "Installation plomberie",
                  "Réparation plomberie",
                  "Débouchage / Drain",
                  "Chauffe-eau",
                  "Urgence plomberie",
                ].map((service) => (
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

            {/* Zone desservie */}
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
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Heures */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Heures d’opération (semaine)
              </label>
              <input
                name="hoursWeek"
                value={form.hoursWeek}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Heures d’opération (fin de semaine)
              </label>
              <input
                name="hoursWeekend"
                value={form.hoursWeekend}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Urgence */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Qu’est-ce qui compte comme un travail URGENT ?
              </label>
              <textarea
                name="urgentJobs"
                rows="2"
                value={form.urgentJobs}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* À ignorer */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Messages ou demandes à ignorer
              </label>
              <textarea
                name="ignoreJobs"
                rows="2"
                value={form.ignoreJobs}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Bloc spécifique selon le type */}
            {isHVAC ? (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">
                  Détails spécifiques — Chauffage / Climatisation
                </h2>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Sur quels types de systèmes travaillez-vous ?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 text-sm">
                    {[
                      "Fournaise",
                      "Climatisation",
                      "Thermopompe",
                      "Mini-split / sans conduit",
                      "Unités de toit (rooftop)",
                      "Ventilation / échangeur d’air",
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
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Quels sont vos mois / saisons les plus occupés ?
                  </label>
                  <input
                    name="hvacPeakMonths"
                    value={form.hvacPeakMonths}
                    onChange={handleChange}
                    placeholder="Ex.: mai à septembre et décembre à février"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Offrez-vous des contrats d’entretien ?
                  </label>
                  <select
                    name="hvacMaintenanceContracts"
                    value={form.hvacMaintenanceContracts}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  >
                    <option value="yes">Oui, régulièrement</option>
                    <option value="no">Non</option>
                    <option value="sometimes">
                      Parfois / au cas par cas
                    </option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">
                  Détails spécifiques — Plomberie
                </h2>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Sur quels types de travaux vous concentrez-vous le plus ?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 text-sm">
                    {[
                      "Plomberie résidentielle",
                      "Plomberie commerciale",
                      "Débouchage / drains",
                      "Égout / conduite principale",
                      "Chauffe-eau",
                      "Rénos salle de bain / cuisine",
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
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Offrez-vous un service d’urgence 24/7 ?
                  </label>
                  <select
                    name="plumbingEmergency24_7"
                    value={form.plumbingEmergency24_7}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  >
                    <option value="yes">Oui, 24/7</option>
                    <option value="limited">
                      Limité / certains soirs / certaines journées
                    </option>
                    <option value="no">Non, seulement aux heures régulières</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Délai de réponse typique pour les urgences
                  </label>
                  <input
                    name="plumbingResponseTime"
                    value={form.plumbingResponseTime}
                    onChange={handleChange}
                    placeholder="Ex.: dans l’heure dans votre zone de service"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Ton */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Ton préféré pour les messages automatisés
              </label>
              <select
                name="tone"
                value={form.tone}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              >
                <option value="friendly">Chaleureux / amical</option>
                <option value="professional">Professionnel</option>
                <option value="fast">Rapide & efficace</option>
              </select>
            </div>

            {/* Courriel résumé */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Courriel pour le rapport quotidien (8 h)
              </label>
              <input
                name="summaryEmail"
                type="email"
                value={form.summaryEmail}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
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
                hover:saturate-150
                transition-all duration-300
              "
            >
              Soumettre & commencer la configuration
            </button>

            {status && (
              <p className="text-sm text-slate-100 drop-shadow-sm">
                {status}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
