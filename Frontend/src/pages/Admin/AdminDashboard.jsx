import { useState, useEffect } from 'react';
import { adminApi } from '../../api/api';
import { HomeIcon, UsersIcon, CheckCircleIcon, MyRequestsIcon } from '../../components/Common/Icons';
import PageContainer from '../../components/Common/PageContainer/PageContainer';
import './Admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError('');
        const response = await adminApi.getStats();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
        setError('שגיאה בטעינת נתוני לוח הבקרה. אנא ודא שהתחברת כראוי.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <PageContainer loading={loading} error={error}>
      <div className="admin-page-header">
        <h2 className="admin-page-title">לוח בקרה אדמין</h2>
        <p className="admin-page-subtitle">מבט על של נתוני מערכת האירוח</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="admin-metric-card-info">
            <h4>מארחים רשומים</h4>
            <p>{stats?.total_hosts || 0}</p>
          </div>
          <div className="admin-metric-icon-wrapper blue">
            <HomeIcon />
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-card-info">
            <h4>אורחים רשומים</h4>
            <p>{stats?.total_guests || 0}</p>
          </div>
          <div className="admin-metric-icon-wrapper purple">
            <UsersIcon />
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-card-info">
            <h4>שידוכים פעילים</h4>
            <p>{stats?.active_matches || 0}</p>
          </div>
          <div className="admin-metric-icon-wrapper green">
            <CheckCircleIcon />
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="admin-metric-card-info">
            <h4>בקשות פתוחות</h4>
            <p>{stats?.open_posts || 0}</p>
          </div>
          <div className="admin-metric-icon-wrapper orange">
            <MyRequestsIcon />
          </div>
        </div>
      </div>

      <div className="admin-dashboard-widgets">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">סטטוס דחיפות</h3>
          </div>
          <div className="widget-list">
            <div className="widget-item">
              <div className="widget-item-info">
                <span className="widget-item-title">בקשות אירוח דחופות (ביממה הקרובה)</span>
                <span className="widget-item-desc">משתמשים שמחפשים אירוח דחוף ללא מענה עדיין</span>
              </div>
              <span className={`badge ${stats?.urgent_posts > 0 ? 'urgent' : 'active'}`}>
                {stats?.urgent_posts || 0} בקשות דחופות
              </span>
            </div>
            <div className="widget-item">
              <div className="widget-item-info">
                <span className="widget-item-title">יחס ממוצע (אורח למארח)</span>
                <span className="widget-item-desc">יחס האורחים והמארחים הרשומים במערכת</span>
              </div>
              <span className="badge host">
                {stats?.total_hosts ? (stats.total_guests / stats.total_hosts).toFixed(1) : 0} : 1
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
