"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, QrCode, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";

export default function BottomNav() {
  const pathname = usePathname();
  const { lang } = useLang();

  const items = [
    { href: "/dashboard",   label: { sw: "Nyumbani", en: "Home" },     icon: LayoutDashboard },
    { href: "/events",      label: { sw: "Matukio",  en: "Events" },   icon: Calendar },
    { href: "/scanner",     label: { sw: "Skana",    en: "Scan" },     icon: QrCode, highlight: true },
    { href: "/invitations", label: { sw: "Mialiko",  en: "Invites" },  icon: Mail },
    { href: "/messages",    label: { sw: "Ujumbe",   en: "Messages" }, icon: MessageSquare },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe"
      style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}>
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-0">
              <div className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                highlight && active  && "bg-entron-blue shadow-lg",
                highlight && !active && "bg-entron-blue/10",
                !highlight && active && "bg-entron-blue/10",
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  active || highlight ? "text-entron-blue" : "",
                  highlight && active ? "text-white" : "",
                )} style={!active && !highlight ? { color: "var(--text-faint)" } : {}} />
              </div>
              <span className={cn("text-[10px] font-medium truncate", active ? "text-entron-blue" : "")}
                style={!active ? { color: "var(--text-faint)" } : {}}>
                {label[lang]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
