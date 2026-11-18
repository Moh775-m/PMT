import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, AlertTriangle } from 'lucide-react';
import { getPostById, updatePost } from '../services/postsService';
import type { PostStatus } from '../types/post';

const CATEGORIES = ['Database', 'Backend', 'Frontend', 'DevOps', 'Design', 'Testing', 'General'];

export const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<PostStatus>('Published');

  // Original values for dirty tracking
  const [original, setOriginal] = useState({ title: '', category: '', author: '', imageUrl: '', excerpt: '', content: '', status: 'Published' as PostStatus });

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isDirty = !submitted && (
    title !== original.title ||
    category !== original.category ||
    author !== original.author ||
    imageUrl !== original.imageUrl ||
    excerpt !== original.excerpt ||
    content !== original.content ||
    status !== original.status
  );

  // بديل useBlocker: تأكيد عند الخروج من الروابط داخل الموقع
  const handleLeave = (e: React.MouseEvent) => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      e.preventDefault();
    }
  };

  // حماية تحديث الصفحة / إغلاق التبويب - هذا كان موجود عندك
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    async function loadPost() {
      if (!id) return;
      setLoading(true);
      try {
        const post = await getPostById(id);
        if (!post) {
          setNotFound(true);
        } else {
          setTitle(post.title);
          setCategory(post.category);
          setAuthor(post.author);
          setImageUrl(post.imageUrl);
          setExcerpt(post.excerpt);
          setContent(post.content);
          setStatus(post.status);
          setOriginal({ title: post.title, category: post.category, author: post.author, imageUrl: post.imageUrl, excerpt: post.excerpt, content: post.content, status: post.status });
        }
      } catch (err) {
        console.error('Failed to load post:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id]);

  const validate = useCallback(() => {
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!content.trim()) newErrors.content = 'Content is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !id) return;
    setIsSubmitting(true);
    try {
      await updatePost(id, { title, category, author: author.trim() || 'Admin User', imageUrl, excerpt, content, status });
      setSubmitted(true);
      navigate('/posts', { state: { message: `Post "${title.trim()}" updated successfully!` } });
    } catch (err) {
      console.error('Failed to update post:', err);
      alert('Failed to update post. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  if (notFound) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
          <AlertTriangle size={24} />
        </div>
        <h2>Post Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>The post you are trying to edit does not exist.</p>
        <Link to="/posts" className="btn btn-secondary"><ArrowLeft size={16} /> Back to Posts</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/posts" onClick={handleLeave} className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Back to Posts</Link>
      </div>

      <div className="page-header">
        <div>
          <h1>Edit Post</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Editing: <strong style={{ color: '#334155' }}>{original.title}</strong>
          </p>
        </div>
        {isDirty && (
          <span style={{ fontSize: '0.8rem', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ● Unsaved changes
          </span>
        )}
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="title">Post Title <span className="required-star">*</span></label>
            <input
              id="title" type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: undefined })); }}
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <div className="error-text"><AlertCircle size={14} />{errors.title}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as PostStatus)}>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input id="author" type="text" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <input id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <div className="field-hint">Direct web URL to an image file.</div>
            {imageUrl.trim() && (
              <div className="image-preview-box">
                <img src={imageUrl} alt="Preview" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/fee2e2/991b1b?text=Invalid+URL'; }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="excerpt">Excerpt / Short Summary</label>
            <input id="excerpt" type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="content">Content <span className="required-star">*</span></label>
            <textarea
              id="content" rows={9}
              value={content}
              onChange={(e) => { setContent(e.target.value); if (errors.content) setErrors((p) => ({ ...p, content: undefined })); }}
              className={errors.content ? 'input-error' : ''}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              {errors.content
                ? <div className="error-text"><AlertCircle size={14} />{errors.content}</div>
                : <div className="field-hint">Supports paragraphs, ## headings, - bullet lists, 1. numbered lists.</div>
              }
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', flexShrink: 0 }}>
                {content.length.toLocaleString()} chars
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <Link to={`/posts/${id}`} onClick={handleLeave} className="btn btn-secondary btn-sm" style={{ fontSize: '0.85rem' }}>
              View Current Post
            </Link>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/posts" onClick={handleLeave} className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn" disabled={isSubmitting}>
                <Save size={16} />
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
