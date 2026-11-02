import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { LIGHT_COLORS, statusText } from '../data.js';

function Slider({ label, value, min = 0, max = 100, step = 1, unit = '%', onChange, disabled }) {
  return (
    <label className={`slider ${disabled ? 'disabled' : ''}`}>
      <span className="slider-head"><span>{label}</span><b>{value}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--pct': `${((value - min) / (max - min)) * 100}%` }} />
    </label>
  );
}

function PowerButton({ on, onClick, labels = ['Off', 'On'] }) {
  return (
    <button className={`power ${on ? 'on' : ''}`} onClick={onClick}>
      <Icon name="power_settings_new" /> {on ? labels[1] : labels[0]}
    </button>
  );
}

function CameraFeed({ on }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className={`camera ${on ? 'live' : ''}`}>
      {on ? (<>
        <div className="cam-scene"><div className="cam-door" /><div className="cam-path" /></div>
        <span className="cam-badge"><i /> LIVE</span>
        <span className="cam-time">{now.toLocaleTimeString()}</span>
      </>) : <span className="cam-off"><Icon name="videocam_off" /> Camera is off</span>}
    </div>
  );
}

export default function DeviceControls({ device: d, update }) {
  const set = (patch) => update(d.id, patch);
  const toggle = () => set({ on: !d.on });

  switch (d.type) {
    case 'light':
      return (
        <div className="controls">
          <div className="bulb" style={{ '--c': d.color, '--b': d.on ? d.brightness / 100 : 0 }}>
            <Icon name="lightbulb" fill={d.on} />
          </div>
          <PowerButton on={d.on} onClick={toggle} />
          <Slider label="Brightness" value={d.brightness} min={1} onChange={(v) => set({ brightness: v, on: true })} />
          <div className="field-label">Color</div>
          <div className="swatches">
            {LIGHT_COLORS.map((c) => (
              <button key={c} className={`swatch ${d.color === c ? 'sel' : ''}`} style={{ background: c }}
                onClick={() => set({ color: c, on: true })} aria-label={`Color ${c}`} />
            ))}
          </div>
        </div>
      );
    case 'thermostat':
      return (
        <div className="controls">
          <div className={`dial ${d.on ? d.mode : 'off'}`}>
            <span className="dial-label">{d.on ? (d.mode === 'heat' ? 'Heat to' : 'Cool to') : 'Off'}</span>
            <span className="dial-temp">{d.target}°</span>
            <span className="dial-label">Indoor {d.current.toFixed(1)}°</span>
          </div>
          <div className="stepper">
            <button className="icon-btn big" onClick={() => set({ target: Math.max(10, d.target - 0.5) })} aria-label="Lower"><Icon name="remove" /></button>
            <button className="icon-btn big" onClick={() => set({ target: Math.min(30, d.target + 0.5) })} aria-label="Raise"><Icon name="add" /></button>
          </div>
          <div className="segmented">
            {[['off', 'Off', 'power_settings_new'], ['heat', 'Heat', 'local_fire_department'], ['cool', 'Cool', 'ac_unit']].map(([m, l, i]) => {
              const active = m === 'off' ? !d.on : d.on && d.mode === m;
              return (
                <button key={m} className={active ? 'active' : ''}
                  onClick={() => set(m === 'off' ? { on: false } : { on: true, mode: m })}>
                  <Icon name={i} /> {l}
                </button>
              );
            })}
          </div>
        </div>
      );
    case 'speaker':
    case 'tv':
      return (
        <div className="controls">
          <div className="media">
            <Icon name={d.type === 'tv' ? 'tv' : 'music_note'} fill />
            <div>
              <b>{d.type === 'tv' ? (d.on ? `Watching on ${d.input}` : 'TV is off') : (d.on ? d.track : 'Nothing playing')}</b>
              <small>{statusText(d)}</small>
            </div>
          </div>
          <PowerButton on={d.on} onClick={toggle} labels={d.type === 'tv' ? ['Off', 'On'] : ['Paused', 'Playing']} />
          <Slider label="Volume" value={d.volume} onChange={(v) => set({ volume: v })} disabled={!d.on} />
          {d.type === 'tv' && (
            <div className="segmented">
              {['HDMI 1', 'HDMI 2', 'Live TV'].map((i) => (
                <button key={i} className={d.input === i ? 'active' : ''} onClick={() => set({ input: i, on: true })}>{i}</button>
              ))}
            </div>
          )}
        </div>
      );
    case 'fan':
      return (
        <div className="controls">
          <div className={`fan-icon ${d.on ? 'spin' : ''}`} style={{ '--speed': `${1.6 / d.speed}s` }}><Icon name="mode_fan" /></div>
          <PowerButton on={d.on} onClick={toggle} />
          <div className="segmented">
            {[1, 2, 3].map((s) => (
              <button key={s} className={d.on && d.speed === s ? 'active' : ''} onClick={() => set({ speed: s, on: true })}>Speed {s}</button>
            ))}
          </div>
        </div>
      );
    case 'lock':
      return (
        <div className="controls">
          <button className={`lock-btn ${d.on ? 'locked' : ''}`} onClick={toggle}>
            <Icon name={d.on ? 'lock' : 'lock_open'} fill />
            <span>{d.on ? 'Locked' : 'Unlocked'}</span>
            <small>Tap to {d.on ? 'unlock' : 'lock'}</small>
          </button>
        </div>
      );
    case 'camera':
      return (
        <div className="controls">
          <CameraFeed on={d.on} />
          <PowerButton on={d.on} onClick={toggle} />
        </div>
      );
    default:
      return (
        <div className="controls">
          <div className={`plug-icon ${d.on ? 'on' : ''}`}><Icon name="power" fill={d.on} /></div>
          <PowerButton on={d.on} onClick={toggle} />
        </div>
      );
  }
}
