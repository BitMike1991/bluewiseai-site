import ConsultCTA from '@/components/ConsultCTA';

export default function Portfolio() {
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
        <section className="max-w-4xl mx-auto space-y-12 px-6 sm:px-12">
          {/* Page Title */}
          <h1 className="text-4xl font-heading text-center drop-shadow-md">Portfolio</h1>

          {/* Project 1 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-heading drop-shadow-sm">💼 Job Interview Coach GPT</h2>
            <p className="leading-relaxed drop-shadow-sm">
              A web app that simulates real interview scenarios and delivers personalized feedback on your answers. Built with Next.js, OpenAI GPT-4, and hosted on Vercel.
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>Dynamic question generation based on job title</li>
              <li>In-browser recording & playback of your responses</li>
              <li>Real-time score & improvement tips</li>
            </ul>
            <a
              href="https://www.jobinterviewcoachgpt.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline drop-shadow-sm"
            >
              View Live Demo
            </a>
          </div>

          {/* Project 2 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-heading drop-shadow-sm">📚 On-Demand Story Maker GPT</h2>
            <p className="leading-relaxed drop-shadow-sm">
              A custom GPT that crafts kids’ stories based on your prompts: characters, themes, and settings. Deployed as a private ChatGPT plugin and wrapped in a simple Streamlit front-end.
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>Prompt templates for age & genre tailoring</li>
              <li>Automated PDF export with illustrations</li>
              <li>Easy integration into websites or Slack bots</li>
            </ul>
            <a
              href="https://chatgpt.com/g/g-685d9a9fec988191a649d0478b85dd56-storycraft-ai-custom-short-stories"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline drop-shadow-sm"
            >
              View Project
            </a>
          </div>

          {/* Project 3 */}
          <div className="space-y-2">
            <h2 className="text-2xl font-heading drop-shadow-sm">📆 30-Day Social Media Calendar GPT</h2>
            <p className="leading-relaxed drop-shadow-sm">
              Generates a full month of post ideas and captions for Instagram & TikTok, tailored to your brand voice. Uses OpenAI fine-tuning + LangChain for prompt orchestration.
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>CSV export for scheduling tools</li>
              <li>Tone & hashtag optimization</li>
              <li>Bulk preview & edit mode</li>
            </ul>
            <a
              href="https://chatgpt.com/g/g-685da1abb65c81919f4af829257cbabc-30-day-social-media-content-calendar-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline drop-shadow-sm"
            >
              View Project
            </a>
          </div>

          {/* Coming Soon */}
          <div className="space-y-2">
            <h2 className="text-2xl font-heading drop-shadow-sm">🚀 More to Come…</h2>
            <p className="leading-relaxed drop-shadow-sm">
              I’m continually experimenting with new AI tools—RAG-based assistants, computer vision demos, and data-driven analytics dashboards. Stay tuned!
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8 text-center">
            <ConsultCTA>Book a free consultation</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
