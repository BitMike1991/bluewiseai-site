import s from './ui.module.css';

const COLOR_MAP = {
  default: s.badgeDefault,
  green: s.badgeGreen,
  red: s.badgeRed,
  yellow: s.badgeYellow,
  blue: s.badgeBlue,
  royalty: s.badgeRoyalty,
  touchette: s.badgeTouchette,
};

export default function Badge({ children, color = 'default', className = '' }) {
  return (
    <span className={`${s.badge} ${COLOR_MAP[color] || s.badgeDefault} ${className}`}>
      {children}
    </span>
  );
}
