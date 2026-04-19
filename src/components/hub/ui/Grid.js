import s from './ui.module.css';

const COL_MAP = {
  2: s.grid2,
  3: s.grid3,
  4: s.grid4,
};

export default function Grid({ cols = 3, gap = '16px', children, className = '' }) {
  return (
    <div
      className={`${s.grid} ${COL_MAP[cols] || s.grid3} ${className}`}
      style={{ gap }}
    >
      {children}
    </div>
  );
}
