import { useState, useEffect } from 'react';
import { adminApi } from '../../api/api';
import { LockIcon, UnlockIcon, CheckCircleIcon } from '../../components/Common/Icons';
import PageContainer from '../../components/Common/PageContainer/PageContainer';
import Table from '../../components/Common/Table/Table';
import './Admin.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, host, guest, admin

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await adminApi.getUsers();
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('שגיאה בטעינת משתמשים.');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentActive) => {
    try {
      setError('');
      setSuccessMsg('');
      const targetState = !currentActive;
      const response = await adminApi.updateUserStatus(userId, targetState);
      
      // Update local state cleanly (DRY & organized)
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, is_active: response.data.is_active } : u)
      );
      setSuccessMsg(targetState ? 'המשתמש הופעל בהצלחה.' : 'המשתמש הושעה בהצלחה.');
    } catch (err) {
      console.error('Failed to toggle status:', err);
      setError('פעולה נכשלה. אנא נסה שנית.');
    }
  };

  const handleVerifySoldier = async (userId, currentVerifiedStatus) => {
    try {
      setError('');
      setSuccessMsg('');
      const targetState = !currentVerifiedStatus;
      const response = await adminApi.verifyGuest(userId, targetState);

      // Update local state cleanly
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === userId ? { ...u, is_soldier_or_national_service: response.data.is_soldier_or_national_service } : u)
      );
      setSuccessMsg(targetState ? 'סטטוס חייל/שירות לאומי אומת בהצלחה.' : 'ביטול אימות חייל/שירות לאומי בוצע בהצלחה.');
    } catch (err) {
      console.error('Failed to verify guest:', err);
      setError('פעולת האימות נכשלה.');
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number?.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || user.user_type === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <PageContainer loading={loading} error={error} successMsg={successMsg}>
      <div className="admin-page-header">
        <h2 className="admin-page-title">ניהול משתמשים</h2>
        <p className="admin-page-subtitle">ניהול הרשאות, השעיית משתמשים ואימות חיילים</p>
      </div>

      {/* Search and Filters Bar */}
      <div className="search-filter-bar">
        <input 
          type="text" 
          placeholder="חיפוש לפי שם, אימייל או טלפון..." 
          className="admin-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="admin-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">כל התפקידים</option>
          <option value="host">מארחים (Host)</option>
          <option value="guest">אורחים (Guest)</option>
          <option value="admin">מנהלים (Admin)</option>
        </select>
      </div>

      {/* Users Table */}
      <Table 
        headers={['שם מלא', 'כתובת אימייל', 'מספר טלפון', 'סוג משתמש', 'סטטוס אימות', 'סטטוס פעיל', 'פעולות']}
        dataLength={filteredUsers.length}
        fallbackText="לא נמצאו משתמשים העונים לסינון הנוכחי."
      >
        {filteredUsers.map(user => (
          <tr key={user.id}>
            <td className="text-semibold">{user.full_name}</td>
            <td>{user.email}</td>
            <td className="ltr-column">{user.phone_number}</td>
            <td>
              <span className={`badge ${user.user_type}`}>
                {user.user_type === 'host' ? 'מארח' : user.user_type === 'guest' ? 'אורח' : 'מנהל'}
              </span>
            </td>
            <td>
              {user.user_type === 'guest' ? (
                <span className={`badge ${user.is_soldier_or_national_service ? 'verified' : 'pending'}`}>
                  {user.is_soldier_or_national_service ? 'חייל מאומת' : 'לא מאומת'}
                </span>
              ) : (
                <span className="text-muted">-</span>
              )}
            </td>
            <td>
              <span className={`badge ${user.is_active ? 'active' : 'suspended'}`}>
                {user.is_active ? 'פעיל' : 'מושעה'}
              </span>
            </td>
            <td>
              <div className="action-group">
                {/* Suspended/Active Toggle */}
                <button 
                  onClick={() => handleToggleStatus(user.id, user.is_active)}
                  className={`btn-action toggle-active ${user.is_active ? 'suspend' : 'activate'}`}
                  title={user.is_active ? 'השעיית משתמש' : 'הפעלת משתמש'}
                >
                  {user.is_active ? <UnlockIcon /> : <LockIcon />}
                </button>

                {/* Guest Verification Toggle */}
                {user.user_type === 'guest' && (
                  <button
                    onClick={() => handleVerifySoldier(user.id, user.is_soldier_or_national_service)}
                    className={`btn-action verify-soldier ${user.is_soldier_or_national_service ? 'verified' : ''}`}
                    title={user.is_soldier_or_national_service ? 'בטל אימות חייל' : 'אמת כחייל'}
                  >
                    <CheckCircleIcon />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </PageContainer>
  );
}
