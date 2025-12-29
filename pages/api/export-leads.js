// Temporary API endpoint to export leads for Slybroadcast campaign
import { getSupabaseServerClient } from '../../lib/supabaseServer';

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: leads, error } = await supabase
      .from('cold_recipients')
      .select('business_name, phone, lead_score, status')
      .eq('status', 'paused')
      .not('phone', 'is', null)
      .neq('phone', '')
      .order('lead_score', { ascending: false })
      .limit(91);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Return as CSV
    let csv = 'Business Name,Phone Number,Lead Score,Status\n';
    leads.forEach(lead => {
      const name = (lead.business_name || '').replace(/"/g, '""');
      csv += `"${name}","${lead.phone}",${lead.lead_score},"${lead.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
