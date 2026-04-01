import { useState } from "react";
import { useRouter } from "next/router";
import { ROI_DEFAULTS, PRICING } from "@/data/pricing";
import { getLocale } from "@/lib/locale";

export default function ROICalculator() {
  const { pathname } = useRouter();
  const locale = getLocale(pathname);

  const [missedCallsPerWeek, setMissedCallsPerWeek] = useState(ROI_DEFAULTS.missedCallsPerWeek);
  const [avgJobValue, setAvgJobValue] = useState(ROI_DEFAULTS.avgJobValue);
  const [conversionRate, setConversionRate] = useState(ROI_DEFAULTS.conversionRate);

  // Email capture state
  const [captureEmail, setCaptureEmail] = useState("");
  const [captureName, setCaptureName] = useState("");
  const [caslConsent, setCaslConsent] = useState(false);
  const [captureStatus, setCaptureStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [captureError, setCaptureError] = useState("");

  const captureRate = ROI_DEFAULTS.captureRate;
  const setupFee = PRICING.pro.setup;
  const monthlyFee = PRICING.pro.monthly;

  const missedCallsPerYear = missedCallsPerWeek * 52;
  const lostRevenuePerYear = missedCallsPerYear * avgJobValue * (conversionRate / 100);
  const capturedLeads = missedCallsPerYear * (captureRate / 100);
  const recoveredRevenue = capturedLeads * avgJobValue * (conversionRate / 100);
  const firstYearCost = setupFee + (monthlyFee * 12);
  const netProfitFirstYear = recoveredRevenue - firstYearCost;
  const roiPercentage = firstYearCost > 0 ? ((netProfitFirstYear / firstYearCost) * 100).toFixed(0) : 0;

  const monthlyRecovered = recoveredRevenue / 12;
  const breakEvenMonths = monthlyRecovered > monthlyFee ? (setupFee + monthlyFee) / (monthlyRecovered - monthlyFee) : 99;
  const breakEvenDays = Math.round(breakEvenMonths * 30);

  const yearTwoCost = monthlyFee * 12;
  const netProfitYearTwo = recoveredRevenue - yearTwoCost;

  const t = {
    title: { en: "Calculate Your ROI", fr: "Calcule ton ROI", es: "Calcula tu ROI" }[locale],
    subtitle: {
      en: "Adjust the sliders to see your personalized ROI (based on Pro plan)",
      fr: "Ajuste les curseurs pour voir ton retour sur investissement personnalisé (basé sur le plan Pro)",
      es: "Ajusta los controles para ver tu retorno de inversión personalizado (basado en el plan Pro)",
    }[locale],
    missedCalls: { en: "Missed Calls Per Week", fr: "Appels manqués par semaine", es: "Llamadas perdidas por semana" }[locale],
    avgJob: { en: "Average Job Value", fr: "Valeur moyenne du contrat", es: "Valor promedio del trabajo" }[locale],
    conversion: { en: "Conversion Rate (if you answered)", fr: "Taux de conversion (si tu répondais)", es: "Tasa de conversión (si contestaras)" }[locale],
    currentTitle: { en: "Current Situation", fr: "Situation actuelle", es: "Situación actual" }[locale],
    withTitle: { en: "With BlueWise (Pro)", fr: "Avec BlueWise (Pro)", es: "Con BlueWise (Pro)" }[locale],
    missedYear: { en: "Missed calls/year:", fr: "Appels manqués/année :", es: "Llamadas perdidas/año:" }[locale],
    potentialRev: { en: "Potential revenue:", fr: "Revenus potentiels :", es: "Ingresos potenciales:" }[locale],
    lostYear: { en: "Lost per year:", fr: "Perdus par année :", es: "Perdidos por año:" }[locale],
    setup: { en: "Setup fee:", fr: "Frais d'installation :", es: "Costo de instalación:" }[locale],
    monthlySupport: { en: "Monthly support:", fr: "Support mensuel :", es: "Soporte mensual:" }[locale],
    firstYearTotal: { en: "First year total:", fr: "Total 1ère année :", es: "Total primer año:" }[locale],
    recovered: { en: "Recovered revenue:", fr: "Revenus récupérés :", es: "Ingresos recuperados:" }[locale],
    netProfit: { en: "Net profit Year 1:", fr: "Profit net Année 1 :", es: "Ganancia neta Año 1:" }[locale],
    breakeven: { en: "Break-Even", fr: "Rentabilisé en", es: "Punto de equilibrio" }[locale],
    roi: { en: "ROI Year 1", fr: "ROI Année 1", es: "ROI Año 1" }[locale],
    capture: { en: "Capture Rate", fr: "Taux capture", es: "Tasa de captura" }[locale],
    year2: { en: "Year 2+ Profit", fr: "Profit An 2+", es: "Ganancia Año 2+" }[locale],
    days: { en: "days", fr: "jours", es: "días" }[locale],
    returnLabel: { en: "return", fr: "retour", es: "retorno" }[locale],
    ofMissed: { en: "of missed calls", fr: "des appels manqués", es: "de llamadas perdidas" }[locale],
    perYear: { en: "per year", fr: "par année", es: "por año" }[locale],
    basedOn: {
      en: "Based on your numbers, BlueWise pays for itself in",
      fr: "Basé sur tes chiffres, BlueWise se rentabilise en",
      es: "Según tus números, BlueWise se paga solo en",
    }[locale],
    lessMonth: { en: "less than a month", fr: "moins d'un mois", es: "menos de un mes" }[locale],
    oneTwo: { en: "1-2 months", fr: "1-2 mois", es: "1-2 meses" }[locale],
    twoThree: { en: "2-3 months", fr: "2-3 mois", es: "2-3 meses" }[locale],
    threePlus: { en: "3+ months", fr: "3+ mois", es: "3+ meses" }[locale],
    gainTitle: { en: "Your Potential Gain", fr: "Ton gain potentiel", es: "Tu ganancia potencial" }[locale],
    firstYear: { en: "in your first year alone", fr: "dans ta première année", es: "solo en tu primer año" }[locale],
    notFit: {
      en: "With these numbers, the Pro plan may not be the best fit. Consider the Starter plan.",
      fr: "Avec ces chiffres, le plan Pro n'est peut-être pas le bon fit. Considère le plan Starter.",
      es: "Con estos números, el plan Pro podría no ser el mejor. Considera el plan Starter.",
    }[locale],
    guarantee: {
      en: "90-day break-even guarantee — we work for free until you're profitable.",
      fr: "Garantie rentabilité 90 jours — on travaille gratis jusqu'à ce que tu sois profitable.",
      es: "Garantía de punto de equilibrio en 90 días — trabajamos gratis hasta que seas rentable.",
    }[locale],
    week: { en: "week", fr: "sem", es: "sem" }[locale],
    reportTitle: {
      en: "Get your custom savings report",
      fr: "Reçois ton rapport d'économies personnalisé",
      es: "Recibe tu reporte de ahorro personalizado",
    }[locale],
    reportSubtitle: {
      en: "We'll send a detailed breakdown based on your numbers.",
      fr: "On t'envoie une analyse détaillée basée sur tes chiffres.",
      es: "Te enviaremos un análisis detallado basado en tus números.",
    }[locale],
    emailPlaceholder: { en: "Your email", fr: "Ton courriel", es: "Tu correo" }[locale],
    namePlaceholder: { en: "Your name (optional)", fr: "Ton nom (optionnel)", es: "Tu nombre (opcional)" }[locale],
    caslLabel: {
      en: "I agree to receive my savings report and occasional updates from BlueWise AI. You can unsubscribe anytime.",
      fr: "J'accepte de recevoir mon rapport d'économies et des communications occasionnelles de BlueWise AI. Tu peux te désabonner en tout temps.",
      es: "Acepto recibir mi reporte de ahorro y comunicaciones ocasionales de BlueWise AI. Puedes darte de baja en cualquier momento.",
    }[locale],
    sendReport: { en: "Send my report", fr: "Envoyer mon rapport", es: "Enviar mi reporte" }[locale],
    sending: { en: "Sending...", fr: "Envoi...", es: "Enviando..." }[locale],
    successMsg: {
      en: "Your report is on the way! Check your inbox.",
      fr: "Ton rapport est en chemin! Vérifie ta boîte courriel.",
      es: "Tu reporte va en camino! Revisa tu bandeja de entrada.",
    }[locale],
    errorMsg: { en: "Something went wrong. Please try again.", fr: "Une erreur est survenue. Réessaie.", es: "Algo salió mal. Inténtalo de nuevo." }[locale],
    consentRequired: { en: "Please check the consent box.", fr: "Coche la case de consentement.", es: "Marca la casilla de consentimiento." }[locale],
    emailRequired: { en: "Please enter a valid email.", fr: "Entre un courriel valide.", es: "Ingresa un correo válido." }[locale],
  };

  async function handleCaptureSubmit(e) {
    e.preventDefault();
    setCaptureError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!captureEmail || !emailRegex.test(captureEmail)) {
      setCaptureError(t.emailRequired);
      return;
    }
    if (!caslConsent) {
      setCaptureError(t.consentRequired);
      return;
    }

    setCaptureStatus("loading");
    try {
      const resp = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: captureEmail,
          name: captureName || undefined,
          casl_consent: true,
          calculator_results: {
            missed_calls_per_week: missedCallsPerWeek,
            avg_job_value: avgJobValue,
            conversion_rate: conversionRate,
            recovered_revenue: recoveredRevenue,
            net_profit_year1: netProfitFirstYear,
            roi_percentage: roiPercentage,
            break_even_days: breakEvenDays,
          },
        }),
      });
      if (resp.ok) {
        setCaptureStatus("success");
      } else {
        setCaptureStatus("error");
        setCaptureError(t.errorMsg);
      }
    } catch {
      setCaptureStatus("error");
      setCaptureError(t.errorMsg);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="text-center mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t.title}</h3>
        <p className="text-slate-300 text-sm sm:text-base">{t.subtitle}</p>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-slate-200 text-sm font-semibold">{t.missedCalls}</label>
            <span className="text-blue-300 text-lg font-bold">{missedCallsPerWeek}</span>
          </div>
          <input type="range" min="5" max="50" step="1" value={missedCallsPerWeek}
            onChange={(e) => setMissedCallsPerWeek(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>5/{t.week}</span>
            <span>50/{t.week}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-slate-200 text-sm font-semibold">{t.avgJob}</label>
            <span className="text-emerald-300 text-lg font-bold">${avgJobValue}</span>
          </div>
          <input type="range" min="150" max="1500" step="50" value={avgJobValue}
            onChange={(e) => setAvgJobValue(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>$150</span>
            <span>$1,500</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-slate-200 text-sm font-semibold">{t.conversion}</label>
            <span className="text-purple-300 text-lg font-bold">{conversionRate}%</span>
          </div>
          <input type="range" min="20" max="70" step="5" value={conversionRate}
            onChange={(e) => setConversionRate(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>20%</span>
            <span>70%</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-900/20 to-slate-900/80 p-6">
          <h4 className="text-lg font-bold text-amber-300 mb-4">{t.currentTitle}</h4>
          <div className="space-y-3 text-slate-200">
            <div className="flex justify-between text-sm">
              <span>{t.missedYear}</span>
              <strong className="text-white">{missedCallsPerYear.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t.potentialRev}</span>
              <strong className="text-white">${lostRevenuePerYear.toLocaleString()}</strong>
            </div>
            <div className="h-px bg-slate-600 my-3"></div>
            <div className="flex justify-between text-lg">
              <span className="text-amber-300 font-semibold">{t.lostYear}</span>
              <strong className="text-amber-200 text-2xl">${lostRevenuePerYear.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-900/20 to-slate-900/80 p-6">
          <h4 className="text-lg font-bold text-emerald-300 mb-4">{t.withTitle}</h4>
          <div className="space-y-3 text-slate-200">
            <div className="flex justify-between text-sm">
              <span>{t.setup}</span>
              <strong className="text-white">${setupFee.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t.monthlySupport}</span>
              <strong className="text-white">${monthlyFee}/mo</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t.firstYearTotal}</span>
              <strong className="text-white">${firstYearCost.toLocaleString()}</strong>
            </div>
            <div className="h-px bg-slate-600 my-3"></div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-300">{t.recovered}</span>
                <strong className="text-emerald-200">${recoveredRevenue.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-emerald-300 font-semibold">{t.netProfit}</span>
                <strong className={`text-2xl ${netProfitFirstYear > 0 ? 'text-emerald-200' : 'text-red-300'}`}>
                  ${netProfitFirstYear.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-slate-950/60 border border-blue-500/30 p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">{t.breakeven}</div>
          <div className="text-2xl font-bold text-blue-300">{breakEvenDays < 90 ? breakEvenDays : '90+'}</div>
          <div className="text-[10px] text-slate-400">{t.days}</div>
        </div>
        <div className="rounded-xl bg-slate-950/60 border border-emerald-500/30 p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">{t.roi}</div>
          <div className="text-2xl font-bold text-emerald-300">{roiPercentage > 0 ? roiPercentage : 0}%</div>
          <div className="text-[10px] text-slate-400">{t.returnLabel}</div>
        </div>
        <div className="rounded-xl bg-slate-950/60 border border-purple-500/30 p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">{t.capture}</div>
          <div className="text-2xl font-bold text-purple-300">{captureRate}%</div>
          <div className="text-[10px] text-slate-400">{t.ofMissed}</div>
        </div>
        <div className="rounded-xl bg-slate-950/60 border border-amber-500/30 p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">{t.year2}</div>
          <div className="text-2xl font-bold text-amber-300">${Math.round(netProfitYearTwo / 1000)}K</div>
          <div className="text-[10px] text-slate-400">{t.perYear}</div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-slate-300 text-sm mb-4">
          {t.basedOn}{" "}
          <strong className="text-blue-300">
            {breakEvenDays < 30 ? t.lessMonth :
             breakEvenDays < 60 ? t.oneTwo :
             breakEvenDays < 90 ? t.twoThree : t.threePlus}
          </strong>.
        </p>

        {netProfitFirstYear > 0 ? (
          <div className="space-y-3">
            <div className="inline-block rounded-xl bg-emerald-600/20 border border-emerald-500/40 px-6 py-3">
              <div className="text-xs text-emerald-300 uppercase tracking-wider mb-1">{t.gainTitle}</div>
              <div className="text-3xl font-bold text-emerald-200">${netProfitFirstYear.toLocaleString()}</div>
              <div className="text-xs text-emerald-300 mt-1">{t.firstYear}</div>
            </div>
            <p className="text-emerald-300/80 text-xs mt-3">{t.guarantee}</p>
          </div>
        ) : (
          <div className="text-amber-300 text-sm">{t.notFit}</div>
        )}
      </div>

      {/* Email capture gate — shown after ROI results */}
      <div className="mt-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900/60 p-6 md:p-8">
        {captureStatus === "success" ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-300 font-semibold">{t.successMsg}</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-5">
              <h4 className="text-lg font-bold text-white mb-1">{t.reportTitle}</h4>
              <p className="text-slate-400 text-sm">{t.reportSubtitle}</p>
            </div>
            <form onSubmit={handleCaptureSubmit} className="space-y-4 max-w-md mx-auto">
              <input
                type="email"
                value={captureEmail}
                onChange={(e) => setCaptureEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                maxLength={320}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={captureName}
                onChange={(e) => setCaptureName(e.target.value)}
                placeholder={t.namePlaceholder}
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caslConsent}
                  onChange={(e) => setCaslConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 shrink-0"
                />
                <span className="text-xs text-slate-400 leading-relaxed">{t.caslLabel}</span>
              </label>
              {captureError && (
                <p className="text-red-400 text-xs text-center">{captureError}</p>
              )}
              <button
                type="submit"
                disabled={captureStatus === "loading"}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
              >
                {captureStatus === "loading" ? t.sending : t.sendReport}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
