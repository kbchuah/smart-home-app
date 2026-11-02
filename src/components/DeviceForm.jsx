import { useState } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
import { DEVICE_TYPES } from '../data.js';

export default function DeviceForm({ device, rooms, defaultRoom, onSave, onDelete, onClose }) {
  const editing = Boolean(device);
  const [name, setName] = useState(device?.name ?? '');
  const [type, setType] = useState(device?.type ?? 'light');
  const [roomId, setRoomId] = useState(device?.roomId ?? defaultRoom ?? rooms[0]?.id);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomId) return;
    onSave({ name: name.trim(), type, roomId });
  };

  return (
    <Modal title={editing ? 'Edit device' : 'Add device'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Name</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Desk Lamp" />
        </label>
        {!editing && (
          <div className="field">
            <span>Type</span>
            <div className="type-grid">
              {Object.entries(DEVICE_TYPES).map(([k, t]) => (
                <button type="button" key={k} className={type === k ? 'sel' : ''} onClick={() => setType(k)}>
                  <Icon name={t.icon} fill={type === k} /> {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="field">
          <span>Room</span>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <div className="form-actions">
          {editing && <button type="button" className="btn danger" onClick={onDelete}><Icon name="delete" /> Remove</button>}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={!name.trim() || !roomId}>{editing ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  );
}
