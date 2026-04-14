"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";

const schema = z.object({
  firstName: z.string().min(1, "Jina la kwanza linahitajika"),
  lastName: z.string().min(1, "Jina la ukoo linahitajika"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  guestType: z.enum(["SINGLE", "DOUBLE", "FAMILY", "VIP"]).default("SINGLE"),
  maxAdmissions: z.coerce.number().int().min(1).optional(),
  tableNumber: z.string().optional(),
  seatNumber: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewGuestPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { guestType: "SINGLE" },
  });

  const guestType = watch("guestType");

  const onSubmit = async (data: FormData) => {
    await api.post(`/events/${eventId}/guests`, {
      ...data,
      maxAdmissions: guestType === "SINGLE" ? 1 : guestType === "DOUBLE" ? 2 : data.maxAdmissions,
    });
    router.push(`/events/${eventId}/guests`);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/events/${eventId}/guests`} className="text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title">Ongeza Mgeni</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="input-group">
            <label>Jina la Kwanza *</label>
            <input {...register("firstName")} placeholder="Amani" />
            {errors.firstName && <p className="text-red-400 text-xs">{errors.firstName.message}</p>}
          </div>
          <div className="input-group">
            <label>Jina la Ukoo *</label>
            <input {...register("lastName")} placeholder="Baraka" />
            {errors.lastName && <p className="text-red-400 text-xs">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="input-group">
            <label>Nambari ya Simu</label>
            <input {...register("phone")} type="tel" placeholder="0700 000 000" />
          </div>
          <div className="input-group">
            <label>Barua Pepe</label>
            <input {...register("email")} type="email" placeholder="amani@example.com" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="input-group">
            <label>Aina ya Tiketi</label>
            <select {...register("guestType")}>
              <option value="SINGLE">Mmoja (1)</option>
              <option value="DOUBLE">Wawili (2)</option>
              <option value="FAMILY">Familia (desturi)</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          {guestType === "FAMILY" && (
            <div className="input-group">
              <label>Idadi ya Watu</label>
              <input {...register("maxAdmissions")} type="number" min={1} placeholder="4" />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="input-group">
            <label>Nambari ya Meza</label>
            <input {...register("tableNumber")} placeholder="A1" />
          </div>
          <div className="input-group">
            <label>Nambari ya Kiti</label>
            <input {...register("seatNumber")} placeholder="5" />
          </div>
        </div>

        <div className="input-group">
          <label>Maelezo Mengine</label>
          <textarea {...register("notes")} rows={2} placeholder="Maelezo ya ziada..." />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href={`/events/${eventId}/guests`} className="btn-secondary flex-1 text-center">Ghairi</Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? "Inahifadhi..." : "Ongeza Mgeni"}
          </button>
        </div>
      </form>
    </div>
  );
}
