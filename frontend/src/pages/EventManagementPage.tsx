import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { Event } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

export default function EventManagementPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchMyEvents(); }, []);

  const fetchMyEvents = async () => {
    try {
      const res = await api.get('/events/my');
      setEvents(res.data);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: number) => {
    if (!confirm('Publish this event? It will be visible to all users.')) return;
    setActionLoading(true);
    try {
      await api.patch(`/events/${id}/publish`);
      await fetchMyEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this event? All bookers will be notified.')) return;
    setActionLoading(true);
    try {
      await api.patch(`/events/${id}/cancel`);
      try { await api.post(`/messages/notify-cancellation/${id}`); } catch {}
      await fetchMyEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/events/${id}`);
      await fetchMyEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'PUBLISHED') return 'var(--color-success)';
    if (s === 'CANCELLED') return 'var(--color-error)';
    if (s === 'COMPLETED') return 'var(--color-accent)';
    return 'var(--color-warning)';
  };

  const statusBg = (s: string) => {
    if (s === 'PUBLISHED') return 'var(--color-success-bg)';
    if (s === 'CANCELLED') return 'var(--color-error-bg)';
    if (s === 'COMPLETED') return 'var(--color-accent-light)';
    return 'var(--color-warning-bg)';
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, padding: isMobile ? '20px 16px' : '40px 24px' }}>

        {/* Header */}
        <div style={{ ...styles.header, flexDirection: isMobile ? 'column' as const : 'row' as const, gap: isMobile ? '12px' : 0 }}>
          <div>
            <h1 style={{ ...styles.title, fontSize: isMobile ? '1.5rem' : '2rem' }}>My Events</h1>
            <p style={styles.subtitle}>
              {events.length} event{events.length !== 1 ? 's' : ''} created
            </p>
          </div>
          <button
            style={{ ...styles.createBtn, width: isMobile ? '100%' : 'auto' }}
            onClick={() => navigate('/my-events/create')}
          >
            + Create Event
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {loading ? (
          <div style={styles.loadingState}>Loading your events...</div>
        ) : events.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>📅</p>
            <h3 style={styles.emptyTitle}>No events yet</h3>
            <p style={styles.emptyText}>Create your first event to get started</p>
            <button
              style={styles.createBtn}
              onClick={() => navigate('/my-events/create')}
            >
              + Create Event
            </button>
          </div>
        ) : (
          <div style={styles.eventList}>
            {events.map((event) => (
              <div key={event.id} style={{ ...styles.eventCard, flexDirection: isMobile ? 'column' as const : 'row' as const }}>
                <div style={styles.cardLeft}>
                  {/* Status + Title */}
                  <div style={styles.cardHeader}>
                    <h2 style={styles.eventTitle}>{event.title}</h2>
                    <span style={{
                      ...styles.statusPill,
                      color: statusColor(event.status),
                      backgroundColor: statusBg(event.status),
                    }}>
                      {event.status}
                    </span>
                  </div>

                  {/* Meta */}
                  <div style={styles.metaRow}>
                    <span style={styles.metaItem}>
                      📍 {event.venue}, {event.city}, {event.country}
                    </span>
                    <span style={styles.metaDot}>·</span>
                    <span style={styles.metaItem}>
                      🗓 {new Date(event.startDateTime).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <span style={styles.metaDot}>·</span>
                    <span style={styles.metaItem}>
                      👥 {event.capacity} capacity
                    </span>
                    <span style={styles.metaDot}>·</span>
                    <span style={styles.metaItem}>
                      🎫 {event.bookings?.length ?? 0} booking{(event.bookings?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Categories */}
                  <div style={styles.categories}>
                    {event.categories.map((c) => (
                      <span key={c.category.id} style={styles.categoryTag}>
                        {c.category.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ ...styles.cardActions, justifyContent: isMobile ? 'stretch' as const : 'flex-end' as const }}>
                  <button
                    style={{ ...styles.actionBtn, flex: isMobile ? 1 : 'initial' }}
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    View
                  </button>
                  <button
                    style={{ ...styles.actionBtn, flex: isMobile ? 1 : 'initial' }}
                    onClick={() => navigate(`/my-events/${event.id}/bookings`)}
                  >
                    Bookings ({event.bookings?.length ?? 0})
                  </button>

                  {event.status === 'DRAFT' && (
                    <>
                      <button
                        style={{ ...styles.actionBtn, flex: isMobile ? 1 : 'initial' }}
                        onClick={() => navigate(`/my-events/edit/${event.id}`)}
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button
                        style={{ ...styles.actionBtn, ...styles.successBtn, flex: isMobile ? 1 : 'initial' }}
                        onClick={() => handlePublish(event.id)}
                        disabled={actionLoading}
                      >
                        Publish
                      </button>
                      <button
                        style={{ ...styles.actionBtn, ...styles.dangerBtn, flex: isMobile ? 1 : 'initial' }}
                        onClick={() => handleDelete(event.id)}
                        disabled={actionLoading}
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {event.status === 'PUBLISHED' && (
                    <>
                      <button
                        style={{ ...styles.actionBtn, flex: isMobile ? 1 : 'initial' }}
                        onClick={() => navigate(`/my-events/edit/${event.id}`)}
                        disabled={actionLoading}
                      >
                        Edit
                      </button>
                      <button
                        style={{ ...styles.actionBtn, ...styles.dangerBtn, flex: isMobile ? 1 : 'initial' }}
                        onClick={() => handleCancel(event.id)}
                        disabled={actionLoading}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: 'var(--color-bg)' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '28px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em', marginBottom: '4px',
  },
  subtitle: { fontSize: '0.875rem', color: 'var(--color-text-muted)' },
  createBtn: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)', border: 'none',
    backgroundColor: 'var(--color-accent)', color: '#fff',
    fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
  errorBox: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)',
    fontSize: '0.875rem', marginBottom: '20px',
  },
  loadingState: {
    textAlign: 'center' as const, padding: '60px',
    color: 'var(--color-text-muted)', fontSize: '0.9rem',
  },
  emptyState: {
    textAlign: 'center' as const, padding: '60px 24px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
  },
  emptyIcon: { fontSize: '2.5rem', marginBottom: '16px' },
  emptyTitle: {
    fontSize: '1.1rem', fontWeight: '600',
    color: 'var(--color-text-primary)', marginBottom: '8px',
  },
  emptyText: {
    fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '24px',
  },
  eventList: { display: 'flex', flexDirection: 'column' as const, gap: '1px',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
    overflow: 'hidden', backgroundColor: 'var(--color-border)',
  },
  eventCard: {
    backgroundColor: 'var(--color-surface)',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
  },
  cardLeft: { flex: 1, minWidth: 0 },
  cardHeader: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const,
    gap: '10px', marginBottom: '10px',
  },
  eventTitle: {
    fontSize: '1rem', fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.01em',
  },
  statusPill: {
    padding: '3px 10px', borderRadius: '100px',
    fontSize: '0.7rem', fontWeight: '600',
    letterSpacing: '0.04em', flexShrink: 0,
  },
  metaRow: {
    display: 'flex', alignItems: 'center',
    flexWrap: 'wrap' as const, gap: '6px',
    marginBottom: '10px',
  },
  metaItem: { fontSize: '0.8rem', color: 'var(--color-text-secondary)' },
  metaDot: { color: 'var(--color-border-strong)', fontSize: '0.8rem' },
  categories: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const },
  categoryTag: {
    padding: '2px 8px', borderRadius: '100px',
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-accent)',
    fontSize: '0.7rem', fontWeight: '500',
  },
  cardActions: {
    display: 'flex', gap: '8px',
    flexWrap: 'wrap' as const,
  },
  actionBtn: {
    padding: '7px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer',
    transition: 'all var(--transition)',
    whiteSpace: 'nowrap' as const,
  },
  successBtn: {
    border: '1px solid var(--color-success)',
    color: 'var(--color-success)',
    backgroundColor: 'var(--color-success-bg)',
  },
  dangerBtn: {
    border: '1px solid var(--color-error)',
    color: 'var(--color-error)',
    backgroundColor: 'var(--color-error-bg)',
  },
};