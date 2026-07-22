import { useState, useEffect } from 'react';
import { getShabbatInfo, getCachedShabbatInfo, formatHebrewToday } from "../../utils/shabbat";
import { authApi } from "../../api/api";

export default function FindHostHeader() {
  const [shabbatData, setShabbatData] = useState(() => getCachedShabbatInfo('ירושלים'));
  const [loading, setLoading] = useState(() => !getCachedShabbatInfo('ירושלים'));

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('token');

    async function loadData() {
      let userCity = 'ירושלים';

      // 1. Fetch user city only if token exists
      if (token) {
        try {
          const res = await authApi.getMe();
          const profile = res.data?.profile;
          userCity = profile?.city || profile?.origin_city || 'ירושלים';
        } catch (err) {
          console.warn('Could not fetch user city profile, using default:', err);
        }
      }

      // Check cache first for user city
      const cached = getCachedShabbatInfo(userCity);
      if (cached && isMounted) {
        setShabbatData(cached);
        setLoading(false);
      }

      // 2. Fetch Shabbat info (handles 6-hour cache check internally)
      const info = await getShabbatInfo(userCity);
      
      if (isMounted) {
        setShabbatData(info);
        setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Early return for loading state (Cleaner than a render function)
  if (loading) {
    return (
      <header className="find-host-header">
        <h1>מצא מארח לשבת</h1>
        <p className="shabbat-info-text loading" aria-busy="true">
          <span className="shabbat-skeleton-bar" />
        </p>
      </header>
    );
  }

  // Fallback if data or lighting times are missing
  const hasValidData = shabbatData?.success && shabbatData?.candleLighting;
  const todayText = shabbatData?.todayFormatted || formatHebrewToday();

  return (
    <header className="find-host-header">
      <h1>מצא מארח לשבת</h1>
      {!hasValidData ? (
        <p className="shabbat-info-text single-line">{todayText}</p>
      ) : shabbatData.isFriday ? (
        <p className="shabbat-info-text single-line">
          {shabbatData.todayFormatted} | כניסת שבת פרשת {shabbatData.parasha}: {shabbatData.candleLighting} ({shabbatData.cityName})
        </p>
      ) : shabbatData.isSaturday ? (
        <p className="shabbat-info-text single-line">
          {shabbatData.todayFormatted} | השבת הבאה: פרשת {shabbatData.parasha} ({shabbatData.fridayDateFormatted}): {shabbatData.candleLighting} ({shabbatData.cityName})
        </p>
      ) : (
        /* Sunday through Thursday: Clean 2-line declarative layout */
        <p className="shabbat-info-text two-lines">
          <span className="shabbat-date-line">{shabbatData.todayFormatted}</span>
          <span className="shabbat-details-line">
            כניסת שבת פרשת {shabbatData.parasha} ({shabbatData.fridayDateFormatted}): {shabbatData.candleLighting} ({shabbatData.cityName})
          </span>
        </p>
      )}
    </header>
  );
}
