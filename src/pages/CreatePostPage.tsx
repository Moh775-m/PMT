import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { createPost } from '../services/postsService';
import type { PostStatus } from '../types/post';

const CATEGORIES = ['Database', 'Backend', 'Frontend', 'DevOps', 'Design', 'Testing', 'General'];

export const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<PostStatus>('Published');

  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Detect if user has entered anything
  const isDirty = !submitted && (title.trim() !== '' || content.trim() !== '' || author.trim() !== '' || imageUrl.trim() !== '');

  // بديل useBlocker - تأكيد عند الخروج من الروابط
  const handleLeave = (e: React.MouseEvent) => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      e.preventDefault();
    }
  };

  // Also block browser close / refresh
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const validate = useCallback(() => {
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!content.trim()) newErrors.content = 'Content is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await createPost({ title, category, author: author.trim() || 'Admin User', imageUrl, excerpt, content, status });
      setSubmitted(true);
      navigate('/posts', { state: { message: `Post "${title.trim()}" created successfully!` } });
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/posts" onClick={handleLeave} className="btn btn-secondary btn-sm"><ArrowLeft size={16} /> Back to Posts</Link>
      </div>

      <div className="page-header">
        <div>
          <h1>Create New Post</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>Fill in the details below to publish or save a draft.</p>
        </div>
        {isDirty && (
          <span style={{ fontSize: '0.8rem', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ● Unsaved changes
          </span>
        )}
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Post Title <span className="required-star">*</span></label>
            <input
              id="title" type="text"
              placeholder="e.g. Mastering Database Relations with Eloquent"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: undefined })); }}
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <div className="error-text"><AlertCircle size={14} />{errors.title}</div>}
          </div>

          {/* Row: Category, Status, Author */}
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
              <label htmlFor="author">Author (Optional)</label>
              <input id="author" type="text" placeholder="Defaults to Admin User" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
          </div>

          {/* Image URL */}
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (Optional)</label>
            <input id="imageUrl" type="url" placeholder="https://images.unsplash.com/photo-..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <div className="field-hint">Direct image URL — a placeholder is used if blank.</div>
            {imageUrl.trim() && (
              <div className="image-preview-box">
                <img src={imageUrl} alt="Preview" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/fee2e2/991b1b?text=Invalid+URL'; }} />
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div className="form-group">
            <label htmlFor="excerpt">Excerpt / Short Summary (Optional)</label>
            <input id="excerpt" type="text" placeholder="A brief summary for previews and lists..." value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
            <div className="field-hint">Auto-generated from content if left blank.</div>
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content">Content <span className="required-star">*</span></label>
            <textarea
              id="content" rows={9}
              placeholder={`Write your full article here...\n\nTips:\n- Use blank lines to separate paragraphs\n- Start a line with ## for a heading\n- Start lines with - for a bullet list\n- Start lines with 1. for a numbered list`}
              value={content}
              onChange={(e) => { setContent(e.target.value); if (errors.content) setErrors((p) => ({ ...p, content: undefined })); }}
              className={errors.content ? 'input-error' : ''}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              {errors.content
                ? <div className="error-text"><AlertCircle size={14} />{errors.content}</div>
                : <div className="field-hint">Supports paragraphs, ## headings, - bullet lists, 1. numbered lists.</div>
              }
              <span style={{ fontSize: '0.78rem', color: content.length > 500 ? '#64748b' : '#94a3b8', flexShrink: 0 }}>
                {content.length.toLocaleString()} chars
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <Link to="/posts" onClick={handleLeave} className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn" disabled={isSubmitting}>
              <Save size={16} />
              {isSubmitting ? 'Saving…' : status === 'Published' ? 'Publish Post' : 'Save Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
