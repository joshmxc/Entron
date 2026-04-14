"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Jina linahitajika"),
  nameSwahili: z.string().optional(),
  venue: z.string().min(1, "Mahali panahitajika"),
  venueSwahili: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().min(1, "Tarehe inahitajika"),
  endDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewEventPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.post("/events", {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    });
    router.push("/events");
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/events" className="text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title">Tukio Jipya</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="input-group">
            <label>Jina la Tukio *</label>
            <input {...register("name")} placeholder="Harusi ya Amani" />
            {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
          </div>
          <div className="input-group">
            <label>Jina kwa Kiswahili</label>
            <input {...register("nameSwahili")} placeholder="Harusi ya Amani" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="input-group">
            <label>Mahali *</label>
            <input {...register("venue")} placeholder="Mlimani City Hall" />
            {errors.venue && <p className="text-red-400 text-xs">{errors.venue.message}</p>}
          </div>
          <div className="input-group">
            <label>Mahali kwa Kiswahili</label>
            <input {...register("venueSwahili")} placeholder="Ukumbi wa Mlimani" />
          </div>
        </div>

        <div className="input-group">
          <label>Maelezo</label>
          <textarea {...register("description")} rows={3} placeholder="Maelezo ya tukio..." />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="input-group">
            <label>Tarehe ya Kuanza *</label>
            <input type="datetime-local" {...register("startDate")} />
            {errors.startDate && <p className="text-red-400 text-xs">{errors.startDate.message}</p>}
          </div>
          <div className="input-group">
            <label>Tarehe ya Kuisha</label>
            <input type="datetime-local" {...register("endDate")} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/events" className="btn-secondary flex-1 text-center">Ghairi</Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? "Inahifadhi..." : "Hifadhi Tukio"}
          </button>
        </div>
      </form>
    </div>
  );
}
