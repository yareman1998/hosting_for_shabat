import Loading from '../Loading/Loading';

export default function PageContainer({ loading, error, successMsg, children }) {
  if (loading) {
    return <Loading />;
  }

  return (
    <>
      {error && (
        <div className="admin-alert error">
          <p>{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="admin-alert success">
          <p>{successMsg}</p>
        </div>
      )}
      {children}
    </>
  );
}
