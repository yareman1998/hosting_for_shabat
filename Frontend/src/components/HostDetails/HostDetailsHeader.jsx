import { ChevronRight } from 'lucide-react';

export default function HostDetailsHeader({ hostName, onBack }) {
  return (
    <div className="host-details-breadcrumb">
      <button
        type="button"
        onClick={onBack}
        className="breadcrumb-back-btn"
      >
        חיפוש
      </button>
      <ChevronRight className="breadcrumb-arrow" />
      <span className="breadcrumb-current">{hostName}</span>
    </div>
  );
}
