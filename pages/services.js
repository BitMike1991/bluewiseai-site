import ConsultCTA from '@/components/ConsultCTA';

export default function Services() {
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
          <h1 className="text-4xl font-heading text-center drop-shadow-md">Services</h1>

          {/* Custom AI */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>🔧</span>
              <span>Custom AI & GPT Development</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Whether you need a streamlined chatbot, a specialized GPT for content generation, or a full-featured AI assistant, I build custom solutions tailored exactly to your needs:
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>Requirement gathering & prototyping</li>
              <li>Prompt design, fine-tuning, and instruction engineering</li>
              <li>API integration (OpenAI, Azure, Hugging Face, etc.)</li>
              <li>Deployment & hosting on Streamlit, Vercel, Heroku, or your stack</li>
            </ul>
          </div>

          {/* Prompt Engineering */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>⚙️</span>
              <span>Prompt Engineering & Optimization</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Get the most out of your LLM budget with prompts that are precise, efficient, and aligned with your goals. I&rsquo;ll audit your existing prompts, optimize for cost and quality, and document best practices.
            </p>
          </div>

          {/* Workflow Automation */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>🤖</span>
              <span>AI Workflow Automation</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Automate repetitive tasks, reports, and data pipelines so you can focus on what matters. From no-code Zapier/Maker workflows to fully custom Python scripts and RAG-powered systems, I&rsquo;ll help you:
            </p>
            <ul className="list-disc list-inside drop-shadow-sm space-y-1">
              <li>Identify high-ROI automation opportunities</li>
              <li>Design & implement end-to-end workflows</li>
              <li>Integrate with your existing tools (Slack, Notion, Google Sheets, etc.)</li>
            </ul>
          </div>

          {/* Consulting */}
          <div className="space-y-4">
            <h2 className="text-2xl font-heading flex items-center space-x-2 drop-shadow-sm">
              <span>📈</span>
              <span>AI Consulting & Strategy</span>
            </h2>
            <p className="leading-relaxed drop-shadow-sm">
              Not sure where to start? I offer one-on-one strategy sessions to map out your AI roadmap—from quick wins to long-term, scalable solutions.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-8 text-center space-y-2">
            <h3 className="text-xl font-heading drop-shadow-sm">Ready to get started?</h3>
            <p className="drop-shadow-sm">
              Let&rsquo;s talk through your project and find the perfect AI solution to drive real results.
            </p>
            <ConsultCTA>Book a free consultation</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
