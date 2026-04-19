import s from './ui.module.css';

export default function TopBar({ left, center, right, className = '' }) {
  return (
    <div className={`${s.topbar} ${className}`}>
      <div className={s.topbarLeft}>{left}</div>
      {center && <div className={s.topbarCenter}>{center}</div>}
      <div className={s.topbarRight}>{right}</div>
    </div>
  );
}
