import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  postTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  postTitle,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-icon-danger">
            <AlertTriangle size={22} />
          </div>
          <h2 className="modal-title">Delete Post</h2>
        </div>

        <div className="modal-body">
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#0f172a' }}>
            Are you sure you want to delete this post?
          </p>
          <p style={{ margin: '0 0 0.5rem 0', color: '#475569', fontStyle: 'italic' }}>
            &ldquo;{postTitle}&rdquo;
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            This action cannot be undone and will remove the post from your list.
          </p>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            <X size={16} />
            No, Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
