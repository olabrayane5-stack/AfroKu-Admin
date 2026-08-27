import React, { useState, useEffect } from "react";
import { ShieldCheck, LogOut, AlertCircle, Loader2 } from "lucide-react";
import { adminLogin, adminLogout, getStoredAdminSession, AdminUser } from "./services/adminAuth";

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

  return <Dashboard user={user} onLogout={() => { adminLogout(); setUser(null); }} />;
}

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

function Dashboard({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold" />
          <span className="font-black text-sm">
            AfroKu<span className="text-gold">.Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-white/80">{user.name}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <h2 className="text-lg font-bold text-slate-800">Bienvenue, {user.name}</h2>
          <p className="text-sm text-slate-500 mt-2">
            La connexion administrateur fonctionne. Les modules de gestion des candidatures
            arrivent dans la prochaine étape.
          </p>
        </div>
      </main>
    </div>
  );
}
