"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

const PIN_KEY = "finance_pin_verified";
const DEFAULT_PIN = "7221";
const SESSION_DURATION = 30 * 60 * 1000; // 30 menit

interface Props {
  children: React.ReactNode;
}

export function FinancePinGate({ children }: Props) {
  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(PIN_KEY);
    let isVerified = false;
    if (stored) {
      try {
        const { timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < SESSION_DURATION) {
          isVerified = true;
        } else {
          sessionStorage.removeItem(PIN_KEY);
        }
      } catch {
        sessionStorage.removeItem(PIN_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVerified(isVerified);

    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem("finance_pin") ?? DEFAULT_PIN;
    if (pin === storedPin) {
      sessionStorage.setItem(PIN_KEY, JSON.stringify({ timestamp: Date.now() }));
      setVerified(true);
      setError(null);
    } else {
      setError("PIN salah. Coba lagi.");
      setPin("");
    }
  };

  if (checking) return null;

  if (verified) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-xs space-y-6 rounded-2xl border border-hairline bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tint-amber text-accent">
            <Lock size={26} />
          </span>
          <h2 className="text-lg font-bold text-ink">Keuangan & Laporan</h2>
          <p className="text-center text-sm text-ink-soft">
            Masukkan PIN untuk mengakses halaman ini.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              placeholder="Masukkan PIN"
              autoFocus
              className="w-full rounded-xl border border-hairline px-4 py-3 pr-11 text-center text-xl font-bold tracking-widest text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
            />
            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              tabIndex={-1}
            >
              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-center text-sm font-medium text-danger">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
