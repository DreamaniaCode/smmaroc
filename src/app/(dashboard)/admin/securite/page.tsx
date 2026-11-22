"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Lock, ShieldCheck, KeyRound, AlertTriangle, CheckCircle2, 
  Copy, Check, RefreshCw, QrCode, ShieldAlert, Key 
} from "lucide-react";

export default function SecurityPage() {
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [setupStep, setSetupStep] = useState<"idle" | "scan" | "backup">("idle");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFactorMsg, setTwoFactorMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Disable 2FA State
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setTwoFactorLoading(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setTwoFactorEnabled(Boolean(data.user.twoFactorEnabled));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Les deux nouveaux mots de passe ne correspondent pas." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Le nouveau mot de passe doit comporter au moins 8 caractères." });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du changement de mot de passe");

      setPasswordMsg({ type: "success", text: "Votre mot de passe a été modifié avec succès." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const start2FASetup = async () => {
    setTwoFactorMsg(null);
    try {
      const res = await fetch("/api/auth/2fa");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'initier la configuration 2FA");

      setQrCodeUrl(data.qrCodeDataUrl);
      setSecretKey(data.secret);
      setSetupStep("scan");
    } catch (err: any) {
      setTwoFactorMsg({ type: "error", text: err.message });
    }
  };

  const confirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorMsg(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode.trim(), token: verifyCode.trim(), secret: secretKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Code invalide");

      setBackupCodes(data.backupCodes || []);
      setSetupStep("backup");
      setTwoFactorEnabled(true);
    } catch (err: any) {
      setTwoFactorMsg({ type: "error", text: err.message });
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisabling(true);
    setTwoFactorMsg(null);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mot de passe incorrect");

      setTwoFactorEnabled(false);
      setShowDisableModal(false);
      setDisablePassword("");
      setTwoFactorMsg({ type: "success", text: "La double authentification a été désactivée." });
    } catch (err: any) {
      setTwoFactorMsg({ type: "error", text: err.message });
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2.5">
          <Lock className="h-7 w-7 text-coral" />
          Sécurité du Compte &amp; Authentification 2FA
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre mot de passe et activez l&apos;authentification à deux facteurs (TOTP) pour garantir une protection maximale de vos accès.
        </p>
      </div>

      {/* Grid: 2FA & Password */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 2FA Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <ShieldCheck className="text-coral" size={20} />
                Double Authentification (2FA)
              </h2>
              {twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 size={13} />
                  Sécurisé
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <AlertTriangle size={13} />
                  Non activé
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Exige un code temporaire à 6 chiffres depuis votre application d&apos;authentification (Google Authenticator, Microsoft Authenticator, Authy, etc.) lors de chaque connexion.
            </p>

            {twoFactorMsg && (
              <div className={`mt-4 p-3 rounded-lg text-xs ${
                twoFactorMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {twoFactorMsg.text}
              </div>
            )}

            {setupStep === "scan" && (
              <div className="mt-4 p-4 rounded-xl bg-ivory-deep border border-border space-y-4">
                <p className="text-xs font-semibold text-ink">1. Scannez le QR Code :</p>
                {qrCodeUrl && (
                  <div className="flex justify-center bg-white p-3 rounded-lg border border-border w-fit mx-auto">
                    <Image src={qrCodeUrl} alt="2FA QR Code" width={180} height={180} unoptimized />
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ou saisissez la clé manuellement :</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded text-xs font-mono font-bold flex-1 select-all border border-border">
                      {secretKey}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="p-1.5 border border-border rounded hover:bg-card text-muted-foreground"
                      title="Copier la clé"
                    >
                      {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <form onSubmit={confirm2FA} className="space-y-3 pt-2 border-t border-border">
                  <label className="block text-xs font-semibold text-ink">
                    2. Entrez le code à 6 chiffres affiché par votre application :
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    className="h-10 w-full text-center text-lg tracking-widest font-mono font-bold rounded-lg border border-border bg-background"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSetupStep("idle")}
                      className="w-1/2 py-2 text-xs font-medium border border-border rounded-lg hover:bg-card"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={verifyCode.length < 6}
                      className="w-1/2 py-2 text-xs font-semibold bg-coral text-white rounded-lg hover:bg-coral-dark disabled:opacity-50"
                    >
                      Activer le 2FA
                    </button>
                  </div>
                </form>
              </div>
            )}

            {setupStep === "backup" && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  2FA activé avec succès !
                </div>
                <p className="text-[11px] text-emerald-900 leading-normal">
                  Veuillez conserver précieusement ces codes de secours. Chaque code n&apos;est utilisable qu&apos;une seule fois en cas de perte de votre téléphone.
                </p>
                <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-emerald-200 font-mono text-xs font-bold text-center">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-emerald-50/50 py-1 rounded">
                      {code}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSetupStep("idle")}
                  className="w-full py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
                >
                  J&apos;ai sauvegardé mes codes de secours
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            {twoFactorEnabled ? (
              <button
                type="button"
                onClick={() => setShowDisableModal(true)}
                className="w-full py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-lg transition-colors"
              >
                Désactiver l&apos;authentification à 2 facteurs
              </button>
            ) : (
              setupStep === "idle" && (
                <button
                  type="button"
                  onClick={start2FASetup}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-coral hover:bg-coral-dark rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <QrCode size={15} />
                  Configurer &amp; Activer le 2FA
                </button>
              )
            )}
          </div>
        </div>

        {/* Password Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-bold text-ink flex items-center gap-2 mb-2">
            <KeyRound className="text-coral" size={20} />
            Changer de Mot de Passe
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pour votre sécurité, choisissez une phrase de passe forte contenant au moins 8 caractères avec majuscules, chiffres et caractères spéciaux.
          </p>

          {passwordMsg && (
            <div className={`mt-4 p-3 rounded-lg text-xs ${
              passwordMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink">Mot de passe actuel</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="mt-2 w-full py-2.5 text-xs font-semibold text-white bg-ink hover:bg-ink-line rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {passwordLoading ? "Mise à jour..." : "Enregistrer le nouveau mot de passe"}
            </button>
          </form>
        </div>
      </div>

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-base font-bold text-ink flex items-center gap-2 text-destructive">
              <ShieldAlert size={20} />
              Désactiver la protection 2FA
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-normal">
              Veuillez confirmer votre mot de passe pour désactiver la double authentification sur votre compte.
            </p>

            <form onSubmit={handleDisable2FA} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink">Votre mot de passe</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Mot de passe actuel"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={disabling || !disablePassword}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg"
                >
                  {disabling ? "Désactivation..." : "Confirmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
