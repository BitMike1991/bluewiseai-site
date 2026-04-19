import s from './ui.module.css';

const VARIANT_MAP = {
  primary: s.btnPrimary,
  secondary: s.btnSecondary,
  danger: s.btnDanger,
  success: s.btnSuccess,
};

const SIZE_MAP = {
  sm: s.btnSm,
  md: s.btnMd,
  lg: s.btnLg,
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) {
  const cls = [
    s.btn,
    VARIANT_MAP[variant] || s.btnPrimary,
    SIZE_MAP[size] || s.btnMd,
    fullWidth ? s.btnFull : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
