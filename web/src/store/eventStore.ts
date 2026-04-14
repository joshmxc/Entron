import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Event {
  id: string;
  name: string;
  venue: string;
  startDate: string;
}

interface EventState {
  activeEvent: Event | null;
  setActiveEvent: (event: Event | null) => void;
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      activeEvent: null,
      setActiveEvent: (activeEvent) => set({ activeEvent }),
    }),
    { name: "entron-event" }
  )
);
