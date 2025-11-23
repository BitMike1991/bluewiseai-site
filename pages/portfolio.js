import ConsultCTA from "@/components/ConsultCTA";

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
        <section
          className="
            max-w-5xl mx-auto space-y-12 px-6 sm:px-12 py-10
            rounded-3xl
            bg-slate-950/80
            border border-white/10
            backdrop-blur-md
            shadow-[0_0_45px_rgba(15,23,42,0.9)]
          "
        >
          {/* Page Title + Intro */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading drop-shadow-md">📁Portfolio</h1>
            <p className="text-lg text-slate-100 drop-shadow-sm">
              A few of the AI tools and automations I&apos;ve built — from
              interview prep and content systems to custom GPTs. Each project
              started from a real problem and ended with a workflow that saves
              time every week.
            </p>
          </div>

          {/* Projects Grid */}
          <div className="space-y-8">
            {/* Project 1 */}
            <article
              className="
                rounded-2xl p-6 md:p-7
                bg-slate-900/80
                border border-slate-700/70
                shadow-[0_0_30px_rgba(15,23,42,0.9)]
                hover:shadow-[0_0_40px_rgba(37,99,235,0.7)]
                hover:border-blue-500/70
                transition-all duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <h2 className="text-2xl font-heading drop-shadow-sm">
                  💼 Job Interview Coach GPT
                </h2>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-300">
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    Next.js · Vercel
                  </span>
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    GPT-4 · Web App
                  </span>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-3">
                A web app that simulates real interview scenarios and delivers
                personalized feedback on your answers. Built with Next.js,
                OpenAI GPT-4, and hosted on Vercel.
              </p>

              <ul className="list-disc list-inside drop-shadow-sm space-y-1 text-slate-100 mb-4">
                <li>Dynamic question generation based on job title.</li>
                <li>In-browser recording &amp; playback of your responses.</li>
                <li>Real-time score &amp; concrete improvement tips.</li>
              </ul>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-slate-300 drop-shadow-sm">
                  <span className="font-semibold text-blue-300">
                    Outcome:
                  </span>{" "}
                  A safe environment to practice high-pressure interviews like
                  the real thing.
                </p>
                <a
                  href="https://www.jobinterviewcoachgpt.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-300 hover:text-blue-200
                    text-sm font-medium
                    hover:underline
                  "
                >
                  View live demo →
                </a>
              </div>
            </article>

            {/* Project 2 */}
            <article
              className="
                rounded-2xl p-6 md:p-7
                bg-slate-900/80
                border border-slate-700/70
                shadow-[0_0_30px_rgba(15,23,42,0.9)]
                hover:shadow-[0_0_40px_rgba(37,99,235,0.7)]
                hover:border-blue-500/70
                transition-all duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <h2 className="text-2xl font-heading drop-shadow-sm">
                  📚 On-Demand Story Maker GPT
                </h2>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-300">
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    Custom GPT
                  </span>
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    Streamlit Front-End
                  </span>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-3">
                A custom GPT that crafts kids&apos; stories based on your prompts:
                characters, themes, settings, and style. Deployed as a private
                ChatGPT experience and wrapped in a simple Streamlit front-end.
              </p>

              <ul className="list-disc list-inside drop-shadow-sm space-y-1 text-slate-100 mb-4">
                <li>Prompt presets for age, genre, and tone.</li>
                <li>Automated PDF export with illustrations.</li>
                <li>Can be embedded into websites, client portals, or Slack bots.</li>
              </ul>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-slate-300 drop-shadow-sm">
                  <span className="font-semibold text-blue-300">
                    Outcome:
                  </span>{" "}
                  A fast way to generate on-brand, custom stories for kids or
                  educational content.
                </p>
                <a
                  href="https://chatgpt.com/g/g-685d9a9fec988191a649d0478b85dd56-storycraft-ai-custom-short-stories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-300 hover:text-blue-200
                    text-sm font-medium
                    hover:underline
                  "
                >
                  View project →
                </a>
              </div>
            </article>

            {/* Project 3 */}
            <article
              className="
                rounded-2xl p-6 md:p-7
                bg-slate-900/80
                border border-slate-700/70
                shadow-[0_0_30px_rgba(15,23,42,0.9)]
                hover:shadow-[0_0_40px_rgba(37,99,235,0.7)]
                hover:border-blue-500/70
                transition-all duration-300
                hover:-translate-y-1
              "
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <h2 className="text-2xl font-heading drop-shadow-sm">
                  📆 30-Day Social Media Calendar GPT
                </h2>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-slate-300">
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    LangChain · GPT
                  </span>
                  <span className="rounded-full border border-slate-600 px-3 py-1">
                    Content System
                  </span>
                </div>
              </div>

              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-3">
                Generates a full month of post ideas and captions for Instagram
                &amp; TikTok, tailored to your brand voice. Uses GPT with
                structured prompting and a reusable content framework.
              </p>

              <ul className="list-disc list-inside drop-shadow-sm space-y-1 text-slate-100 mb-4">
                <li>CSV export ready for scheduling tools.</li>
                <li>Tone, hooks, and hashtag suggestions.</li>
                <li>Bulk preview and edit flow before publishing.</li>
              </ul>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-slate-300 drop-shadow-sm">
                  <span className="font-semibold text-blue-300">
                    Outcome:
                  </span>{" "}
                  No more staring at a blank screen when it&apos;s time to post.
                  The month is mapped out in one shot.
                </p>
                <a
                  href="https://chatgpt.com/g/g-685da1abb65c81919f4af829257cbabc-30-day-social-media-content-calendar-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-1
                    text-blue-300 hover:text-blue-200
                    text-sm font-medium
                    hover:underline
                  "
                >
                  View project →
                </a>
              </div>
            </article>

            {/* Coming Soon */}
            <article
              className="
                rounded-2xl p-6 md:p-7
                bg-slate-950/80
                border border-dashed border-slate-600
                shadow-[0_0_26px_rgba(15,23,42,0.9)]
              "
            >
              <h2 className="text-2xl font-heading drop-shadow-sm mb-2">
                🚀 More to come…
              </h2>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm mb-2">
                I&apos;m continually experimenting with new AI tools — RAG-based
                assistants, internal bots for small businesses, computer vision
                demos, and analytics dashboards.
              </p>
              <p className="leading-relaxed text-slate-100 drop-shadow-sm">
                If you have a workflow you&apos;d love to automate or a tool you&apos;d
                like to bring to life, we can turn it into the next case study
                on this page.
              </p>
            </article>
          </div>

          {/* CTA */}
          <div className="pt-4 text-center space-y-3">
            <p className="text-slate-100 drop-shadow-sm">
              Want to build something similar — or completely new — for your
              own business?
            </p>
            <ConsultCTA>Book a free consultation</ConsultCTA>
          </div>
        </section>
      </div>
    </div>
  );
}
