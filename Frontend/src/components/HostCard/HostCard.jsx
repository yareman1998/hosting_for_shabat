import React from 'react';
import HostCardMedia from './components/HostCardMedia';
import HostCardHeader from './components/HostCardHeader';
import HostCardTags from './components/HostCardTags';
import HostSpotsIndicator from './components/HostSpotsIndicator';
import HostCardFooter from './components/HostCardFooter';
import './HostCard.css';

export default function HostCard({ host, onBookingRequest }) {
  if (!host) return null;

  const isFull = host.available_spots === 0;

  return (
    <div className="host-card">
      {/* 1. Media Header (Image / Placeholder & Overlay Badges) */}
      <HostCardMedia host={host} />

      {/* 2. Main Content Details */}
      <div className="card-content">
        <HostCardHeader fullName={host.full_name} city={host.city} />

        {host.biography && (
          <p className="host-biography">{host.biography}</p>
        )}

        <HostCardTags tags={host.tags} />

        <HostSpotsIndicator availableSpots={host.available_spots} />
      </div>

      {/* 3. Action Footer */}
      <HostCardFooter
        host={host}
        isFull={isFull}
        onBookingRequest={onBookingRequest}
      />
    </div>
  );
}
