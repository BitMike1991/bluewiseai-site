import { useRef, useEffect } from 'react';
import s from './ui.module.css';

export default function Textarea({
  label,
  className = '',
  id,
  ...props
}) {
  const ref = useRef(null);
  const textareaId = id || (label ? `hub-ta-${label.replace(/\s/g, '-').toLowerCase()}` : undefined);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [props.value]);

  return (
    <div className={`${s.field} ${className}`}>
      {label && <label className={s.fieldLabel} htmlFor={textareaId}>{label}</label>}
      <textarea
        ref={ref}
        id={textareaId}
        className={s.textarea}
        rows={3}
        {...props}
      />
    </div>
  );
}
