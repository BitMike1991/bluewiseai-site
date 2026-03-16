import { useState } from "react";
import { useRouter } from "next/router";
import {
  Mail,
  Phone,
  Clock,
  Calendar,
  Check,
  Send,
  Loader2,
} from "lucide-react";
import { GlowCard } from "@/components/ui/GlowCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getLocale, localePath } from "@/lib/locale";

const T = {
  title: { en: "Book Your Free Strategy Call", fr: "Réserve ton appel stratégique", es: "Agenda tu llamada estratégica gratis" },
  subtitle: {
    en: "15 minutes. We look at your business, calculate your revenue loss, and tell you exactly what we can automate.",
    fr: "15 minutes. On regarde ta business, on calcule ta perte de revenus et on te dit exactement ce qu'on peut automatiser.",
    es: "15 minutos. Analizamos tu negocio, calculamos tu pérdida de ingresos y te decimos exactamente qué podemos automatizar.",
  },
  respond: { en: "We respond within 4 hours.", fr: "On répond en moins de 4 heures.", es: "Respondemos en menos de 4 horas." },
  callTitle: { en: "15-Minute Strategy Call", fr: "Appel stratégique 15 min", es: "Llamada estratégica de 15 min" },
  callDesc: {
    en: "We'll analyze your operations, calculate your revenue loss, and show you exactly where automation fits.",
    fr: "On analyse tes opérations, on calcule ta perte de revenus et on te montre où l'automatisation fit.",
    es: "Analizamos tus operaciones, calculamos tu pérdida de ingresos y te mostramos exactamente dónde encaja la automatización.",
  },
  free: { en: "Free — no commitment", fr: "Gratuit — pas d'engagement", es: "Gratis — sin compromiso" },
  customROI: { en: "Custom ROI calculation for your business", fr: "Calcul ROI personnalisé pour ta business", es: "Cálculo de ROI personalizado para tu negocio" },
  actionable: { en: "Actionable recommendations you can use right away", fr: "Recommandations actionnables", es: "Recomendaciones prácticas que puedes usar de inmediato" },
  pickTime: { en: "Pick a Time", fr: "Choisir un créneau", es: "Elige un horario" },
  calNote: { en: "Opens Google Calendar — pick the slot that works for you", fr: "Ouvre Google Calendar — choisis le créneau qui te convient", es: "Abre Google Calendar — elige el horario que te convenga" },
  formTitle: { en: "Or tell us about your business", fr: "Ou parle-nous de ta business", es: "O cuéntanos sobre tu negocio" },
  formSub: {
    en: "Fill this out and we'll reach out with a custom recommendation.",
    fr: "Remplis le formulaire et on te revient avec une recommandation personnalisée.",
    es: "Llena esto y te contactaremos con una recomendación personalizada.",
  },
  name: { en: "Name", fr: "Nom", es: "Nombre" },
  email: { en: "Email", fr: "Courriel", es: "Email" },
  phone: { en: "Phone", fr: "Téléphone", es: "Teléfono" },
  industry: { en: "Industry", fr: "Industrie", es: "Industria" },
  callsWeek: { en: "Calls / week", fr: "Appels / sem", es: "Llamadas / sem" },
  tellUs: { en: "Tell us more about your business", fr: "Parle-nous de ta business", es: "Cuéntanos más sobre tu negocio" },
  placeholder: {
    en: "What services do you offer? What's your biggest operational headache?",
    fr: "Quels services tu offres ? C'est quoi ton plus gros mal de tête opérationnel ?",
    es: "¿Qué servicios ofreces? ¿Cuál es tu mayor dolor de cabeza operativo?",
  },
  submit: { en: "Get My Free Assessment", fr: "Obtenir mon évaluation gratuite", es: "Obtener mi evaluación gratis" },
  sending: { en: "Sending...", fr: "Envoi...", es: "Enviando..." },
  successMsg: {
    en: "Message sent! We will get back to you within 4 hours.",
    fr: "Message envoyé ! On te revient dans les 4 prochaines heures.",
    es: "¡Mensaje enviado! Te respondemos en las próximas 4 horas.",
  },
  errorMsg: { en: "Something went wrong. Please try again.", fr: "Quelque chose a planté. Réessaie.", es: "Algo salió mal. Intenta de nuevo." },
  responseTime: { en: "Response Time", fr: "Temps de réponse", es: "Tiempo de respuesta" },
  within4h: { en: "Within 4 hours", fr: "Moins de 4 heures", es: "Menos de 4 horas" },
  select: { en: "Select...", fr: "Sélectionner...", es: "Seleccionar..." },
};

const INDUSTRIES = {
  en: [
    { value: "", label: "Select..." },
    { value: "hvac", label: "HVAC" },
    { value: "plumbing", label: "Plumbing" },
    { value: "roofing", label: "Roofing" },
    { value: "electrical", label: "Electrical" },
    { value: "general-contractor", label: "General Contractor" },
    { value: "landscaping", label: "Landscaping" },
    { value: "cleaning", label: "Cleaning" },
    { value: "chimney", label: "Chimney Services" },
    { value: "other", label: "Other Home Services" },
  ],
  fr: [
    { value: "", label: "Sélectionner..." },
    { value: "hvac", label: "CVC" },
    { value: "plumbing", label: "Plomberie" },
    { value: "roofing", label: "Toiture" },
    { value: "electrical", label: "Électricité" },
    { value: "general-contractor", label: "Entrepreneur général" },
    { value: "landscaping", label: "Aménagement paysager" },
    { value: "cleaning", label: "Ménage" },
    { value: "chimney", label: "Ramonage" },
    { value: "other", label: "Autre service résidentiel" },
  ],
  es: [
    { value: "", label: "Seleccionar..." },
    { value: "hvac", label: "HVAC / Aire acondicionado" },
    { value: "plumbing", label: "Plomería" },
    { value: "roofing", label: "Techos" },
    { value: "electrical", label: "Electricidad" },
    { value: "general-contractor", label: "Contratista general" },
    { value: "landscaping", label: "Jardinería" },
    { value: "cleaning", label: "Limpieza" },
    { value: "chimney", label: "Chimeneas" },
    { value: "painting", label: "Pintura" },
    { value: "other", label: "Otro servicio residencial" },
  ],
};

export default function Contact() {
  const { pathname, query } = useRouter();
  const locale = getLocale(pathname);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    industry: "",
    callsPerWeek: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, plan: query.plan || "", locale }),
      });
      setStatus(T.successMsg[locale]);
      setForm({ name: "", email: "", phone: "", industry: "", callsPerWeek: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus(T.errorMsg[locale]);
    } finally {
      setSubmitting(false);
    }
  };

  const industries = INDUSTRIES[locale];

  const inputClass =
    "w-full rounded-lg px-4 py-3 bg-surface border border-border text-white placeholder-txt3 focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-colors";
  const selectClass =
    "w-full rounded-lg px-4 py-3 bg-surface border border-border text-white focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-colors";

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 space-y-12">

        <ScrollReveal>
          <div className="text-center space-y-4 pt-8">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold">{T.title[locale]}</h1>
            <p className="text-lg text-txt2 max-w-2xl mx-auto leading-relaxed">{T.subtitle[locale]}</p>
            <p className="text-accent2 font-semibold">{T.respond[locale]}</p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          <ScrollReveal>
            <GlowCard className="p-8 h-full flex flex-col items-center justify-center text-center" glowColor="rgba(108,99,255,0.15)">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-heading font-bold mb-2">{T.callTitle[locale]}</h2>
              <p className="text-txt2 text-sm max-w-sm mb-6">{T.callDesc[locale]}</p>
              <ul className="text-txt2 text-sm space-y-2 text-left mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent2 flex-shrink-0" />{T.free[locale]}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent2 flex-shrink-0" />{T.customROI[locale]}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-accent2 flex-shrink-0" />{T.actionable[locale]}</li>
              </ul>
              <a href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0" target="_blank" rel="noopener noreferrer">
                <ShimmerButton className="text-base px-8 py-4">{T.pickTime[locale]}</ShimmerButton>
              </a>
              <p className="text-txt3 text-xs mt-3">{T.calNote[locale]}</p>
            </GlowCard>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <GlowCard className="p-6 h-full" glowColor="rgba(0,212,170,0.1)">
              <h2 className="text-xl font-heading font-bold mb-1">{T.formTitle[locale]}</h2>
              <p className="text-txt3 text-sm mb-5">{T.formSub[locale]}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-txt2 mb-1">{T.name[locale]}</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-1">{T.email[locale]}</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-1">{T.phone[locale]}</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-1">{T.industry[locale]}</label>
                    <select name="industry" value={form.industry} onChange={handleChange} required className={selectClass}>
                      {industries.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-1">{T.callsWeek[locale]}</label>
                    <select name="callsPerWeek" value={form.callsPerWeek} onChange={handleChange} required className={selectClass}>
                      <option value="">{T.select[locale]}</option>
                      <option value="5-10">5-10</option>
                      <option value="10-20">10-20</option>
                      <option value="20-40">20-40</option>
                      <option value="40+">40+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-txt2 mb-1">{T.tellUs[locale]}</label>
                  <textarea name="message" rows="3" value={form.message} onChange={handleChange} placeholder={T.placeholder[locale]} className={inputClass} />
                </div>

                <ShimmerButton type="submit" disabled={submitting} className="w-full py-3 text-sm">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{T.sending[locale]}</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2"><Send className="w-4 h-4" />{T.submit[locale]}</span>
                  )}
                </ShimmerButton>

                {status && (
                  <p className={`text-sm text-center ${status.includes("sent") || status.includes("envoyé") || status.includes("enviado") ? "text-accent2" : "text-danger"}`}>
                    {status}
                  </p>
                )}
              </form>
            </GlowCard>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-4">
            <GlowCard className="p-5 text-center">
              <Mail className="w-5 h-5 text-accent mx-auto mb-2" />
              <div className="text-xs text-txt3 mb-1">Email</div>
              <a href="mailto:mikael@bluewiseai.com" className="text-accent hover:text-accent/80 text-sm font-medium transition-colors">mikael@bluewiseai.com</a>
            </GlowCard>
            <GlowCard className="p-5 text-center">
              <Phone className="w-5 h-5 text-accent mx-auto mb-2" />
              <div className="text-xs text-txt3 mb-1">{T.phone[locale]}</div>
              <a href="tel:+15144184743" className="text-accent hover:text-accent/80 text-sm font-medium transition-colors">(514) 418-4743</a>
            </GlowCard>
            <GlowCard className="p-5 text-center">
              <Clock className="w-5 h-5 text-accent2 mx-auto mb-2" />
              <div className="text-xs text-txt3 mb-1">{T.responseTime[locale]}</div>
              <p className="text-accent2 font-semibold text-sm">{T.within4h[locale]}</p>
            </GlowCard>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
