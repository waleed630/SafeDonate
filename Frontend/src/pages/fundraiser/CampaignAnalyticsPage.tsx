import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from '../../components/ui/ChartCard';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { useRealtime } from '../../contexts/RealtimeContext';
import api from '../../api/axios';

type TrendRow = { _id: string; amount: number; donations: number };

function sliceLast<T>(arr: T[] | undefined, n: number): T[] {
  if (!arr?.length) return [];
  return arr.slice(-n);
}

function formatChartDay(isoDate: string) {
  if (!isoDate || isoDate.length < 10) return isoDate;
  return isoDate.slice(5);
}

export function CampaignAnalyticsPage() {
  const { id } = useParams();
  const { connected } = useRealtime();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState({
    totalRaised: 0,
    donationCount: 0,
    avgDonation: 0,
  });
  const [campaignMeta, setCampaignMeta] = useState({
    donorCount: 0,
    goal: 0,
    progressPct: 0,
  });
  const [trends, setTrends] = useState<TrendRow[]>([]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Missing campaign id');
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/analytics/campaign/${id}`);
        if (cancelled) return;
        const d = res.data;
        if (!d?.success) throw new Error(d?.message || 'Failed to load campaign analytics');
        setTitle(d.campaign?.title || 'Campaign');
        setCampaignMeta({
          donorCount: d.campaign?.donorCount ?? 0,
          goal: d.campaign?.goal ?? 0,
          progressPct: d.campaign?.progressPct ?? 0,
        });
        setSummary({
          totalRaised: d.summary?.totalRaised ?? 0,
          donationCount: d.summary?.donationCount ?? 0,
          avgDonation: d.summary?.avgDonation ?? 0,
        });
        setTrends(Array.isArray(d.trends) ? d.trends : []);
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
  }, [id]);

  const chartData = useMemo(
    () =>
      sliceLast(trends, 30).map((row) => ({
        name: formatChartDay(row._id),
        amount: Math.round(row.amount || 0),
        donations: row.donations ?? 0,
      })),
    [trends],
  );

  const raisedDisplay = summary.totalRaised >= 1000
    ? `$${summary.totalRaised.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : `$${summary.totalRaised.toLocaleString()}`;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <Link
        to="/fundraiser/my-campaigns"
        className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 mb-6"
      >
        <i className="fa-solid fa-arrow-left" /> Back to My Campaigns
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Campaign Analytics</h1>
      <p className="text-slate-500 mb-8 break-words">{loading ? 'Loading' : title}</p>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard title="Total raised" value={loading ? '—' : raisedDisplay} icon="fa-hand-holding-dollar" />
        <DashboardCard
          title="Donations"
          value={loading ? '—' : summary.donationCount.toLocaleString()}
          icon="fa-receipt"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          subtitle="Completed donation records"
        />
        <DashboardCard
          title="Donor count"
          value={loading ? '—' : campaignMeta.donorCount.toLocaleString()}
          icon="fa-users"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          subtitle="On campaign"
        />
        <DashboardCard
          title="Avg. donation"
          value={loading ? '—' : `$${summary.avgDonation.toLocaleString()}`}
          icon="fa-chart-pie"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Donation trends" subtitle="Daily amount (last 30 days with data)">
          {chartData.length === 0 && !loading ? (
            <p className="text-slate-500 text-sm py-12 text-center">No donations for this campaign yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Amount']}
                />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title="Donation count" subtitle="Donations per day">
          {chartData.length === 0 && !loading ? (
            <p className="text-slate-500 text-sm py-12 text-center">No activity to chart yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="donations" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Campaign progress</h2>
          {connected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Goal</p>
            <p className="text-2xl font-bold text-slate-800">
              {loading ? '—' : `$${campaignMeta.goal.toLocaleString()}`}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Progress</p>
            <p className="text-2xl font-bold text-slate-800">{loading ? '—' : `${campaignMeta.progressPct}%`}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Donation events</p>
            <p className="text-2xl font-bold text-slate-800">{loading ? '—' : summary.donationCount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Avg. gift</p>
            <p className="text-2xl font-bold text-slate-800">
              {loading ? '—' : `$${summary.avgDonation.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
