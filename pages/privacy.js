import Head from "next/head";
import Navbar from "../src/components/Navbar";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | BlueWise</title>
        <meta name="description" content="BlueWise privacy policy — how we collect, use, and protect your data." />
      </Head>
      <Navbar />
      <main className="min-h-screen bg-bg pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-text">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-sm text-muted mb-8">Last updated: March 13, 2026</p>

          <section className="space-y-6 text-muted leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-text mb-3">1. Who We Are</h2>
              <p>BlueWise ("we", "our", "us") operates the bluewiseai.com website and the BlueWise AI platform. We provide AI-powered business automation tools for trades and service businesses. Our headquarters are in Montreal, Quebec, Canada.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">2. Information We Collect</h2>
              <p className="mb-2">We collect information you provide directly:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name, email address, phone number</li>
                <li>Business name and industry</li>
                <li>Information submitted through contact forms, lead forms, or Facebook Lead Ads</li>
                <li>Communications you send us (email, SMS, chat)</li>
              </ul>
              <p className="mt-3 mb-2">We collect automatically:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Device and browser information</li>
                <li>IP address and approximate location</li>
                <li>Pages visited and interactions on our website</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To provide and improve our services</li>
                <li>To contact you about our products and services</li>
                <li>To respond to your inquiries</li>
                <li>To send automated SMS messages related to your leads and business operations</li>
                <li>To process payments and manage subscriptions</li>
                <li>To comply with legal obligations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">4. Data Sharing</h2>
              <p>We do not sell your personal information. We may share data with:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Service providers who help us operate (Supabase, Stripe, Vercel, Telnyx, Meta)</li>
                <li>Law enforcement when required by law</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">5. Data Retention</h2>
              <p>We retain your data for as long as your account is active or as needed to provide services. You may request deletion at any time by contacting us.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">6. Your Rights</h2>
              <p>Under Quebec privacy law (Law 25) and applicable Canadian legislation, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for data processing</li>
                <li>File a complaint with the Commission d&apos;accès à l&apos;information du Québec</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">7. Data Security</h2>
              <p>We use industry-standard security measures including encryption, secure servers, and access controls to protect your data.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">8. Cookies</h2>
              <p>We use cookies to improve your experience on our website. You can disable cookies in your browser settings, though some features may not function properly.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">9. Contact Us</h2>
              <p>For any privacy-related questions or requests:</p>
              <p className="mt-2">Email: <a href="mailto:info@bluewiseai.com" className="text-primary hover:underline">info@bluewiseai.com</a></p>
              <p>Phone: <a href="tel:+15144184743" className="text-primary hover:underline">(514) 418-4743</a></p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
