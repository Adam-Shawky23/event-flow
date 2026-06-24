import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useIsMobile } from '../hooks/useIsMobile';

interface TicketTypeForm {
  name: string;
  price: string;
  quantity: string;
}

export default function CreateEditEventPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '', eventType: '', venue: '', address: '',
    city: '', country: '', geoLat: '', geoLng: '',
    startDateTime: '', endDateTime: '', capacity: '',
    description: '', categories: '',
  });
  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
    { name: '', price: '', quantity: '' },
  ]);

  useEffect(() => { if (isEdit) fetchEvent(); }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      const e = res.data;
      setForm({
        title: e.title, eventType: e.eventType,
        venue: e.venue, address: e.address,
        city: e.city, country: e.country,
        geoLat: e.geoLat?.toString() ?? '',
        geoLng: e.geoLng?.toString() ?? '',
        startDateTime: new Date(e.startDateTime).toISOString().slice(0, 16),
        endDateTime: new Date(e.endDateTime).toISOString().slice(0, 16),
        capacity: e.capacity.toString(),
        description: e.description,
        categories: e.categories.map((c: any) => c.category.name).join(', '),
      });
      setTicketTypes(e.ticketTypes.map((t: any) => ({
        name: t.name, price: t.price.toString(), quantity: t.quantity.toString(),
      })));
      setPhotos(e.photos ?? []);
    } catch {
      setError('Failed to load event');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTicketChange = (index: number, field: keyof TicketTypeForm, value: string) => {
    const updated = [...ticketTypes];
    updated[index][field] = value;
    setTicketTypes(updated);
  };

  const totalTickets = ticketTypes.reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0);
  const capacity = parseInt(form.capacity) || 0;
  const capacityOk = totalTickets <= capacity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!capacityOk) {
      setError('Total ticket quantities cannot exceed event capacity');
      return;
    }
    const categoriesArray = form.categories.split(',').map((c) => c.trim()).filter(Boolean);
    if (!categoriesArray.length) {
      setError('Please enter at least one category');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: form.title, eventType: form.eventType,
        venue: form.venue, address: form.address,
        city: form.city, country: form.country,
        geoLat: form.geoLat ? parseFloat(form.geoLat) : undefined,
        geoLng: form.geoLng ? parseFloat(form.geoLng) : undefined,
        startDateTime: form.startDateTime, endDateTime: form.endDateTime,
        capacity: parseInt(form.capacity), description: form.description,
        categories: categoriesArray,
        ticketTypes: ticketTypes.map((t) => ({
          name: t.name, price: parseFloat(t.price), quantity: parseInt(t.quantity),
        })),
      };
      if (isEdit) {
        await api.patch(`/events/${id}`, payload);
      } else {
        await api.post('/events', payload);
      }
      navigate('/my-events');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <div style={styles.page}><Navbar />
      <div style={styles.loadingState}>Loading event...</div>
    </div>
  );

  const grid2 = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' } as React.CSSProperties;

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, padding: isMobile ? '20px 16px 48px' : '40px 24px' }}>
        <div style={styles.header}>
          <button style={styles.backLink} onClick={() => navigate('/my-events')}>
            ← Back to My Events
          </button>
          <h1 style={{ ...styles.title, fontSize: isMobile ? '1.5rem' : '2rem' }}>
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p style={styles.subtitle}>
            {isEdit ? 'Update your event details' : 'Fill in the details to create a new event'}
          </p>
        </div>

        {error && <div style={styles.errorBox}>⚠ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Basic Info */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Basic Information</h3>
            <div style={styles.field}>
              <label style={styles.label}>Event Title *</label>
              <input style={styles.input} name="title" value={form.title} onChange={handleChange} placeholder="Enter event title" required />
            </div>
            <div style={grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Event Type *</label>
                <input style={styles.input} name="eventType" value={form.eventType} onChange={handleChange} placeholder="e.g. Concert, Seminar" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Categories *</label>
                <input style={styles.input} name="categories" value={form.categories} onChange={handleChange} placeholder="e.g. Music, Live Performance" required />
                <span style={styles.hint}>Separate multiple with commas</span>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description *</label>
              <textarea style={styles.textarea} name="description" value={form.description} onChange={handleChange} placeholder="Full event description" rows={4} required />
            </div>
          </div>

          {/* Venue */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Venue & Location</h3>
            <div style={styles.field}>
              <label style={styles.label}>Venue Name *</label>
              <input style={styles.input} name="venue" value={form.venue} onChange={handleChange} placeholder="Venue name" required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Address *</label>
              <input style={styles.input} name="address" value={form.address} onChange={handleChange} placeholder="Street address" required />
            </div>
            <div style={grid2}>
              <div style={styles.field}>
                <label style={styles.label}>City *</label>
                <input style={styles.input} name="city" value={form.city} onChange={handleChange} placeholder="City" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Country *</label>
                <input style={styles.input} name="country" value={form.country} onChange={handleChange} placeholder="Country" required />
              </div>
            </div>
            <div style={grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Latitude (optional)</label>
                <input style={styles.input} name="geoLat" value={form.geoLat} onChange={handleChange} placeholder="e.g. 37.9838" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Longitude (optional)</label>
                <input style={styles.input} name="geoLng" value={form.geoLng} onChange={handleChange} placeholder="e.g. 23.7275" />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Date & Time</h3>
            <div style={grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Start Date & Time *</label>
                <input style={styles.input} type="datetime-local" name="startDateTime" value={form.startDateTime} onChange={handleChange} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>End Date & Time *</label>
                <input style={styles.input} type="datetime-local" name="endDateTime" value={form.endDateTime} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* Capacity & Tickets */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Capacity & Tickets</h3>
            <div style={styles.field}>
              <label style={styles.label}>Total Capacity *</label>
              <input style={styles.input} type="number" name="capacity" value={form.capacity} onChange={handleChange} placeholder="Total seats" min="1" required />
            </div>

            {form.capacity && (
              <div style={{
                ...styles.capacityIndicator,
                borderColor: capacityOk ? 'var(--color-success)' : 'var(--color-error)',
                backgroundColor: capacityOk ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                color: capacityOk ? 'var(--color-success)' : 'var(--color-error)',
              }}>
                {capacityOk ? '✓' : '✗'} Tickets allocated: {totalTickets} / {capacity}
              </div>
            )}

            <div style={styles.ticketHeader}>
              <p style={styles.ticketLabel}>Ticket Types</p>
              <button type="button" style={styles.addTicketBtn} onClick={() => setTicketTypes([...ticketTypes, { name: '', price: '', quantity: '' }])}>
                + Add Type
              </button>
            </div>

            {ticketTypes.map((ticket, index) => (
              <div key={index} style={styles.ticketRow}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr', gap: '12px', flex: 1 }}>
                  <div style={{ ...styles.field, gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                    <label style={styles.label}>Name *</label>
                    <input style={styles.input} value={ticket.name} onChange={(e) => handleTicketChange(index, 'name', e.target.value)} placeholder="e.g. General" required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Price (€) *</label>
                    <input style={styles.input} type="number" value={ticket.price} onChange={(e) => handleTicketChange(index, 'price', e.target.value)} placeholder="0.00" min="0" step="0.01" required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Quantity *</label>
                    <input style={styles.input} type="number" value={ticket.quantity} onChange={(e) => handleTicketChange(index, 'quantity', e.target.value)} placeholder="0" min="1" required />
                  </div>
                </div>
                {ticketTypes.length > 1 && (
                  <button type="button" style={styles.removeTicketBtn} onClick={() => setTicketTypes(ticketTypes.filter((_, i) => i !== index))}>
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Photos — edit only */}
          {isEdit && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Photos (optional)</h3>
              <input
                type="file"
                accept="image/*"
                style={styles.fileInput}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('photo', file);
                  try {
                    await api.post(`/events/${id}/photos`, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    const res = await api.get(`/events/${id}`);
                    setPhotos(res.data.photos ?? []);
                  } catch { alert('Failed to upload photo'); }
                  e.target.value = '';
                }}
              />
              {photos.length > 0 && (
                <div style={styles.photoGrid}>
                  {photos.map((photo: any) => (
                    <div key={photo.id} style={styles.photoItem}>
                      <img
                        src={`/uploads/${photo.filename}`}
                        style={{ ...styles.photoThumb, width: isMobile ? '100%' : '110px' }}
                        alt="event"
                      />
                      <button
                        type="button"
                        style={styles.photoDeleteBtn}
                        onClick={async () => {
                          try {
                            await api.delete(`/events/${id}/photos/${photo.id}`);
                            setPhotos(photos.filter((p: any) => p.id !== photo.id));
                          } catch { alert('Failed to delete photo'); }
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ ...styles.formActions, flexDirection: isMobile ? 'column' as const : 'row' as const }}>
            <button type="button" style={{ ...styles.cancelBtn, width: isMobile ? '100%' : 'auto' }} onClick={() => navigate('/my-events')}>
              Cancel
            </button>
            <button type="submit" style={{ ...styles.submitBtn, width: isMobile ? '100%' : 'auto' }} disabled={loading || !capacityOk}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: 'var(--color-bg)' },
  container: { maxWidth: '760px', margin: '0 auto' },
  loadingState: { textAlign: 'center' as const, padding: '80px', color: 'var(--color-text-muted)' },
  header: { marginBottom: '28px' },
  backLink: {
    padding: '0', border: 'none', backgroundColor: 'transparent',
    color: 'var(--color-text-muted)', fontSize: '0.875rem',
    cursor: 'pointer', marginBottom: '16px', display: 'block',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em', marginBottom: '6px',
  },
  subtitle: { fontSize: '0.9rem', color: 'var(--color-text-muted)' },
  errorBox: {
    padding: '12px 16px', borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '20px',
  },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  section: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '20px',
    display: 'flex', flexDirection: 'column' as const, gap: '14px',
  },
  sectionTitle: {
    fontSize: '0.78rem', fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    paddingBottom: '12px', borderBottom: '1px solid var(--color-border)',
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: { fontSize: '0.78rem', fontWeight: '500', color: 'var(--color-text-secondary)' },
  input: {
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    fontSize: '0.9rem', color: 'var(--color-text-primary)',
    outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  },
  textarea: {
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    fontSize: '0.9rem', color: 'var(--color-text-primary)',
    outline: 'none', resize: 'vertical' as const,
    width: '100%', boxSizing: 'border-box' as const,
  },
  hint: { fontSize: '0.75rem', color: 'var(--color-text-muted)' },
  capacityIndicator: {
    padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid', fontSize: '0.875rem', fontWeight: '500',
  },
  ticketHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  ticketLabel: { fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-primary)' },
  addTicketBtn: {
    padding: '6px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-accent)',
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-accent)', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
  },
  ticketRow: {
    display: 'flex', alignItems: 'flex-end', gap: '12px',
    padding: '16px', backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
  },
  removeTicketBtn: {
    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)', cursor: 'pointer', fontSize: '0.8rem',
    flexShrink: 0, marginBottom: '16px',
  },
  fileInput: { fontSize: '0.875rem', color: 'var(--color-text-secondary)' },
  photoGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '12px' },
  photoItem: { position: 'relative' as const, display: 'inline-block' },
  photoThumb: {
    height: '80px',
    objectFit: 'cover' as const, borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  },
  photoDeleteBtn: {
    position: 'absolute' as const, top: '-6px', right: '-6px',
    width: '20px', height: '20px', borderRadius: '50%',
    backgroundColor: 'var(--color-error)', color: '#fff',
    border: 'none', cursor: 'pointer', fontSize: '0.65rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  cancelBtn: {
    padding: '11px 22px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)', fontSize: '0.9rem', cursor: 'pointer',
  },
  submitBtn: {
    padding: '11px 28px', borderRadius: 'var(--radius-md)',
    border: 'none', backgroundColor: 'var(--color-accent)',
    color: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
  },
};