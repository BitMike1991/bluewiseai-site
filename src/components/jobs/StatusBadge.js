// src/components/jobs/StatusBadge.js
// Reusable status badge using STATUS_META colors.
// Never crashes on unknown status — falls back gracefully.

import { getStatusMeta } from '../../../lib/status-config';

/**
 * @param {{ status: string, size?: 'sm' | 'md' | 'lg' }} props
 */
export default function StatusBadge({ status, size = 'sm' }) {
  const meta = getStatusMeta(status);

  const padCls = size === 'lg'
    ? 'px-3 py-1 text-sm font-semibold'
    : size === 'md'
    ? 'px-2.5 py-0.5 text-xs font-medium'
    : 'px-2 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${padCls}`}
      style={{
        color: meta.color,
        backgroundColor: meta.bg,
        borderColor: meta.color + '55',
      }}
    >
      {meta.label}
    </span>
  );
}
