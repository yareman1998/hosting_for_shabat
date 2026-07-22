import React, { useState } from 'react';
import { getMatchStyle } from '../utils/getMatchStyle';

export default function HostCardMedia({ host }) {
  const [imageError, setImageError] = useState(false);
  const matchStyle = getMatchStyle(host.match_percentage || 85);

  return (
    <div className="card-media">
      {!imageError && host.image_url ? (
        <img
          src={host.image_url}
          alt={host.full_name || 'תמונת מארח'}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="media-placeholder">
          <span className="placeholder-text">אירוח חם לשבת</span>
        </div>
      )}

      {/* Floating Overlay Badges */}
      <div className="media-overlay-badges">
        <div className="badge-group-right">
          {host.kashrut_level && (
            <span
              className="card-badge badge-kashrut"
              data-kashrut={host.kashrut_level}
            >
              {(() => {
                const norm = String(host.kashrut_level).toLowerCase();
                if (norm === 'glatt_mehadrin' || norm === 'mehadrin') return 'מהדרין / חלק';
                if (norm === 'kosher') return 'כשר';
                if (norm === 'basic') return 'כשר בסיסי';
                if (norm === 'none') return 'ללא כשרות';
                return host.kashrut_level;
              })()}
            </span>
          )}
        </div>

        <div className="badge-group-left">
          {host.has_lodging && (
            <span className="card-badge badge-lodging">
              לינה
            </span>
          )}

          {host.match_percentage && (
            <span
              className="card-badge badge-ai-match"
              style={{
                backgroundColor: matchStyle.bg,
                color: matchStyle.color,
                borderColor: matchStyle.border
              }}
            >
              {host.match_percentage}% {matchStyle.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
