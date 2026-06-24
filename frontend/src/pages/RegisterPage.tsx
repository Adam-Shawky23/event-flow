import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useIsMobile } from '../hooks/useIsMobile';

export default function RegisterPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    username: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', country: '', vatNumber: '',
    geoLat: '', geoLng: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: form.username,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        country: form.country,
        vatNumber: form.vatNumber,
        geoLat: form.geoLat ? parseFloat(form.geoLat) : undefined,
        geoLng: form.geoLng ? parseFloat(form.geoLng) : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.successCard, padding: isMobile ? '32px 20px' : '48px' }}>
          <div style={styles.successIconWrap}>✓</div>
          <h2 style={styles.successTitle}>Registration Submitted</h2>
          <p style={styles.successText}>
            Your account is pending approval by the administrator.
            You will be notified once your account has been approved.
          </p>
          <button style={styles.backBtn} onClick={() => navigate('/')}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ ...styles.container, padding: isMobile ? '24px 16px 48px' : '48px 24px' }}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backLink} onClick={() => navigate('/')}>
            ← Back to Sign In
          </button>
          <div style={styles.headerText}>
            <h1 style={{ ...styles.title, fontSize: isMobile ? '1.6rem' : '2rem' }}>Create Account</h1>
            <p style={styles.subtitle}>Join EventFlow to discover and manage events</p>
          </div>
        </div>

        {error && <div style={styles.errorBox}>⚠ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Personal Info */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            <div style={{ ...styles.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div style={styles.field}>
                <label style={styles.label}>First Name *</label>
                <input style={styles.input} name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Last Name *</label>
                <input style={styles.input} name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" required />
              </div>
            </div>
            <div style={{ ...styles.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div style={styles.field}>
                <label style={styles.label}>Email *</label>
                <input style={styles.input} type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Phone *</label>
                <input style={styles.input} name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" required />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>VAT Number *</label>
              <input style={styles.input} name="vatNumber" value={form.vatNumber} onChange={handleChange} placeholder="VAT number" required />
            </div>
          </div>

          {/* Account */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Account Credentials</h3>
            <div style={styles.field}>
              <label style={styles.label}>Username *</label>
              <input style={styles.input} name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required />
            </div>
            <div style={{ ...styles.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div style={styles.field}>
                <label style={styles.label}>Password *</label>
                <input style={styles.input} type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Confirm Password *</label>
                <input style={styles.input} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
              </div>
            </div>
          </div>

          {/* Address */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Address & Location</h3>
            <div style={styles.field}>
              <label style={styles.label}>Street Address *</label>
              <input style={styles.input} name="address" value={form.address} onChange={handleChange} placeholder="Street address" required />
            </div>
            <div style={{ ...styles.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div style={styles.field}>
                <label style={styles.label}>City *</label>
                <input style={styles.input} name="city" value={form.city} onChange={handleChange} placeholder="City" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Country *</label>
                <input style={styles.input} name="country" value={form.country} onChange={handleChange} placeholder="Country" required />
              </div>
            </div>
            <div style={{ ...styles.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
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

          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg)',
    display: 'flex',
    justifyContent: 'center',
  },
  container: { width: '100%', maxWidth: '640px' },
  header: { marginBottom: '28px' },
  backLink: {
    padding: '0', border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    fontSize: '0.875rem', cursor: 'pointer',
    marginBottom: '20px', display: 'block',
  },
  headerText: {},
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em', marginBottom: '6px',
  },
  subtitle: { fontSize: '0.9rem', color: 'var(--color-text-muted)' },
  errorBox: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)',
    fontSize: '0.875rem', marginBottom: '24px',
    display: 'flex', alignItems: 'center', gap: '8px',
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
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--color-border)',
  },
  grid2: { display: 'grid', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: {
    fontSize: '0.78rem', fontWeight: '500',
    color: 'var(--color-text-secondary)',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    fontSize: '0.9rem', color: 'var(--color-text-primary)',
    outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  },
  submitBtn: {
    padding: '13px',
    borderRadius: 'var(--radius-md)', border: 'none',
    backgroundColor: 'var(--color-accent)', color: '#fff',
    fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
  },
  successCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    maxWidth: '440px', width: '90%',
    margin: 'auto', textAlign: 'center' as const,
    boxShadow: 'var(--shadow-md)',
  },
  successIconWrap: {
    width: '56px', height: '56px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    fontSize: '1.5rem', fontWeight: '600',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem', fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: '12px', letterSpacing: '-0.01em',
  },
  successText: {
    fontSize: '0.9rem', color: 'var(--color-text-muted)',
    lineHeight: '1.7', marginBottom: '32px',
  },
  backBtn: {
    padding: '10px 24px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
  },
};