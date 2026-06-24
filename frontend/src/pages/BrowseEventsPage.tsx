import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import type { Event } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

export default function BrowseEventsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 9;

  const [filters, setFilters] = useState({
    title: '',
    category: '',
    description: '',
    city: '',
    startDate: '',
    endDate: '',
    minPrice: '',
    maxPrice: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  useEffect(() => {
    fetchEvents();
  }, [page, appliedFilters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      Object.entries(appliedFilters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await api.get('/events', { params });
      setEvents(res.data.data);
      setTotal(res.data.total);
      setLastPage(res.data.lastPage);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
    if (isMobile) setShowFilters(false);
  };

  const handleReset = () => {
    const empty = {
      title: '', category: '', description: '',
      city: '', startDate: '', endDate: '',
      minPrice: '', maxPrice: '',
    };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const getMinPrice = (event: Event) => {
    if (!event.ticketTypes?.length) return null;
    return Math.min(...event.ticketTypes.map((t) => t.price));
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={{ ...styles.container, padding: isMobile ? '24px 16px' : '40px 24px' }}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={{ ...styles.title, fontSize: isMobile ? '1.5rem' : '2rem' }}>Browse Events</h1>
            <p style={styles.subtitle}>
              {loading ? 'Loading...' : `${total} event${total !== 1 ? 's' : ''} available`}
            </p>
          </div>
        </div>

        {/* Filters */}
        {isMobile ? (
          <>
            <button style={styles.filterToggleBtn} onClick={() => setShowFilters((s) => !s)}>
              <span>🔍 Filters</span>
              {activeFilterCount > 0 && <span style={styles.filterCountBadge}>{activeFilterCount}</span>}
              <span>{showFilters ? '▲' : '▼'}</span>
            </button>
            {showFilters && (
              <div style={styles.filterCardMobile}>
                <FilterFields filters={filters} setFilters={setFilters} isMobile />
                <div style={styles.filterActions}>
                  <button style={styles.resetBtn} onClick={handleReset}>Reset</button>
                  <button style={styles.searchBtn} onClick={handleSearch}>Search</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={styles.filterCard}>
            <FilterFields filters={filters} setFilters={setFilters} isMobile={false} />
            <div style={styles.filterActions}>
              <button style={styles.resetBtn} onClick={handleReset}>Reset</button>
              <button style={styles.searchBtn} onClick={handleSearch}>Search</button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={styles.loadingState}>
            <span>Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>🔍</p>
            <h3 style={styles.emptyTitle}>No events found</h3>
            <p style={styles.emptyText}>Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <div style={{ ...styles.eventsGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
              {events.map((event) => {
                const minPrice = getMinPrice(event);
                return (
                  <div
                    key={event.id}
                    style={styles.eventCard}
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div style={styles.cardTop}>
                      <span style={styles.eventTypeBadge}>{event.eventType}</span>
                      <div style={styles.cardCategories}>
                        {event.categories.slice(0, 1).map((c) => (
                          <span key={c.category.id} style={styles.categoryTag}>
                            {c.category.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h2 style={styles.eventTitle}>{event.title}</h2>

                    <p style={styles.eventDesc}>
                      {event.description.length > 90
                        ? event.description.slice(0, 90) + '...'
                        : event.description}
                    </p>

                    <div style={styles.eventMeta}>
                      <div style={styles.metaRow}>
                        <span style={styles.metaIcon}>📍</span>
                        <span>{event.venue}, {event.city}</span>
                      </div>
                      <div style={styles.metaRow}>
                        <span style={styles.metaIcon}>🗓</span>
                        <span>
                          {new Date(event.startDateTime).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div style={styles.cardFooter}>
                      {minPrice !== null ? (
                        <div style={styles.priceTag}>
                          <span style={styles.priceFrom}>from </span>
                          <span style={styles.price}>€{minPrice}</span>
                        </div>
                      ) : (
                        <span style={styles.price}>Free</span>
                      )}
                      <button style={styles.viewBtn}>View →</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div style={styles.pagination}>
              <button
                style={{ ...styles.pageBtn, opacity: page === 1 ? 0.4 : 1 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {isMobile ? '←' : '← Previous'}
              </button>
              <div style={styles.pageNumbers}>
                {Array.from({ length: Math.min(lastPage, isMobile ? 3 : 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    style={{
                      ...styles.pageNum,
                      ...(p === page ? styles.pageNumActive : {}),
                    }}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                style={{ ...styles.pageBtn, opacity: page === lastPage ? 0.4 : 1 }}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
              >
                {isMobile ? '→' : 'Next →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterFields({ filters, setFilters, isMobile }: any) {
  return (
    <div style={{ ...styles.filterGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)' }}>
      {[
        { label: 'Title', name: 'title', placeholder: 'Search by title...' },
        { label: 'Category', name: 'category', placeholder: 'e.g. Music, Sports...' },
        { label: 'City', name: 'city', placeholder: 'City...' },
        { label: 'Keywords', name: 'description', placeholder: 'Keywords in description...' },
      ].map((f) => (
        <div key={f.name} style={styles.filterField}>
          <label style={styles.filterLabel}>{f.label}</label>
          <input
            style={styles.filterInput}
            name={f.name}
            value={filters[f.name as keyof typeof filters]}
            onChange={(e) => setFilters({ ...filters, [f.name]: e.target.value })}
            placeholder={f.placeholder}
          />
        </div>
      ))}
      <div style={styles.filterField}>
        <label style={styles.filterLabel}>From Date</label>
        <input
          style={styles.filterInput}
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
      </div>
      <div style={styles.filterField}>
        <label style={styles.filterLabel}>To Date</label>
        <input
          style={styles.filterInput}
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>
      <div style={styles.filterField}>
        <label style={styles.filterLabel}>Min Price (€)</label>
        <input
          style={styles.filterInput}
          type="number"
          value={filters.minPrice}
          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
          placeholder="0"
          min="0"
        />
      </div>
      <div style={styles.filterField}>
        <label style={styles.filterLabel}>Max Price (€)</label>
        <input
          style={styles.filterInput}
          type="number"
          value={filters.maxPrice}
          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          placeholder="Any"
          min="0"
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
  },
  filterToggleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginBottom: '16px',
  },
  filterCountBadge: {
    backgroundColor: 'var(--color-accent)',
    color: '#fff',
    borderRadius: '100px',
    padding: '1px 8px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  filterCardMobile: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '16px',
    marginBottom: '24px',
  },
  filterCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '24px',
    marginBottom: '32px',
  },
  filterGrid: {
    display: 'grid',
    gap: '16px',
    marginBottom: '20px',
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  filterLabel: {
    fontSize: '0.78rem',
    fontWeight: '500',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.02em',
  },
  filterInput: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  filterActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid var(--color-border)',
  },
  resetBtn: {
    padding: '8px 18px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    flex: '1',
  },
  searchBtn: {
    padding: '8px 20px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'var(--color-accent)',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: '600',
    flex: '1',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 24px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
  },
  eventsGrid: {
    display: 'grid',
    gap: '20px',
    marginBottom: '40px',
  },
  eventCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '24px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    transition: 'border-color var(--transition), box-shadow var(--transition)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTypeBadge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  cardCategories: {
    display: 'flex',
    gap: '6px',
  },
  categoryTag: {
    padding: '2px 8px',
    borderRadius: '100px',
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-accent)',
    fontSize: '0.7rem',
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  },
  eventDesc: {
    fontSize: '0.82rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.6',
    flex: 1,
  },
  eventMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.82rem',
    color: 'var(--color-text-secondary)',
  },
  metaIcon: {
    fontSize: '0.9rem',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '14px',
    borderTop: '1px solid var(--color-border)',
    marginTop: 'auto',
  },
  priceTag: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '3px',
  },
  priceFrom: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
  },
  price: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
  },
  viewBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.82rem',
    fontWeight: '500',
    transition: 'all var(--transition)',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  },
  pageBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  pageNumbers: {
    display: 'flex',
    gap: '6px',
  },
  pageNum: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  pageNumActive: {
    backgroundColor: 'var(--color-accent)',
    color: '#fff',
    border: '1px solid var(--color-accent)',
  },
};