import React, { useState } from 'react';

export default function SessionControls({ listenerCount, onEnd }) {
  // Local state — just for the confirm dialog
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="session-controls">

      {/* Listener count — updates live as phones join/leave */}
      <div className="listener-count">
        <span className="listener-number">{listenerCount}</span>
        <span className="listener-label">
          {listenerCount === 1 ? 'person' : 'people'} following along
        </span>
      </div>

      {/* Two-step end: button → confirm dialog → actually end */}
      {!confirming ? (
        <button className="btn-end" onClick={() => setConfirming(true)}>
          End session
        </button>
      ) : (
        <div className="confirm-end">
          <p>End the session for everyone?</p>
          <div className="confirm-buttons">
            <button className="btn-confirm-yes" onClick={onEnd}>
              Yes, end it   {/* calls handleEnd() in HostPage */}
            </button>
            <button className="btn-confirm-no" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
