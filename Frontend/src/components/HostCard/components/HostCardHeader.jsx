import React from 'react';

export default function HostCardHeader({ fullName, city }) {
  return (
    <div className="card-header-info">
      <h3 className="host-name">{fullName}</h3>
      {city && (
        <span className="host-city-badge">
          {city}
        </span>
      )}
    </div>
  );
}
