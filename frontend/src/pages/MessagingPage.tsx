import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { Message } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

export default function MessagingPage() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeReceiverId, setComposeReceiverId] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState('');

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get('/messages/sent'),
      ]);
      setInbox(inboxRes.data);
      setSent(sentRes.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (activeTab === 'inbox' && !message.isReadByReceiver) {
      try {
        await api.patch(`/messages/${message.id}/read`);
        setInbox((prev) =>
          prev.map((m) => m.id === message.id ? { ...m, isReadByReceiver: true } : m)
        );
      } catch {}
    }
  };

  const handleDeleteInbox = async (id: number) => {
    try {
      await api.delete(`/messages/${id}/inbox`);
      setInbox((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch { alert('Failed to delete message'); }
  };

  const handleDeleteSent = async (id: number) => {
    try {
      await api.delete(`/messages/${id}/sent`);
      setSent((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch { alert('Failed to delete message'); }
  };

  const handleSendMessage = async () => {
    if (!composeReceiverId || !composeSubject || !composeBody) {
      setComposeError('All fields are required');
      return;
    }
    setComposeSending(true);
    setComposeError('');
    try {
      await api.post('/messages', {
        receiverId: parseInt(composeReceiverId),
        subject: composeSubject,
        body: composeBody,
      });
      setShowCompose(false);
      setComposeReceiverId('');
      setComposeSubject('');
      setComposeBody('');
      fetchMessages();
    } catch (err: any) {
      setComposeError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setComposeSending(false);
    }
  };

  const currentMessages = activeTab === 'inbox' ? inbox : sent;
  const unreadCount = inbox.filter((m) => !m.isReadByReceiver).length;

  const showList = !isMobile || !selectedMessage;
  const showDetail = !isMobile || !!selectedMessage;

  const DetailContent = selectedMessage ? (
    <>
      <div style={styles.detailHeader}>
        <div>
          <h2 style={styles.detailSubject}>{selectedMessage.subject}</h2>
          <p style={styles.detailMeta}>
            {activeTab === 'inbox' ? 'From' : 'To'}:{' '}
            <strong>
              {activeTab === 'inbox'
                ? `${selectedMessage.sender?.firstName} ${selectedMessage.sender?.lastName}`
                : `${selectedMessage.receiver?.firstName} ${selectedMessage.receiver?.lastName}`}
            </strong>
            {' · '}
            {new Date(selectedMessage.createdAt).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div style={styles.detailActions}>
          {activeTab === 'inbox' && (
            <button
              style={styles.replyBtn}
              onClick={() => {
                setComposeReceiverId(String(selectedMessage.sender?.id ?? ''));
                setComposeSubject(`Re: ${selectedMessage.subject}`);
                setShowCompose(true);
              }}
            >
              ↩ Reply
            </button>
          )}
          <button
            style={styles.deleteBtn}
            onClick={() => activeTab === 'inbox'
              ? handleDeleteInbox(selectedMessage.id)
              : handleDeleteSent(selectedMessage.id)
            }
          >
            Delete
          </button>
        </div>
      </div>
      <div style={styles.detailBody}>
        <p style={styles.messageBody}>{selectedMessage.body}</p>
      </div>
    </>
  ) : (
    <div style={styles.noSelection}>
      <p style={styles.noSelectionIcon}>✉️</p>
      <p style={styles.noSelectionText}>Select a message to read</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, padding: isMobile ? '20px 16px' : '40px 24px' }}>

        {/* Header */}
        <div style={{ ...styles.header, flexDirection: isMobile ? 'column' as const : 'row' as const, gap: isMobile ? '12px' : 0 }}>
          <div>
            <h1 style={{ ...styles.title, fontSize: isMobile ? '1.5rem' : '2rem' }}>Messages</h1>
            {unreadCount > 0 && (
              <p style={styles.unreadNote}>{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
          <button
            style={{ ...styles.composeBtn, width: isMobile ? '100%' : 'auto' }}
            onClick={() => setShowCompose(true)}
          >
            + Compose
          </button>
        </div>

        <div style={{ ...styles.layout, gridTemplateColumns: isMobile ? '1fr' : '300px 1fr' }}>
          {/* Sidebar */}
          {showList && (
            <div style={styles.sidebar}>
              {/* Tabs */}
              <div style={styles.tabs}>
                {(['inbox', 'sent'] as const).map((tab) => (
                  <button
                    key={tab}
                    style={{
                      ...styles.tab,
                      ...(activeTab === tab ? styles.tabActive : {}),
                    }}
                    onClick={() => { setActiveTab(tab); setSelectedMessage(null); }}
                  >
                    {tab === 'inbox' ? 'Inbox' : 'Sent'}
                    {tab === 'inbox' && unreadCount > 0 && (
                      <span style={styles.unreadBadge}>{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Message List */}
              {loading ? (
                <div style={styles.listEmpty}>Loading...</div>
              ) : currentMessages.length === 0 ? (
                <div style={styles.listEmpty}>No messages in {activeTab}</div>
              ) : (
                <div style={styles.messageList}>
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        ...styles.messageItem,
                        ...(selectedMessage?.id === message.id ? styles.messageItemActive : {}),
                        ...(activeTab === 'inbox' && !message.isReadByReceiver ? styles.messageItemUnread : {}),
                      }}
                      onClick={() => handleSelectMessage(message)}
                    >
                      <div style={styles.messageItemTop}>
                        <span style={styles.messageSender}>
                          {activeTab === 'inbox'
                            ? `${message.sender?.firstName} ${message.sender?.lastName}`
                            : `${message.receiver?.firstName} ${message.receiver?.lastName}`}
                        </span>
                        <span style={styles.messageDate}>
                          {new Date(message.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p style={styles.messageSubject}>
                        {activeTab === 'inbox' && !message.isReadByReceiver && (
                          <span style={styles.unreadDot}>● </span>
                        )}
                        {message.subject}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Detail */}
          {showDetail && (
            <div style={styles.detailPanel}>
              {isMobile && selectedMessage && (
                <button style={styles.backToListBtn} onClick={() => setSelectedMessage(null)}>
                  ← Back to {activeTab}
                </button>
              )}
              {DetailContent}
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: isMobile ? '92%' : '500px' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>New Message</h2>
              <button
                style={styles.modalCloseBtn}
                onClick={() => {
                  setShowCompose(false);
                  setComposeError('');
                  setComposeReceiverId('');
                  setComposeSubject('');
                  setComposeBody('');
                }}
              >✕</button>
            </div>

            {composeError && (
              <div style={styles.errorBox}>{composeError}</div>
            )}

            <div style={styles.composeFields}>
              <div style={styles.composeField}>
                <label style={styles.composeLabel}>Recipient User ID</label>
                <input
                  style={styles.composeInput}
                  type="number"
                  value={composeReceiverId}
                  onChange={(e) => setComposeReceiverId(e.target.value)}
                  placeholder="Enter recipient's user ID"
                />
              </div>
              <div style={styles.composeField}>
                <label style={styles.composeLabel}>Subject</label>
                <input
                  style={styles.composeInput}
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Message subject"
                />
              </div>
              <div style={styles.composeField}>
                <label style={styles.composeLabel}>Message</label>
                <textarea
                  style={styles.composeTextarea}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your message..."
                  rows={6}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => {
                  setShowCompose(false);
                  setComposeError('');
                }}
              >
                Cancel
              </button>
              <button
                style={styles.sendBtn}
                onClick={handleSendMessage}
                disabled={composeSending}
              >
                {composeSending ? 'Sending...' : 'Send Message'}
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
  unreadNote: {
    fontSize: '0.875rem',
    color: 'var(--color-accent)', fontWeight: '500',
  },
  composeBtn: {
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)', border: 'none',
    backgroundColor: 'var(--color-accent)', color: '#fff',
    fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
  layout: {
    display: 'grid',
    gap: '20px', alignItems: 'start',
  },
  sidebar: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid var(--color-border)',
  },
  tab: {
    flex: 1, padding: '14px',
    border: 'none', backgroundColor: 'transparent',
    cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500',
    color: 'var(--color-text-muted)',
    position: 'relative' as const,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    transition: 'all var(--transition)',
  },
  tabActive: {
    color: 'var(--color-accent)',
    borderBottom: '2px solid var(--color-accent)',
    backgroundColor: 'var(--color-accent-light)',
  },
  unreadBadge: {
    backgroundColor: 'var(--color-error)', color: '#fff',
    borderRadius: '100px', padding: '1px 6px',
    fontSize: '0.7rem', fontWeight: '600',
  },
  listEmpty: {
    textAlign: 'center' as const, padding: '32px',
    color: 'var(--color-text-muted)', fontSize: '0.875rem',
  },
  messageList: { maxHeight: '560px', overflowY: 'auto' as const },
  messageItem: {
    padding: '14px 16px', cursor: 'pointer',
    borderBottom: '1px solid var(--color-border)',
    transition: 'background-color var(--transition)',
  },
  messageItemActive: { backgroundColor: 'var(--color-accent-light)' },
  messageItemUnread: { backgroundColor: '#F8F8FF' },
  messageItemTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '4px',
  },
  messageSender: {
    fontSize: '0.875rem', fontWeight: '600',
    color: 'var(--color-text-primary)',
  },
  messageDate: { fontSize: '0.75rem', color: 'var(--color-text-muted)' },
  messageSubject: {
    fontSize: '0.82rem', color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap' as const, overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  unreadDot: { color: 'var(--color-accent)', fontSize: '0.6rem' },
  detailPanel: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    minHeight: '300px', display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  backToListBtn: {
    padding: '16px 24px 0', border: 'none', backgroundColor: 'transparent',
    color: 'var(--color-text-muted)', fontSize: '0.875rem',
    cursor: 'pointer', textAlign: 'left' as const,
  },
  detailHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '12px',
    padding: '24px', borderBottom: '1px solid var(--color-border)',
  },
  detailSubject: {
    fontSize: '1.1rem', fontWeight: '600',
    color: 'var(--color-text-primary)', marginBottom: '6px',
  },
  detailMeta: { fontSize: '0.82rem', color: 'var(--color-text-muted)' },
  detailActions: { display: 'flex', gap: '8px', flexShrink: 0 },
  replyBtn: {
    padding: '7px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
  },
  deleteBtn: {
    padding: '7px 14px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-error-bg)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)',
    fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
  },
  detailBody: { padding: '24px', flex: 1 },
  messageBody: {
    fontSize: '0.9rem', color: 'var(--color-text-secondary)',
    lineHeight: '1.8', whiteSpace: 'pre-wrap' as const,
  },
  noSelection: {
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    flex: 1, gap: '12px', minHeight: '300px',
  },
  noSelectionIcon: { fontSize: '2rem' },
  noSelectionText: { fontSize: '0.9rem', color: 'var(--color-text-muted)' },
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
  modalHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px',
  },
  modalTitle: {
    fontSize: '1.2rem', fontWeight: '600',
    color: 'var(--color-text-primary)',
  },
  modalCloseBtn: {
    width: '32px', height: '32px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    fontSize: '0.875rem', cursor: 'pointer',
  },
  errorBox: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-error-bg)',
    color: 'var(--color-error)',
    fontSize: '0.875rem', marginBottom: '16px',
  },
  composeFields: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  composeField: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  composeLabel: {
    fontSize: '0.78rem', fontWeight: '500',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  },
  composeInput: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    fontSize: '0.9rem', color: 'var(--color-text-primary)',
    outline: 'none', boxSizing: 'border-box' as const, width: '100%',
  },
  composeTextarea: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    fontSize: '0.9rem', color: 'var(--color-text-primary)',
    outline: 'none', resize: 'vertical' as const,
    boxSizing: 'border-box' as const, width: '100%',
  },
  modalActions: {
    display: 'flex', justifyContent: 'flex-end',
    gap: '10px', marginTop: '24px', flexWrap: 'wrap' as const,
  },
  cancelBtn: {
    padding: '9px 18px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem', cursor: 'pointer',
  },
  sendBtn: {
    padding: '9px 20px', borderRadius: 'var(--radius-md)',
    border: 'none', backgroundColor: 'var(--color-accent)',
    color: '#fff', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
};