import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from '../../components/ui/ChartCard';
import { DashboardCard } from '../../components/ui/DashboardCard';
import api from '../../api/axios';

type VolumeRow = { _id: string; volume: number; donations: number };
type UserGrowthRow = { _id: string; count: number };

function sliceLast<T>(arr: T[] | undefined, n: number): T[] {
  if (!arr?.length) return [];
  return arr.slice(-n);
}

function formatChartDay(isoDate: string) {
  if (!isoDate || isoDate.length < 10) return isoDate;
  return isoDate.slice(5);
}

export function PlatformAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState({
    totalUsers: 0,
    totalCampaigns: 0,
    totalRaised: 0,
    totalDonations: 0,
  });
  const [userGrowth, setUserGrowth] = useState<UserGrowthRow[]>([]);
  const [fraudStats, setFraudStats] = useState({ avgFraudScore: 0, suspicious: 0 });
  const [volume, setVolume] = useState<VolumeRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [platRes, volRes] = await Promise.all([
          api.get('/analytics/platform'),
          api.get('/analytics/transactions'),
        ]);
        if (cancelled) return;
        const p = platRes.data;
        if (!p?.success) throw new Error(p?.message || 'Failed to load platform analytics');
        setPlatform(p.platform);
        setUserGrowth(p.userGrowth || []);
        setFraudStats(p.fraudStats || { avgFraudScore: 0, suspicious: 0 });
        const v = volRes.data;
        if (v?.success && Array.isArray(v.volume)) setVolume(v.volume);
        else setVolume([]);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as Error)?.message ||
          'Could not load analytics';
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const donationChartData = useMemo(
    () =>
      sliceLast(volume, 30).map((d) => ({
        name: formatChartDay(d._id),
        amount: Math.round(d.volume || 0),
        donations: d.donations ?? 0,
      })),
    [volume],
  );

  const userChartData = useMemo(
    () =>
      sliceLast(userGrowth, 30).map((d) => ({
        name: formatChartDay(d._id),
        newUsers: d.count,
      })),
    [userGrowth],
  );

  const trustIndex = useMemo(() => {
    const avg = Number(fraudStats.avgFraudScore) || 0;
    return Math.max(0, Math.min(100, Math.round(100 - avg)));
  }, [fraudStats.avgFraudScore]);

  const raisedLabel = useMemo(() => {
    const n = platform.totalRaised || 0;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${Math.round(n).toLocaleString()}`;
  }, [platform.totalRaised]);

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Platform Analytics</h1>
      <p className="text-slate-500 mb-8">Platform-wide metrics and trends (live data)</p>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title="Total raised"
          value={loading ? '—' : raisedLabel}
          icon="fa-hand-holding-dollar"
          subtitle={`${(platform.totalDonations || 0).toLocaleString()} donations recorded`}
        />
        <DashboardCard
          title="Live campaigns"
          value={loading ? '—' : (platform.totalCampaigns || 0).toLocaleString()}
          icon="fa-rocket"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          subtitle="Verified, not paused"
        />
        <DashboardCard
          title="Total users"
          value={loading ? '—' : (platform.totalUsers || 0).toLocaleString()}
          icon="fa-users"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <DashboardCard
          title="Trust index"
          value={loading ? '—' : `${trustIndex}%`}
          icon="fa-chart-pie"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          subtitle={`Avg fraud score ${Math.round(fraudStats.avgFraudScore || 0)}/100 · ${fraudStats.suspicious || 0} high-risk`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Donation volume" subtitle="Daily amount (last 30 days with data)">
          {donationChartData.length === 0 && !loading ? (
            <p className="text-slate-500 text-sm py-12 text-center">No donation activity in the last year yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={donationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="New users" subtitle="Registrations by day (last 30 points)">
          {userChartData.length === 0 && !loading ? (
            <p className="text-slate-500 text-sm py-12 text-center">No user signups recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="newUsers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
