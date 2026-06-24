import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

export default function AdminExportPage() {
  const navigate = useNavigate();
  const [loadingJson, setLoadingJson] = useState(false);
  const [loadingXml, setLoadingXml] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExport = async (format: 'json' | 'xml') => {
    const setLoading = format === 'json' ? setLoadingJson : setLoadingXml;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.get(`/export/${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `events.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(`events.${format} downloaded successfully`);
    } catch {
      setError(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backLink} onClick={() => navigate('/admin')}>
            ← Back to Users
          </button>
          <h1 style={styles.title}>Export Data</h1>
          <p style={styles.subtitle}>
            Download all events data in your preferred format
          </p>
        </div>

        {error && <div style={styles.errorBox}>⚠ {error}</div>}
        {success && <div style={styles.successBox}>✓ {success}</div>}

        {/* Export Cards */}
        <div style={styles.cards}>
          {[
            {
              format: 'json' as const,
              label: 'JSON',
              description: 'Download all events, bookings, ticket types, and related data in JSON format. Suitable for data processing and API integration.',
              features: ['All events with full details', 'Bookings and attendees', 'Ticket types and availability', 'Organizer information'],
              loading: loadingJson,
              accent: 'var(--color-accent)',
              accentBg: 'var(--color-accent-light)',
            },
            {
              format: 'xml' as const,
              label: 'XML',
              description: 'Download all events in XML format following the DTD specification defined in the application requirements.',
              features: ['DTD-compliant XML structure', 'All events and bookings', 'Ticket types per event', 'Media and photo references'],
              loading: loadingXml,
              accent: 'var(--color-warning)',
              accentBg: 'var(--color-warning-bg)',
            },
          ].map((item) => (
            <div key={item.format} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{
                  ...styles.formatBadge,
                  color: item.accent,
                  backgroundColor: item.accentBg,
                }}>
                  {item.label}
                </div>
              </div>
              <p style={styles.cardDesc}>{item.description}</p>
              <ul style={styles.featureList}>
                {item.features.map((f) => (
                  <li key={f} style={styles.featureItem}>
                    <span style={styles.featureCheck}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                style={{
                  ...styles.downloadBtn,
                  backgroundColor: item.accent,
                }}
                onClick={() => handleExport(item.format)}
                disabled={item.loading}
              >
                {item.loading ? 'Downloading...' : `↓ Download ${item.label}`}
              </button>
            </div>
          ))}
        </div>

        {/* Info */}
        <div style={styles.infoBox}>
          <span style={styles.infoIcon}>ℹ</span>
          <p style={styles.infoText}>
            The export includes all events regardless of their status (DRAFT, PUBLISHED,
            COMPLETED, CANCELLED). Each export is generated in real-time from the current
            database state.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: 'var(--color-bg)' },
  container: { maxWidth: '860px', margin: '0 auto', padding: '40px 24px' },
  header: { marginBottom: '32px' },
  backLink: {
    padding: '0', border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    fontSize: '0.875rem', cursor: 'pointer',
    marginBottom: '16px', display: 'block',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem', fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em', marginBottom: '6px',
  },
  subtitle: { fontSize: '0.9rem', color: 'var(--color-text-muted)' },
  errorBox: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)',
    fontSize: '0.875rem', marginBottom: '20px',
  },
  successBox: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    fontSize: '0.875rem', marginBottom: '20px',
  },
  cards: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '20px', marginBottom: '24px',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '28px',
    display: 'flex', flexDirection: 'column' as const, gap: '16px',
  },
  cardHeader: {},
  formatBadge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.9rem', fontWeight: '700',
    letterSpacing: '0.06em',
  },
  cardDesc: {
    fontSize: '0.875rem', color: 'var(--color-text-secondary)',
    lineHeight: '1.6',
  },
  featureList: {
    listStyle: 'none', display: 'flex',
    flexDirection: 'column' as const, gap: '8px',
    flex: 1,
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '0.82rem', color: 'var(--color-text-secondary)',
  },
  featureCheck: {
    color: 'var(--color-success)',
    fontSize: '0.75rem', fontWeight: '700', flexShrink: 0,
  },
  downloadBtn: {
    padding: '11px 20px',
    borderRadius: 'var(--radius-md)', border: 'none',
    color: '#fff', fontSize: '0.9rem', fontWeight: '600',
    cursor: 'pointer', marginTop: 'auto',
  },
  infoBox: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
  },
  infoIcon: {
    color: 'var(--color-accent)', fontSize: '1rem',
    fontWeight: '600', flexShrink: 0,
  },
  infoText: {
    fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.6',
  },
};