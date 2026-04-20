import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockCampaignComments, formatTimestamp, type CampaignComment } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

interface CampaignCommentsProps {
  campaignId: string | number;
  organizerName?: string;
  className?: string;
}

export function CampaignComments({ campaignId, className = '' }: CampaignCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<CampaignComment[]>(() =>
    mockCampaignComments.filter((c) => c.campaignId === campaignId || c.campaignId.toString() === campaignId.toString())
  );
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    const comment: CampaignComment = {
      id: `c-${Date.now()}`,
      campaignId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      text: newComment.trim(),
      date: new Date().toISOString(),
      isOwner: false,
    };
    setComments((prev) => [comment, ...prev]);
    setNewComment('');
    setSubmitting(false);
  };

  return (
    <div className={`mt-8 pt-6 border-t border-slate-100 ${className}`}>
      <h3 className="font-semibold text-slate-900 mb-4">Comments &amp; feedback</h3>
      {isAuthenticated && user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your support or ask a question..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Post comment
          </button>
        </form>
      ) : (
        <p className="text-slate-500 text-sm mb-4">
          <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">Sign in</Link> to leave a comment.
        </p>
      )}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-slate-500 text-sm">No comments yet. Be the first to share your support!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3 p-4 bg-slate-50 rounded-xl">
              <img
                src={c.userAvatar || 'https://i.pravatar.cc/150'}
                alt=""
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800">{c.userName}</span>
                  {c.isOwner && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                      Campaign owner
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{formatTimestamp(c.date)}</span>
                </div>
                <p className="text-slate-700 text-sm mt-1">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
