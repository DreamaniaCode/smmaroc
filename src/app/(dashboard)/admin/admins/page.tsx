"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  ShieldCheck, UserPlus, Key, Trash2, Edit3, ShieldAlert, 
  CheckCircle2, XCircle, Clock, Globe, RefreshCw, AlertTriangle, Eye 
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  adminEmail: string;
  target: string | null;
  ipAddress: string;
  details: string | null;
  createdAt: string;
}

export default function AdminStaffPage() {
  const [tab, setTab] = useState<"staff" | "audit">("staff");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "ADMIN", password: "" });
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de charger l'équipe");
      setStaff(data.staff || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/audit-logs?limit=50");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de charger les logs");
      setAuditLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    await Promise.all([fetchStaff(), fetchAuditLogs()]);
    setLoading(false);
  }, [fetchStaff, fetchAuditLogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");

      setSuccess(`Administrateur ${newStaff.email} ajouté avec succès.`);
      setShowAddModal(false);
      setNewStaff({ name: "", email: "", role: "ADMIN", password: "" });
      fetchStaff();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingStaff.name,
          role: editingStaff.role,
          status: editingStaff.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la modification");

      setSuccess(`Compte de ${editingStaff.email} mis à jour avec succès.`);
      setEditingStaff(null);
      fetchStaff();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (member: StaffMember) => {
    if (!confirm(`Confirmez-vous la révocation définitive des accès de ${member.name} (${member.email}) ?`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression");

      setSuccess(`L'accès pour ${member.email} a été révoqué.`);
      fetchStaff();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">👑 Super Admin</span>;
      case "ADMIN":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">🛡️ Admin</span>;
      case "SUPPORT":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">🎧 Support</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-coral" />
            Gestion de l&apos;Équipe &amp; Sécurité
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contrôle d&apos;accès basé sur les rôles (RBAC), double authentification et journal d&apos;audit de sécurité.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg bg-card hover:bg-ivory-deep transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors shadow-sm"
          >
            <UserPlus size={16} />
            Ajouter un Admin / Staff
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 text-xs font-bold">Fermer</button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="text-green-500 hover:text-green-700 text-xs font-bold">Fermer</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("staff")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            tab === "staff"
              ? "border-coral text-coral"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <ShieldCheck size={16} />
          Membres de l&apos;Équipe ({staff.length})
        </button>
        <button
          onClick={() => setTab("audit")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            tab === "audit"
              ? "border-coral text-coral"
              : "border-transparent text-muted-foreground hover:text-ink"
          }`}
        >
          <Clock size={16} />
          Journal d&apos;Audit de Sécurité ({auditLogs.length})
        </button>
      </div>

      {/* Tab: Staff Roster */}
      {tab === "staff" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ivory-deep border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Membre &amp; Contact</th>
                  <th className="px-6 py-3.5 font-semibold">Rôle</th>
                  <th className="px-6 py-3.5 font-semibold">2FA Sécurité</th>
                  <th className="px-6 py-3.5 font-semibold">Statut</th>
                  <th className="px-6 py-3.5 font-semibold">Dernière Connexion</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-ivory-deep/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </td>
                    <td className="px-6 py-4">{roleBadge(member.role)}</td>
                    <td className="px-6 py-4">
                      {member.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={13} />
                          2FA Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle size={13} />
                          Non activé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {member.status === "ACTIVE" ? (
                        <span className="text-xs font-medium text-success">Actif</span>
                      ) : (
                        <span className="text-xs font-medium text-destructive">{member.status}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {member.lastLoginAt ? (
                        <div>
                          <div>{new Date(member.lastLoginAt).toLocaleString("fr-FR")}</div>
                          {member.lastLoginIp && (
                            <span className="text-[10px] text-gray-500 font-mono">IP: {member.lastLoginIp}</span>
                          )}
                        </div>
                      ) : (
                        <span>Jamais connecté</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingStaff(member)}
                          className="p-1.5 text-muted-foreground hover:text-ink hover:bg-ivory-deep rounded-md transition-colors"
                          title="Modifier"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member)}
                          className="p-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Révoquer l'accès"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {tab === "audit" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ivory-deep border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Date &amp; Heure</th>
                  <th className="px-6 py-3.5 font-semibold">Action</th>
                  <th className="px-6 py-3.5 font-semibold">Exécuté par</th>
                  <th className="px-6 py-3.5 font-semibold">Cible</th>
                  <th className="px-6 py-3.5 font-semibold">Adresse IP</th>
                  <th className="px-6 py-3.5 font-semibold">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Aucun événement d&apos;audit enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-ivory-deep/40 transition-colors">
                      <td className="px-6 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs font-medium text-ink">
                        {log.adminEmail}
                      </td>
                      <td className="px-6 py-3 text-xs text-muted-foreground truncate max-w-[200px]" title={log.target || ""}>
                        {log.target || "—"}
                      </td>
                      <td className="px-6 py-3 text-xs font-mono text-muted-foreground">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-3 text-xs text-muted-foreground font-mono truncate max-w-[250px]" title={log.details || ""}>
                        {log.details || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <UserPlus className="text-coral" size={20} />
              Ajouter un Administrateur / Staff
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Créez un nouvel accès sécurisé. Un mot de passe fort et unique est exigé.
            </p>

            <form onSubmit={handleCreateStaff} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink">Nom complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Youssef Bennani"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Adresse E-mail professionnelle</label>
                <input
                  type="email"
                  required
                  placeholder="youssef@smmaroc.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Rôle et autorisations</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                >
                  <option value="ADMIN">ADMIN (Accès complet gestion &amp; CRM)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Accès total système &amp; admins)</option>
                  <option value="SUPPORT">SUPPORT (Gestion des tickets &amp; CRM consultatif)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Mot de passe provisoire</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min. 8 car. (majuscules, chiffres, symboles)"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background font-mono"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Le membre sera invité à configurer son 2FA et son mot de passe.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-ink rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                >
                  {submitting ? "Création..." : "Créer l'accès"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Edit3 className="text-coral" size={20} />
              Modifier l&apos;accès : {editingStaff.email}
            </h2>

            <form onSubmit={handleUpdateStaff} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink">Nom complet</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Rôle</label>
                <select
                  value={editingStaff.role}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPPORT">SUPPORT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink">Statut du compte</label>
                <select
                  value={editingStaff.status}
                  onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                >
                  <option value="ACTIVE">Actif (Autorisé)</option>
                  <option value="SUSPENDED">Suspendu (Bloqué temporairement)</option>
                  <option value="BANNED">Banni (Accès révoqué)</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-ink rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors"
                >
                  {submitting ? "Enregistrement..." : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
