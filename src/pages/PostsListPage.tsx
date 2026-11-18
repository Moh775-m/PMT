import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  X,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  FolderOpen,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ToggleLeft,
  ToggleRight,
  FileText,
  BookOpen,
} from 'lucide-react';
import type { Post } from '../types/post';
import { getPosts, deletePost, updatePost, resetMockPosts } from '../services/postsService';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

type SortField = 'title' | 'category' | 'author' | 'date' | 'status';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export const PostsListPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Success alert
  const [notification, setNotification] = useState<string | null>(
    (location.state as { message?: string })?.message || null
  );

  // Modal deletion state
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Inline status-toggle loading set
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Clear nav state on mount
  useEffect(() => {
    if (location.state && (location.state as { message?: string }).message) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteTarget(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 whenever filters/sort/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, sortField, sortDir]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [posts]);

  // Stats
  const stats = useMemo(() => ({
    total: posts.length,
    published: posts.filter((p) => p.status === 'Published').length,
    draft: posts.filter((p) => p.status === 'Draft').length,
  }), [posts]);

  // Filter → Sort → Paginate
  const filteredSorted = useMemo(() => {
    let result = posts.filter((post) => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
        || post.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || post.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';
      if (sortField === 'date') {
        aVal = a.createdAt ?? a.date;
        bVal = b.createdAt ?? b.date;
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [posts, searchTerm, selectedCategory, selectedStatus, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={13} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} style={{ color: '#2563eb' }} />
      : <ChevronDown size={13} style={{ color: '#2563eb' }} />;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePost(deleteTarget.id);
      setNotification(`Post "${deleteTarget.title}" was successfully deleted.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (post: Post) => {
    setTogglingIds((prev) => new Set(prev).add(post.id));
    try {
      const newStatus = post.status === 'Published' ? 'Draft' : 'Published';
      await updatePost(post.id, { status: newStatus });
      await loadData();
      setNotification(`"${post.title}" changed to ${newStatus}.`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all posts to default mock sample data?')) {
      const reset = resetMockPosts();
      setPosts(reset);
      setNotification('Sample posts reset to default data.');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedStatus('All');
  };

  const hasActiveFilters = searchTerm || selectedCategory !== 'All' || selectedStatus !== 'All';

  return (
    <div>
      {/* Notification Alert */}
      {notification && (
        <div className="alert-success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', display: 'flex', padding: '0.2rem' }}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Posts Management</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Create, view, edit, and organize training blog posts and articles.
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetData} title="Reset to 6 default mock posts">
            <RefreshCw size={14} />
            Reset Mock Data
          </button>
          <Link to="/posts/new" className="btn">
            <Plus size={18} />
            + Add New Post
          </Link>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Posts', value: stats.total, icon: <FileText size={18} />, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Published', value: stats.published, icon: <BookOpen size={18} />, color: '#166534', bg: '#dcfce7' },
          { label: 'Drafts', value: stats.draft, icon: <FileText size={18} />, color: '#92400e', bg: '#fef3c7' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 180px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ background: s.bg, color: s.color, borderRadius: 8, padding: '0.5rem', display: 'flex' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="filter-bar">
          <div className="filter-input-wrap">
            <Search className="filter-input-icon" size={17} />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search posts"
            />
          </div>

          <div className="filter-select">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} aria-label="Filter by category">
              <option value="All">All Categories</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="filter-select" style={{ maxWidth: '160px' }}>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} aria-label="Filter by status">
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              <X size={14} /> Clear
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
            <button type="button" className={`btn btn-sm ${viewMode === 'table' ? '' : 'btn-secondary'}`} onClick={() => setViewMode('table')} title="Table view" aria-label="Table view">
              <ListIcon size={16} />
            </button>
            <button type="button" className={`btn btn-sm ${viewMode === 'grid' ? '' : 'btn-secondary'}`} onClick={() => setViewMode('grid')} title="Grid view" aria-label="Grid view">
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.85rem', color: '#64748b' }}>
            <Filter size={14} />
            <span>Showing <strong>{filteredSorted.length}</strong> of <strong>{posts.length}</strong> posts</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: '0.75rem' }} />
          <p style={{ color: '#64748b', margin: 0 }}>Loading posts...</p>
        </div>
      ) : filteredSorted.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f1f5f9', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <FolderOpen size={28} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No posts found</h3>
          <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.95rem' }}>
            {hasActiveFilters
              ? 'No posts matched your current filters. Try adjusting your search.'
              : 'No posts yet. Write your first training post!'}
          </p>
          {hasActiveFilters
            ? <button type="button" className="btn btn-secondary" onClick={clearFilters}>Reset Filters</button>
            : <Link to="/posts/new" className="btn"><Plus size={16} /> + Create First Post</Link>
          }
        </div>
      ) : viewMode === 'table' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Image</th>
                  <th>
                    <button type="button" onClick={() => handleSort('title')} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                      Title <SortIcon field="title" />
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('category')} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                      Category <SortIcon field="category" />
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('author')} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                      Author <SortIcon field="author" />
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('date')} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                      Date <SortIcon field="date" />
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => handleSort('status')} style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th style={{ textAlign: 'right', minWidth: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="post-thumb"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/120x80/e2e8f0/475569?text=Post'; }}
                      />
                    </td>
                    <td>
                      <Link
                        to={`/posts/${post.id}`}
                        style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none', lineHeight: 1.35, display: 'inline-block' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#0f172a'; }}
                      >
                        {post.title}
                      </Link>
                      {post.excerpt && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {post.excerpt}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-category">{post.category}</span></td>
                    <td style={{ color: '#475569', fontSize: '0.9rem' }}>{post.author}</td>
                    <td style={{ color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDate(post.date)}</td>
                    <td>
                      {/* Inline status toggle */}
                      <button
                        type="button"
                        title={`Toggle to ${post.status === 'Published' ? 'Draft' : 'Published'}`}
                        disabled={togglingIds.has(post.id)}
                        onClick={() => handleToggleStatus(post)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: togglingIds.has(post.id) ? 0.5 : 1 }}
                      >
                        {post.status === 'Published'
                          ? <ToggleRight size={22} style={{ color: '#16a34a' }} />
                          : <ToggleLeft size={22} style={{ color: '#94a3b8' }} />
                        }
                        <span className={`badge ${post.status === 'Published' ? 'badge-published' : 'badge-draft'}`}>
                          {post.status}
                        </span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/posts/${post.id}`)} title="View" aria-label={`View ${post.title}`}>
                          <Eye size={14} /> View
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/posts/${post.id}/edit`)} title="Edit" aria-label={`Edit ${post.title}`}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(post)} title="Delete" aria-label={`Delete ${post.title}`}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredSorted.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      ) : (
        /* Grid View */
        <>
          <div className="posts-grid">
            {paginatedPosts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-card-img-wrap">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="post-card-img"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e8f0/475569?text=Post'; }}
                  />
                </div>
                <div className="post-card-body">
                  <div className="post-card-meta">
                    <span className="badge badge-category">{post.category}</span>
                    <button
                      type="button"
                      title={`Toggle to ${post.status === 'Published' ? 'Draft' : 'Published'}`}
                      disabled={togglingIds.has(post.id)}
                      onClick={() => handleToggleStatus(post)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: togglingIds.has(post.id) ? 0.5 : 1 }}
                    >
                      <span className={`badge ${post.status === 'Published' ? 'badge-published' : 'badge-draft'}`}>
                        {post.status}
                      </span>
                    </button>
                  </div>
                  <h3 className="post-card-title">
                    <Link to={`/posts/${post.id}`}>{post.title}</Link>
                  </h3>
                  <p className="post-card-excerpt">{post.excerpt}</p>
                  <div className="post-card-footer">
                    <div>
                      <span style={{ fontWeight: 500, color: '#334155' }}>{post.author}</span>
                      <span style={{ margin: '0 0.35rem' }}>•</span>
                      <span>{formatDate(post.date)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button type="button" className="btn btn-secondary btn-sm btn-icon-only" onClick={() => navigate(`/posts/${post.id}`)} title="View" aria-label="View"><Eye size={15} /></button>
                      <button type="button" className="btn btn-secondary btn-sm btn-icon-only" onClick={() => navigate(`/posts/${post.id}/edit`)} title="Edit" aria-label="Edit"><Edit2 size={15} /></button>
                      <button type="button" className="btn btn-danger btn-sm btn-icon-only" onClick={() => setDeleteTarget(post)} title="Delete" aria-label="Delete"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid Pagination */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredSorted.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        postTitle={deleteTarget?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ---- Pagination Component ---- */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange,
}) => {
  const start = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const end = Math.min(currentPage * pageSize, totalItems);

  // Build visible page numbers with ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.75rem' }}>
      {/* Info + page size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
        <span>Showing <strong>{start}–{end}</strong> of <strong>{totalItems}</strong></span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{ padding: '0.3rem 0.5rem', fontSize: '0.825rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff' }}
          aria-label="Rows per page"
        >
          {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s} / page</option>)}
        </select>
      </div>

      {/* Page controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <button type="button" className="btn btn-secondary btn-sm btn-icon-only" onClick={() => onPageChange(1)} disabled={currentPage === 1} aria-label="First page"><ChevronsLeft size={15} /></button>
        <button type="button" className="btn btn-secondary btn-sm btn-icon-only" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page"><ChevronLeft size={15} /></button>

        {getPageNumbers().map((p, i) =>
          p === '...'
            ? <span key={`ellipsis-${i}`} style={{ padding: '0 0.4rem', color: '#94a3b8' }}>…</span>
            : (
              <button
                key={p}
                type="button"
                className={`btn btn-sm ${currentPage === p ? '' : 'btn-secondary'}`}
                style={{ minWidth: 34 }}
                onClick={() => onPageChange(p as number)}
                aria-label={`Page ${p}`}
                aria-current={currentPage === p ? 'page' : undefined}
              >
                {p}
              </button>
            )
        )}

        <button type="button" className="btn btn-secondary btn-sm btn-icon-only" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page"><ChevronRight size={15} /></button>
        <button type="button" className="btn btn-secondary btn-sm btn-icon-only" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} aria-label="Last page"><ChevronsRight size={15} /></button>
      </div>
    </div>
  );
};
