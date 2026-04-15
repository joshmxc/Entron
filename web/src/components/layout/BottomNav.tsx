"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, QrCode, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard",   label: "Home",     icon: LayoutDashboard },
  { href: "/events",      label: "Events",   icon: Calendar },
  { href: "/scanner",     label: "Scan",     icon: QrCode, highlight: true },
  { href: "/invitations", label: "Invites",  icon: Mail },
  { href: "/messages",    label: "Messages", icon: MessageSquare },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 pb-safe"
      style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname.startsWith(href);

          // Icon container background
          const containerCls = cn(
            "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
            highlight && active  ? "bg-entron-blue shadow-lg" :
            highlight && !active ? "bg-entron-blue/10"        :
            active               ? "bg-entron-blue/10"        : ""
          );

          // Icon colour — white only when it's the highlighted Scan button AND active
          const iconCls = cn(
            "w-5 h-5 transition-colors",
            highlight && active ? "text-white" :
            active || highlight ? "text-entron-blue" : ""
          );

          const iconStyle = !active && !highlight ? { color: "var(--text-faint)" } : {};

          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-0">
              <div className={containerCls}>
                <Icon className={iconCls} style={iconStyle} />
              </div>
              <span
                className={cn("text-[10px] font-medium truncate", active ? "text-entron-blue" : "")}
                style={!active ? { color: "var(--text-faint)" } : {}}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
