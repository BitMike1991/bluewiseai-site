import s from './ui.module.css';

export default function Select({
  label,
  children,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? `hub-select-${label.replace(/\s/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={`${s.field} ${className}`}>
      {label && <label className={s.fieldLabel} htmlFor={selectId}>{label}</label>}
      <select id={selectId} className={s.select} {...props}>
        {children}
      </select>
    </div>
  );
}
