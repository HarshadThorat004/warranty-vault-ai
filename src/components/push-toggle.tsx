"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }

  return output;
}

export default function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setSupported(ok);

    if (!ok) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/push");
        if (!response.ok) return;
        const data = (await response.json()) as {
          enabled?: boolean;
          subscribed?: boolean;
        };
        setConfigured(Boolean(data.enabled));
        setSubscribed(Boolean(data.subscribed));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function enable() {
    try {
      setBusy(true);

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications were blocked in the browser");
        return;
      }

      const config = await fetch("/api/push").then((res) => res.json());
      if (!config.enabled || !config.publicKey) {
        toast.error("Browser alerts are not configured on the server");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey),
      });

      const response = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      setSubscribed(true);
      toast.success("Browser alerts on");
    } catch (error) {
      console.error(error);
      toast.error("Could not enable browser alerts");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    try {
      setBusy(true);

      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      await fetch("/api/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription?.endpoint }),
      });

      await subscription?.unsubscribe();
      setSubscribed(false);
      toast.success("Browser alerts off");
    } catch (error) {
      console.error(error);
      toast.error("Could not disable browser alerts");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">Checking browser alerts…</p>
    );
  }

  if (!supported) {
    return (
      <p className="text-sm leading-7 text-gray-500">
        This browser does not support push alerts. Chrome, Edge, Firefox, or an
        installed PWA on iOS 16.4+ will.
      </p>
    );
  }

  if (!configured) {
    return (
      <p className="text-sm leading-7 text-gray-500">
        Browser alerts need VAPID keys on the server. Email and calendar
        reminders still work.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={subscribed ? disable : enable}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-white/20 hover:text-white disabled:opacity-50"
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : subscribed ? (
          <BellOff size={16} />
        ) : (
          <Bell size={16} />
        )}
        {subscribed ? "Turn off alerts" : "Enable browser alerts"}
      </button>
      <p className="text-xs text-gray-500">
        {subscribed
          ? "This device will get a notification the day before cover ends."
          : "Works on this device while the browser is closed."}
      </p>
    </div>
  );
}
