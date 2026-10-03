import { useEffect, useRef, useState } from "react";
import { useCustomerAuth, getCustomerSupabaseClient, getStoredAuthReturnTo } from "../auth/customerAuth";
import { clearPendingBookingIntent, getPendingBookingIntent, storePaymentResumeReference } from "../auth/bookingIntentStorage";
import { CustomerApiError, finalizeBookingIntent, getBookingIntent } from "../services/customerAuthApi";

function newKey(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; const v = c === "x" ? r : (r & 0x3) | 0x8; return v.toString(16); });
}

type FinalizeIntent = (intentId: string, secret: string, token: string, acceptFare: boolean) => Promise<void>;

export function AuthCallbackPage() {
  const { configured, accessToken, signInWithGoogle } = useCustomerAuth();
  const started = useRef(false);
  const finalizeRef = useRef<FinalizeIntent | null>(null);
  const [message, setMessage] = useState("Finishing secure Google sign-in…");
  const [error, setError] = useState<string | null>(null);
  const [updatedFare, setUpdatedFare] = useState<number | null>(null);
  const [updatedTotal, setUpdatedTotal] = useState<number | null>(null);
  const [pending, setPending] = useState<ReturnType<typeof getPendingBookingIntent>>(null);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const finalize: FinalizeIntent = async (intentId, secret, token, acceptFare) => {
      setFinalizing(true);
      setError(null);
      try {
        const result = await finalizeBookingIntent(intentId, secret, token, acceptFare);
        storePaymentResumeReference({ bookingId: result.booking.id, ticketId: result.booking.ticketId, idempotencyKey: newKey() });
        clearPendingBookingIntent();
        window.location.replace("/payment/resume/");
      } catch (cause) {
        if (cause instanceof CustomerApiError && cause.code === "FARE_RECONFIRMATION_REQUIRED") {
          try {
            const intent = await getBookingIntent(intentId, secret);
            setPending(getPendingBookingIntent());
            setUpdatedFare(intent.quote.advanceAmount);
            setUpdatedTotal(intent.quote.totalFare);
            setMessage("The fare changed while you were signing in. Review the updated advance and accept it to continue.");
            return;
          } catch { /* show the finalization error */ }
        }
        setError(cause instanceof Error ? cause.message : "The booking could not be finalized. Please retry.");
        setMessage("We couldn’t finish the next step yet. Your saved booking is still available for a short time.");
      } finally {
        setFinalizing(false);
      }
    };
    finalizeRef.current = finalize;

    const run = async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const oauthError = query.get("error_description") || query.get("error");
        const savedIntent = getPendingBookingIntent();
        if (oauthError) {
          if (savedIntent) {
            window.location.replace("/book.html?restoreIntent=1&auth=cancelled");
            return;
          }
          window.location.replace(getStoredAuthReturnTo());
          return;
        }

        if (!configured) throw new Error("Google sign-in is not configured for this site.");
        const client = getCustomerSupabaseClient();
        const code = query.get("code");
        let session = (await client.auth.getSession()).data.session;
        if (code) {
          const exchanged = await client.auth.exchangeCodeForSession(code);
          if (exchanged.error) throw exchanged.error;
          session = exchanged.data.session;
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (!session?.access_token) throw new Error("Google did not return a session. Please try signing in again.");
        if (!savedIntent) {
          window.location.replace(getStoredAuthReturnTo());
          return;
        }
        setPending(savedIntent);
        setMessage("Your booking details are saved securely. Preparing your booking…");
        await finalize(savedIntent.intentId, savedIntent.resumeSecret, session.access_token, false);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Sign-in could not be completed. Your booking details are still saved for a short time.");
        setMessage("We couldn’t finish the next step yet.");
      }
    };

    void run();
  }, [configured]);

  const retry = async (acceptFare: boolean) => {
    const intent = pending ?? getPendingBookingIntent();
    if (!intent) {
      setError("This saved booking continuation has expired. Please return to the booking form and start again.");
      return;
    }
    try {
      const session = accessToken ? { access_token: accessToken } : (await getCustomerSupabaseClient().auth.getSession()).data.session;
      if (!session?.access_token) {
        await signInWithGoogle("/auth/callback/");
        return;
      }
      const finalize = finalizeRef.current;
      if (finalize) await finalize(intent.intentId, intent.resumeSecret, session.access_token, acceptFare);
      else {
        const result = await finalizeBookingIntent(intent.intentId, intent.resumeSecret, session.access_token, acceptFare);
        storePaymentResumeReference({ bookingId: result.booking.id, ticketId: result.booking.ticketId, idempotencyKey: newKey() });
        clearPendingBookingIntent();
        window.location.replace("/payment/resume/");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not continue. Please retry.");
    }
  };

  return (
    <main className="min-h-[70vh] bg-surface px-4 py-16 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-2xl border border-border-warm bg-surface-container-lowest p-7 shadow-lg" aria-live="polite">
        <p className="text-xs uppercase tracking-widest text-primary font-bold">Secure sign-in</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-midnight">Continue your booking</h1>
        <p className="mt-3 text-on-surface-variant">{message}</p>
        {updatedFare !== null && <p className="mt-4 rounded-xl bg-sandstone-wash p-4 font-semibold">Updated total fare: ₹{(updatedTotal ?? updatedFare).toLocaleString("en-IN")} · Advance due: ₹{updatedFare.toLocaleString("en-IN")}</p>}
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
        {updatedFare !== null && pending && <button type="button" onClick={() => void retry(true)} disabled={finalizing} className="mt-5 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60">{finalizing ? "Updating booking…" : "Accept updated fare and continue"}</button>}
        {error && !accessToken && configured && <button type="button" onClick={() => void signInWithGoogle("/auth/callback/").catch((e) => setError(e.message))} className="mt-3 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white">Sign in with Google again</button>}
        {error && <button type="button" onClick={() => void retry(updatedFare !== null)} disabled={finalizing} className="mt-3 w-full rounded-xl border border-primary px-4 py-3 font-semibold text-primary disabled:opacity-60">{finalizing ? "Retrying…" : "Retry securely"}</button>}
        {pending && <button type="button" onClick={() => window.location.replace("/book.html?restoreIntent=1")} className="mt-3 w-full rounded-xl px-4 py-3 font-semibold text-on-surface-variant hover:bg-sandstone-wash">Return to booking details</button>}
      </section>
    </main>
  );
}

export default AuthCallbackPage;
