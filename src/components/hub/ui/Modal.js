import { useEffect, useCallback } from 'react';
import s from './ui.module.css';

export default function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  className = '',
}) {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div
        className={`${s.modal} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-modal-title"
      >
        {title && (
          <div className={s.modalHeader}>
            <h3 id="hub-modal-title" className={s.modalTitle}>{title}</h3>
            <button className={s.modalClose} onClick={onClose}>×</button>
          </div>
        )}
        <div className={s.modalBody}>{children}</div>
        {actions && <div className={s.modalActions}>{actions}</div>}
      </div>
    </div>
  );
}
