import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from "../../../store/statsSlice"; // Adjust this path if needed based on your folder structure
import { 
  Sparkles, 
  Send, 
  Star, 
  MapPin, 
  Check,
  Bot
} from 'lucide-react';
import './HomeGuest.css';

export default function HomeGuest() {
  const dispatch = useDispatch();

  // 1. Pull global stats (Hosts, Spots, Sleepovers) from the statsSlice
  const { data: stats, status } = useSelector((state) => state.stats);

  // 2. Pull personal requests count directly from the requestsSlice (Syncs with Navbar!)
  // Note: Adjust 'badgeCount' if it's named something else in your requestsSlice
  const myPendingRequests = useSelector((state) => state.requests.badgeCount || 0);

  // Generate the live date in Hebrew format
  const formattedDate = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // 3. Fetch stats on mount if we haven't already
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDashboardStats());
    }
  }, [status, dispatch]);

  const featuredHosts = [
    {
      id: 1,
      name: 'משפחת כהן',
      location: 'מודיעין',
      rating: 4.9,
      reviews: 47,
      spots: 2,
      match: 96,
      hasSleepover: true,
      kosher: true,
      tags: ['ילדים', 'חם ומשפחתי'],
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      name: 'משפחת ישראלי',
      location: 'ירושלים',
      rating: 5.0,
      reviews: 63,
      spots: 3,
      match: 91,
      hasSleepover: true,
      kosher: true,
      tags: ['ירושלים', 'שירה'],
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 3,
      name: 'משפחת גולדברג',
      location: 'באר שבע',
      rating: 4.9,
      reviews: 41,
      spots: 5,
      match: 88,
      hasSleepover: true,
      kosher: true,
      tags: ['משפחה גדולה', 'דרום'],
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 4,
      name: 'משפחת כץ',
      location: 'ראשון לציון',
      rating: 4.8,
      reviews: 35,
      spots: 4,
      match: 84,
      hasSleepover: true,
      kosher: true,
      tags: ['בני נוער', 'אורבני'],
      image: 'https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <div className="guest-home-container">
      
      {/* HERO SECTION */}
      <section className="gh-hero">
        <div className="gh-hero-content">
          <span className="gh-hero-subtitle">שבת הקרובה</span>
          <h1 className="gh-hero-title">{formattedDate}</h1>
          <p className="gh-hero-info">כניסת שבת בשעה 19:45 · 8 משפחות מחכות לכם</p>
        </div>
      </section>

      {/* STATS ROW - Wired to Redux State */}
      <section className="gh-stats-row">
        <div className="gh-stat-card">
          <h2>{status === 'loading' ? '...' : stats.availableHosts}</h2>
          <p>מארחים זמינים</p>
        </div>
        <div className="gh-stat-card gh-stat-green">
          <h2>{status === 'loading' ? '...' : stats.availableSpots}</h2>
          <p>מקומות פנויים</p>
        </div>
        <div className="gh-stat-card gh-stat-purple">
          {/* Now pulls directly from your personal requests slice */}
          <h2>{myPendingRequests}</h2>
          <p>הבקשות שלי</p>
        </div>
        <div className="gh-stat-card gh-stat-yellow">
          <h2>{status === 'loading' ? '...' : stats.hostsWithSleepover}</h2>
          <p>מארחים עם לינה</p>
        </div>
      </section>

      {/* AI AGENT SECTION */}
      <section className="gh-ai-section">
        <div className="gh-section-header">
          <h3>שאל את הסוכן החכם</h3>
          <span className="gh-badge-new"><Sparkles size={14} /> AI · חדש</span>
        </div>

        <div className="gh-ai-grid">
          {/* AI Chat Window (Right Side) */}
          <div className="gh-ai-chat">
            <div className="gh-chat-header">
              <div className="gh-chat-agent-info">
                <div className="gh-agent-avatar">
                  <Bot size={20} />
                </div>
                <div>
                  <h4>עוזר חכם - שבת שלום</h4>
                  <p>מענה מיידי לכל שאלה <span className="gh-online-dot"></span> פעיל</p>
                </div>
              </div>
            </div>
            
            <div className="gh-chat-body">
              <div className="gh-chat-message">
                <div className="gh-agent-avatar-small">
                  <Bot size={16} />
                </div>
                <div className="gh-message-bubble">
                  שלום! אני העוזר החכם של שבת שלום 👋<br/>
                  אני יכול לעזור למצוא מארח, להסביר ציוני התאמה, ולענות על כל שאלה. במה אוכל לעזור?
                </div>
              </div>

              <div className="gh-chat-suggestions">
                <button>מה ההבדל בין כשר למהדרין?</button>
                <button>יש מארחים בתל אביב עם לינה?</button>
                <button>איך שולחים בקשת אירוח?</button>
                <button>מתי צריך להגיע לשבת?</button>
              </div>
            </div>

            <div className="gh-chat-input-area">
              <div className="gh-input-wrapper">
                <button className="gh-send-btn"><Send size={18} /></button>
                <input type="text" placeholder="שאל אותי כל שאלה על אירוח שבת..." />
              </div>
            </div>
          </div>

          {/* AI Capabilities (Left Side) */}
          <div className="gh-ai-features">
            <div className="gh-features-icon">
              <Sparkles size={24} color="#2563eb" />
            </div>
            <h4>מה הסוכן יכול לעשות?</h4>
            <ul className="gh-features-list">
              <li><Check size={16} className="gh-check" /> לעזור לך לבחור מארח לפי ציון ההתאמה</li>
              <li><Check size={16} className="gh-check" /> לענות על שאלות כשרות ולינה</li>
              <li><Check size={16} className="gh-check" /> להסביר איך עובד לוח הבקשות</li>
              <li><Check size={16} className="gh-check" /> לתת מידע על אזורים בארץ</li>
              <li><Check size={16} className="gh-check" /> לענות על שאלות כלליות על שבת</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FEATURED HOSTS */}
      <section className="gh-featured-section">
        <div className="gh-section-header">
          <h3>מארחים מובילים השבת</h3>
          <span className="gh-link-all">כל המארחים</span>
        </div>

        <div className="gh-hosts-grid">
          {featuredHosts.map(host => (
            <div className="gh-host-card" key={host.id}>
              <div className="gh-card-image-wrapper">
                <img src={host.image} alt={host.name} className="gh-card-image" />
                <div className="gh-card-badges">
                  <span className="gh-badge-night">🌙 לינה</span>
                  <div className="gh-badge-right-group">
                    {host.kosher && <span className="gh-badge-kosher">🛡️ מהדרין</span>}
                    <span className="gh-badge-match"><Sparkles size={12} /> {host.match}%</span>
                  </div>
                </div>
              </div>
              
              <div className="gh-card-content">
                <div className="gh-card-title-row">
                  <h4>{host.name}</h4>
                  <div className="gh-rating">
                    <Star size={14} fill="#eab308" color="#eab308" />
                    <span>{host.rating.toFixed(1)}</span>
                    <span className="gh-reviews">({host.reviews})</span>
                  </div>
                </div>
                
                <div className="gh-location">
                  <MapPin size={14} /> {host.location}
                </div>

                <div className="gh-card-footer">
                  <div className="gh-tags">
                    {host.tags.map(tag => (
                      <span key={tag} className="gh-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="gh-spots-text">{host.spots} מקומות</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="gh-how-it-works">
        <h3>איך זה עובד?</h3>
        <div className="gh-steps-container">
          <div className="gh-step">
            <div className="gh-step-number">01</div>
            <h4>חפש מארח</h4>
            <p>AI מחשב ציון התאמה לכל מארח לפי הפרופיל שלך.</p>
          </div>
          <div className="gh-step">
            <div className="gh-step-number">02</div>
            <h4>שלח בקשה</h4>
            <p>בחר מארח או פרסם בקשה בלוח ותן למארחים לבוא אליך.</p>
          </div>
          <div className="gh-step">
            <div className="gh-step-number">03</div>
            <h4>קבל שיבוץ</h4>
            <p>קישור WhatsApp + שאלות chat-i icebreaker פנימי.</p>
          </div>
        </div>
      </section>

    </div>
  );
}