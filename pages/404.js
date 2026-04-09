import Link from "next/link";

export default function Custom404() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-content center">
      <div className="max-w-md mx-auto text-center px-6">
        {/* Glowing 404 */}
        <h1
          className="text-[120px] font-extrabold leading-none tracking-tighter"
          style={{
            background: "linear-gradient(135deg, #6c63ff, #00d4aa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>

        <p className="text-d-txt text-lg font-semibold mt-4">
          Cette page n&apos;existe pas
        </p>
        <p className="text-d-txt2 text-sm mt-2">
          Le lien est peut-être expiré ou la page a été déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6c63ff, #00d4aa)" }}
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl font-semibold text-sm text-d-txt2 border border-d-border hover:border-d-accent transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}
