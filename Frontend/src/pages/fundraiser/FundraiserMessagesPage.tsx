import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../hooks/useSocket';
import { ChatWindow } from '../../components/chat/ChatWindow';

interface Conversation {
  otherUserId: string;
  name: string;
  email: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

export function FundraiserMessagesPage() {
  const { socket, connected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen for real-time message updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      console.log("📨 New message received, refreshing conversations...");
      fetchConversations();
    };

    socket.on('receiveMessage', handleNewMessage);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
    };
  }, [socket]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/messages');
      
      if (response.data.success) {
        console.log("✅ Conversations loaded:", response.data.conversations.length);
        setConversations(response.data.conversations);
        // Auto-select first conversation if not already selected
        if (response.data.conversations.length > 0 && !selected) {
          setSelected(response.data.conversations[0].otherUserId);
        }
      }
    } catch (err: any) {
      console.error('❌ Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-4 p-4 sm:p-6">
      <div className="lg:w-80 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Messages</h2>
          <p className="text-sm text-slate-500">
            {isLoading ? 'Loading...' : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
          </p>
          {!connected && (
            <p className="text-xs text-yellow-600 mt-1">
              <i className="fa-solid fa-wifi-slash mr-1"></i>
              Connecting...
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 m-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
            <button
              onClick={fetchConversations}
              className="text-xs text-red-600 hover:underline mt-1"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <i className="fa-solid fa-inbox text-3xl text-slate-300 mb-2 block"></i>
                <p className="text-sm text-slate-500">No messages yet</p>
              </div>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.otherUserId}
                onClick={() => setSelected(c.otherUserId)}
                className={`w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                  selected === c.otherUserId ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <img
                      src={c.avatar || `https://i.pravatar.cc/150?u=${c.otherUserId}`}
                      alt={c.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="text-xs text-slate-400">{getTimeAgo(c.lastMessageTime)}</span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{c.lastMessage}</p>
                    {c.unread > 0 && (
                      <span className="inline-block mt-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {selected ? (
          <ChatWindow
            conversationId={selected}
            recipientName={conversations.find((c) => c.otherUserId === selected)?.name || 'Chat'}
            onRefreshConversations={fetchConversations}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-center">
              <i className="fa-solid fa-comments text-4xl text-slate-300 mb-3 block"></i>
              <p className="text-slate-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
