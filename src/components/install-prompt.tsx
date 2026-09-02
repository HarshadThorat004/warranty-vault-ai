"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const STORAGE_KEY = "wv-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(STORAGE_KEY) === "1") {
      return;
    }

    if (isIos()) {
      setIosHint(true);
      setHidden(false);
      return;
    }

    function onPrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setHidden(false);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setHidden(true);
    setDeferred(null);
    setIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (hidden || (!deferred && !iosHint)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 md:p-6">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-white/10 bg-neutral-950/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            Install Warranty Vault
          </p>
          {iosHint ? (
            <p className="mt-1 text-xs leading-5 text-gray-400">
              On iPhone, tap Share{" "}
              <Share size={12} className="inline align-text-bottom" /> then{" "}
              <strong className="font-medium text-gray-200">
                Add to Home Screen
              </strong>{" "}
              so expiry alerts can arrive with the app closed.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-gray-400">
              Add it to your home screen for camera scan and browser alerts
              without opening this tab.
            </p>
          )}
          {!iosHint && (
            <button
              type="button"
              onClick={() => void install()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-gray-100"
            >
              <Download size={14} />
              Install
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1 text-gray-500 transition hover:text-white"
          aria-label="Dismiss install hint"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
