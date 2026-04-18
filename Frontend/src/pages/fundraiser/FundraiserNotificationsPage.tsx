import { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function FundraiserNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await api.get('/notifications');
        console.log('Notifications response:', response.data);
        
        // Handle different response formats
        const notificationsData = response.data?.notifications || response.data || [];
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch notifications:', err);
        setError(err.response?.data?.message || 'Failed to load notifications');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.post('/notifications/read', { notificationIds: [notificationId] });
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Notifications</h1>
      <p className="text-slate-500 mb-8">Campaign and donation updates</p>

      {loading && <p className="text-slate-500 text-center py-8">Loading notifications...</p>}
      {error && <p className="text-red-600 text-center py-8">{error}</p>}
      {!loading && notifications.length === 0 && (
        <p className="text-slate-500 text-center py-8">there is not any notification yet</p>
      )}

      {!loading && notifications.length > 0 && (
      <div className="space-y-4">
        {notifications.map((n) => (
          <div
            key={n._id}
            className={`p-4 rounded-xl border transition-colors cursor-pointer hover:shadow-md ${
              n.read ? 'bg-white border-slate-100' : 'bg-emerald-50/50 border-emerald-100'
            }`}
            onClick={() => !n.read && handleMarkAsRead(n._id)}
          >
            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                n.type === 'donation' ? 'bg-emerald-600' :
                n.type === 'campaign' ? 'bg-blue-600' :
                'bg-slate-600'
              }`}>
                <i className={`fa-solid ${
                  n.type === 'donation' ? 'fa-coins' :
                  n.type === 'campaign' ? 'fa-rocket' :
                  'fa-bell'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                </div>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{formatTime(n.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
