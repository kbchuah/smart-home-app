import { useState } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';

export default function RoomManager({ rooms, devices, dispatch, onClose }) {
  const [newName, setNewName] = useState('');
  const add = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    dispatch({ type: 'addRoom', name: newName.trim() });
    setNewName('');
  };
  return (
    <Modal title="Rooms" onClose={onClose}>
      <ul className="room-list">
        {rooms.map((r) => {
          const count = devices.filter((d) => d.roomId === r.id).length;
          return (
            <li key={r.id}>
              <Icon name="meeting_room" />
              <input value={r.name} aria-label="Room name"
                onChange={(e) => dispatch({ type: 'renameRoom', id: r.id, name: e.target.value })} />
              <small>{count} device{count === 1 ? '' : 's'}</small>
              <button className="icon-btn" disabled={rooms.length <= 1} title="Delete room (devices move to another room)"
                onClick={() => dispatch({ type: 'removeRoom', id: r.id })} aria-label={`Delete ${r.name}`}>
                <Icon name="delete" />
              </button>
            </li>
          );
        })}
      </ul>
      <form className="room-add" onSubmit={add}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New room name" />
        <button className="btn primary" disabled={!newName.trim()}><Icon name="add" /> Add room</button>
      </form>
      <button className="btn subtle reset" onClick={() => { if (confirm('Reset the demo home to its defaults?')) { dispatch({ type: 'reset' }); onClose(); } }}>
        <Icon name="restart_alt" /> Reset demo data
      </button>
    </Modal>
  );
}
