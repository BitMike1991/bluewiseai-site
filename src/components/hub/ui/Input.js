import s from './ui.module.css';

export default function Input({
  label,
  suffix,
  type = 'text',
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? `hub-input-${label.replace(/\s/g, '-').toLowerCase()}` : undefined);

  return (
    <div className={`${s.field} ${className}`}>
      {label && <label className={s.fieldLabel} htmlFor={inputId}>{label}</label>}
      <div className={s.inputWrap}>
        <input
          id={inputId}
          type={type}
          className={`${s.input} ${suffix ? s.inputWithSuffix : ''}`}
          {...props}
        />
        {suffix && <span className={s.inputSuffix}>{suffix}</span>}
      </div>
    </div>
  );
}
