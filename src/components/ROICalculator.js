import { useState } from "react";
import { useRouter } from "next/router";
import { ROI_DEFAULTS, PRICING } from "@/data/pricing";

export default function ROICalculator() {
  const { pathname } = useRouter();
  const isFr = pathname.startsWith("/fr");

  const [missedCallsPerWeek, setMissedCallsPerWeek] = useState(ROI_DEFAULTS.missedCallsPerWeek);
  const [avgJobValue, setAvgJobValue] = useState(ROI_DEFAULTS.avgJobValue);
  const [conversionRate, setConversionRate] = useState(ROI_DEFAULTS.conversionRate);

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
    title: isFr ? "Calcule ton ROI" : "Calculate Your ROI",
    subtitle: isFr
      ? "Ajuste les curseurs pour voir ton retour sur investissement personnalisé (basé sur le plan Pro)"
      : "Adjust the sliders to see your personalized ROI (based on Pro plan)",
    missedCalls: isFr ? "Appels manqués par semaine" : "Missed Calls Per Week",
    avgJob: isFr ? "Valeur moyenne du contrat" : "Average Job Value",
    conversion: isFr ? "Taux de conversion (si tu répondais)" : "Conversion Rate (if you answered)",
    currentTitle: isFr ? "Situation actuelle" : "Current Situation",
    withTitle: isFr ? "Avec BlueWise (Pro)" : "With BlueWise (Pro)",
    missedYear: isFr ? "Appels manqués/année :" : "Missed calls/year:",
    potentialRev: isFr ? "Revenus potentiels :" : "Potential revenue:",
    lostYear: isFr ? "Perdus par année :" : "Lost per year:",
    setup: isFr ? "Frais d'installation :" : "Setup fee:",
    monthlySupport: isFr ? "Support mensuel :" : "Monthly support:",
    firstYearTotal: isFr ? "Total 1ère année :" : "First year total:",
    recovered: isFr ? "Revenus récupérés :" : "Recovered revenue:",
    netProfit: isFr ? "Profit net Année 1 :" : "Net profit Year 1:",
    breakeven: isFr ? "Rentabilisé en" : "Break-Even",
    roi: isFr ? "ROI Année 1" : "ROI Year 1",
    capture: isFr ? "Taux capture" : "Capture Rate",
    year2: isFr ? "Profit An 2+" : "Year 2+ Profit",
    days: isFr ? "jours" : "days",
    returnLabel: isFr ? "retour" : "return",
    ofMissed: isFr ? "des appels manqués" : "of missed calls",
    perYear: isFr ? "par année" : "per year",
    basedOn: isFr ? "Basé sur tes chiffres, BlueWise se rentabilise en" : "Based on your numbers, BlueWise pays for itself in",
    lessMonth: isFr ? "moins d'un mois" : "less than a month",
    oneTwo: isFr ? "1-2 mois" : "1-2 months",
    twoThree: isFr ? "2-3 mois" : "2-3 months",
    threePlus: isFr ? "3+ mois" : "3+ months",
    gainTitle: isFr ? "Ton gain potentiel" : "Your Potential Gain",
    firstYear: isFr ? "dans ta première année" : "in your first year alone",
    notFit: isFr ? "Avec ces chiffres, le plan Pro n'est peut-être pas le bon fit. Considère le plan Starter." : "With these numbers, the Pro plan may not be the best fit. Consider the Starter plan.",
    guarantee: isFr ? "Garantie rentabilité 90 jours — on travaille gratis jusqu'à ce que tu sois profitable." : "90-day break-even guarantee — we work for free until you're profitable.",
  };

  return (
    <div className="rounded-3xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-900/30 to-slate-900/90 p-6 md:p-10 backdrop-blur-xl">
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
            <span>5/{isFr ? "sem" : "week"}</span>
            <span>50/{isFr ? "sem" : "week"}</span>
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
              <strong className="text-white">${monthlyFee}/{isFr ? "mo" : "mo"}</strong>
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
    </div>
  );
}
