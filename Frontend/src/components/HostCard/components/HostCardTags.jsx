import React from 'react';

export default function HostCardTags({ tags }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="host-tags-list">
      {tags.map((tag, idx) => (
        <span key={idx} className="capsule-tag">
          #{tag}
        </span>
      ))}
    </div>
  );
}
