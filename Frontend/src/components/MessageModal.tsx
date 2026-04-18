import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundraiserName: string;
  fundraiserId: string;
  campaignTitle: string;
  campaignId?: string;
}

export function MessageModal({ 
  isOpen, 
  onClose, 
  fundraiserName, 
  fundraiserId,
  campaignTitle,
  campaignId
}: MessageModalProps) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!connected || !socket) {
      setError('Connection lost. Please check your internet.');
      return;
    }

    setIsSending(true);
    setError('');
    
    try {
      const messageData = {
        from: user?.id,
        to: fundraiserId,
        message: message.trim(),
        campaignId: campaignId,
      };

      // Emit the message through socket.io
      socket.emit('sendMessage', messageData, (response: any) => {
        if (response?.success) {
          setSuccess(true);
          setMessage('');
          
          // Close after success
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 2000);
        } else {
          setError(response?.message || 'Failed to send message. Please try again.');
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred while sending your message.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <i className="fa-solid fa-envelope" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Message {fundraiserName}</h3>
            <p className="text-xs text-slate-500">About: {campaignTitle}</p>
          </div>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-emerald-100 rounded-full mb-3">
              <i className="fa-solid fa-check text-emerald-600 text-lg" />
            </div>
            <p className="text-emerald-700 font-medium">Message sent successfully!</p>
            <p className="text-xs text-emerald-600 mt-1">The fundraiser will receive your message shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!connected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  <i className="fa-solid fa-wifi-slash mr-2"></i>
                  Connecting... Please wait
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={5}
                disabled={isSending || !connected}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">{message.length} characters</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="flex-1 py-2 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!message.trim() || isSending || !connected}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {isSending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
