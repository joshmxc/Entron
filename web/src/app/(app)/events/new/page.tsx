"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Event name is required"),
  venue: z.string().min(1, "Venue is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
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
        <h1 className="page-title">New Event</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div className="input-group">
          <label>Event Name *</label>
          <input {...register("name")} placeholder="Annual Gala 2026" />
          {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
        </div>

        <div className="input-group">
          <label>Venue *</label>
          <input {...register("venue")} placeholder="Grand Ballroom, City Hotel" />
          {errors.venue && <p className="text-red-400 text-xs">{errors.venue.message}</p>}
        </div>

        <div className="input-group">
          <label>Description</label>
          <textarea {...register("description")} rows={3} placeholder="Event description..." />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="input-group">
            <label>Start Date *</label>
            <input type="datetime-local" {...register("startDate")} />
            {errors.startDate && <p className="text-red-400 text-xs">{errors.startDate.message}</p>}
          </div>
          <div className="input-group">
            <label>End Date</label>
            <input type="datetime-local" {...register("endDate")} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/events" className="btn-secondary flex-1 text-center">Cancel</Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? "Saving..." : "Save Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
