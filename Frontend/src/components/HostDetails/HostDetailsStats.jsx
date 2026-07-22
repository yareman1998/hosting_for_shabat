import { Users, Utensils, Moon } from 'lucide-react';

export default function HostDetailsStats({ spotsFormatted, kashrutText, hasLodging }) {
  return (
    <div className="host-stats-grid">
      {/* Spots Card */}
      <div className="stat-card">
        <div className="stat-icon-wrapper text-emerald">
          <Users className="stat-icon" />
        </div>
        <p className="stat-value text-emerald">{spotsFormatted}</p>
        <p className="stat-label">מקומות</p>
      </div>

      {/* Kashrut Card */}
      <div className="stat-card">
        <div className="stat-icon-wrapper text-purple">
          <Utensils className="stat-icon" />
        </div>
        <p className="stat-value text-purple">{kashrutText}</p>
        <p className="stat-label">כשרות</p>
      </div>

      {/* Lodging Card */}
      <div className="stat-card">
        <div className="stat-icon-wrapper text-primary">
          <Moon className="stat-icon" />
        </div>
        <p className="stat-value text-primary">
          {hasLodging ? 'זמינה' : 'ללא'}
        </p>
        <p className="stat-label">לינה</p>
      </div>
    </div>
  );
}
