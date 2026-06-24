import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<number | null>(null);
  const [numberOfTickets, setNumberOfTickets] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => { fetchEvent(); }, [id]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = (lat: number, lng: number) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current).setView([lat, lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${event!.title}</b><br>${event!.venue}`)
        .openPopup();
      mapInstanceRef.current = map;
    };

    const tryGeocode = async (queries: string[]) => {
      for (const query of queries) {
        if (!query.trim()) continue;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
          );
          const data = await res.json();
          if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
        } catch {}
      }
      return null;
    };

    if (event?.geoLat && event?.geoLng) {
      initMap(event.geoLat, event.geoLng);
    } else if (event?.venue || event?.city || event?.country) {
      const venue = event.venue ?? '';
      const city = event.city ?? '';
      const country = event.country ?? '';

      setTimeout(async () => {
        if (mapInstanceRef.current) return;
        const result = await tryGeocode([
          `${venue} ${city} ${country}`.trim(),
          `${city} ${country}`.trim(),
          country.trim(),
        ]);
        if (result && mapRef.current && !mapInstanceRef.current) {
          initMap(result.lat, result.lng);
        }
      }, 300);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [event]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
      if (res.data.ticketTypes?.length > 0) {
        setSelectedTicketTypeId(res.data.ticketTypes[0].id);
      }
      if (isAuthenticated) {
        try { await api.post(`/events/${id}/view`); } catch {}
      }
    } catch {
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const selectedTicketType = event?.ticketTypes.find((t) => t.id === selectedTicketTypeId);
  const totalCost = selectedTicketType ? selectedTicketType.price * numberOfTickets : 0;

  const handleBookingSubmit = async () => {
    if (!selectedTicketTypeId || !event) return;
    setBookingLoading(true);
    setBookingError('');
    try {
      await api.post('/bookings', {
        eventId: event.id,
        ticketTypeId: selectedTicketTypeId,
        numberOfTickets,
      });
      setBookingSuccess(true);
      setShowConfirm(false);
      fetchEvent();
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Booking failed');
      setShowConfirm(false);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <div style={styles.page}><Navbar />
      <div style={styles.centerState}>Loading event...</div>
    </div>
  );

  if (error || !event) return (
    <div style={styles.page}><Navbar />
      <div style={styles.centerState}>{error || 'Event not found'}</div>
    </div>
  );

  const BookingPanel = (
    <div style={styles.bookingCard}>
      <h2 style={styles.bookingTitle}>Book Tickets</h2>

      {event.status !== 'PUBLISHED' ? (
        <div style={styles.unavailableBox}>
          This event is <strong>{event.status.toLowerCase()}</strong> and not available for booking.
        </div>
      ) : bookingSuccess ? (
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✓</div>
          <p style={styles.successText}>Booking confirmed!</p>
          <button style={styles.bookAgainBtn} onClick={() => setBookingSuccess(false)}>
            Book Again
          </button>
        </div>
      ) : (
        <>
          {bookingError && <div style={styles.bookingError}>{bookingError}</div>}

          <div style={styles.ticketSection}>
            <p style={styles.fieldLabel}>Ticket Type</p>
            {event.ticketTypes.map((t) => (
              <div
                key={t.id}
                style={{
                  ...styles.ticketOption,
                  ...(selectedTicketTypeId === t.id ? styles.ticketSelected : {}),
                  ...(t.available === 0 ? styles.ticketSoldOut : {}),
                }}
                onClick={() => { if (t.available > 0) setSelectedTicketTypeId(t.id); }}
              >
                <div>
                  <p style={styles.ticketName}>{t.name}</p>
                  <p style={styles.ticketAvail}>
                    {t.available > 0 ? `${t.available} available` : 'Sold out'}
                  </p>
                </div>
                <span style={styles.ticketPrice}>€{t.price}</span>
              </div>
            ))}
          </div>

          <div style={styles.quantitySection}>
            <p style={styles.fieldLabel}>Quantity</p>
            <div style={styles.qtyRow}>
              <button
                style={styles.qtyBtn}
                onClick={() => setNumberOfTickets((n) => Math.max(1, n - 1))}
              >−</button>
              <span style={styles.qtyValue}>{numberOfTickets}</span>
              <button
                style={styles.qtyBtn}
                onClick={() => setNumberOfTickets((n) => Math.min(selectedTicketType?.available ?? 1, n + 1))}
              >+</button>
            </div>
          </div>

          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Total</span>
            <span style={styles.totalValue}>€{totalCost.toFixed(2)}</span>
          </div>

          {!isAuthenticated ? (
            <button style={styles.primaryBtn} onClick={() => navigate('/')}>
              Sign in to Book
            </button>
          ) : (
            <button
              style={styles.primaryBtn}
              onClick={() => setShowConfirm(true)}
              disabled={bookingLoading || !selectedTicketTypeId || (selectedTicketType?.available ?? 0) === 0}
            >
              {bookingLoading ? 'Processing...' : 'Book Now'}
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, padding: isMobile ? '20px 16px 100px' : '32px 24px' }}>
        {!isMobile && (
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
        )}

        <div style={{ ...styles.layout, gridTemplateColumns: isMobile ? '1fr' : '1fr 340px' }}>
          {/* Left */}
          <div style={styles.mainCol}>

            {/* Hero Card */}
            <div style={{ ...styles.heroCard, padding: isMobile ? '20px' : '32px' }}>
              <div style={styles.heroMeta}>
                <span style={styles.eventTypeBadge}>{event.eventType}</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: event.status === 'PUBLISHED' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                  color: event.status === 'PUBLISHED' ? 'var(--color-success)' : 'var(--color-error)',
                }}>
                  {event.status}
                </span>
              </div>
              <h1 style={{ ...styles.eventTitle, fontSize: isMobile ? '1.5rem' : '2rem' }}>{event.title}</h1>
              <div style={styles.categories}>
                {event.categories.map((c) => (
                  <span key={c.category.id} style={styles.categoryTag}>
                    {c.category.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Booking panel inline on mobile, right after hero */}
            {isMobile && BookingPanel}

            {/* Details Grid */}
            <div style={{ ...styles.card, padding: isMobile ? '20px' : '28px' }}>
              <h2 style={styles.cardTitle}>Event Details</h2>
              <div style={{ ...styles.detailGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                {[
                  { icon: '📍', label: 'Venue', value: event.venue, sub: `${event.address}, ${event.city}, ${event.country}` },
                  { icon: '🗓', label: 'Start', value: new Date(event.startDateTime).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), sub: new Date(event.startDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
                  { icon: '🏁', label: 'End', value: new Date(event.endDateTime).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), sub: new Date(event.endDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
                  { icon: '👤', label: 'Organizer', value: `${event.organizer?.firstName} ${event.organizer?.lastName}`, sub: `@${event.organizer?.username}` },
                ].map((item) => (
                  <div key={item.label} style={styles.detailItem}>
                    <span style={styles.detailIcon}>{item.icon}</span>
                    <div>
                      <p style={styles.detailLabel}>{item.label}</p>
                      <p style={styles.detailValue}>{item.value}</p>
                      {item.sub && <p style={styles.detailSub}>{item.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ ...styles.card, padding: isMobile ? '20px' : '28px' }}>
              <h2 style={styles.cardTitle}>About this Event</h2>
              <p style={styles.description}>{event.description}</p>
            </div>

            {/* Photos */}
            {event.photos && event.photos.length > 0 && (
              <div style={{ ...styles.card, padding: isMobile ? '20px' : '28px' }}>
                <h2 style={styles.cardTitle}>Photos</h2>
                <div style={styles.photoGrid}>
                  {event.photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={`/uploads/${photo.filename}`}
                      style={{ ...styles.photoImg, width: isMobile ? '100%' : '180px' }}
                      alt="event"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {((event.geoLat && event.geoLng) || event.venue || event.city || event.country) && (
              <div style={{ ...styles.card, padding: isMobile ? '20px' : '28px' }}>
                <h2 style={styles.cardTitle}>Location</h2>
                <div ref={mapRef} style={styles.map} />
              </div>
            )}
          </div>

          {/* Right: Booking (desktop only — mobile shows it inline above) */}
          {!isMobile && (
            <div style={styles.sideCol}>
              {BookingPanel}
              <div style={styles.capacityCard}>
                <p style={styles.capacityLabel}>Capacity</p>
                <p style={styles.capacityValue}>{event.capacity} seats</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: isMobile ? '90%' : '440px' }}>
            <h2 style={styles.modalTitle}>Confirm Booking</h2>
            <p style={styles.modalText}>
              You are about to book{' '}
              <strong>{numberOfTickets} × {selectedTicketType?.name}</strong>{' '}
              for <strong>{event.title}</strong>.
            </p>
            <p style={styles.modalTotal}>Total: <strong>€{totalCost.toFixed(2)}</strong></p>
            <p style={styles.modalWarning}>
              ⚠ Bookings cannot be cancelled after confirmation.
            </p>
            <div style={styles.modalActions}>
              <button style={styles.modalCancelBtn} onClick={() => setShowConfirm(false)}>
                Go Back
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={handleBookingSubmit}
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Processing...' : 'Confirm Booking'}
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
  container: { maxWidth: '1200px', margin: '0 auto' },
  centerState: { textAlign: 'center', padding: '80px', color: 'var(--color-text-muted)' },
  backBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    marginBottom: '24px',
    cursor: 'pointer',
  },
  layout: {
    display: 'grid',
    gap: '24px',
    alignItems: 'start',
  },
  mainCol: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  sideCol: { display: 'flex', flexDirection: 'column' as const, gap: '16px', position: 'sticky', top: '80px' },
  heroCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
  },
  heroMeta: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' as const },
  eventTypeBadge: {
    fontSize: '0.72rem', fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    padding: '4px 10px',
    borderRadius: '100px',
    border: '1px solid var(--color-border)',
  },
  statusBadge: {
    fontSize: '0.72rem', fontWeight: '600',
    padding: '4px 10px', borderRadius: '100px',
    letterSpacing: '0.04em',
  },
  eventTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    marginBottom: '16px',
  },
  categories: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  categoryTag: {
    padding: '4px 12px', borderRadius: '100px',
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-accent)',
    fontSize: '0.78rem', fontWeight: '500',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
  },
  cardTitle: {
    fontSize: '0.95rem', fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--color-border)',
  },
  detailGrid: { display: 'grid', gap: '20px' },
  detailItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  detailIcon: { fontSize: '1.2rem', flexShrink: 0, marginTop: '2px' },
  detailLabel: { fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: '500', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '3px' },
  detailValue: { fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '2px' },
  detailSub: { fontSize: '0.8rem', color: 'var(--color-text-secondary)' },
  description: { fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.8' },
  photoGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '12px' },
  photoImg: { height: '130px', objectFit: 'cover' as const, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' },
  map: { height: '280px', borderRadius: 'var(--radius-md)', overflow: 'hidden' },
  bookingCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '24px',
  },
  bookingTitle: {
    fontSize: '1rem', fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: '20px',
    paddingBottom: '14px',
    borderBottom: '1px solid var(--color-border)',
  },
  fieldLabel: { fontSize: '0.78rem', fontWeight: '500', color: 'var(--color-text-muted)', marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  ticketSection: { marginBottom: '20px' },
  ticketOption: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    marginBottom: '8px', cursor: 'pointer',
    transition: 'all var(--transition)',
  },
  ticketSelected: { border: '1.5px solid var(--color-accent)', backgroundColor: 'var(--color-accent-light)' },
  ticketSoldOut: { opacity: 0.5, cursor: 'not-allowed' },
  ticketName: { fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '2px' },
  ticketAvail: { fontSize: '0.75rem', color: 'var(--color-text-muted)' },
  ticketPrice: { fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)' },
  quantitySection: { marginBottom: '20px' },
  qtyRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  qtyBtn: {
    width: '34px', height: '34px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    fontSize: '1.1rem', color: 'var(--color-text-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  qtyValue: { fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-primary)', minWidth: '24px', textAlign: 'center' as const },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderTop: '1px solid var(--color-border)',
    borderBottom: '1px solid var(--color-border)', marginBottom: '16px',
  },
  totalLabel: { fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-secondary)' },
  totalValue: { fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-text-primary)' },
  primaryBtn: {
    width: '100%', padding: '12px',
    borderRadius: 'var(--radius-md)', border: 'none',
    backgroundColor: 'var(--color-accent)', color: '#fff',
    fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
  },
  unavailableBox: {
    padding: '14px', borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)', fontSize: '0.875rem',
    textAlign: 'center' as const,
  },
  bookingError: {
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '16px',
  },
  successBox: { textAlign: 'center' as const, padding: '24px' },
  successIcon: {
    width: '48px', height: '48px', borderRadius: '50%',
    backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)',
    fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px',
  },
  successText: { fontSize: '1rem', fontWeight: '600', color: 'var(--color-success)', marginBottom: '16px' },
  bookAgainBtn: {
    padding: '9px 20px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)', fontSize: '0.875rem', cursor: 'pointer',
  },
  capacityCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '16px 20px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  capacityLabel: { fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: '500', textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
  capacityValue: { fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-primary)' },
  modalOverlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(4px)',
    padding: '16px',
  },
  modal: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    padding: '28px', width: '100%',
    boxShadow: 'var(--shadow-lg)',
  },
  modalTitle: { fontSize: '1.2rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '16px' },
  modalText: { fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.6', marginBottom: '10px' },
  modalTotal: { fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '12px' },
  modalWarning: { fontSize: '0.82rem', color: 'var(--color-warning)', marginBottom: '24px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' as const },
  modalCancelBtn: {
    padding: '9px 18px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)', fontSize: '0.875rem', cursor: 'pointer',
  },
  modalConfirmBtn: {
    padding: '9px 20px', borderRadius: 'var(--radius-md)',
    border: 'none', backgroundColor: 'var(--color-accent)',
    color: '#fff', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
};