"use client";
import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, UserCog, UserCheck, UserX, Circle } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(9),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

type FormData = z.infer<typeof schema>;

export default function StaffPage() {
  useAuth("ADMIN");
  const [showForm, setShowForm] = useState(false);
  const { data, mutate } = useSWR("/users", fetcher);
  const users = data?.data ?? [];
  const activeStaff = users.filter((u: Record<string, unknown>) => u.isActive);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "STAFF" },
  });

  const onSubmit = async (data: FormData) => {
    await api.post("/users", data);
    reset();
    setShowForm(false);
    mutate();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await api.patch(`/users/${id}`, { isActive: !isActive });
    mutate();
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Wafanyakazi</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4" /> Ongeza
        </button>
      </div>

      {/* Active Staff Panel */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Circle className="w-3 h-3 text-green-400 fill-green-400" />
          <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
            Active Staff ({activeStaff.length})
          </h2>
        </div>
        {activeStaff.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No active staff members.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeStaff.map((user: Record<string, unknown>) => (
              <div key={String(user.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>{user.name as string}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {user.role === "ADMIN" ? "Admin" : "Staff"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <h2 className="font-semibold text-slate-200">Mfanyakazi Mpya</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="input-group">
              <label>Jina Kamili</label>
              <input {...register("name")} placeholder="Amani Baraka" />
              {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
            </div>
            <div className="input-group">
              <label>Nambari ya Simu</label>
              <input {...register("phone")} type="tel" placeholder="0700 000 000" />
              {errors.phone && <p className="text-red-400 text-xs">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="input-group">
              <label>Nenosiri</label>
              <input {...register("password")} type="password" placeholder="min. herufi 6" />
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>
            <div className="input-group">
              <label>Wadhifa</label>
              <select {...register("role")}>
                <option value="STAFF">Mhudumu</option>
                <option value="ADMIN">Msimamizi</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Ghairi</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? "Inaongeza..." : "Ongeza Mfanyakazi"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {users.map((user: Record<string, unknown>) => (
          <div key={String(user.id)} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              user.isActive ? "bg-entron-blue/20" : "bg-slate-700"
            }`}>
              <UserCog className={`w-5 h-5 ${user.isActive ? "text-entron-blue" : "text-slate-500"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200">{user.name as string}</p>
              <p className="text-sm text-slate-400">{user.phone as string}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${user.role === "ADMIN" ? "badge-purple" : "badge-blue"}`}>
                {user.role === "ADMIN" ? "Msimamizi" : "Mhudumu"}
              </span>
              <button
                onClick={() => toggleActive(user.id as string, user.isActive as boolean)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                {user.isActive ? <UserCheck className="w-4 h-4 text-blue-400" /> : <UserX className="w-4 h-4 text-red-400" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
