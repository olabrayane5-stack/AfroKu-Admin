import React, { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Palette,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Wallet,
  RefreshCw,
} from "lucide-react";
import {
  fetchApplications,
  approveApplication,
  rejectApplication,
  PartnerApplication,
} from "../services/adminApi";

type StatusFilter = "pending" | "approved" | "rejected";

const STATUS_LABELS: Record<StatusFilter, string> = {
  pending: "En attente",
  approved: "Approuvées",
  rejected: "Refusées",
};

export function CandidaturesView() {
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchApplications(filter);
      setApplications(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDecision = () => {
    // Après une décision, on retire l'élément de la liste "en attente"
    // et on rafraîchit pour refléter le vrai état du serveur.
    setExpandedId(null);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">Candidatures</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Examinez, approuvez ou refusez les dossiers Guide et Artisan.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* Filtres par statut */}
      <div className="flex gap-2 mb-5">
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${
              filter === key
                ? "bg-navy text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {STATUS_LABELS[key]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Chargement des candidatures...</span>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm">
          Aucune candidature dans cette catégorie pour le moment.
        </div>
      )}

      <div className="space-y-3">
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            expanded={expandedId === app.id}
            onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
            onDecision={handleDecision}
          />
        ))}
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  expanded,
  onToggle,
  onDecision,
}: {
  application: PartnerApplication;
  expanded: boolean;
  onToggle: () => void;
  onDecision: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");

  const { details } = application;
  const isGuide = application.type === "guide";

  const handleApprove = async () => {
    setProcessing(true);
    setError("");
    try {
      await approveApplication(application.id);
      onDecision();
    } catch (err: any) {
      setError(err.message || "Échec de l'approbation.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (reason.trim().length < 5) {
      setError("Le motif doit comporter au moins 5 caractères.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      await rejectApplication(application.id, reason.trim());
      onDecision();
    } catch (err: any) {
      setError(err.message || "Échec du refus.");
    } finally {
      setProcessing(false);
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
            <p className="text-sm font-bold text-slate-800">{details.fullName || application.email}</p>
            <p className="text-xs text-slate-500">
              {isGuide ? "Guide touristique" : "Artisan / Créateur"} · Soumis le{" "}
              {new Date(application.submittedAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={application.status} />
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
          {/* Détails du dossier */}
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <DetailRow icon={<Mail className="w-3.5 h-3.5" />} label="E-mail" value={details.email || application.email} />
            <DetailRow icon={<Phone className="w-3.5 h-3.5" />} label="WhatsApp" value={details.phoneWhatsApp} />
            <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="Ville" value={details.city} />
            <DetailRow icon={<Wallet className="w-3.5 h-3.5" />} label="Mobile Money" value={details.mobileMoneyNumber} />
            {isGuide ? (
              <>
                <DetailRow label="Langues" value={(details.languages || []).join(", ")} />
                <DetailRow label="Tarif journalier" value={details.dailyRateXOF ? `${details.dailyRateXOF} XOF` : undefined} />
                <DetailRow label="Expérience" value={details.yearsExperience ? `${details.yearsExperience} an(s)` : undefined} />
                <DetailRow label="Spécialités" value={(details.specialties || []).join(", ")} />
              </>
            ) : (
              <>
                <DetailRow label="Atelier" value={details.workshopName} />
                <DetailRow label="Type d'artisanat" value={details.craftType} />
                <DetailRow label="Tarif visite" value={details.workshopPriceXOF ? `${details.workshopPriceXOF} XOF` : undefined} />
              </>
            )}
          </div>

          {details.photoUrl && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Photo de profil</p>
              <img
                src={details.photoUrl}
                alt="Photo de profil"
                className="w-24 h-24 rounded-full object-cover border border-slate-200 mt-1"
              />
            </div>
          )}

          {details.bio && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">Présentation</p>
              <p className="text-xs text-slate-700 leading-relaxed">{details.bio}</p>
            </div>
          )}

          {details.idDocumentType && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                Pièce d'identité — {details.idDocumentType} {details.idDocumentNumber}
              </p>
              {details.documentPhotoUrl && (
                <img
                  src={details.documentPhotoUrl}
                  alt="Pièce d'identité"
                  className="max-w-xs rounded-lg border border-slate-200 mt-1"
                />
              )}
            </div>
          )}

          {details.cvUrl && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                CV / Portfolio {details.cvFileName ? `— ${details.cvFileName}` : ""}
              </p>
              <a
                href={details.cvUrl}
                download={details.cvFileName || "cv"}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 underline"
              >
                Ouvrir / télécharger le fichier
              </a>
            </div>
          )}

          {application.status === "rejected" && application.adminNotes && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <span className="font-bold">Motif du refus : </span>{application.adminNotes}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Actions — uniquement pour les candidatures en attente */}
          {application.status === "pending" && !showRejectForm && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approuver
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={processing}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
              >
                <XCircle className="w-3.5 h-3.5" /> Refuser
              </button>
            </div>
          )}

          {application.status === "pending" && showRejectForm && (
            <div className="pt-2 space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase">
                Motif du refus (visible par le candidat)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Ex : Photo de la pièce d'identité illisible, merci de la soumettre à nouveau."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                >
                  {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirmer le refus
                </button>
                <button
                  onClick={() => { setShowRejectForm(false); setReason(""); setError(""); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-1.5 text-slate-600">
      {icon}
      <span className="font-semibold text-slate-500">{label} :</span>
      <span>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: PartnerApplication["status"] }) {
  const config = {
    pending: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
    approved: { label: "Approuvée", cls: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "Refusée", cls: "bg-red-100 text-red-700" },
  }[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${config.cls}`}>
      {status === "pending" && <Clock className="w-3 h-3" />}
      {status === "approved" && <CheckCircle2 className="w-3 h-3" />}
      {status === "rejected" && <XCircle className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
