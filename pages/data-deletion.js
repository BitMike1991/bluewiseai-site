import Head from "next/head";
import Navbar from "../src/components/Navbar";

export default function DataDeletion() {
  return (
    <>
      <Head>
        <title>Data Deletion | BlueWise</title>
        <meta name="description" content="Request deletion of your data from BlueWise." />
      </Head>
      <Navbar />
      <main className="min-h-screen bg-bg pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-text">
          <h1 className="text-3xl font-bold mb-8">Data Deletion Request</h1>
          <p className="text-sm text-muted mb-8">Last updated: March 13, 2026</p>

          <section className="space-y-6 text-muted leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-text mb-3">Your Right to Deletion</h2>
              <p>Under Quebec privacy law (Law 25) and Meta&apos;s platform policies, you have the right to request the deletion of any personal data we have collected about you, including data received through Facebook Lead Ads.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">How to Request Data Deletion</h2>
              <p className="mb-3">Send your request by email with the subject line &ldquo;Data Deletion Request&rdquo;:</p>
              <div className="bg-surface border border-border rounded-lg p-6">
                <p className="font-semibold text-text mb-2">Email:</p>
                <p><a href="mailto:info@bluewiseai.com?subject=Data%20Deletion%20Request" className="text-primary hover:underline">info@bluewiseai.com</a></p>
                <p className="font-semibold text-text mt-4 mb-2">Include:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your full name</li>
                  <li>Email address associated with your data</li>
                  <li>Phone number (if applicable)</li>
                  <li>Business name (if applicable)</li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">What Happens Next</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>We will confirm receipt of your request within 48 hours</li>
                <li>Your data will be permanently deleted within 30 days</li>
                <li>You will receive confirmation once deletion is complete</li>
                <li>Some data may be retained if required by law (e.g., financial records)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">Facebook Data</h2>
              <p>If your data was collected through a Facebook Lead Ad, we will delete all information received from Meta, including your name, email, phone number, and any form responses. This does not affect data stored by Meta directly — to manage that, visit your <a href="https://www.facebook.com/settings?tab=your_facebook_information" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Facebook Privacy Settings</a>.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-text mb-3">Contact</h2>
              <p>Email: <a href="mailto:info@bluewiseai.com" className="text-primary hover:underline">info@bluewiseai.com</a></p>
              <p>Phone: <a href="tel:+15144184743" className="text-primary hover:underline">(514) 418-4743</a></p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
