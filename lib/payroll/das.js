// lib/payroll/das.js
// Déductions à la source (DAS) — Quebec 2026 rates.
//
// SCOPE: simplified calc for small-crew construction payroll. Good enough
// for internal planning / accountant hand-off. NOT a substitute for
// Revenu Québec's WinRAS or a CPA review.
//
// Rates pulled from the last published Revenu Québec / CRA tables we have
// on file. If Jer's accountant flags a discrepancy, update RATES_2026
// in-place and re-run past pay runs.
//
// References (for future-you updating these):
//   - RRQ (QPP):        revenuquebec.ca > Programmes > RRQ > taux
//   - EI:               canada.ca > Employment Insurance > premium rates
//   - RQAP (QPIP):      rqap.gouv.qc.ca > taux
//   - Federal tax:      CRA TD1 + T4127 payroll formulas
//   - Québec tax:       Guide TP-1015.G
//   - CNESST:           cnesst.gouv.qc.ca — varies per industry (fenestration
//                       / construction is approx 6-10% employer, override per-tenant)

export const RATES_2026 = {
  year: 2026,
  source_note: 'Taux 2026 publiés par Revenu Québec / CRA (dernière mise à jour connue). À vérifier avec le comptable.',

  // Régime de rentes du Québec (QPP) — 2026
  rrq: {
    base_rate:        0.0540,   // 5.40% base
    supplemental_rate: 0.0100,  // 1.00% additional (PRB)
    annual_exemption: 3500,
    max_pensionable:  73200,    // MPE = max pensionable earnings
  },

  // Assurance-emploi (EI) — Quebec reduced rate 2026
  ei: {
    employee_rate: 0.0131,      // 1.31% QC-reduced (federal outside QC is higher)
    employer_factor: 1.4,        // employer pays 1.4× employee
    max_insurable: 65700,
  },

  // Régime québécois d'assurance parentale (QPIP / RQAP)
  rqap: {
    employee_rate: 0.00494,     // 0.494%
    employer_rate: 0.00692,     // 0.692%
    max_insurable: 94000,
  },

  // Fédéral — brackets + basic personal amount (TD1)
  federal: {
    basic_personal: 16129,      // TD1 default
    brackets: [
      { up_to: 57375,  rate: 0.15   },
      { up_to: 114750, rate: 0.205  },
      { up_to: 177882, rate: 0.26   },
      { up_to: 253414, rate: 0.29   },
      { up_to: Infinity, rate: 0.33 },
    ],
    // Quebec abatement (refund of 16.5% on federal tax for QC residents)
    qc_abatement: 0.165,
  },

  // Québec — brackets + basic amount (TP-1015.3)
  quebec: {
    basic_personal: 18056,      // TP-1015.3 default
    brackets: [
      { up_to: 53255,  rate: 0.14   },
      { up_to: 106495, rate: 0.19   },
      { up_to: 129590, rate: 0.24   },
      { up_to: Infinity, rate: 0.2575 },
    ],
  },

  // CNESST — employer only, industry-specific. Default 7% (fenestration/
  // renovation band) — overridable per tenant via customers.cnesst_rate.
  cnesst: {
    default_rate: 0.07,
  },
};

// Standard payroll frequencies
export const PAY_PERIODS_PER_YEAR = {
  weekly:      52,
  biweekly:    26,
  semimonthly: 24,
  monthly:     12,
};

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

// Tiered tax for annualized gross minus personal credit
function taxOnAnnualIncome(annualTaxable, brackets, basicCredit, creditRate) {
  if (annualTaxable <= basicCredit) return 0;
  let tax = 0;
  let remaining = annualTaxable;
  let floor = 0;
  for (const b of brackets) {
    if (remaining <= 0) break;
    const bandTop = b.up_to;
    const bandWidth = bandTop - floor;
    const slice = Math.min(remaining, bandWidth);
    tax += slice * b.rate;
    remaining -= slice;
    floor = bandTop;
  }
  // Subtract non-refundable basic credit at the lowest rate (standard T4127 method)
  tax -= basicCredit * creditRate;
  return Math.max(0, tax);
}

/**
 * computeDas — one-period DAS breakdown.
 *
 * @param {object} args
 * @param {number} args.gross                 Gross pay for this period ($).
 * @param {number} args.ytdGross              Employee's YTD gross BEFORE this period.
 * @param {number} args.payPeriodsPerYear     52 | 26 | 24 | 12.
 * @param {number} [args.td1Federal]          Federal personal amount (defaults to basic).
 * @param {number} [args.tp1015Quebec]        Québec personal amount (defaults to basic).
 * @param {number} [args.cnesstRate]          Employer CNESST rate (overrides default).
 * @param {object} [args.rates]               Override rate table (defaults to RATES_2026).
 * @returns {object} Breakdown incl. deductions, net, employer cost.
 */
export function computeDas(args) {
  const {
    gross,
    ytdGross = 0,
    payPeriodsPerYear = 52,
    td1Federal,
    tp1015Quebec,
    cnesstRate,
    rates = RATES_2026,
  } = args || {};

  const g = Number(gross) || 0;
  if (g <= 0) {
    return zeroResult(rates);
  }

  const ytd = Number(ytdGross) || 0;

  // RRQ — apply exemption pro-rated per period
  const rrqExemptionPerPeriod = rates.rrq.annual_exemption / payPeriodsPerYear;
  const rrqRate = rates.rrq.base_rate + rates.rrq.supplemental_rate;
  // Cap on YTD pensionable earnings
  const rrqRemainingRoom = Math.max(0, rates.rrq.max_pensionable - ytd);
  const rrqPensionable = Math.max(0, Math.min(g - rrqExemptionPerPeriod, rrqRemainingRoom));
  const rrq = rrqPensionable * rrqRate;

  // EI — no exemption, capped on YTD insurable
  const eiRemainingRoom = Math.max(0, rates.ei.max_insurable - ytd);
  const eiInsurable = Math.min(g, eiRemainingRoom);
  const ei = eiInsurable * rates.ei.employee_rate;

  // RQAP — no exemption, capped
  const rqapRemainingRoom = Math.max(0, rates.rqap.max_insurable - ytd);
  const rqapInsurable = Math.min(g, rqapRemainingRoom);
  const rqap = rqapInsurable * rates.rqap.employee_rate;

  // Annualize period gross to use yearly tax tables
  const annualGross = g * payPeriodsPerYear;

  // Federal tax
  const tdFed = Number.isFinite(td1Federal) ? td1Federal : rates.federal.basic_personal;
  const annualFedTax = taxOnAnnualIncome(
    annualGross,
    rates.federal.brackets,
    tdFed,
    rates.federal.brackets[0].rate,
  );
  const federalTaxAfterAbatement = annualFedTax * (1 - rates.federal.qc_abatement);
  const federalTaxPeriod = federalTaxAfterAbatement / payPeriodsPerYear;

  // Québec tax
  const tpQc = Number.isFinite(tp1015Quebec) ? tp1015Quebec : rates.quebec.basic_personal;
  const annualQcTax = taxOnAnnualIncome(
    annualGross,
    rates.quebec.brackets,
    tpQc,
    rates.quebec.brackets[0].rate,
  );
  const qcTaxPeriod = annualQcTax / payPeriodsPerYear;

  // Employer costs (for projection — not deducted from employee net)
  const employerRrq = rrqPensionable * rrqRate; // matches employee
  const employerEi  = ei * rates.ei.employer_factor;
  const employerRqap = rqapInsurable * rates.rqap.employer_rate;
  const cnesstR = Number.isFinite(cnesstRate) ? cnesstRate : rates.cnesst.default_rate;
  const cnesst = g * cnesstR;

  const totalDeductions = rrq + ei + rqap + federalTaxPeriod + qcTaxPeriod;
  const netPay = g - totalDeductions;

  return {
    year: rates.year,
    gross: round2(g),
    deductions: {
      rrq:           round2(rrq),
      ei:            round2(ei),
      rqap:          round2(rqap),
      federal_tax:   round2(federalTaxPeriod),
      qc_tax:        round2(qcTaxPeriod),
      total:         round2(totalDeductions),
    },
    net_pay: round2(netPay),
    employer: {
      rrq:    round2(employerRrq),
      ei:     round2(employerEi),
      rqap:   round2(employerRqap),
      cnesst: round2(cnesst),
      total:  round2(employerRrq + employerEi + employerRqap + cnesst),
    },
    total_cost: round2(g + employerRrq + employerEi + employerRqap + cnesst),
    // Audit trail — lets the accountant retrace the math
    inputs: {
      ytd_gross: round2(ytd),
      pay_periods_per_year: payPeriodsPerYear,
      td1_federal: round2(tdFed),
      tp1015_qc: round2(tpQc),
      cnesst_rate: cnesstR,
      rates_year: rates.year,
    },
  };
}

function zeroResult(rates) {
  return {
    year: rates.year,
    gross: 0,
    deductions: { rrq: 0, ei: 0, rqap: 0, federal_tax: 0, qc_tax: 0, total: 0 },
    net_pay: 0,
    employer: { rrq: 0, ei: 0, rqap: 0, cnesst: 0, total: 0 },
    total_cost: 0,
    inputs: { ytd_gross: 0, pay_periods_per_year: 52, rates_year: rates.year },
  };
}
