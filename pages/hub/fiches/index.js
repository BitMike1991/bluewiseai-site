// pages/hub/fiches/index.js
// Stub page — real implementation in P11 (migration from pur-construction-site)
import DashboardLayout from "../../../src/components/dashboard/DashboardLayout";
import { FileText, ExternalLink } from "lucide-react";

const TOOL_ID = "fiches";

export default function FichesStub() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--d-surface)" }}>
            <FileText size={24} style={{ color: "var(--d-primary)" }} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "var(--d-text)" }}>
              Fiches techniques
            </h1>
            <p className="text-sm" style={{ color: "var(--d-muted)" }}>
              Outil en cours de migration vers la plateforme unifiée
            </p>
          </div>
        </div>

        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: "var(--d-surface)", borderColor: "var(--d-border)" }}
        >
          <p className="mb-3" style={{ color: "var(--d-text)" }}>
            Les fiches techniques sont actuellement sur{" "}
            <strong>hub.purconstruction.com</strong>.
          </p>
          <p className="mb-5" style={{ color: "var(--d-muted)" }}>
            La migration vers cette plateforme arrive en P11. En attendant, continuez
            d&apos;utiliser le hub existant.
          </p>
          <a
            href="https://hub.purconstruction.com/hub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
            style={{ color: "var(--d-primary)" }}
          >
            Ouvrir le hub PÜR
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const { getAuthContext } = await import("../../../lib/supabaseServer");
  const { supabase, customerId, user } = await getAuthContext(
    context.req,
    context.res
  );

  if (!user || !customerId) {
    return { redirect: { destination: "/platform/login", permanent: false } };
  }

  const { data } = await supabase
    .from("customers")
    .select("enabled_hub_tools")
    .eq("id", customerId)
    .single();

  const tools = Array.isArray(data?.enabled_hub_tools) ? data.enabled_hub_tools : [];

  if (!tools.includes(TOOL_ID)) {
    return { redirect: { destination: "/platform/overview", permanent: false } };
  }

  return { props: {} };
}
