import { useState } from "react";

export default function ROICalculator() {
  // Default values (conservative estimates)
  const [missedCallsPerWeek, setMissedCallsPerWeek] = useState(20);
  const [avgJobValue, setAvgJobValue] = useState(300);
  const [conversionRate, setConversionRate] = useState(60);

  // Lead Rescue pricing
  const setupFee = 2997;
  const monthlyFee = 799;
  const captureRate = 70; // Conservative estimate (60-80% range)

  // Calculations
  const missedCallsPerYear = missedCallsPerWeek * 52;
  const potentialRevenue = missedCallsPerYear * avgJobValue * (conversionRate / 100);
  const lostRevenuePerYear = potentialRevenue;

  const capturedLeads = missedCallsPerYear * (captureRate / 100);
  const recoveredRevenue = capturedLeads * avgJobValue * (conversionRate / 100);

  const firstYearCost = setupFee + (monthlyFee * 12);
  const netProfitFirstYear = recoveredRevenue - firstYearCost;
  const roiPercentage = ((netProfitFirstYear / firstYearCost) * 100).toFixed(0);

  // Break-even calculation
  const monthlyRecovered = recoveredRevenue / 12;
  const breakEvenMonths = (setupFee + monthlyFee) / (monthlyRecovered - monthlyFee);
  const breakEvenDays = Math.round(breakEvenMonths * 30);

  // Subsequent years (no setup fee)
  const yearTwoCost = monthlyFee * 12;
  const netProfitYearTwo = recoveredRevenue - yearTwoCost;

  return (
    <div className="rounded-3xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-900/30 to-slate-900/90 p-6 md:p-10 backdrop-blur-xl">
      <div className="text-center mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Calculate Your ROI
        </h3>
        <p className="text-slate-300 text-sm sm:text-base">
          Adjust the sliders to see your personalized break-even timeline
        </p>
      </div>

      {/* Input Controls */}
      <div className="space-y-6 mb-8">
        {/* Missed Calls Per Week */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-slate-200 text-sm font-semibold">
              Missed Calls Per Week
            </label>
            <span className="text-blue-300 text-lg font-bold">
              {missedCallsPerWeek}
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={missedCallsPerWeek}
            onChange={(e) => setMissedCallsPerWeek(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>5/week</span>
            <span>50/week</span>
          </div>
        </div>

        {/* Average Job Value */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-slate-200 text-sm font-semibold">
              Average Job Value
            </label>
            <span className="text-emerald-300 text-lg font-bold">
              ${avgJobValue}
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={avgJobValue}
            onChange={(e) => setAvgJobValue(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>$100</span>
            <span>$1,000</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-slate-200 text-sm font-semibold">
              Conversion Rate (if you answered)
            </label>
            <span className="text-purple-300 text-lg font-bold">
              {conversionRate}%
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="90"
            step="5"
            value={conversionRate}
            onChange={(e) => setConversionRate(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>30%</span>
            <span>90%</span>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Current State (Problem) */}
        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-900/20 to-slate-900/80 p-6">
          <h4 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            Current Situation
          </h4>
          <div className="space-y-3 text-slate-200">
            <div className="flex justify-between">
              <span className="text-sm">Missed calls/year:</span>
              <strong className="text-white">{missedCallsPerYear.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Potential revenue:</span>
              <strong className="text-white">${potentialRevenue.toLocaleString()}</strong>
            </div>
            <div className="h-px bg-slate-600 my-3"></div>
            <div className="flex justify-between text-lg">
              <span className="text-amber-300 font-semibold">Lost per year:</span>
              <strong className="text-amber-200 text-2xl">
                ${lostRevenuePerYear.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* With Lead Rescue (Solution) */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-900/20 to-slate-900/80 p-6">
          <h4 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
            <span className="text-2xl">✅</span>
            With Lead Rescue
          </h4>
          <div className="space-y-3 text-slate-200">
            <div className="flex justify-between">
              <span className="text-sm">Setup fee:</span>
              <strong className="text-white">${setupFee.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Monthly support:</span>
              <strong className="text-white">${monthlyFee}/mo</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">First year total:</span>
              <strong className="text-white">${firstYearCost.toLocaleString()}</strong>
            </div>
            <div className="h-px bg-slate-600 my-3"></div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-emerald-300">Recovered revenue:</span>
                <strong className="text-emerald-200">
                  ${recoveredRevenue.toLocaleString()}
                </strong>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-emerald-300 font-semibold">Net profit Year 1:</span>
                <strong className="text-emerald-200 text-2xl">
                  ${netProfitFirstYear.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-slate-950/60 border border-blue-500/30 p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Break-Even</div>
          <div className="text-2xl font-bold text-blue-300">
            {breakEvenDays < 90 ? `${breakEvenDays}` : '90+'}
          </div>
          <div className="text-[10px] text-slate-400">days</div>
        </div>

        <div className="rounded-xl bg-slate-950/60 border border-emerald-500/30 p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">ROI Year 1</div>
          <div className="text-2xl font-bold text-emerald-300">
            {roiPercentage > 0 ? roiPercentage : 0}%
          </div>
          <div className="text-[10px] text-slate-400">return</div>
        </div>

        <div className="rounded-xl bg-slate-950/60 border border-purple-500/30 p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Capture Rate</div>
          <div className="text-2xl font-bold text-purple-300">{captureRate}%</div>
          <div className="text-[10px] text-slate-400">of missed calls</div>
        </div>

        <div className="rounded-xl bg-slate-950/60 border border-amber-500/30 p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Year 2+ Profit</div>
          <div className="text-2xl font-bold text-amber-300">
            ${Math.round(netProfitYearTwo / 1000)}K
          </div>
          <div className="text-[10px] text-slate-400">per year</div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <p className="text-slate-300 text-sm mb-4">
          Based on your numbers, Lead Rescue pays for itself in{" "}
          <strong className="text-blue-300">
            {breakEvenDays < 30 ? 'less than a month' :
             breakEvenDays < 60 ? '1-2 months' :
             breakEvenDays < 90 ? '2-3 months' : '3+ months'}
          </strong>.
          Everything after that is pure profit.
        </p>

        {netProfitFirstYear > 0 ? (
          <div className="inline-block rounded-xl bg-emerald-600/20 border border-emerald-500/40 px-6 py-3">
            <div className="text-xs text-emerald-300 uppercase tracking-wider mb-1">
              Your Potential Gain
            </div>
            <div className="text-3xl font-bold text-emerald-200">
              ${netProfitFirstYear.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-300 mt-1">
              in your first year alone
            </div>
          </div>
        ) : (
          <div className="text-amber-300 text-sm">
            ⚠️ With these numbers, Lead Rescue may not be the best fit.
            We recommend businesses with higher call volume or job values.
          </div>
        )}
      </div>
    </div>
  );
}
