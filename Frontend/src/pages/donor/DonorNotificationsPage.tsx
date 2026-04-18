import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  campaign?: {
    _id: string;
    title: string;
  };
  createdAt: string;
  action?: string;
}

export function DonorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/notifications');
      
      if (response.data.success) {
        const notificationsData = response.data.notifications.map((notif: any) => ({
          _id: notif._id,
          type: notif.type || 'notification',
          title: notif.title || 'Notification',
          message: notif.message || '',
          read: notif.read || false,
          campaign: notif.campaign,
          createdAt: notif.createdAt,
          action: notif.action || null,
        }));
        setNotifications(notificationsData);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await api.post('/notifications/read', {
        notificationIds: [notificationId],
      });

      if (response.data.success) {
        // Update notification state
        setNotifications(
          notifications.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);
    
    if (unreadIds.length === 0) return;

    try {
      const response = await api.post('/notifications/read', {
        notificationIds: unreadIds,
      });

      if (response.data.success) {
        // Mark all as read in state
        setNotifications(
          notifications.map((n) => ({ ...n, read: true }))
        );
      }
    } catch (err: any) {
      console.error('Error marking notifications as read:', err);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Notifications</h1>
          <p className="text-slate-500">Stay updated on your donations</p>
        </div>
        {notifications.length > 0 && notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <i className="fa-solid fa-bell-slash text-slate-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No notifications yet</h3>
          <p className="text-slate-500">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const className = `block p-4 rounded-xl border transition-all cursor-pointer ${
              n.read
                ? 'bg-white border-slate-100 hover:border-slate-200'
                : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
            }`;
            const content = (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <i className={`fa-solid ${n.read ? 'fa-bell' : 'fa-bell-dot'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold ${n.read ? 'text-slate-800' : 'text-emerald-900'}`}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {getTimeAgo(n.createdAt)}
                  </p>
                  {n.action && (
                    <span className="inline-flex items-center gap-1 mt-2 text-sm text-emerald-600 font-medium">
                      View details <i className="fa-solid fa-arrow-right text-xs" />
                    </span>
                  )}
                </div>
              </div>
            );

            return n.action ? (
              <Link
                key={n._id}
                to={n.action}
                className={className}
                onClick={() => !n.read && handleMarkAsRead(n._id)}
              >
                {content}
              </Link>
            ) : (
              <div
                key={n._id}
                className={className}
                onClick={() => !n.read && handleMarkAsRead(n._id)}
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
