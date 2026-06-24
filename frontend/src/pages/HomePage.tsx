import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useIsMobile } from '../hooks/useIsMobile';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/recommendations');
      setRecommendations(res.data);
    } catch {}
  };

  const quickActions = [
    {
      icon: '🔍',
      title: 'Browse Events',
      description: 'Explore upcoming events filtered by category, location, date, and price.',
      path: '/events',
      show: true,
    },
    {
      icon: '📅',
      title: 'My Events',
      description: 'Create, edit, publish, and manage your events and track bookings.',
      path: '/my-events',
      show: user?.role === 'ORGANIZER' || user?.role === 'ADMIN',
    },
    {
      icon: '✉️',
      title: 'Messages',
      description: 'View your inbox and communicate with organizers and attendees.',
      path: '/messages',
      show: true,
    },
  ].filter((a) => a.show);

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, padding: isMobile ? '28px 16px' : '48px 24px' }}>

        {/* Hero */}
        <div style={{ ...styles.hero, flexDirection: isMobile ? 'column' as const : 'row' as const, gap: isMobile ? '16px' : 0 }}>
          <div style={styles.heroText}>
            <p style={styles.heroGreeting}>Good to see you,</p>
            <h1 style={{ ...styles.heroName, fontSize: isMobile ? '1.8rem' : '2.4rem' }}>
              {user?.firstName} {user?.lastName}
            </h1>
          </div>
          <div style={styles.heroRole}>
            <span style={styles.rolePill}>{user?.role}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <div
                key={action.path}
                style={{ ...styles.actionCard, padding: isMobile ? '16px' : '20px 24px' }}
                onClick={() => navigate(action.path)}
              >
                <div style={styles.actionIcon}>{action.icon}</div>
                <div style={styles.actionBody}>
                  <h3 style={styles.actionTitle}>{action.title}</h3>
                  {!isMobile && <p style={styles.actionDesc}>{action.description}</p>}
                </div>
                <span style={styles.actionArrow}>→</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Recommended for You</h2>
                <p style={styles.sectionSubtitle}>
                  Personalized picks based on your activity
                </p>
              </div>
              {!isMobile && (
                <button
                  style={styles.seeAllBtn}
                  onClick={() => navigate('/events')}
                >
                  See all →
                </button>
              )}
            </div>
            <div style={{ ...styles.recGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {recommendations.map((event) => {
                const minPrice =
                  event.ticketTypes?.length > 0
                    ? Math.min(...event.ticketTypes.map((t: any) => t.price))
                    : null;
                return (
                  <div
                    key={event.id}
                    style={styles.recCard}
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div style={styles.recCardTop}>
                      <span style={styles.recEventType}>{event.eventType}</span>
                      {minPrice !== null && (
                        <span style={styles.recPrice}>€{minPrice}</span>
                      )}
                    </div>
                    <h3 style={styles.recTitle}>{event.title}</h3>
                    <div style={styles.recMeta}>
                      <span>📍 {event.city}</span>
                      <span>
                        🗓{' '}
                        {new Date(event.startDateTime).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div style={styles.recCardFooter}>
                      <div style={styles.recCategories}>
                        {event.categories?.slice(0, 2).map((c: any) => (
                          <span key={c.category.id} style={styles.recTag}>
                            {c.category.name}
                          </span>
                        ))}
                      </div>
                      <span style={styles.recLink}>View →</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {isMobile && (
              <button
                style={styles.seeAllBtnMobile}
                onClick={() => navigate('/events')}
              >
                See all events →
              </button>
            )}
          </section>
        )}

        {user?.role === 'PARTICIPANT' && (
          <div style={styles.upgradeNote}>
            <span>💡</span>
            <p>
              Want to organize events?{' '}
              <strong>Contact the administrator</strong> to upgrade your account to Organizer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg)',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    paddingBottom: '28px',
    borderBottom: '1px solid var(--color-border)',
  },
  heroText: {},
  heroGreeting: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
    marginBottom: '6px',
    fontWeight: '400',
  },
  heroName: {
    fontFamily: 'var(--font-display)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
  },
  heroRole: {},
  rolePill: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '100px',
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-accent)',
    fontSize: '0.78rem',
    fontWeight: '600',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  },
  section: {
    marginBottom: '40px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: '4px',
  },
  sectionSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
  },
  seeAllBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  seeAllBtnMobile: {
    width: '100%',
    marginTop: '16px',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  actionsGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    backgroundColor: 'var(--color-border)',
  },
  actionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'var(--color-surface)',
    cursor: 'pointer',
    transition: 'background-color var(--transition)',
  },
  actionIcon: {
    fontSize: '1.4rem',
    flexShrink: 0,
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
  },
  actionBody: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: '2px',
  },
  actionDesc: {
    fontSize: '0.82rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.5',
  },
  actionArrow: {
    color: 'var(--color-text-muted)',
    fontSize: '1rem',
    flexShrink: 0,
  },
  recGrid: {
    display: 'grid',
    gap: '16px',
  },
  recCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    transition: 'border-color var(--transition)',
  },
  recCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recEventType: {
    fontSize: '0.72rem',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  recPrice: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--color-accent)',
  },
  recTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    lineHeight: '1.3',
  },
  recMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
  },
  recCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '10px',
    borderTop: '1px solid var(--color-border)',
    marginTop: 'auto',
  },
  recCategories: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  recTag: {
    padding: '2px 8px',
    borderRadius: '100px',
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-accent)',
    fontSize: '0.72rem',
    fontWeight: '500',
  },
  recLink: {
    fontSize: '0.82rem',
    color: 'var(--color-accent)',
    fontWeight: '500',
  },
  upgradeNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-accent-light)',
    border: '1px solid rgba(61,59,243,0.15)',
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)',
  },
};