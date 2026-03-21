import React, { useEffect, useRef } from 'react';

export default function CaptionDisplay({ captions }) {
  const bottomRef = useRef(null);

  // Whenever captions array changes, scroll to the bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions]);  // [captions] = re-run this whenever captions changes

  // Empty state
  if (!captions || captions.length === 0) {
    return (
      <div className="caption-display caption-empty">
        Captions will appear here when someone starts speaking…
      </div>
    );
  }

  return (
    <div className="caption-display">
      {captions.map((c, i) => (
        <span
          key={i}
          className={c.isFinal ? 'caption-final' : 'caption-partial'}
        >
          {c.text}{' '}
        </span>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}