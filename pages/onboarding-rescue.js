// pages/onboarding-rescue.js
import { useState } from 'react';

export default function LeadRescueOnboarding() {
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

    // Shared services checkboxes
    if (name === 'services' && type === 'checkbox') {
      setForm((prev) => {
        const updated = checked
          ? [...prev.services, value]
          : prev.services.filter((s) => s !== value);
        return { ...prev, services: updated };
      });
      return;
    }

    // HVAC system types
    if (name === 'hvacSystemTypes' && type === 'checkbox') {
      setForm((prev) => {
        const updated = checked
          ? [...prev.hvacSystemTypes, value]
          : prev.hvacSystemTypes.filter((s) => s !== value);
        return { ...prev, hvacSystemTypes: updated };
      });
      return;
    }

    // Plumbing focus
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
    setStatus('Sending…');

    try {
      const businessTypeLabels = {
        hvac: 'HVAC',
        plumbing: 'Plumbing',
        roofing: 'Roofing',
        chimney: 'Chimney / Fireplace',
        electrician: 'Electrical',
        other: 'Other / Mixed Trade',
      };

      let specificDetails = '';

      switch (form.businessType) {
        case 'hvac':
          specificDetails = `
--------------------------------
HVAC-specific details
--------------------------------

Systems you work on:
${(form.hvacSystemTypes || []).map((s) => `- ${s}`).join('\n') || '- (not specified)'}

Peak months / busy season:
${form.hvacPeakMonths || 'Not specified'}

Do you offer maintenance contracts?
${form.hvacMaintenanceContracts || 'Not specified'}
`.trim();
          break;

        case 'plumbing':
          specificDetails = `
--------------------------------
Plumbing-specific details
--------------------------------

Main focus areas:
${(form.plumbingFocusAreas || []).map((s) => `- ${s}`).join('\n') || '- (not specified)'}

Do you offer 24/7 emergency service?
${form.plumbingEmergency24_7 || 'Not specified'}

Typical response time for emergency calls:
${form.plumbingResponseTime || 'Not specified'}
`.trim();
          break;

        case 'roofing':
          specificDetails = `
--------------------------------
Roofing-specific details
--------------------------------

Roof types you work on:
${form.roofingRoofTypes || 'Not specified'}

Do you offer emergency / storm-damage service?
${form.roofingEmergencyStorm || 'Not specified'}

Any limits on building height or roof pitch?
${form.roofingHeightLimits || 'Not specified'}
`.trim();
          break;

        case 'chimney':
          specificDetails = `
--------------------------------
Chimney / Fireplace-specific details
--------------------------------

Chimney & fireplace services you offer:
${form.chimneyServices || 'Not specified'}

Your busiest season (months):
${form.chimneySeason || 'Not specified'}

Do you also install stoves / inserts / liners?
${form.chimneyInstallations || 'Not specified'}
`.trim();
          break;

        case 'electrician':
          specificDetails = `
--------------------------------
Electrical-specific details
--------------------------------

Types of electrical work you do:
${form.electricianWorkTypes || 'Not specified'}

Do you offer 24/7 emergency calls?
${form.electricianEmergency24_7 || 'Not specified'}

Licenses, certifications, or jurisdictions:
${form.electricianLicenses || 'Not specified'}
`.trim();
          break;

        case 'other':
        default:
          specificDetails = `
--------------------------------
Other trade details
--------------------------------

Describe your main services / trade:
${form.otherTradeDescription || 'Not specified'}

Do you handle emergency / urgent jobs?
${form.otherEmergency || 'Not specified'}
`.trim();
          break;
      }

      const message = `
BlueWise AI Lead Rescue System — New Onboarding

Business type:
- ${businessTypeLabels[form.businessType] || form.businessType}

Business:
- Name: ${form.businessName}
- Owner: ${form.ownerName}
- Email to integrate: ${form.email}
- Phone for missed calls: ${form.phone}

Services:
${(form.services || []).map((s) => `- ${s}`).join('\n') || '- (none selected)'}

Service Area:
${form.serviceArea}

Operating Hours:
- Weekdays: ${form.hoursWeek}
- Weekend: ${form.hoursWeekend || 'N/A'}

Urgent Jobs:
${form.urgentJobs}

Jobs / messages to ignore:
${form.ignoreJobs || 'N/A'}

Preferred Tone:
${form.tone}

Daily Summary Email:
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
        console.error('Contact API error:', await res.text());
        setStatus('Oops, something went wrong on the server.');
        return;
      }

      setStatus(
        'Submitted! I’ll review your details and prepare your custom setup.'
      );
    } catch (error) {
      console.error(error);
      setStatus('Network error — please try again.');
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
    { id: 'plumbing', label: 'Plumbing' },
    { id: 'roofing', label: 'Roofing' },
    { id: 'chimney', label: 'Chimney / Fireplace' },
    { id: 'electrician', label: 'Electrical' },
    { id: 'other', label: 'Other Trade' },
  ];

  // 🔹 Services options per trade (this is the part that changed)
  const serviceOptionsByType = {
    hvac: [
      'HVAC Installation',
      'HVAC Repair',
      'AC Service',
      'Furnace Service',
      'Heat Pump Service',
      'Ductless / Mini-split',
      'Emergency HVAC',
    ],
    plumbing: [
      'Plumbing Install',
      'Plumbing Repair',
      'Drain Cleaning',
      'Water Heater',
      'Sewer / Main line',
      'Bathroom / Kitchen Renos',
      'Emergency Plumbing',
    ],
    roofing: [
      'Roof Repair / Leak',
      'New Roof / Re-roof',
      'Gutter / Eavestrough',
      'Roof Inspection',
      'Emergency Storm Repair',
    ],
    chimney: [
      'Chimney Sweep',
      'Chimney Inspection',
      'Chimney / Stove Install',
      'Chimney Repair / Liner',
      'Wood Stove / Insert Install',
      'Chimney Cap / Waterproofing',
    ],
    electrician: [
      'Electrical Troubleshooting',
      'Panel / Breaker Upgrade',
      'Lighting / Fixtures',
      'EV Charger Install',
      'New Construction / Reno Wiring',
      'Generator Install',
      'Emergency Electrical',
    ],
    other: [
      'General Service Call',
      'Small Jobs / Handyman',
      'Project Estimates / Quotes',
      'Maintenance Contracts',
      'Other (describe in notes)',
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
            BlueWise AI Lead Rescue System — Trade Onboarding
          </h1>

          <p className="text-center text-slate-100 drop-shadow-sm">
            Fill out this onboarding so I can configure your custom 24/7
            automation system for your small trade or home-service business
            (HVAC, plumbing, roofing, chimney, electrical, or other) within 72
            hours.
          </p>

          {/* Business type selector */}
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
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Business Name
              </label>
              <input
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Owner Name
              </label>
              <input
                name="ownerName"
                value={form.ownerName}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Email to Integrate
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

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Phone Number for Missed-Call Forwarding
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Shared Services – now dynamic per trade */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Services Offered
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

            {/* Service Area */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Service Area (Cities, ZIP / Postal Codes, Radius)
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

            {/* Hours */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Operating Hours (Weekdays)
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
                Operating Hours (Weekend)
              </label>
              <input
                name="hoursWeekend"
                value={form.hoursWeekend}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Urgent Jobs */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                What counts as an urgent job?
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

            {/* Ignore Jobs */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Jobs or messages to ignore
              </label>
              <textarea
                name="ignoreJobs"
                rows="2"
                value={form.ignoreJobs}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              />
            </div>

            {/* Type-specific section */}
            {isHVAC && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">HVAC specifics</h2>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    What kind of systems do you work on?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 text-sm">
                    {[
                      'Furnace',
                      'Air Conditioning',
                      'Heat Pump',
                      'Ductless / Mini-split',
                      'Rooftop units',
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
                  <label className="block text-sm font-medium drop-shadow-sm">
                    When is your busiest season? (months)
                  </label>
                  <input
                    name="hvacPeakMonths"
                    value={form.hvacPeakMonths}
                    onChange={handleChange}
                    placeholder="Example: May–September and December–February"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Do you offer maintenance contracts?
                  </label>
                  <select
                    name="hvacMaintenanceContracts"
                    value={form.hvacMaintenanceContracts}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  >
                    <option value="yes">Yes, regularly</option>
                    <option value="no">No</option>
                    <option value="sometimes">Sometimes / occasional</option>
                  </select>
                </div>
              </div>
            )}

            {isPlumbing && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Plumbing specifics</h2>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    What do you focus on the most?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-200 text-sm">
                    {[
                      'Residential plumbing',
                      'Commercial plumbing',
                      'Drain cleaning',
                      'Sewer / main line',
                      'Water heaters',
                      'Bathroom / kitchen renos',
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
                    Do you offer 24/7 emergency service?
                  </label>
                  <select
                    name="plumbingEmergency24_7"
                    value={form.plumbingEmergency24_7}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  >
                    <option value="yes">Yes, 24/7</option>
                    <option value="limited">
                      Limited after-hours / certain days
                    </option>
                    <option value="no">No, regular hours only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Typical response time for emergency calls
                  </label>
                  <input
                    name="plumbingResponseTime"
                    value={form.plumbingResponseTime}
                    onChange={handleChange}
                    placeholder="Example: within 1–2 hours in service area"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>
              </div>
            )}

            {isRoofing && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Roofing specifics</h2>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Roof types you work on (asphalt, metal, flat, etc.)
                  </label>
                  <input
                    name="roofingRoofTypes"
                    value={form.roofingRoofTypes}
                    onChange={handleChange}
                    placeholder="Example: asphalt shingles, metal roofs, flat roofs"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Do you offer emergency / storm-damage service?
                  </label>
                  <select
                    name="roofingEmergencyStorm"
                    value={form.roofingEmergencyStorm}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  >
                    <option value="yes">Yes, emergency storm repair</option>
                    <option value="limited">
                      Limited / only certain situations
                    </option>
                    <option value="no">No, regular hours only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Any limits on building height or roof pitch?
                  </label>
                  <input
                    name="roofingHeightLimits"
                    value={form.roofingHeightLimits}
                    onChange={handleChange}
                    placeholder="Example: up to 2-story residential, no very steep roofs"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>
              </div>
            )}

            {isChimney && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">
                  Chimney / Fireplace specifics
                </h2>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    What chimney / fireplace services do you offer?
                  </label>
                  <input
                    name="chimneyServices"
                    value={form.chimneyServices}
                    onChange={handleChange}
                    placeholder="Example: sweeping, inspections, repairs, relining, stove installs"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Your busiest season (months)
                  </label>
                  <input
                    name="chimneySeason"
                    value={form.chimneySeason}
                    onChange={handleChange}
                    placeholder="Example: September–December"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Do you also install stoves / inserts / liners?
                  </label>
                  <input
                    name="chimneyInstallations"
                    value={form.chimneyInstallations}
                    onChange={handleChange}
                    placeholder="Example: yes, wood stoves & inserts with liners"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>
              </div>
            )}

            {isElectrician && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Electrical specifics</h2>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Types of electrical work you do
                  </label>
                  <input
                    name="electricianWorkTypes"
                    value={form.electricianWorkTypes}
                    onChange={handleChange}
                    placeholder="Example: residential service calls, commercial, panel upgrades, new construction"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Do you offer 24/7 emergency calls?
                  </label>
                  <select
                    name="electricianEmergency24_7"
                    value={form.electricianEmergency24_7}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  >
                    <option value="yes">Yes, 24/7</option>
                    <option value="limited">
                      Limited after-hours / certain days
                    </option>
                    <option value="no">No, regular hours only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Licenses, certifications, or jurisdictions
                  </label>
                  <input
                    name="electricianLicenses"
                    value={form.electricianLicenses}
                    onChange={handleChange}
                    placeholder="Example: Master electrician, licensed in Quebec & Ontario"
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>
              </div>
            )}

            {isOther && (
              <div className="space-y-4 border border-slate-700/70 rounded-2xl p-4 bg-slate-900/60">
                <h2 className="text-lg font-semibold">Other trade specifics</h2>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Describe your trade and main services
                  </label>
                  <textarea
                    name="otherTradeDescription"
                    rows={3}
                    value={form.otherTradeDescription}
                    onChange={handleChange}
                    placeholder="Example: flooring, painting, landscaping, handyman, etc."
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium drop-shadow-sm">
                    Do you handle emergency / urgent jobs?
                  </label>
                  <select
                    name="otherEmergency"
                    value={form.otherEmergency}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
                  >
                    <option value="yes">Yes, urgent jobs</option>
                    <option value="limited">
                      Limited / only certain situations
                    </option>
                    <option value="no">No, regular schedule only</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Preferred Tone for Responses
              </label>
              <select
                name="tone"
                value={form.tone}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl px-4 py-2 text-slate-900 bg-white/95 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60 outline-none"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="fast">Fast &amp; Efficient</option>
              </select>
            </div>

            {/* Summary Email */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Email for Daily Summary (8 AM)
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

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium drop-shadow-sm">
                Upload Your Logo (Optional)
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
              Submit &amp; Start Setup
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
