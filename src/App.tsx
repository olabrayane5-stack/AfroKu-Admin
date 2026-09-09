import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  LogOut,
  AlertCircle,
  Loader2,
  LayoutDashboard,
  ClipboardCheck,
  Users,
  UserCog,
  Package,
  CalendarCheck,
  BarChart3,
  Settings,
  Lock,
  Menu,
  X,
} from "lucide-react";
import { adminLogin, adminLogout, getStoredAdminSession, AdminUser } from "./services/adminAuth";
import { fetchApplications, fetchProducts } from "./services/adminApi";
import { CandidaturesView } from "./components/CandidaturesView";
import { PartnersView } from "./components/PartnersView";
import { ProductsView } from "./components/ProductsView";
import { StatisticsView } from "./components/StatisticsView";

type Section = "dashboard" | "candidatures" | "partenaires" | "produits" | "utilisateurs" | "reservations" | "statistiques" | "parametres";

export default function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const session = getStoredAdminSession();
    if (session) setUser(session.user);
    setCheckingSession(false);
  }, []);

  if (checkingSession) return null;

  if (!user) {
    return <LoginScreen onLoggedIn={setUser} />;
  }

  return <AdminLayout user={user} onLogout={() => { adminLogout(); setUser(null); }} />;
}

// ============================================================================
// ECRAN DE CONNEXION
// ============================================================================
function LoginScreen({ onLoggedIn }: { onLoggedIn: (u: AdminUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await adminLogin(email, password);
      onLoggedIn(user);
    } catch (err: any) {
      setError(err.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-gold" />
          </div>
          <h1 className="text-xl font-black text-slate-900">
            AfroKu<span className="text-gold">.Admin</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Accès réservé aux administrateurs</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Adresse e-mail
            </label>
            <input
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-navy hover:bg-navy-dark text-white font-bold text-sm rounded-lg shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MISE EN PAGE PRINCIPALE (sidebar + contenu)
// ============================================================================
const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode; ready: boolean }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: <LayoutDashboard className="w-4 h-4" />, ready: true },
  { id: "candidatures", label: "Candidatures", icon: <ClipboardCheck className="w-4 h-4" />, ready: true },
  { id: "partenaires", label: "Partenaires actifs", icon: <UserCog className="w-4 h-4" />, ready: true },
  { id: "produits", label: "Produits Artisans", icon: <Package className="w-4 h-4" />, ready: true },
  { id: "utilisateurs", label: "Utilisateurs", icon: <Users className="w-4 h-4" />, ready: false },
  { id: "reservations", label: "Réservations", icon: <CalendarCheck className="w-4 h-4" />, ready: false },
  { id: "statistiques", label: "Statistiques", icon: <BarChart3 className="w-4 h-4" />, ready: true },
  { id: "parametres", label: "Paramètres", icon: <Settings className="w-4 h-4" />, ready: false },
];

function AdminLayout({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [section, setSection] = useState<Section>("dashboard");
  const [pendingCandidatures, setPendingCandidatures] = useState(0);
  const [pendingProducts, setPendingProducts] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const refreshBadges = () => {
    fetchApplications("pending").then((list) => setPendingCandidatures(list.length)).catch(() => {});
    fetchProducts("pending").then((list) => setPendingProducts(list.length)).catch(() => {});
  };

  // Recharge les compteurs au démarrage, puis à chaque fois qu'on revient
  // sur le tableau de bord (après avoir traité une candidature/un produit
  // ailleurs), et toutes les 60s en tâche de fond.
  useEffect(() => {
    refreshBadges();
    const interval = setInterval(refreshBadges, 60000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (section === "dashboard") refreshBadges();
  }, [section]);

  const badgeFor = (id: Section): number => {
    if (id === "candidatures") return pendingCandidatures;
    if (id === "produits") return pendingProducts;
    return 0;
  };

  const currentLabel = NAV_ITEMS.find((i) => i.id === section)?.label || "";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Barre supérieure mobile/tablette (< md) : titre de la section + bouton menu */}
      <div className="md:hidden bg-navy text-white flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold" />
          <span className="font-black text-sm">
            AfroKu<span className="text-gold">.Admin</span>
          </span>
        </div>
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold"
        >
          {currentLabel}
          {mobileNavOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Menu déroulant mobile/tablette : mêmes items, en pleine largeur */}
      {mobileNavOpen && (
        <div className="md:hidden bg-navy text-white px-3 pb-3 space-y-1 shrink-0">
          {NAV_ITEMS.map((item) => {
            const count = badgeFor(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.ready) {
                    setSection(item.id);
                    setMobileNavOpen(false);
                  }
                }}
                disabled={!item.ready}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  section === item.id
                    ? "bg-white/10 text-gold"
                    : item.ready
                    ? "text-white/85 hover:bg-white/10 hover:text-white cursor-pointer"
                    : "text-white/35 cursor-not-allowed"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                {!item.ready && <Lock className="w-3 h-3" />}
                {item.ready && count > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black shadow-sm">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors mt-2 border-t border-white/10 pt-3"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      )}

      {/* Sidebar classique (>= md) */}
      <aside className="hidden md:flex w-64 bg-navy text-white flex-col shrink-0">
        <div className="p-5 flex items-center gap-2 border-b border-white/10">
          <ShieldCheck className="w-5 h-5 text-gold" />
          <span className="font-black text-sm">
            AfroKu<span className="text-gold">.Admin</span>
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const count = badgeFor(item.id);
            return (
              <button
                key={item.id}
                onClick={() => item.ready && setSection(item.id)}
                disabled={!item.ready}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  section === item.id
                    ? "bg-white/10 text-gold"
                    : item.ready
                    ? "text-white/85 hover:bg-white/10 hover:text-white cursor-pointer"
                    : "text-white/35 cursor-not-allowed"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                {!item.ready && <Lock className="w-3 h-3" />}
                {item.ready && count > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black shadow-sm animate-pulse">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-white/90 truncate">{user.name}</p>
            <p className="text-[10px] text-white/50 truncate">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto min-w-0">
        {section === "dashboard" && <DashboardHome user={user} />}
        {section === "candidatures" && <CandidaturesView onChange={refreshBadges} />}
        {section === "partenaires" && <PartnersView />}
        {section === "produits" && <ProductsView onChange={refreshBadges} />}
        {section === "statistiques" && <StatisticsView />}
      </main>
    </div>
  );
}

// ============================================================================
// VUE D'ACCUEIL DU DASHBOARD
// ============================================================================
function DashboardHome({ user }: { user: AdminUser }) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-black text-slate-900">Bienvenue, {user.name}</h1>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Voici l'état actuel de votre panneau d'administration AfroKu.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <ClipboardCheck className="w-5 h-5 text-navy mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Candidatures</h3>
          <p className="text-xs text-slate-500 mt-1">
            Consultez, approuvez ou refusez les dossiers Guide et Artisan — fonctionnel dès aujourd'hui.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 opacity-60">
          <Users className="w-5 h-5 text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Utilisateurs, Réservations, Statistiques</h3>
          <p className="text-xs text-slate-500 mt-1">
            Modules prévus dans une prochaine itération, une fois leurs briques backend construites.
          </p>
        </div>
      </div>
    </div>
  );
}
