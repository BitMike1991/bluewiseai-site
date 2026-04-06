// src/components/dashboard/SuspendedScreen.js
import { AlertTriangle, Mail, Phone, RefreshCw } from "lucide-react";
import { useBranding } from "./BrandingContext";

export default function SuspendedScreen() {
  const { branding } = useBranding();

  const supportEmail = branding.support_email || "mikael@bluewiseai.com";
  const interacEmail = branding.billing_email || supportEmail;
  const interacQuestion = branding.interac_question || null;
  const interacAnswer = branding.interac_answer || null;
  const companyName = branding.company_name || "BlueWise AI";

  return (
    <div className="flex h-screen bg-d-bg text-d-text items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Warning icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-red-500 mb-2">Account Suspended</h1>
          <p className="text-d-muted text-sm leading-relaxed">
            Your platform access has been temporarily suspended due to an outstanding balance.
            Please complete your payment to restore full access immediately.
          </p>
        </div>

        {/* Payment instructions */}
        <div className="bg-d-surface/60 border border-d-border rounded-xl p-6 text-left space-y-4">
          <h2 className="text-sm font-semibold text-d-text uppercase tracking-wider">
            Payment Instructions — Interac e-Transfer
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-d-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-d-muted">Send to</div>
                <div className="text-sm text-d-text font-medium">{interacEmail}</div>
              </div>
            </div>
            {interacQuestion && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-d-muted">Security question</div>
                  <div className="text-sm text-d-text font-medium">{interacQuestion}</div>
                </div>
              </div>
            )}
            {interacAnswer && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-d-muted">Answer</div>
                  <div className="text-sm text-d-text font-medium">{interacAnswer}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-d-primary hover:bg-d-primary/80 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          I paid — refresh access
        </button>

        {/* Contact */}
        <div className="flex items-center justify-center gap-2 text-xs text-d-muted">
          <Phone className="w-3 h-3" />
          <span>Need help? Contact {companyName} support at {supportEmail}</span>
        </div>
      </div>
    </div>
  );
}
