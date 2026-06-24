import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/messages/unread-count');
      setUnreadCount(res.data.unreadCount);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { label: 'Browse', path: '/events', show: true },
    {
      label: 'My Events',
      path: '/my-events',
      show: isAuthenticated && user?.role !== 'ADMIN' && user?.role === 'ORGANIZER',
    },
    { label: 'Users', path: '/admin', show: isAuthenticated && user?.role === 'ADMIN' },
    { label: 'Export', path: '/admin/export', show: isAuthenticated && user?.role === 'ADMIN' },
  ].filter((l) => l.show);

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <div style={styles.left}>
          <span
            style={styles.logo}
            onClick={() =>
              navigate(
                !isAuthenticated ? '/' : user?.role === 'ADMIN' ? '/admin' : '/home'
              )
            }
          >
            EventFlow
          </span>

          {!isMobile && (
            <div style={styles.links}>
              {navLinks.map((link) => (
                <span
                  key={link.path}
                  style={{ ...styles.link, ...(isActive(link.path) ? styles.linkActive : {}) }}
                  onClick={() => navigate(link.path)}
                >
                  {link.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={styles.right}>
          {isAuthenticated ? (
            <>
              <button
                style={styles.iconBtn}
                onClick={() => navigate('/messages')}
                title="Messages"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
              </button>

              {!isMobile && (
                <div style={styles.userChip}>
                  <div style={styles.avatar}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <span style={styles.userName}>{user?.firstName}</span>
                  <span style={styles.roleTag}>{user?.role}</span>
                </div>
              )}

              {!isMobile && (
                <button style={styles.logoutBtn} onClick={handleLogout}>
                  Sign out
                </button>
              )}

              <button
                style={styles.hamburger}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu"
              >
                {menuOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <button style={styles.loginBtn} onClick={() => navigate('/')}>
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={styles.mobileMenu}>
          {isAuthenticated && (
            <div style={styles.mobileUserRow}>
              <div style={styles.avatar}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <p style={styles.mobileUserName}>{user?.firstName} {user?.lastName}</p>
                <span style={styles.roleTag}>{user?.role}</span>
              </div>
            </div>
          )}
          {navLinks.map((link) => (
            <span
              key={link.path}
              style={{ ...styles.mobileLink, ...(isActive(link.path) ? styles.mobileLinkActive : {}) }}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </span>
          ))}
          {isAuthenticated && (
            <button style={styles.mobileLogoutBtn} onClick={handleLogout}>
              Sign out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    minWidth: 0,
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  links: {
    display: 'flex',
    gap: '4px',
  },
  link: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    whiteSpace: 'nowrap',
  },
  linkActive: {
    color: 'var(--color-accent)',
    backgroundColor: 'var(--color-accent-light)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  iconBtn: {
    position: 'relative',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition)',
    flexShrink: 0,
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: 'var(--color-error)',
    color: '#fff',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    fontSize: '0.65rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px 4px 4px',
    borderRadius: '100px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: '600',
    flexShrink: 0,
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--color-text-primary)',
  },
  roleTag: {
    fontSize: '0.7rem',
    fontWeight: '500',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  logoutBtn: {
    padding: '7px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all var(--transition)',
    whiteSpace: 'nowrap',
  },
  loginBtn: {
    padding: '7px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'var(--color-accent)',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color var(--transition)',
  },
  hamburger: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mobileMenu: {
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    padding: '12px 16px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  mobileUserRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 4px 14px',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '8px',
  },
  mobileUserName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: '2px',
  },
  mobileLink: {
    padding: '12px 10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  mobileLinkActive: {
    color: 'var(--color-accent)',
    backgroundColor: 'var(--color-accent-light)',
  },
  mobileLogoutBtn: {
    marginTop: '8px',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
};