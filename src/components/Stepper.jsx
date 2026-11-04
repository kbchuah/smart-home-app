import Icon from './Icon.jsx';

// Each step has its own colour (current step dot); completed steps are sage.
const STEP_TONE = {
  Account: 'blue', Permissions: 'plum', Profile: 'sage', Plan: 'honey',
  Device: 'plum', 'Wi-Fi': 'blue', Room: 'sage', Price: 'honey', Verify: 'blue', Payment: 'plum', Done: 'sage',
};

export default function Stepper({ steps, step, label = 'Progress' }) {
  return (
    <ol className="stepper-bar" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s} className={`tone-${STEP_TONE[s] ?? 'sage'} ${i < step ? 'done' : i === step ? 'current' : ''}`}>
          <span>{i < step ? <Icon name="check" /> : i + 1}</span>{s}
        </li>
      ))}
    </ol>
  );
}
