import ConsultCTA from '@/components/ConsultCTA';
import { Brain } from 'lucide-react';

export default function Home() {
  return (
    // Thin white frame: 2px on left/right, 1rem top/bottom
    <div className="bg-white px-2 py-4">
      
      {/* Content area: wider max width so it stretches more */}
      <div
        className="
          relative
          w-full
          max-w-5xl
          mx-auto
          bg-[url('/styles/fullpage-bg.png')]
          bg-cover bg-center
          rounded-lg
          overflow-hidden
          shadow-lg
        "
      >
        <div className="backdrop-brightness-110 min-h-screen">

          {/* Hero */}
          <section
            className="relative w-full h-96"
            style={{
              backgroundImage: "url('/styles/hero-bg.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-blue-900/40" />
            <div className="relative z-10 flex flex-col items-center h-full text-center text-white px-6 py-4">
              
              {/* Top */}
              <div className="flex items-center space-x-2 mt-4">
                <Brain className="w-10 h-10 text-primary" />
                <h1 className="text-4xl font-heading">
                  Smarter Workflows. Simpler Tools. Powered by AI.
                </h1>
              </div>

              {/* Bottom */}
              <div className="mt-auto mb-4 space-y-2">
                <p className="text-lg max-w-3xl mx-auto">
                  Blue Wise AI builds smart, simple solutions to automate and grow your business.
                </p>
                <ConsultCTA>Book a free consultation</ConsultCTA>
              </div>
            </div>
          </section>

          {/* What I Build */}
          <section className="px-8 py-12 space-y-6">
            <h2 className="text-2xl font-heading text-primary">💼 What I Build</h2>
            <p className="text-midgray">
              From idea to automation in days — I make AI accessible and useful.
            </p>
            <ul className="list-disc list-inside text-midgray space-y-2">
              <li>✅ AI-powered tools tailored to your business</li>
              <li>✅ MVPs ready in just days, not weeks</li>
              <li>✅ Friendly guidance from brainstorm to launch</li>
            </ul>
          </section>

          {/* Past Projects */}
          <section className="px-8 pb-12 space-y-6">
            <h2 className="text-2xl font-heading text-primary">🧠 Past Projects</h2>
            <ul className="text-midgray space-y-2">
              <li><strong>Job Interview Coach GPT</strong> – Personalized prep in minutes</li>
              <li><strong>Story Generator GPT</strong> – Creative content on demand</li>
              <li><strong>Social Media Planner</strong> – 30-day AI-powered calendars</li>
            </ul>
            <ConsultCTA>Book a free consultation</ConsultCTA>
          </section>

        </div>
      </div>
    </div>
  );
}
