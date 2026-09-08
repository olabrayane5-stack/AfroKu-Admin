import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Wallet, TrendingUp, Users2, PiggyBank, Loader2, AlertCircle,
  RefreshCw, Crown, Compass, Palette, Ticket, Building2, MapPinned,
} from "lucide-react";
import { fetchRevenue, RevenueData } from "../services/adminApi";

const NAVY = "#003580";
const GOLD = "#D4A72C";
const EMERALD = "#059669";
const SLATE = "#94A3B8";

const CATEGORY_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  GUIDE: { label: "Guides", color: GOLD, icon: <Compass className="w-3.5 h-3.5" /> },
  ARTISAN: { label: "Artisans", color: EMERALD, icon: <Palette className="w-3.5 h-3.5" /> },
  EXCURSION: { label: "Sites / Excursions", color: NAVY, icon: <MapPinned className="w-3.5 h-3.5" /> },
  BILLET: { label: "Billets d'événements", color: "#DB2777", icon: <Ticket className="w-3.5 h-3.5" /> },
  SÉJOUR: { label: "Séjours", color: "#7C3AED", icon: <Building2 className="w-3.5 h-3.5" /> },
};

const fmt = (n: number) => n.toLocaleString("fr-FR");

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export function StatisticsView() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchRevenue());
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des statistiques.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">Calcul des revenus en cours...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2 max-w-2xl mx-auto">
        <AlertCircle className="w-4 h-4 shrink-0" /> {error || "Aucune donnée disponible."}
      </div>
    );
  }

  const { totals, byCategory, monthlyTrend, topPartners } = data;

  const trendData = monthlyTrend.map((m) => ({
    month: monthLabel(m.month),
    commission: m.commission,
    gmv: m.gmv,
  }));

  const categoryData = Object.entries(byCategory).map(([key, v]) => ({
    key,
    label: CATEGORY_META[key]?.label || key,
    color: CATEGORY_META[key]?.color || SLATE,
    commission: v.commission,
    gmv: v.gmv,
    count: v.count,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">Statistiques & Revenus</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commission de 20% perçue par AfroKu sur l'ensemble des réservations confirmées.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Wallet className="w-5 h-5" />}
          label="Commission AfroKu"
          value={`${fmt(totals.totalCommission)} XOF`}
          accent="bg-gradient-to-br from-[#003580] to-[#001d47] text-white"
          sub="20% du volume confirmé"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Volume total (GMV)"
          value={`${fmt(totals.totalGMV)} XOF`}
          accent="bg-white border border-slate-200 text-slate-900"
          sub={`${totals.confirmedCount} réservation(s) confirmée(s)`}
        />
        <KpiCard
          icon={<PiggyBank className="w-5 h-5" />}
          label="Reversé aux partenaires"
          value={`${fmt(totals.totalNetToPartners)} XOF`}
          accent="bg-white border border-slate-200 text-slate-900"
          sub="80% du volume confirmé"
        />
        <KpiCard
          icon={<Users2 className="w-5 h-5" />}
          label="En attente"
          value={`${totals.pendingCount}`}
          accent="bg-amber-50 border border-amber-200 text-amber-900"
          sub={`sur ${totals.totalReservationsCount} réservation(s) au total`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Trend chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Évolution de la commission</h3>
          <p className="text-[11px] text-slate-500 mb-4">Sur les 6 derniers mois avec activité</p>
          {trendData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="commissionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={70}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  formatter={(value) => [`${fmt(Number(value) || 0)} XOF`, "Commission"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="commission" stroke={NAVY} strokeWidth={2.5} fill="url(#commissionFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Commission par catégorie</h3>
          <p className="text-[11px] text-slate-500 mb-4">Répartition des 20% perçus</p>
          {categoryData.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="commission"
                    nameKey="label"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${fmt(Number(value) || 0)} XOF`} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryData
                  .sort((a, b) => b.commission - a.commission)
                  .map((c) => (
                    <div key={c.key} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        {c.label}
                      </span>
                      <span className="font-bold text-slate-800">{fmt(c.commission)} XOF</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* GMV by category bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Volume par catégorie</h3>
          <p className="text-[11px] text-slate-500 mb-4">Montant total réservé (avant commission)</p>
          {categoryData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={70}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(value) => `${fmt(Number(value) || 0)} XOF`} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="gmv" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top partners */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-500" /> Top partenaires
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">Par commission générée</p>
          {topPartners.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="space-y-3">
              {topPartners.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    i === 0 ? "bg-amber-400 text-amber-950" : "bg-slate-100 text-slate-500"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.count} réservation(s)</p>
                  </div>
                  <span className="text-xs font-black text-navy shrink-0">{fmt(p.commission)} XOF</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, accent,
}: { icon: React.ReactNode; label: string; value: string; sub: string; accent: string }) {
  return (
    <div className={`rounded-2xl p-4 ${accent}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</span>
        <div className="opacity-90">{icon}</div>
      </div>
      <p className="text-xl font-black leading-tight">{value}</p>
      <p className="text-[10px] opacity-70 mt-1">{sub}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-40 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
      Pas encore de réservation confirmée à afficher.
    </div>
  );
}
