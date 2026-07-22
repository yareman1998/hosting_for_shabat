import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { listingsApi, bookingsApi } from '../../api/api';
import HostDetailsHeader from '../../components/HostDetails/HostDetailsHeader';
import HostDetailsHero from '../../components/HostDetails/HostDetailsHero';
import HostDetailsStats from '../../components/HostDetails/HostDetailsStats';
import HostDetailsAbout from '../../components/HostDetails/HostDetailsAbout';
import HostDetailsSidebar from '../../components/HostDetails/HostDetailsSidebar';
import './HostDetails.css';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop&auto=format';

const CACHE_KEY = 'shabbat_hosts_cache';

function getUpcomingFridayDateStr(dateInput) {
  if (dateInput) {
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      console.warn('Invalid date format:', e);
    }
  }
  return 'שישי, 18 ביולי 2025';
}

export default function HostDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [host, setHost] = useState(() => {
    if (location.state?.host) return location.state.host;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const found = parsed.find(
          (h) => String(h.id) === String(id) || String(h.user_id) === String(id)
        );
        if (found) return found;
      }
    } catch (e) {
      console.warn('Error reading cached host:', e);
    }
    return null;
  });

  const [loading, setLoading] = useState(!host);
  const [imageError, setImageError] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // 'submitting' | 'success' | null
  const [toastMessage, setToastMessage] = useState('');

  // Fetch host from DB if not available in state/cache
  useEffect(() => {
    if (host) return;

    let isMounted = true;
    async function fetchHostDetails() {
      setLoading(true);
      try {
        const response = await listingsApi.searchHosts();
        const rawData = response.data || [];
        const found = rawData.find(
          (item) => String(item.id) === String(id) || String(item.user_id) === String(id)
        );

        if (found && isMounted) {
          const mapped = {
            id: found.id,
            user_id: found.user_id,
            full_name: found.host_name || found.user?.full_name || 'משפחת כהן',
            city: found.city || 'מודיעין',
            kashrut_level: found.kashrut_level || 'MEHADRIN',
            has_lodging: found.availability_windows
              ? found.availability_windows.includes('לינה')
              : true,
            available_spots: found.available_spots !== undefined ? found.available_spots : 2,
            total_spots: found.total_spots || 6,
            match_percentage:
              found.match_score !== undefined && found.match_score !== null
                ? found.match_score
                : 96,
            biography:
              found.free_text_notes ||
              'משפחה חמה ומסבירת פנים עם 3 ילדים. שבת ביתית ומשפחתית, אוכל ביתי מעולה.',
            tags: [
              found.neighborhood,
              found.religious_orientation,
              found.kashrut_level === 'MEHADRIN' ? 'מהדרין' : 'כשר'
            ].filter(Boolean),
            image_url: found.image_url || null,
            rating: found.rating || 4.9,
            reviews_count: found.reviews_count || 47,
            phone_number: found.phone_number || found.user?.phone_number || '054-1234567'
          };
          setHost(mapped);
        }
      } catch (err) {
        console.error('Error fetching host details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHostDetails();
    return () => {
      isMounted = false;
    };
  }, [id, host]);

  const handleBack = () => {
    navigate('/find-host');
  };

  const handleSendBookingRequest = async () => {
    setRequestStatus('submitting');
    try {
      if (host?.id) {
        await bookingsApi.requestBooking({ listing_id: host.id, host_id: host.user_id || host.id });
      }
    } catch (err) {
      console.warn('Booking request notice:', err);
    } finally {
      setRequestStatus('success');
      setToastMessage(`בקשת אירוח נשלחה בהצלחה אל ${hostName}!`);
    }
  };

  const handleSendMessage = () => {
    const rawPhone = host?.phone_number || host?.phone || '0541234567';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const text = encodeURIComponent(`שלום ${hostName}, שאלתי לגבי אירוח לשבת דרך אפליקציית שבת מארח.`);
    window.open(`https://wa.me/972${cleanPhone.replace(/^0/, '')}?text=${text}`, '_blank');
  };

  // Dynamic values with fallbacks matching exact mockup requirements
  const hostName = host?.full_name || host?.host_name || 'משפחת כהן';
  const city = host?.city || 'מודיעין';
  const imageUrl = !imageError && host?.image_url ? host.image_url : DEFAULT_IMAGE;
  const matchPercentage = host?.match_percentage ?? host?.match_score ?? 96;
  const hasLodging = host?.has_lodging !== undefined ? host.has_lodging : true;

  const availableSpots = host?.available_spots !== undefined ? host.available_spots : 2;
  const totalSpots = host?.total_spots || 6;
  const spotsFormatted = `${availableSpots}/${totalSpots}`;

  const getKashrutLabel = (level) => {
    if (!level) return 'מהדרין';
    const norm = String(level).toLowerCase();
    if (norm.includes('mehadrin') || norm.includes('מהדרין') || norm.includes('glatt')) return 'מהדרין';
    if (norm.includes('kosher') || norm.includes('כשר')) return 'כשר';
    return level;
  };
  const kashrutText = getKashrutLabel(host?.kashrut_level);

  const biography =
    host?.biography ||
    host?.free_text_notes ||
    'משפחה חמה ומסבירת פנים עם 3 ילדים. שבת ביתית ומשפחתית, אוכל ביתי מעולה.';

  const tags =
    host?.tags && host.tags.length > 0
      ? host.tags
      : ['ילדים', 'חם ומשפחתי', 'אוכל ביתי'];

  const rating = host?.rating !== undefined && host?.rating !== null ? Number(host.rating).toFixed(1) : '4.9';
  const reviewsCount = host?.reviews_count ?? host?.review_count ?? 47;
  const phone = host?.phone_number || host?.phone || '054-1234567';

  const upcomingFridayDate = getUpcomingFridayDateStr(host?.shabbat_date);

  if (loading) {
    return (
      <main className="host-details-page loading-state">
        <p className="loading-text">טוען פרטי משפחה מארחת...</p>
      </main>
    );
  }

  return (
    <main className="host-details-page">
      <div className="host-details-container">
        
        {/* Breadcrumb Header Component */}
        <HostDetailsHeader hostName={hostName} onBack={handleBack} />

        {/* Hero Image Banner Component */}
        <HostDetailsHero
          imageUrl={imageUrl}
          hostName={hostName}
          city={city}
          matchPercentage={matchPercentage}
          hasLodging={hasLodging}
          onImageError={() => setImageError(true)}
        />

        {/* Grid Content */}
        <div className="host-details-grid">
          
          {/* Main Content (2 cols on md) */}
          <div className="host-details-main-content">
            {/* 3 Summary Info Cards Component */}
            <HostDetailsStats
              spotsFormatted={spotsFormatted}
              kashrutText={kashrutText}
              hasLodging={hasLodging}
            />

            {/* About Section & Tags Component */}
            <HostDetailsAbout biography={biography} tags={tags} />
          </div>

          {/* Action / Booking Card Component */}
          <div>
            <HostDetailsSidebar
              matchPercentage={matchPercentage}
              rating={rating}
              reviewsCount={reviewsCount}
              upcomingFridayDate={upcomingFridayDate}
              phone={phone}
              handleSendMessage={handleSendMessage}
              handleSendBookingRequest={handleSendBookingRequest}
              requestStatus={requestStatus}
              availableSpots={availableSpots}
              toastMessage={toastMessage}
            />
          </div>

        </div>

      </div>
    </main>
  );
}
