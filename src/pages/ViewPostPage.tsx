import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Post } from '../types/post';
import { getPostById, getPosts, deletePost } from '../services/postsService';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

/** Render plain-text content with paragraph & heading support */
function renderContent(content: string): React.ReactNode {
  const paragraphs = content.split(/\n{2,}/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Detect simple markdown-ish headings (## Heading)
    if (/^#{1,3}\s/.test(trimmed)) {
      const level = trimmed.match(/^(#+)/)?.[1].length ?? 2;
      const text = trimmed.replace(/^#+\s/, '');
      const Tag = `h${Math.min(level + 1, 4)}` as 'h2' | 'h3' | 'h4';
      return <Tag key={i} style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>{text}</Tag>;
    }

    // Numbered or bulleted lists
    const lines = trimmed.split('\n');
    const isNumbered = lines.every((l) => /^\d+\.\s/.test(l.trim()));
    const isBulleted = lines.every((l) => /^[-*]\s/.test(l.trim()));

    if (isNumbered || isBulleted) {
      const ListTag = isNumbered ? 'ol' : 'ul';
      return (
        <ListTag key={i} style={{ margin: '0.75rem 0', paddingLeft: '1.5rem', lineHeight: 1.7 }}>
          {lines.map((line, j) => (
            <li key={j}>{line.replace(/^(\d+\.|[-*])\s/, '')}</li>
          ))}
        </ListTag>
      );
    }

    // Regular paragraph — render single-newlines as <br>
    return (
      <p key={i} style={{ margin: '0 0 1rem 0', lineHeight: 1.75 }}>
        {lines.map((line, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

function formatDateTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export const ViewPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteModal) setShowDeleteModal(false);
      if (e.key === 'e' && !showDeleteModal && post) navigate(`/posts/${post.id}/edit`);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showDeleteModal, post, navigate]);

  useEffect(() => {
    async function loadPost() {
      if (!id) return;
      setLoading(true);
      try {
        const [data, list] = await Promise.all([getPostById(id), getPosts()]);
        setPost(data);
        setAllPosts(list);
      } catch (err) {
        console.error('Error fetching post:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id]);

  // Adjacent posts for prev/next navigation
  const currentIndex = allPosts.findIndex((p) => String(p.id) === String(id));
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const handleDeleteConfirm = async () => {
    if (!post) return;
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      navigate('/posts', { state: { message: `Post "${post.title}" was successfully deleted.` } });
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: '1rem' }} />
        <p style={{ color: '#64748b', margin: 0 }}>Loading post…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <AlertCircle size={24} />
        </div>
        <h2>Post Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          The post with ID &ldquo;{id}&rdquo; does not exist or has been deleted.
        </p>
        <Link to="/posts" className="btn btn-secondary"><ArrowLeft size={16} /> Back to Posts</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb + action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link to="/posts" className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Back to Posts</Link>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '0.25rem' }}>Press <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 3, padding: '0 0.3rem', fontFamily: 'monospace' }}>E</kbd> to edit</span>
          <Link to={`/posts/${post.id}/edit`} className="btn btn-secondary btn-sm"><Edit2 size={15} /> Edit Post</Link>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={15} /> Delete Post
          </button>
        </div>
      </div>

      <article className="card" style={{ padding: '2rem' }}>
        {/* Category + Status badges */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.9rem' }}>
          <span className="badge badge-category"><Tag size={12} />{post.category}</span>
          <span className={`badge ${post.status === 'Published' ? 'badge-published' : 'badge-draft'}`}>{post.status}</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.75rem 0', lineHeight: 1.25, color: '#0f172a' }}>
          {post.title}
        </h1>

        {/* Meta row */}
        <div className="post-detail-meta" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <User size={15} />
            <span style={{ fontWeight: 600, color: '#334155' }}>{post.author}</span>
          </div>
          <span>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={15} />
            <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                <Clock size={13} />
                <span style={{ fontSize: '0.85rem' }}>Updated {formatDateTime(post.updatedAt)}</span>
              </div>
            </>
          )}
        </div>

        {/* Featured Image */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="post-detail-banner"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/900x400/e2e8f0/475569?text=Post+Banner'; }}
          />
        )}

        {/* Excerpt lead */}
        {post.excerpt && <div className="post-detail-lead">{post.excerpt}</div>}

        {/* Full Content with smart rendering */}
        <div className="post-detail-content">
          {renderContent(post.content)}
        </div>
      </article>

      {/* Prev / Next navigation */}
      {(prevPost || nextPost) && (
        <div style={{ display: 'grid', gridTemplateColumns: prevPost && nextPost ? '1fr 1fr' : nextPost ? '1fr' : '1fr', gap: '1rem', marginTop: '1rem' }}>
          {prevPost && (
            <Link
              to={`/posts/${prevPost.id}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem 1.25rem', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.15s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <ChevronLeft size={20} style={{ color: '#94a3b8', flexShrink: 0, marginTop: '0.15rem' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Previous Post</div>
                <div style={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.35 }}>{prevPost.title}</div>
                <span className="badge badge-category" style={{ marginTop: '0.4rem' }}>{prevPost.category}</span>
              </div>
            </Link>
          )}
          {nextPost && (
            <Link
              to={`/posts/${nextPost.id}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', justifyContent: 'flex-end', textAlign: 'right', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem 1.25rem', textDecoration: 'none', color: 'inherit', transition: 'box-shadow 0.15s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Next Post</div>
                <div style={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.35 }}>{nextPost.title}</div>
                <span className="badge badge-category" style={{ marginTop: '0.4rem' }}>{nextPost.category}</span>
              </div>
              <ChevronRight size={20} style={{ color: '#94a3b8', flexShrink: 0, marginTop: '0.15rem' }} />
            </Link>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        postTitle={post.title}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
