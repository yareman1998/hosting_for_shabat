

export default function HostCardFooter({ host, isFull, onBookingRequest }) {
  return (
    <div className="card-footer">
      <button
        className="book-request-btn"
        disabled={isFull}
        onClick={() => !isFull && onBookingRequest && onBookingRequest(host)}
      >
        {isFull ? 'מלא לשבת זו' : 'שלח בקשת אירוח'}
      </button>
    </div>
  );
}
