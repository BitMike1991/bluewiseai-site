import Head from "next/head";
import Navbar from "../src/components/Navbar";

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | BlueWise</title>
        <meta name="description" content="BlueWise terms of service — conditions governing use of our platform." />
      </Head>
      <Navbar />
      <main className="min-h-screen bg-bg pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-text">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          <p className="text-sm text-muted mb-8">Last updated: March 13, 2026</p>

          <section className="space-y-6 text-muted leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-text mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using the BlueWise platform and website (bluewiseai.com), you agree to be bound by these Terms of Service. If you do not agree, do not use our services.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">2. Description of Services</h2>
              <p>BlueWise provides AI-powered business automation tools for trades and service businesses, including but not limited to: lead management, automated SMS, voice AI, CRM, invoicing, and marketing automation.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">3. Account Registration</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must be at least 18 years old to use our services</li>
                <li>One account per business unless otherwise agreed</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">4. Subscription and Payments</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Paid plans are billed monthly or annually as selected</li>
                <li>All prices are in Canadian dollars (CAD) unless otherwise stated</li>
                <li>Applicable taxes (TPS/TVQ) will be added to all invoices</li>
                <li>You may cancel your subscription at any time; access continues until the end of the billing period</li>
                <li>Refunds are handled on a case-by-case basis</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">5. Acceptable Use</h2>
              <p className="mb-2">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use our platform to send spam or unsolicited messages</li>
                <li>Violate any applicable laws, including CASL (Canada&apos;s Anti-Spam Legislation)</li>
                <li>Attempt to access other users&apos; data or accounts</li>
                <li>Reverse engineer, copy, or redistribute our software</li>
                <li>Use the platform for any illegal or fraudulent activity</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">6. Data Ownership</h2>
              <p>You retain ownership of all data you upload to BlueWise. We do not claim ownership of your business data, leads, or content. See our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for details on how we handle your data.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">7. Service Availability</h2>
              <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. We are not liable for downtime caused by maintenance, third-party providers, or circumstances beyond our control.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">8. Limitation of Liability</h2>
              <p>BlueWise is not liable for any indirect, incidental, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">9. Termination</h2>
              <p>We may suspend or terminate your account if you violate these terms. Upon termination, your data will be retained for 30 days, after which it may be permanently deleted.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">10. Governing Law</h2>
              <p>These terms are governed by the laws of the Province of Quebec and the federal laws of Canada applicable therein. Any disputes shall be resolved in the courts of Montreal, Quebec.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">11. Changes to Terms</h2>
              <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance. We will notify users of significant changes by email.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">12. Contact</h2>
              <p>Email: <a href="mailto:info@bluewiseai.com" className="text-primary hover:underline">info@bluewiseai.com</a></p>
              <p>Phone: <a href="tel:+15144184743" className="text-primary hover:underline">(514) 418-4743</a></p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
