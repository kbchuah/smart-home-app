import Icon from './Icon.jsx';

export default function Stepper({ steps, step, label = 'Progress' }) {
  return (
    <ol className="stepper-bar" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s} className={i < step ? 'done' : i === step ? 'current' : ''}>
          <span>{i < step ? <Icon name="check" /> : i + 1}</span>{s}
        </li>
      ))}
    </ol>
  );
}
