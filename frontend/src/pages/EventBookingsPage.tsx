import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { Booking } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

export default function EventBookingsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [messageSending, setMessageSending] = useState(false);

  useEffect(() => { fetchBookings(); }, [id]);

  const fetchBookings = async () => {
    try {
      const [bookingsRes, eventRes] = await Promise.all([
        api.get(`/bookings/event/${id}`),
        api.get(`/events/${id}`),
      ]);
      setBookings(bookingsRes.data);
      setEventTitle(eventRes.data.title);
    } catch {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedBooking || !messageBody.trim()) return;
    setMessageSending(true);
    try {
      await api.post('/messages', {
        receiverId: (selectedBooking.attendee as any).id,
        subject: `Regarding your booking for ${eventTitle}`,
        body: messageBody,
      });
      setShowMessageModal(false);
      setMessageBody('');
      setSelectedBooking(null);
      alert('Message sent successfully');
    } catch {
      alert('Failed to send message');
    } finally {
      setMessageSending(false);
    }
  };

  const statusColor = (s: string) =>
    s === 'CONFIRMED' ? 'var(--color-success)' :
    s === 'CANCELLED' ? 'var(--color-error)' : 'var(--color-warning)';

  const statusBg = (s: string) =>
    s === 'CONFIRMED' ? 'var(--color-success-bg)' :
    s === 'CANCELLED' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)';

  const totalRevenue = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + b.totalCost, 0);
  const totalTickets = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + b.numberOfTickets, 0);

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, padding: isMobile ? '20px 16px' : '40px 24px' }}>

        {/* Header */}
        <button style={styles.backLink} onClick={() => navigate('/my-events')}>
          ← Back to My Events
        </button>
        <div style={styles.header}>
          <div>
            <h1 style={{ ...styles.title, fontSize: isMobile ? '1.5rem' : '2rem' }}>Bookings</h1>
            <p style={styles.subtitle}>{eventTitle}</p>
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Summary */}
        <div style={{ ...styles.summaryCards, gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)' }}>
          {[
            { label: 'Total', value: bookings.length },
            { label: 'Tickets', value: totalTickets },
            { label: 'Revenue', value: `€${totalRevenue.toFixed(0)}` },
          ].map((s) => (
            <div key={s.label} style={styles.summaryCard}>
              <p style={styles.summaryLabel}>{s.label}</p>
              <p style={{ ...styles.summaryValue, fontSize: isMobile ? '1.3rem' : '1.6rem' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={styles.loadingState}>Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>🎫</p>
            <h3 style={styles.emptyTitle}>No bookings yet</h3>
            <p style={styles.emptyText}>Bookings will appear here once users reserve tickets.</p>
          </div>
        ) : isMobile ? (
          /* Mobile: card list instead of table */
          <div style={styles.mobileList}>
            {bookings.map((booking) => (
              <div key={booking.id} style={styles.mobileCard}>
                <div style={styles.mobileCardTop}>
                  <div>
                    <p style={styles.mobileAttendeeName}>
                      {(booking.attendee as any)?.firstName} {(booking.attendee as any)?.lastName}
                    </p>
                    <p style={styles.mobileAttendeeHandle}>@{(booking.attendee as any)?.username}</p>
                  </div>
                  <span style={{
                    ...styles.statusPill,
                    color: statusColor(booking.status),
                    backgroundColor: statusBg(booking.status),
                  }}>
                    {booking.status}
                  </span>
                </div>
                <div style={styles.mobileCardMeta}>
                  <span>{(booking.ticketType as any)?.name}</span>
                  <span>·</span>
                  <span>{booking.numberOfTickets} ticket{booking.numberOfTickets > 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span style={{ fontWeight: '600' }}>€{booking.totalCost.toFixed(2)}</span>
                </div>
                <div style={styles.mobileCardFooter}>
                  <span style={styles.bookingIdText}>{booking.bookingId}</span>
                  <button
                    style={styles.msgBtn}
                    onClick={() => { setSelectedBooking(booking); setShowMessageModal(true); }}
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  {['Booking ID', 'Attendee', 'Ticket Type', 'Qty', 'Total', 'Status', 'Date', ''].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.bookingId}>{booking.bookingId}</span>
                    </td>
                    <td style={styles.td}>
                      <p style={styles.attendeeName}>
                        {(booking.attendee as any)?.firstName} {(booking.attendee as any)?.lastName}
                      </p>
                      <p style={styles.attendeeHandle}>@{(booking.attendee as any)?.username}</p>
                    </td>
                    <td style={styles.td}>{(booking.ticketType as any)?.name}</td>
                    <td style={styles.td}>{booking.numberOfTickets}</td>
                    <td style={styles.td}>€{booking.totalCost.toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusPill,
                        color: statusColor(booking.status),
                        backgroundColor: statusBg(booking.status),
                      }}>
                        {booking.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(booking.time).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.msgBtn}
                        onClick={() => { setSelectedBooking(booking); setShowMessageModal(true); }}
                      >
                        Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedBooking && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: isMobile ? '92%' : '480px' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Send Message</h2>
              <button style={styles.modalCloseBtn} onClick={() => { setShowMessageModal(false); setMessageBody(''); }}>✕</button>
            </div>
            <p style={styles.modalMeta}>
              To: <strong>{(selectedBooking.attendee as any)?.firstName} {(selectedBooking.attendee as any)?.lastName}</strong>
            </p>
            <p style={styles.modalSubject}>Subject: Regarding your booking for {eventTitle}</p>
            <textarea
              style={styles.modalTextarea}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Type your message..."
              rows={5}
            />
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => { setShowMessageModal(false); setMessageBody(''); }}>
                Cancel
              </button>
              <button
                style={styles.sendBtn}
                onClick={handleSendMessage}
                disabled={messageSending || !messageBody.trim()}
              >
                {messageSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: 'var(--color-bg)' },
  container: { maxWidth: '1100px', margin: '0 auto' },
  backLink: {
    padding: '0', border: 'none', backgroundColor: 'transparent',
    color: 'var(--color-text-muted)', fontSize: '0.875rem',
    cursor: 'pointer', marginBottom: '16px', display: 'block',
  },
  header: { marginBottom: '24px' },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em', marginBottom: '4px',
  },
  subtitle: { fontSize: '0.9rem', color: 'var(--color-text-muted)' },
  errorBox: {
    padding: '12px 16px', borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '20px',
  },
  summaryCards: {
    display: 'grid',
    gap: '12px', marginBottom: '24px',
  },
  summaryCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '16px',
  },
  summaryLabel: {
    fontSize: '0.72rem', fontWeight: '500',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  summaryValue: {
    fontWeight: '700',
    color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
  },
  loadingState: {
    textAlign: 'center' as const, padding: '60px',
    color: 'var(--color-text-muted)', fontSize: '0.9rem',
  },
  emptyState: {
    textAlign: 'center' as const, padding: '60px 24px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
  },
  emptyIcon: { fontSize: '2.5rem', marginBottom: '16px' },
  emptyTitle: { fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '8px' },
  emptyText: { fontSize: '0.875rem', color: 'var(--color-text-muted)' },
  mobileList: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  mobileCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '16px',
    display: 'flex', flexDirection: 'column' as const, gap: '10px',
  },
  mobileCardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  mobileAttendeeName: { fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '2px' },
  mobileAttendeeHandle: { fontSize: '0.78rem', color: 'var(--color-text-muted)' },
  mobileCardMeta: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '0.82rem', color: 'var(--color-text-secondary)',
    flexWrap: 'wrap' as const,
  },
  mobileCardFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: '10px', borderTop: '1px solid var(--color-border)',
  },
  bookingIdText: { fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' },
  tableWrapper: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  thead: { backgroundColor: 'var(--color-bg)' },
  th: {
    padding: '12px 16px', textAlign: 'left' as const,
    fontSize: '0.72rem', fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    borderBottom: '1px solid var(--color-border)',
    whiteSpace: 'nowrap' as const,
  },
  tr: { borderBottom: '1px solid var(--color-border)' },
  td: { padding: '14px 16px', fontSize: '0.875rem', color: 'var(--color-text-primary)' },
  bookingId: { fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--color-text-muted)' },
  attendeeName: { fontWeight: '500', marginBottom: '2px', fontSize: '0.875rem' },
  attendeeHandle: { fontSize: '0.78rem', color: 'var(--color-text-muted)' },
  statusPill: {
    padding: '2px 8px', borderRadius: '100px',
    fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.04em',
    whiteSpace: 'nowrap' as const,
  },
  msgBtn: {
    padding: '6px 12px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)', backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)', fontSize: '0.78rem',
    fontWeight: '500', cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(4px)', padding: '16px',
  },
  modal: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)', padding: '28px',
    width: '100%', boxShadow: 'var(--shadow-lg)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '16px',
  },
  modalTitle: { fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-primary)' },
  modalCloseBtn: {
    width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)', backgroundColor: 'transparent',
    color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem',
  },
  modalMeta: { fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '4px' },
  modalSubject: { fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '16px' },
  modalTextarea: {
    width: '100%', padding: '10px 14px',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)', fontSize: '0.9rem',
    color: 'var(--color-text-primary)', outline: 'none',
    resize: 'vertical' as const, marginBottom: '16px',
    boxSizing: 'border-box' as const,
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' as const },
  cancelBtn: {
    padding: '9px 18px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)', fontSize: '0.875rem', cursor: 'pointer',
  },
  sendBtn: {
    padding: '9px 20px', borderRadius: 'var(--radius-md)',
    border: 'none', backgroundColor: 'var(--color-accent)',
    color: '#fff', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
};