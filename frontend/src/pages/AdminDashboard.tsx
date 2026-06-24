import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { User } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await api.patch(`/users/${id}/approve`);
      await fetchUsers();
      if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, status: 'APPROVED' });
    } catch {
      setError('Failed to approve user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(true);
    try {
      await api.patch(`/users/${id}/reject`);
      await fetchUsers();
      if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, status: 'REJECTED' });
    } catch {
      setError('Failed to reject user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (id: number, role: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/users/${id}/role`, { role });
      await fetchUsers();
      if (selectedUser?.id === id) setSelectedUser({ ...selectedUser, role: role as any });
    } catch {
      setError('Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    filterStatus === 'ALL' ? true : u.status === filterStatus
  );

  const pendingCount = users.filter((u) => u.status === 'PENDING').length;

  const statusColor = (s: string) =>
    s === 'APPROVED' ? 'var(--color-success)' :
    s === 'REJECTED' ? 'var(--color-error)' : 'var(--color-warning)';

  const statusBg = (s: string) =>
    s === 'APPROVED' ? 'var(--color-success-bg)' :
    s === 'REJECTED' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)';

  // On mobile: show either list OR detail, never both
  const showList = !isMobile || !selectedUser;
  const showDetail = !isMobile || !!selectedUser;

  const DetailContent = selectedUser ? (
    <>
      {/* User Header */}
      <div style={styles.detailHeader}>
        <div style={styles.detailAvatar}>
          {selectedUser.firstName[0]}{selectedUser.lastName[0]}
        </div>
        <div style={styles.detailHeaderInfo}>
          <h2 style={styles.detailName}>
            {selectedUser.firstName} {selectedUser.lastName}
          </h2>
          <p style={styles.detailHandle}>@{selectedUser.username}</p>
          <div style={styles.detailBadges}>
            <span style={{
              ...styles.statusPill,
              color: statusColor(selectedUser.status),
              backgroundColor: statusBg(selectedUser.status),
            }}>
              {selectedUser.status}
            </span>
            <span style={styles.rolePill}>{selectedUser.role}</span>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ ...styles.fieldGrid, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
        {[
          { label: 'Email', value: selectedUser.email },
          { label: 'Phone', value: selectedUser.phone },
          { label: 'Address', value: selectedUser.address },
          { label: 'City', value: selectedUser.city },
          { label: 'Country', value: selectedUser.country },
          { label: 'VAT Number', value: selectedUser.vatNumber },
        ].map((f) => (
          <div key={f.label} style={styles.fieldItem}>
            <span style={styles.fieldLabel}>{f.label}</span>
            <span style={styles.fieldValue}>{f.value}</span>
          </div>
        ))}
      </div>

      {/* Role Change */}
      {selectedUser.status === 'APPROVED' && selectedUser.role !== 'ADMIN' && (
        <div style={styles.actionSection}>
          <p style={styles.actionSectionTitle}>Change Role</p>
          <div style={styles.roleButtons}>
            {['PARTICIPANT', 'ORGANIZER'].map((role) => (
              <button
                key={role}
                style={{
                  ...styles.roleBtn,
                  ...(selectedUser.role === role ? styles.roleBtnActive : {}),
                }}
                onClick={() => handleRoleChange(selectedUser.id, role)}
                disabled={actionLoading || selectedUser.role === role}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={styles.actionSection}>
        <p style={styles.actionSectionTitle}>Account Status</p>
        <div style={styles.actionButtons}>
          {selectedUser.status === 'PENDING' && (
            <>
              <button
                style={styles.approveBtn}
                onClick={() => handleApprove(selectedUser.id)}
                disabled={actionLoading}
              >
                ✓ Approve
              </button>
              <button
                style={styles.rejectBtn}
                onClick={() => handleReject(selectedUser.id)}
                disabled={actionLoading}
              >
                ✗ Reject
              </button>
            </>
          )}
          {selectedUser.status === 'APPROVED' && (
            <button
              style={styles.rejectBtn}
              onClick={() => handleReject(selectedUser.id)}
              disabled={actionLoading}
            >
              ✗ Revoke Access
            </button>
          )}
          {selectedUser.status === 'REJECTED' && (
            <button
              style={styles.approveBtn}
              onClick={() => handleApprove(selectedUser.id)}
              disabled={actionLoading}
            >
              ✓ Approve
            </button>
          )}
        </div>
      </div>
    </>
  ) : (
    <div style={styles.noSelection}>
      <p style={styles.noSelectionIcon}>👤</p>
      <p style={styles.noSelectionText}>Select a user to view details</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, padding: isMobile ? '20px 16px' : '40px 24px' }}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={{ ...styles.title, fontSize: isMobile ? '1.5rem' : '2rem' }}>User Management</h1>
            {pendingCount > 0 && (
              <p style={styles.pendingNote}>
                {pendingCount} user{pendingCount > 1 ? 's' : ''} awaiting approval
              </p>
            )}
          </div>
          {!isMobile && (
            <button style={styles.exportBtn} onClick={() => navigate('/admin/export')}>
              Export Data →
            </button>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={{ ...styles.layout, gridTemplateColumns: isMobile ? '1fr' : '320px 1fr' }}>
          {/* List Panel */}
          {showList && (
            <div style={styles.listPanel}>
              <div style={styles.filterTabs}>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                  <button
                    key={s}
                    style={{
                      ...styles.filterTab,
                      ...(filterStatus === s ? styles.filterTabActive : {}),
                    }}
                    onClick={() => setFilterStatus(s)}
                  >
                    {s}
                    {s === 'PENDING' && pendingCount > 0 && (
                      <span style={styles.pendingBadge}>{pendingCount}</span>
                    )}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={styles.listLoading}>Loading users...</div>
              ) : (
                <div style={styles.userList}>
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        ...styles.userRow,
                        ...(selectedUser?.id === u.id ? styles.userRowSelected : {}),
                      }}
                      onClick={() => setSelectedUser(u)}
                    >
                      <div style={styles.userAvatar}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div style={styles.userInfo}>
                        <p style={styles.userName}>{u.firstName} {u.lastName}</p>
                        <p style={styles.userHandle}>@{u.username}</p>
                      </div>
                      <span style={{
                        ...styles.statusPill,
                        color: statusColor(u.status),
                        backgroundColor: statusBg(u.status),
                      }}>
                        {u.status}
                      </span>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p style={styles.emptyList}>No users found</p>
                  )}
                </div>
              )}

              {isMobile && (
                <button style={styles.exportBtnMobile} onClick={() => navigate('/admin/export')}>
                  Export Data →
                </button>
              )}
            </div>
          )}

          {/* Detail Panel */}
          {showDetail && (
            <div style={styles.detailPanel}>
              {isMobile && selectedUser && (
                <button style={styles.backToListBtn} onClick={() => setSelectedUser(null)}>
                  ← Back to list
                </button>
              )}
              {DetailContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: 'var(--color-bg)' },
  container: { maxWidth: '1100px', margin: '0 auto' },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '24px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em', marginBottom: '4px',
  },
  pendingNote: {
    fontSize: '0.875rem',
    color: 'var(--color-warning)',
    fontWeight: '500',
  },
  exportBtn: {
    padding: '9px 18px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem', fontWeight: '500',
    cursor: 'pointer',
  },
  exportBtnMobile: {
    width: '100%',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem', fontWeight: '500',
    margin: '12px',
    width: 'calc(100% - 24px)',
  },
  errorBox: {
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)',
    fontSize: '0.875rem',
    marginBottom: '20px',
  },
  layout: {
    display: 'grid',
    gap: '20px',
    alignItems: 'start',
  },
  listPanel: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
  },
  filterTabs: {
    display: 'flex',
    borderBottom: '1px solid var(--color-border)',
    padding: '8px 8px 0',
    gap: '2px',
  },
  filterTab: {
    flex: 1, padding: '7px 4px',
    border: 'none', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    fontSize: '0.7rem', fontWeight: '600',
    letterSpacing: '0.03em',
    cursor: 'pointer',
    position: 'relative' as const,
    textTransform: 'uppercase' as const,
  },
  filterTabActive: {
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-accent)',
  },
  pendingBadge: {
    position: 'absolute' as const,
    top: '-4px', right: '-2px',
    backgroundColor: 'var(--color-error)',
    color: '#fff', borderRadius: '50%',
    width: '14px', height: '14px',
    fontSize: '0.6rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700',
  },
  listLoading: {
    textAlign: 'center' as const,
    padding: '32px',
    color: 'var(--color-text-muted)',
    fontSize: '0.875rem',
  },
  userList: { maxHeight: '580px', overflowY: 'auto' as const },
  userRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 16px', cursor: 'pointer',
    borderBottom: '1px solid var(--color-border)',
    transition: 'background-color var(--transition)',
  },
  userRowSelected: { backgroundColor: 'var(--color-accent-light)' },
  userAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    backgroundColor: 'var(--color-accent)',
    color: '#fff', fontSize: '0.75rem', fontWeight: '600',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: '0.875rem', fontWeight: '600',
    color: 'var(--color-text-primary)', marginBottom: '1px',
  },
  userHandle: { fontSize: '0.78rem', color: 'var(--color-text-muted)' },
  statusPill: {
    padding: '2px 8px', borderRadius: '100px',
    fontSize: '0.68rem', fontWeight: '600',
    letterSpacing: '0.04em', flexShrink: 0,
  },
  emptyList: {
    textAlign: 'center' as const, padding: '32px',
    color: 'var(--color-text-muted)', fontSize: '0.875rem',
  },
  detailPanel: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '24px',
    minHeight: '300px',
  },
  backToListBtn: {
    padding: '0', border: 'none', backgroundColor: 'transparent',
    color: 'var(--color-text-muted)', fontSize: '0.875rem',
    cursor: 'pointer', marginBottom: '20px', display: 'block',
  },
  detailHeader: {
    display: 'flex', gap: '20px', alignItems: 'flex-start',
    marginBottom: '28px', paddingBottom: '24px',
    borderBottom: '1px solid var(--color-border)',
  },
  detailAvatar: {
    width: '56px', height: '56px', borderRadius: '50%',
    backgroundColor: 'var(--color-text-primary)',
    color: '#fff', fontSize: '1.2rem', fontWeight: '600',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  detailHeaderInfo: {},
  detailName: {
    fontSize: '1.2rem', fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: '2px', letterSpacing: '-0.01em',
  },
  detailHandle: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '10px',
  },
  detailBadges: { display: 'flex', gap: '8px', alignItems: 'center' },
  rolePill: {
    padding: '2px 8px', borderRadius: '100px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    fontSize: '0.68rem', fontWeight: '600',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.04em',
  },
  fieldGrid: {
    display: 'grid',
    gap: '16px', marginBottom: '28px',
  },
  fieldItem: { display: 'flex', flexDirection: 'column' as const, gap: '3px' },
  fieldLabel: {
    fontSize: '0.7rem', fontWeight: '500',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  },
  fieldValue: { fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: '500', wordBreak: 'break-word' as const },
  actionSection: { marginBottom: '20px' },
  actionSectionTitle: {
    fontSize: '0.72rem', fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', marginBottom: '10px',
  },
  roleButtons: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  roleBtn: {
    padding: '8px 18px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem', fontWeight: '500',
    cursor: 'pointer',
  },
  roleBtnActive: {
    backgroundColor: 'var(--color-accent)',
    color: '#fff', border: '1px solid var(--color-accent)',
  },
  actionButtons: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  approveBtn: {
    padding: '9px 20px',
    borderRadius: 'var(--radius-sm)', border: 'none',
    backgroundColor: 'var(--color-success)',
    color: '#fff', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
  rejectBtn: {
    padding: '9px 20px',
    borderRadius: 'var(--radius-sm)', border: 'none',
    backgroundColor: 'var(--color-error)',
    color: '#fff', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
  noSelection: {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    height: '300px', gap: '12px',
  },
  noSelectionIcon: { fontSize: '2rem' },
  noSelectionText: { fontSize: '0.9rem', color: 'var(--color-text-muted)' },
};