import ConsultCTA from '@/components/ConsultCTA';
import { Brain } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-white px-2 py-4">
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
        {/* Hero Section */}
        <section
          className="relative w-full h-96"
          style={{
            backgroundImage: "url('/styles/hero-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-blue-900/50 backdrop-brightness-75" />
          <div className="relative z-10 flex flex-col items-center h-full text-center text-white px-6 py-4">
            <div className="flex items-center space-x-2 mt-6">
              <Brain className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-heading max-w-3xl">
                Smarter workflows. Simpler tools. Powered by AI.
              </h1>
            </div>
            <div className="mt-auto mb-6 space-y-3">
              <p className="text-lg max-w-2xl mx-auto">
                Blue Wise AI designs smart, simple solutions to automate and grow your business.
              </p>
              <ConsultCTA>Book a free consultation</ConsultCTA>
            </div>
          </div>
        </section>

        {/* What I Build Section */}
        <section className="px-8 py-12 space-y-6 bg-white/90 text-dark">
          <h2 className="text-2xl font-heading text-primary">💼 What I Build</h2>
          <p className="text-midgray">
            From idea to automation in just days — I make AI accessible and useful.
          </p>
          <ul className="list-disc list-inside text-midgray space-y-2">
            <li>✅ AI tools tailored to your business</li>
            <li>✅ MVPs ready in a few days, not weeks</li>
            <li>✅ Friendly support from brainstorming to launch</li>
          </ul>
        </section>

        {/* Past Projects Section */}
        <section className="px-8 pb-12 space-y-6 bg-white/90 text-dark">
          <h2 className="text-2xl font-heading text-primary">🧠 Past Projects</h2>
          <ul className="text-midgray space-y-2">
            <li><strong>Job Interview Coach GPT</strong> &ndash; Personalized prep in minutes</li>
            <li><strong>Story Generator GPT</strong> &ndash; Creative content on demand</li>
            <li><strong>Social Media Planner</strong> &ndash; 30-day AI-powered calendars</li>
          </ul>
          <ConsultCTA>Book a free consultation</ConsultCTA>
        </section>
      </div>
    </div>
  );
}
