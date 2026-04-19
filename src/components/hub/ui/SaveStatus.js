import s from './ui.module.css';

const STATUS_MAP = {
  saved: { text: 'Sauvegardé ✓', cls: s.saveStatusSaved },
  saving: { text: 'Sauvegarde...', cls: s.saveStatusSaving },
  error: { text: '⚠ Erreur', cls: s.saveStatusError },
  idle: { text: '', cls: '' },
};

export default function SaveStatus({ status = 'idle', className = '' }) {
  const info = STATUS_MAP[status] || STATUS_MAP.idle;
  if (!info.text) return null;

  return (
    <span className={`${s.saveStatus} ${info.cls} ${className}`}>
      {info.text}
    </span>
  );
}
