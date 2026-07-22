import { MapPin, Zap, Moon } from 'lucide-react';

export default function HostDetailsHero({
  imageUrl,
  hostName,
  city,
  matchPercentage,
  hasLodging,
  onImageError
}) {
  return (
    <div className="hero-banner-container">
      <img
        src={imageUrl}
        alt={hostName}
        onError={onImageError}
        className="hero-banner-img"
      />
      <div className="hero-banner-overlay" />

      <div className="hero-details-bottom">
        <h1 className="hero-title">{hostName}</h1>
        <p className="hero-subtitle">
          <MapPin className="hero-location-icon" />
          {city}
        </p>
      </div>

      {/* Match Score Badge (Top Right) */}
      <div className="hero-match-badge-wrap">
        <span className="hero-match-badge">
          <Zap className="badge-icon-sm" />
          {matchPercentage}%
        </span>
      </div>

      {/* Lodging Availability Badge (Top Left) */}
      <div className="hero-lodging-badge-wrap">
        <span className="hero-lodging-badge">
          <Moon className="badge-icon-md" />
          {hasLodging ? 'לינה זמינה' : 'ארוחות בלבד'}
        </span>
      </div>
    </div>
  );
}
