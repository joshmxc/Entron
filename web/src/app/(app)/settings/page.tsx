"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Globe, Lock, LogOut, MessageSquare, CheckCircle2, XCircle, Loader2, Phone } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const schema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

// ── Test SMS panel (admin-only) ─────────────────────────────────────────────
function TestSMSPanel() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; simulated?: boolean } | null>(null);

  const handleTest = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/sms/test", { phone: phone.trim() });
      const data = res.data?.data;
      setResult({
        success: true,
        message: data?.simulated
          ? `Simulated — Next SMS credentials not set yet. To: ${data?.to}`
          : `SMS sent! To: ${data?.to} | ID: ${data?.messageId}`,
        simulated: data?.simulated,
      });
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string; detail?: string; hint?: string } } };
      const detail = axErr.response?.data?.detail ?? axErr.response?.data?.error ?? "SMS failed";
      const hint = axErr.response?.data?.hint;
      setResult({ success: false, message: hint ? `${detail} — ${hint}` : detail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-slate-200 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-entron-blue" /> Test SMS (Next SMS)
      </h2>
      <p className="text-xs text-slate-400">
        Send a test message to verify your Next SMS credentials are working.
        Set <code className="bg-slate-700 px-1 rounded">NEXTSMS_USERNAME</code> and{" "}
        <code className="bg-slate-700 px-1 rounded">NEXTSMS_PASSWORD</code> in your server&apos;s{" "}
        <code className="bg-slate-700 px-1 rounded">.env</code> file first.
      </p>

      <div className="input-group">
        <label>Phone Number (Tanzania)</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="0712 345 678"
            className="pl-10"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Local format (0712…) or international (255712…) both work.
        </p>
      </div>

      <button
        onClick={handleTest}
        disabled={loading || !phone.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
          : <><MessageSquare className="w-4 h-4" /> Send Test SMS</>
        }
      </button>

      {result && (
        <div className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
          result.success
            ? result.simulated
              ? "border-yellow-700/50 bg-yellow-900/20 text-yellow-300"
              : "border-green-700/50 bg-green-900/20 text-green-300"
            : "border-red-700/50 bg-red-900/20 text-red-300"
        }`}>
          {result.success
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          }
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Settings Page ──────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, clear } = useAuthStore();
  const router = useRouter();
  const [lang, setLang] = useState(user?.language ?? "en");
  const [msg, setMsg] = useState("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onChangePassword = async (data: FormData) => {
    try {
      await api.patch(`/users/${user?.id}`, { password: data.newPassword });
      reset();
      setMsg("Password changed successfully!");
    } catch {
      setMsg("Failed to change password");
    }
  };

  const handleLangChange = async (newLang: string) => {
    setLang(newLang);
    document.cookie = `NEXT_LOCALE=${newLang}; path=/`;
    if (user?.id) {
      await api.patch(`/users/${user.id}`, { language: newLang });
    }
    window.location.reload();
  };

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    clear();
    router.push("/login");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="page-title">Settings</h1>

      {/* Profile */}
      <div className="card">
        <h2 className="font-semibold text-slate-200 mb-4">Account Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Name</span>
            <span className="text-slate-200">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Role</span>
            <span className="text-slate-200">{user?.role === "ADMIN" ? "Admin" : "Staff"}</span>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" /> Language
        </h2>
        <div className="flex gap-3">
          {[
            { code: "en", label: "English" },
            { code: "sw", label: "Kiswahili" },
          ].map(({ code, label }) => (
            <button
              key={code}
              onClick={() => handleLangChange(code)}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                lang === code
                  ? "bg-entron-blue text-white"
                  : "bg-entron-dark-card border border-entron-dark-border text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Test SMS — admin only */}
      {user?.role === "ADMIN" && <TestSMSPanel />}

      {/* Change password */}
      <div className="card">
        <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Change Password
        </h2>
        {msg && (
          <div className={`px-3 py-2 rounded-lg text-sm mb-4 ${
            msg.includes("successfully") ? "bg-green-900/50 text-green-300" : "bg-red-900/50 text-red-300"
          }`}>
            {msg}
          </div>
        )}
        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
          <div className="input-group">
            <label>Current Password</label>
            <input {...register("currentPassword")} type="password" />
            {errors.currentPassword && <p className="text-red-400 text-xs">{errors.currentPassword.message}</p>}
          </div>
          <div className="input-group">
            <label>New Password</label>
            <input {...register("newPassword")} type="password" />
            {errors.newPassword && <p className="text-red-400 text-xs">{errors.newPassword.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Saving..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="w-full btn-danger flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Log Out
      </button>
    </div>
  );
}
