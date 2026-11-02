import Icon from './Icon.jsx';
import { DEVICE_TYPES, statusText } from '../data.js';

export default function DeviceTile({ device, onToggle, onOpen }) {
  const t = DEVICE_TYPES[device.type];
  const icon = device.type === 'lock' && !device.on ? 'lock_open' : t.icon;
  const style = device.type === 'light' && device.on ? { '--accent': device.color } : undefined;
  return (
    <div className={`tile ${device.on ? 'on' : ''} t-${device.type}`} style={style}>
      <button className="tile-icon" onClick={() => onToggle(device.id)} aria-label={`Toggle ${device.name}`}>
        <Icon name={icon} fill={device.on} />
      </button>
      <button className="tile-body" onClick={() => onOpen(device.id)}>
        <span className="tile-name">{device.name}</span>
        <span className="tile-status">{statusText(device)}</span>
      </button>
    </div>
  );
}
