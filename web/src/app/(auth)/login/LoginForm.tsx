"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  phone: z.string().min(9, "Nambari ya simu inahitajika"),
  password: z.string().min(6, "Nenosiri linahitajika"),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const { setAccessToken, setUser } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await api.post("/auth/login", data);
      const { accessToken, user } = res.data.data;
      setAccessToken(accessToken);
      setUser(user);
      router.push("/dashboard");
    } catch {
      setError("Nambari ya simu au nenosiri si sahihi");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card flex flex-col gap-4">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="input-group">
        <label>Nambari ya Simu</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            {...register("phone")}
            type="tel"
            placeholder="0700 000 000"
            className="pl-10"
          />
        </div>
        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
      </div>

      <div className="input-group">
        <label>Nenosiri</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            {...register("password")}
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full mt-2">
        {isSubmitting ? "Inaingia..." : "Ingia"}
      </button>
    </form>
  );
}
