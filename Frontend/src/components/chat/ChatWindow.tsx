import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import { MessageBubble } from './MessageBubble';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';

interface BackendMessage {
  _id: string;
  message: string;
  from: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  to: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  isOwn: boolean;
  time: string;
}

interface ChatWindowProps {
  conversationId?: string;
  recipientName?: string;
  title?: string;
  onClose?: () => void;
  onRefreshConversations?: () => void;
}

export function ChatWindow({
  conversationId,
  recipientName,
  title,
  onClose,
  onRefreshConversations,
}: ChatWindowProps) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayTitle = recipientName || title || 'Chat';

  // Fetch messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      // Join chat room for real-time updates
      if (socket && user?.id) {
        console.log("💬 Joining chat room:", user.id, conversationId);
        socket.emit('joinChat', {
          userId: user.id,
          otherUserId: conversationId,
        });
      }
    }
  }, [conversationId, socket, user?.id]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg: BackendMessage) => {
      console.log("📨 Received message in ChatWindow:", msg);
      console.log("📍 Current user:", user?.id, "Message from:", msg.from._id);
      
      // Only add if it's for the current conversation
      if (msg.from._id === conversationId || msg.to._id === conversationId) {
        const formattedMessage: Message = {
          id: msg._id,
          text: msg.message,
          senderId: msg.from._id,
          senderName: msg.from.username,
          isOwn: msg.from._id === user?.id,
          time: new Date(msg.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setMessages((prevMessages) => {
          const isFromCurrentUser = msg.from._id === user?.id;
          
          // Check if this is a confirmation of a pending message
          if (isFromCurrentUser) {
            const hasPendingWithText = prevMessages.some(
              (m) => m.id.startsWith('pending_') && m.text === formattedMessage.text
            );
            
            if (hasPendingWithText) {
              console.log("✅ Replacing pending message with saved message");
              // Replace the pending message with the confirmed one
              return prevMessages.map((m) =>
                m.id.startsWith('pending_') && m.text === formattedMessage.text
                  ? formattedMessage
                  : m
              );
            }
          }
          
          // For new messages from other users or if no pending found, add normally
          console.log("➕ Adding new message to chat");
          return [...prevMessages, formattedMessage];
        });
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, conversationId, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/messages/${conversationId}`);

      if (response.data.success) {
        const formattedMessages = response.data.messages.map((msg: BackendMessage) => ({
          id: msg._id,
          text: msg.message,
          senderId: msg.from._id,
          senderName: msg.from.username,
          isOwn: msg.from._id === user?.id,
          time: new Date(msg.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
        setMessages(formattedMessages);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;

    if (!connected || !socket) {
      console.error("❌ Socket not connected");
      return;
    }

    const messageText = input.trim();
    const pendingId = `pending_${Date.now()}`;

    // Optimistically add message to UI
    const newMessage: Message = {
      id: pendingId,
      text: messageText,
      senderId: user?.id || '',
      senderName: user?.name || 'You',
      isOwn: true,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((m) => [...m, newMessage]);
    setInput('');
    setIsSending(true);

    try {
      // Emit message via socket
      const messageData = {
        from: user?.id,
        to: conversationId,
        message: messageText,
      };

      console.log("📤 Sending message via socket:", messageData);

      socket.emit('sendMessage', messageData, (response: any) => {
        if (response?.success) {
          console.log("✅ Message sent successfully:", response.messageId);
          // Refresh conversations list
          if (onRefreshConversations) {
            onRefreshConversations();
          }
        } else {
          console.error("❌ Failed to send message:", response?.message);
          // Remove optimistic message on error
          setMessages((m) => m.filter((msg) => msg.id !== pendingId));
          setInput(messageText);
        }
        setIsSending(false);
      });
    } catch (err: any) {
      console.error('❌ Error sending message:', err);
      // Remove optimistic message on error
      setMessages((m) => m.filter((msg) => msg.id !== pendingId));
      setInput(messageText);
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-100 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <i className="fa-solid fa-user" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{displayTitle}</h3>
            <p className="text-xs text-slate-500">Online</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:text-slate-700">
            <i className="fa-solid fa-times" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="bg-gray-200 h-12 rounded-2xl w-2/3"></div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">Start a conversation</div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m.text} isOwn={m.isOwn} sender={!m.isOwn ? m.senderName : undefined} time={m.time} />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!conversationId || isSending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || !conversationId || isSending}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isSending ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-paper-plane" />}
          </button>
        </div>
      </form>
    </div>
  );
}
