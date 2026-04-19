import s from './ui.module.css';

export default function StepIndicator({ steps, current, onStepClick, className = '' }) {
  return (
    <div className={`${s.steps} ${className}`}>
      {steps.map((label, i) => (
        <button
          key={i}
          type="button"
          className={[
            s.step,
            i === current ? s.stepActive : '',
            i < current ? s.stepDone : '',
          ].filter(Boolean).join(' ')}
          onClick={() => onStepClick?.(i)}
        >
          <span className={s.stepNum}>{i < current ? '✓' : i + 1}</span>
          <span className={s.stepLabel}>{label}</span>
        </button>
      ))}
    </div>
  );
}
