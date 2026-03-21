// src/components/dashboard/SuspendedScreen.js
import { AlertTriangle, Mail, Phone, RefreshCw } from "lucide-react";

export default function SuspendedScreen() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Warning icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Account Suspended</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your platform access has been temporarily suspended due to an outstanding balance.
            Please complete your payment to restore full access immediately.
          </p>
        </div>

        {/* Payment instructions */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-left space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Payment Instructions — Interac e-Transfer
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Send to</div>
                <div className="text-sm text-slate-200 font-medium">mikael@bluewiseai.com</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Security question</div>
                <div className="text-sm text-slate-200 font-medium">Quel type de service?</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Answer</div>
                <div className="text-sm text-slate-200 font-medium">plus</div>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          I paid — refresh access
        </button>

        {/* Contact */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Phone className="w-3 h-3" />
          <span>Need help? Contact support at mikael@bluewiseai.com</span>
        </div>
      </div>
    </div>
  );
}
