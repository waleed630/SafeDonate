import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSocket } from '../hooks/useSocket';
import type { LiveDonation } from '../data/mockData';

export interface CampaignProgressUpdate {
  campaignId: string;
  raised: number;
  goal: number;
  percent: number;
}

export interface RealtimeState {
  connected: boolean;
  liveDonations: LiveDonation[];
  campaignProgress: Record<string, CampaignProgressUpdate>;
  viewerCount: number;
  campaignViewerCount: Record<number, number>;
  hasNewNotification: boolean;
}

const RealtimeContext = createContext<RealtimeState & {
  setHasNewNotification: (v: boolean) => void;
  getProgressOverride: (campaignId: string | number) => CampaignProgressUpdate | null;
  getViewerCount: (campaignId?: number) => number;
} | null>(null);

const MAX_LIVE_DONATIONS = 50;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { socket, connected } = useSocket();
  const [liveDonations, setLiveDonations] = useState<LiveDonation[]>([]);
  const [campaignProgress, setCampaignProgress] = useState<Record<string, CampaignProgressUpdate>>({});
  const [viewerCount, setViewerCount] = useState(0);
  const [campaignViewerCount, setCampaignViewerCount] = useState<Record<number, number>>({});
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    if (!connected || !socket) {
      setLiveDonations([]);
      setViewerCount(0);
      setCampaignViewerCount({});
      return;
    }

    const onDonationNew = (payload: LiveDonation) => {
      setLiveDonations((prev) => {
        const next = [{ ...payload, timeAgo: 'Just now' }, ...prev];
        return next.slice(0, MAX_LIVE_DONATIONS);
      });
    };

    const onCampaignProgress = (payload: CampaignProgressUpdate) => {
      setCampaignProgress((prev) => ({ ...prev, [String(payload.campaignId)]: payload }));
    };

    const onNotificationsNew = () => {
      setHasNewNotification(true);
    };

    const onViewersCount = (payload: { count?: number; campaignId?: number }) => {
      const count = payload.count ?? 0;
      if (payload.campaignId != null && typeof payload.campaignId === 'number') {
        setCampaignViewerCount((prev) => ({ ...prev, [payload.campaignId!]: count }));
      } else {
        setViewerCount(count);
      }
    };

    socket.on('donation:new', onDonationNew);
    socket.on('campaign:progress', onCampaignProgress);
    socket.on('notifications:new', onNotificationsNew);
    socket.on('viewers:count', onViewersCount);

    return () => {
      socket.off('donation:new', onDonationNew);
      socket.off('campaign:progress', onCampaignProgress);
      socket.off('notifications:new', onNotificationsNew);
      socket.off('viewers:count', onViewersCount);
    };
  }, [connected, socket]);

  const getProgressOverride = useCallback(
    (campaignId: string | number) => campaignProgress[String(campaignId)] ?? null,
    [campaignProgress]
  );

  const getViewerCount = useCallback(
    (campaignId?: number) => {
      if (campaignId != null && campaignViewerCount[campaignId] !== undefined) {
        return campaignViewerCount[campaignId];
      }
      return viewerCount;
    },
    [viewerCount, campaignViewerCount]
  );

  const value = useMemo(
    () => ({
      connected,
      liveDonations,
      campaignProgress,
      viewerCount,
      campaignViewerCount,
      hasNewNotification,
      setHasNewNotification,
      getProgressOverride,
      getViewerCount,
    }),
    [
      connected,
      liveDonations,
      campaignProgress,
      viewerCount,
      campaignViewerCount,
      hasNewNotification,
      getProgressOverride,
      getViewerCount,
    ]
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
