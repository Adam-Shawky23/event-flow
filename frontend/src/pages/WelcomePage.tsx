import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useIsMobile } from '../hooks/useIsMobile';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const isMobile = useIsMobile();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.access_token, res.data.user);
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.page, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
      {!isMobile && (
        <div style={styles.left}>
          <div style={styles.leftContent}>
            <div style={styles.badge}>Event Management Platform</div>
            <h1 style={styles.headline}>
              Discover &<br />Book Events
            </h1>
            <p style={styles.subtext}>
              Create, manage, and attend events with ease.
              From intimate gatherings to large conferences.
            </p>
            <div style={styles.stats}>
              {[
                { value: '4 Roles', label: 'Admin, Organizer, Participant, Guest' },
                { value: 'Real-time', label: 'Capacity & availability tracking' },
                { value: 'Smart', label: 'Personalized recommendations' },
              ].map((stat) => (
                <div key={stat.value} style={styles.stat}>
                  <span style={styles.statValue}>{stat.value}</span>
                  <span style={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ ...styles.right, padding: isMobile ? '32px 20px' : '64px' }}>
        <div style={styles.formCard}>

          {isMobile && (
            <div style={styles.mobileHeader}>
              <span style={styles.mobileLogo}>EventFlow</span>
              <p style={styles.mobileTagline}>Discover & book events</p>
            </div>
          )}

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSubtitle}>Sign in to your account</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button style={styles.primaryBtn} type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>New to EventFlow?</span>
          </div>

          <button style={styles.secondaryBtn} onClick={() => navigate('/register')}>
            Create an account
          </button>

          <button style={styles.ghostBtn} onClick={() => navigate('/events')}>
            Browse events as guest →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'grid',
  },
  left: {
    backgroundColor: 'var(--color-text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
  },
  leftContent: {
    maxWidth: '440px',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '100px',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.78rem',
    fontWeight: '500',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    marginBottom: '32px',
  },
  headline: {
    fontFamily: 'var(--font-display)',
    fontSize: '3.5rem',
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: '1.15',
    letterSpacing: '-0.02em',
    marginBottom: '20px',
  },
  subtext: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: '1.7',
    marginBottom: '48px',
  },
  stats: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    paddingLeft: '16px',
    borderLeft: '2px solid var(--color-accent)',
  },
  statValue: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.5)',
  },
  right: {
    backgroundColor: 'var(--color-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: '380px',
  },
  mobileHeader: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  mobileLogo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
  },
  mobileTagline: {
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  formHeader: {
    marginBottom: '32px',
  },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '6px',
  },
  formSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
  },
  errorBox: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)',
    fontSize: '0.875rem',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.01em',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontSize: '0.9rem',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color var(--transition)',
    boxSizing: 'border-box' as const,
  },
  primaryBtn: {
    width: '100%',
    padding: '11px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: 'var(--color-accent)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginTop: '4px',
    transition: 'background-color var(--transition)',
  },
  divider: {
    textAlign: 'center' as const,
    margin: '24px 0 16px',
  },
  dividerText: {
    fontSize: '0.82rem',
    color: 'var(--color-text-muted)',
  },
  secondaryBtn: {
    width: '100%',
    padding: '11px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginBottom: '10px',
    transition: 'all var(--transition)',
  },
  ghostBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    fontSize: '0.875rem',
    transition: 'color var(--transition)',
  },
};