import s from './ui.module.css';

export default function Card({
  icon,
  title,
  description,
  badge,
  active = false,
  onClick,
  className = '',
  children,
}) {
  return (
    <button
      type="button"
      className={`${s.card} ${active ? s.cardActive : ''} ${className}`}
      onClick={onClick}
    >
      {badge && <span className={s.cardBadge}>{badge}</span>}
      {icon && <span className={s.cardIcon} aria-hidden="true">{icon}</span>}
      {title && <span className={s.cardTitle}>{title}</span>}
      {description && <span className={s.cardDesc}>{description}</span>}
      {children}
    </button>
  );
}
