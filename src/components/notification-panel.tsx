"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type NotificationItem = {
  id: string;
  type: string;
  channel: string;
  sentAt: string;
  readAt: string | null;
  product: {
    id: string;
    name: string;
    brand: string | null;
    warrantyExpiry: string | null;
  };
};

const TYPE_LABELS: Record<string, string> = {
  expiring_30: "Expires in 30 days",
  expiring_7: "Expires in 7 days",
  expired: "Warranty expired",
  renewal_available: "Renewal available",
};

type Props = {
  initialItems?: NotificationItem[];
};

export default function NotificationPanel({ initialItems = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((item) => !item.readAt).length;

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const data = await response.json();
      setItems(data.notifications ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        throw new Error("Failed");
      }

      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        }))
      );
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not update notifications");
    }
  }

  async function markRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
            : item
        )
      );
    } catch {
      // ignore
    }
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadNotifications();
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex items-center justify-center rounded-xl border border-gray-800 bg-neutral-900 p-2.5 text-gray-300 transition hover:border-cyan-400 hover:text-cyan-300"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-cyan-300 transition hover:text-cyan-200"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                <Loader2 className="animate-spin" size={16} />
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                No notifications yet. You&apos;ll see warranty reminders here.
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/products/${item.product.id}`}
                  onClick={() => {
                    markRead(item.id);
                    setOpen(false);
                  }}
                  className={`block border-b border-white/5 px-4 py-3 transition hover:bg-white/5 ${
                    !item.readAt ? "bg-cyan-500/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.product.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {TYPE_LABELS[item.type] ?? item.type}
                      </p>
                    </div>
                    {!item.readAt && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
