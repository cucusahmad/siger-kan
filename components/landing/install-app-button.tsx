"use client";

import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const detectionFrame = window.requestAnimationFrame(() => {
      setIsIos(iosDevice && !standalone);
    });

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js");
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowIosGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.cancelAnimationFrame(detectionFrame);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!installPrompt && !isIos) return null;

  const handleInstall = async () => {
    if (isIos) {
      setShowIosGuide((visible) => !visible);
      return;
    }

    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void handleInstall()}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-ocean/20 bg-white px-5 py-3 text-sm font-bold text-ocean shadow-sm transition hover:border-ocean/40 hover:bg-seafoam focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean sm:w-auto"
        aria-expanded={isIos ? showIosGuide : undefined}
        aria-controls={isIos ? "ios-install-guide" : undefined}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Instal Aplikasi
      </button>
      {showIosGuide && (
        <div
          id="ios-install-guide"
          role="status"
          className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-72 rounded-2xl border border-navy/10 bg-white p-4 text-left text-sm leading-6 text-ink shadow-xl"
        >
          <p className="font-bold text-navy">Instal di iPhone atau iPad</p>
          <p className="mt-1">
            Ketuk <Share className="mx-1 inline h-4 w-4 text-ocean" aria-label="Bagikan" />
            pada Safari, lalu pilih <strong>Tambahkan ke Layar Utama</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
