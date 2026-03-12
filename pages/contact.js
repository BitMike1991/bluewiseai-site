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

export default function Contact() {
  const { pathname, query } = useRouter();
  const isFr = pathname.startsWith("/fr");

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
        body: JSON.stringify({ ...form, plan: query.plan || "" }),
      });
      setStatus(
        isFr
          ? "Message envoyé ! On te revient dans les 4 prochaines heures."
          : "Message sent! We will get back to you within 4 hours."
      );
      setForm({
        name: "",
        email: "",
        phone: "",
        industry: "",
        callsPerWeek: "",
        message: "",
      });
    } catch (err) {
      console.error(err);
      setStatus(
        isFr
          ? "Quelque chose a planté. Réessaie."
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const industries = isFr
    ? [
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
      ]
    : [
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
      ];

  const inputClass =
    "w-full rounded-lg px-4 py-3 bg-surface border border-border text-white placeholder-txt3 focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-colors";
  const selectClass =
    "w-full rounded-lg px-4 py-3 bg-surface border border-border text-white focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-colors";

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 space-y-12">

        {/* TITLE */}
        <ScrollReveal>
          <div className="text-center space-y-4 pt-8">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold">
              {isFr
                ? "Réserve ton appel stratégique"
                : "Book Your Free Strategy Call"}
            </h1>
            <p className="text-lg text-txt2 max-w-2xl mx-auto leading-relaxed">
              {isFr
                ? "15 minutes. On regarde ta business, on calcule ta perte de revenus et on te dit exactement ce qu'on peut automatiser."
                : "15 minutes. We look at your business, calculate your revenue loss, and tell you exactly what we can automate."}
            </p>
            <p className="text-accent2 font-semibold">
              {isFr
                ? "On répond en moins de 4 heures."
                : "We respond within 4 hours."}
            </p>
          </div>
        </ScrollReveal>

        {/* TWO COLUMNS */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* BOOKING */}
          <ScrollReveal>
            <GlowCard
              className="p-8 h-full flex flex-col items-center justify-center text-center"
              glowColor="rgba(108,99,255,0.15)"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-heading font-bold mb-2">
                {isFr
                  ? "Appel stratégique 15 min"
                  : "15-Minute Strategy Call"}
              </h2>
              <p className="text-txt2 text-sm max-w-sm mb-6">
                {isFr
                  ? "On analyse tes opérations, on calcule ta perte de revenus et on te montre où l'automatisation fit."
                  : "We'll analyze your operations, calculate your revenue loss, and show you exactly where automation fits."}
              </p>
              <ul className="text-txt2 text-sm space-y-2 text-left mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent2 flex-shrink-0" />
                  {isFr ? "Gratuit — pas d'engagement" : "Free — no commitment"}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent2 flex-shrink-0" />
                  {isFr
                    ? "Calcul ROI personnalisé pour ta business"
                    : "Custom ROI calculation for your business"}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-accent2 flex-shrink-0" />
                  {isFr
                    ? "Recommandations actionnables"
                    : "Actionable recommendations you can use right away"}
                </li>
              </ul>
              <a
                href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ShimmerButton className="text-base px-8 py-4">
                  {isFr ? "Choisir un créneau" : "Pick a Time"}
                </ShimmerButton>
              </a>
              <p className="text-txt3 text-xs mt-3">
                {isFr
                  ? "Ouvre Google Calendar — choisis le créneau qui te convient"
                  : "Opens Google Calendar — pick the slot that works for you"}
              </p>
            </GlowCard>
          </ScrollReveal>

          {/* QUALIFYING FORM */}
          <ScrollReveal delay={100}>
            <GlowCard className="p-6 h-full" glowColor="rgba(0,212,170,0.1)">
              <h2 className="text-xl font-heading font-bold mb-1">
                {isFr
                  ? "Ou parle-nous de ta business"
                  : "Or tell us about your business"}
              </h2>
              <p className="text-txt3 text-sm mb-5">
                {isFr
                  ? "Remplis le formulaire et on te revient avec une recommandation personnalisée."
                  : "Fill this out and we'll reach out with a custom recommendation."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-txt2 mb-1">
                    {isFr ? "Nom" : "Name"}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-1">
                      {isFr ? "Courriel" : "Email"}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-1">
                      {isFr ? "Téléphone" : "Phone"}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-1">
                      {isFr ? "Industrie" : "Industry"}
                    </label>
                    <select
                      name="industry"
                      value={form.industry}
                      onChange={handleChange}
                      required
                      className={selectClass}
                    >
                      {industries.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-txt2 mb-1">
                      {isFr ? "Appels / sem" : "Calls / week"}
                    </label>
                    <select
                      name="callsPerWeek"
                      value={form.callsPerWeek}
                      onChange={handleChange}
                      required
                      className={selectClass}
                    >
                      <option value="">
                        {isFr ? "Sélectionner..." : "Select..."}
                      </option>
                      <option value="5-10">5-10</option>
                      <option value="10-20">10-20</option>
                      <option value="20-40">20-40</option>
                      <option value="40+">40+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-txt2 mb-1">
                    {isFr
                      ? "Parle-nous de ta business"
                      : "Tell us more about your business"}
                  </label>
                  <textarea
                    name="message"
                    rows="3"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={
                      isFr
                        ? "Quels services tu offres ? C'est quoi ton plus gros mal de tête opérationnel ?"
                        : "What services do you offer? What's your biggest operational headache?"
                    }
                    className={inputClass}
                  />
                </div>

                <ShimmerButton
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-sm"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isFr ? "Envoi..." : "Sending..."}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      {isFr
                        ? "Obtenir mon évaluation gratuite"
                        : "Get My Free Assessment"}
                    </span>
                  )}
                </ShimmerButton>

                {status && (
                  <p
                    className={`text-sm text-center ${
                      status.includes("sent") || status.includes("envoyé")
                        ? "text-accent2"
                        : "text-danger"
                    }`}
                  >
                    {status}
                  </p>
                )}
              </form>
            </GlowCard>
          </ScrollReveal>
        </div>

        {/* CONTACT INFO */}
        <ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-4">
            <GlowCard className="p-5 text-center">
              <Mail className="w-5 h-5 text-accent mx-auto mb-2" />
              <div className="text-xs text-txt3 mb-1">Email</div>
              <a
                href="mailto:mikael@bluewiseai.com"
                className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
              >
                mikael@bluewiseai.com
              </a>
            </GlowCard>
            <GlowCard className="p-5 text-center">
              <Phone className="w-5 h-5 text-accent mx-auto mb-2" />
              <div className="text-xs text-txt3 mb-1">
                {isFr ? "Téléphone" : "Phone"}
              </div>
              <a
                href="tel:+15144184743"
                className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
              >
                (514) 418-4743
              </a>
            </GlowCard>
            <GlowCard className="p-5 text-center">
              <Clock className="w-5 h-5 text-accent2 mx-auto mb-2" />
              <div className="text-xs text-txt3 mb-1">
                {isFr ? "Temps de réponse" : "Response Time"}
              </div>
              <p className="text-accent2 font-semibold text-sm">
                {isFr ? "Moins de 4 heures" : "Within 4 hours"}
              </p>
            </GlowCard>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
