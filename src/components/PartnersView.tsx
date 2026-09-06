import React, { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Palette,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Pencil,
  Trash2,
  Save,
  X,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { fetchActivePartners, updatePartner, deletePartner, ActivePartner } from "../services/adminApi";

export function PartnersView() {
  const [partners, setPartners] = useState<ActivePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPartners(await fetchActivePartners());
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Partenaires actifs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Guides et Artisans déjà validés, visibles sur le site public — modifiez leur fiche ou supprimez leur statut de partenaire.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {loading && (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Chargement des partenaires...</span>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && partners.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm">
          Aucun partenaire actif pour le moment.
        </div>
      )}

      <div className="space-y-3">
        {partners.map((partner) => (
          <PartnerCard
            key={partner.userId}
            partner={partner}
            expanded={expandedId === partner.userId}
            onToggle={() => setExpandedId(expandedId === partner.userId ? null : partner.userId)}
            onChanged={load}
          />
        ))}
      </div>
    </div>
  );
}

function PartnerCard({
  partner,
  expanded,
  onToggle,
  onChanged,
}: {
  partner: ActivePartner;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const isGuide = partner.type === "guide";
  const { details } = partner;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEditing = () => {
    setForm(
      isGuide
        ? {
            bio: details.bio || "",
            city: details.city || "",
            phoneWhatsApp: details.phoneWhatsApp || "",
            dailyRateXOF: details.dailyRateXOF || 0,
            languages: (details.languages || []).join(", "),
            specialties: (details.specialties || []).join(", "),
          }
        : {
            bio: details.bio || "",
            city: details.city || "",
            phoneWhatsApp: details.phoneWhatsApp || "",
            workshopName: details.workshopName || "",
            craftType: details.craftType || "",
            workshopPriceXOF: details.workshopPriceXOF || 0,
            physicalAddress: details.physicalAddress || "",
          }
    );
    setEditing(true);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, any> = { ...form };
      if (isGuide) {
        payload.languages = form.languages.split(",").map((l: string) => l.trim()).filter(Boolean);
        payload.specialties = form.specialties.split(",").map((s: string) => s.trim()).filter(Boolean);
        payload.dailyRateXOF = Number(form.dailyRateXOF) || 0;
      } else {
        payload.workshopPriceXOF = Number(form.workshopPriceXOF) || 0;
      }
      await updatePartner(partner.userId, payload);
      setEditing(false);
      onChanged();
    } catch (err: any) {
      setError(err.message || "Échec de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await deletePartner(partner.userId);
      onChanged();
    } catch (err: any) {
      setError(err.message || "Échec de la suppression.");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isGuide ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}>
            {isGuide ? <UserCheck className="w-5 h-5" /> : <Palette className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{details.fullName || partner.email}</p>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              {isGuide ? "Guide touristique" : "Artisan / Créateur"} · {partner.email}
              {!isGuide && partner.productCount > 0 && (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <ShoppingBag className="w-3 h-3" /> {partner.productCount} produit(s)
                </span>
              )}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {!editing ? (
            <>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <DetailRow label="Ville" value={details.city} />
                <DetailRow label="WhatsApp" value={details.phoneWhatsApp} />
                {isGuide ? (
                  <>
                    <DetailRow label="Tarif journalier" value={details.dailyRateXOF ? `${details.dailyRateXOF} XOF` : undefined} />
                    <DetailRow label="Langues" value={(details.languages || []).join(", ")} />
                    <DetailRow label="Spécialités" value={(details.specialties || []).join(", ")} />
                  </>
                ) : (
                  <>
                    <DetailRow label="Atelier" value={details.workshopName} />
                    <DetailRow label="Type d'artisanat" value={details.craftType} />
                    <DetailRow label="Tarif visite" value={details.workshopPriceXOF ? `${details.workshopPriceXOF} XOF` : undefined} />
                    <DetailRow label="Adresse" value={details.physicalAddress} />
                  </>
                )}
              </div>
              {details.bio && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Présentation</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{details.bio}</p>
                </div>
              )}

              {!confirmDelete ? (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              ) : (
                <div className="pt-2 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                  <p className="text-xs text-red-800 font-semibold flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    Action irréversible : {details.fullName || partner.email} redevient un compte Voyageur, sa fiche
                    {!isGuide && partner.productCount > 0 ? ` et ses ${partner.productCount} produit(s) ` : " "}
                    seront définitivement supprimés du site. Il pourra repostuler plus tard depuis zéro.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                    >
                      {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Confirmer la suppression
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2.5">
              <EditField label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <EditField label="WhatsApp" value={form.phoneWhatsApp} onChange={(v) => setForm({ ...form, phoneWhatsApp: v })} />
              {isGuide ? (
                <>
                  <EditField label="Tarif journalier (XOF)" type="number" value={form.dailyRateXOF} onChange={(v) => setForm({ ...form, dailyRateXOF: v })} />
                  <EditField label="Langues (séparées par une virgule)" value={form.languages} onChange={(v) => setForm({ ...form, languages: v })} />
                  <EditField label="Spécialités (séparées par une virgule)" value={form.specialties} onChange={(v) => setForm({ ...form, specialties: v })} />
                </>
              ) : (
                <>
                  <EditField label="Nom de l'atelier" value={form.workshopName} onChange={(v) => setForm({ ...form, workshopName: v })} />
                  <EditField label="Type d'artisanat" value={form.craftType} onChange={(v) => setForm({ ...form, craftType: v })} />
                  <EditField label="Tarif visite (XOF)" type="number" value={form.workshopPriceXOF} onChange={(v) => setForm({ ...form, workshopPriceXOF: v })} />
                  <EditField label="Adresse" value={form.physicalAddress} onChange={(v) => setForm({ ...form, physicalAddress: v })} />
                </>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Présentation</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50"
                >
                  <X className="w-3.5 h-3.5" /> Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-1.5 text-slate-600">
      <span className="font-semibold text-slate-500">{label} :</span>
      <span>{value}</span>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
      />
    </div>
  );
}
