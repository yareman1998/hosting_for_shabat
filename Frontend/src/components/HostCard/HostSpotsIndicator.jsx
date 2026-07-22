

export default function HostSpotsIndicator({ availableSpots }) {
  const spots = availableSpots !== undefined ? availableSpots : 3;

  let spotStatusClass = 'spots-available';
  let spotStatusText = `${spots} מקומות פנויים`;

  if (spots === 1) {
    spotStatusClass = 'spots-warning';
    spotStatusText = 'מקום 1 אחרון!';
  } else if (spots === 0) {
    spotStatusClass = 'spots-full';
    spotStatusText = 'מלא לשבת זו';
  }

  return (
    <div className={`spots-indicator ${spotStatusClass}`}>
      <span>סטטוס מקומות:</span>
      <span>{spotStatusText}</span>
    </div>
  );
}
