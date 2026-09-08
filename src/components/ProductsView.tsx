import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  X,
} from "lucide-react";
import { fetchProducts, approveProduct, rejectProduct, PendingProduct } from "../services/adminApi";

type Filter = "pending" | "approved" | "rejected";

export function ProductsView({ onChange }: { onChange?: () => void }) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectTarget, setRejectTarget] = useState<PendingProduct | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async (f: Filter) => {
    setLoading(true);
    setError("");
    try {
      setProducts(await fetchProducts(f));
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  const handleApprove = async (id: string) => {
    setActingId(id);
    try {
      await approveProduct(id);
      load(filter);
      onChange?.();
    } catch (err: any) {
      setError(err.message || "Échec de l'approbation.");
    } finally {
      setActingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || rejectReason.trim().length < 5) return;
    setActingId(rejectTarget.id);
    try {
      await rejectProduct(rejectTarget.id, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason("");
      load(filter);
      onChange?.();
    } catch (err: any) {
      setError(err.message || "Échec du refus.");
    } finally {
      setActingId(null);
    }
  };

  const TABS: { id: Filter; label: string }[] = [
    { id: "pending", label: "En attente" },
    { id: "approved", label: "Publiés" },
    { id: "rejected", label: "Refusés" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Produits Artisans</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chaque produit soumis depuis "Mon Espace" doit être validé avant d'apparaître sur le site.
          </p>
        </div>
        <button
          onClick={() => load(filter)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {filter === "pending" && !loading && products.length > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-white border border-amber-200 rounded-xl px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-gold text-white flex items-center justify-center shrink-0 font-black text-sm">
            {products.length}
          </div>
          <p className="text-xs text-amber-900">
            <strong>{products.length} produit{products.length > 1 ? "s" : ""}</strong> en attente de votre validation — rien n'est visible sur le site tant que vous n'avez pas tranché.
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filter === tab.id ? "bg-navy text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm">
          Aucun produit {filter === "pending" ? "en attente" : filter === "approved" ? "publié" : "refusé"} pour le moment.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <img src={p.image} alt={p.name} className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-800 leading-tight">{p.name}</h3>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {p.category}
                </span>
              </div>
              <p className="text-xs font-black text-navy mb-1">{p.priceXOF.toLocaleString("fr-FR")} XOF</p>
              <p className="text-[11px] text-slate-500 mb-2">Par {p.artisanEmail}</p>
              {p.description && <p className="text-xs text-slate-600 mb-3 line-clamp-2">{p.description}</p>}

              {p.status === "rejected" && p.adminNotes && (
                <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 mb-2">
                  Motif : {p.adminNotes}
                </p>
              )}

              {p.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={actingId === p.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                  >
                    {actingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Publier
                  </button>
                  <button
                    onClick={() => { setRejectTarget(p); setRejectReason(""); }}
                    disabled={actingId === p.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Refuser
                  </button>
                </div>
              )}

              {p.status === "approved" && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 pt-2 border-t border-slate-100">
                  <Package className="w-3.5 h-3.5" /> Visible sur le site
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 relative">
            <button onClick={() => setRejectTarget(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Refuser "{rejectTarget.name}"</h3>
            <p className="text-xs text-slate-500 mb-3">Le motif sera visible par l'artisan dans son espace.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Ex : photo trop sombre, description manquante..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmReject}
                disabled={rejectReason.trim().length < 5 || actingId === rejectTarget.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                {actingId === rejectTarget.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmer le refus
              </button>
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
