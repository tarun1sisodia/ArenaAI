import { useEffect, useRef, useState } from "react";
import { useCustomerAuth, getCustomerDisplayName } from "../auth/customerAuth";
import { clearPaymentResumeReference, getPaymentResumeReference, storePaymentResumeReference } from "../auth/bookingIntentStorage";
import { createOwnerPaymentCheckout, getOwnerPaymentStatus, type PaymentCheckoutResponse } from "../services/customerAuthApi";
import { loadRazorpayScript } from "../features/booking/razorpay";

function makeKey(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export function PaymentResumePage() {
  const { user, accessToken, loading: authLoading, configured, signInWithGoogle } = useCustomerAuth();
  const [reference, setReference] = useState(() => getPaymentResumeReference());
  const [status, setStatus] = useState("Preparing your secure payment…");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const started = useRef(false);

  const launchCheckout = async (checkout: PaymentCheckoutResponse, current: NonNullable<typeof reference>) => {
    if (checkout.checkoutUrl) {
      window.location.assign(checkout.checkoutUrl);
      return;
    }
    if (!checkout.providerOrderId) throw new Error("Razorpay did not return a checkout order. Your booking is saved; try again from My Bookings.");
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) throw new Error("Unable to load secure Razorpay Checkout. Check your connection or content blocker.");
    const key = checkout.publicClientToken || checkout.keyId;
    if (!key) throw new Error("The payment provider key is missing from the server response.");
    setStatus("Razorpay is ready. Complete payment in the secure checkout window.");
    const instance = new window.Razorpay({
      key,
      order_id: checkout.providerOrderId,
      amount: checkout.amountMinor,
      currency: checkout.currency || "INR",
      name: "SK Baghel Tour & Travels",
      description: `Trip booking ${current.ticketId}`,
      image: `${window.location.origin}/assets/brand/favicon.svg`,
      prefill: { name: getCustomerDisplayName(user), email: user?.email ?? undefined },
      theme: { color: "#8B1E1E" },
      modal: { ondismiss: () => { setBusy(false); setStatus("Checkout was closed. Your booking is still saved; you can reopen the same payment safely."); } },
      handler: async () => {
        setStatus("Payment submitted. Waiting for server-side confirmation…");
        try {
          for (let attempt = 0; attempt < 10; attempt += 1) {
            const result = await getOwnerPaymentStatus(checkout.paymentId, accessToken!);
            if (result.status === "captured" && result.bookingStatus === "paid_confirmed") {
              clearPaymentResumeReference();
              setReference(null);
              setStatus("Payment verified. Your booking is confirmed.");
              setBusy(false);
              return;
            }
            if (result.status === "failed" || result.status === "refunded") {
              setPaymentFailed(true);
              setBusy(false);
              setStatus("The payment was not completed. You can retry with a new payment attempt.");
              return;
            }
            await new Promise((resolve) => window.setTimeout(resolve, 1500));
          }
          setStatus("Razorpay returned successfully, but server verification is still pending. Do not pay again yet; check My Bookings shortly.");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not verify payment status yet. Do not pay again until status is checked.");
        } finally {
          setBusy(false);
        }
      },
    });
    instance.on("payment.failed", (response: any) => {
      setPaymentFailed(true);
      setBusy(false);
      setStatus(response?.error?.description ? `Payment failed: ${response.error.description}` : "Payment was not completed. You can retry from your account.");
    });
    instance.open();
  };

  const retryCheckout = (newAttempt: boolean) => {
    if (!reference || busy) return;
    const next = { ...reference, idempotencyKey: newAttempt ? makeKey() : reference.idempotencyKey, createdAt: Date.now() };
    storePaymentResumeReference(next);
    setReference(next);
    started.current = false;
    setError(null);
    setPaymentFailed(false);
    setStatus("Reopening your secure checkout…");
  };

  useEffect(() => {
    if (authLoading || !accessToken || !reference || started.current) return;
    started.current = true;
    setBusy(true);
    void createOwnerPaymentCheckout(reference.ticketId, accessToken, reference.idempotencyKey)
      .then((checkout) => launchCheckout(checkout, reference))
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Could not start payment. Your booking remains saved.");
        setStatus("Payment has not been started. You can safely retry using the same request.");
      })
      .finally(() => setBusy(false));
    // This mount-driven launch is intentional: the OAuth redirect continues directly into Checkout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, accessToken, reference]);

  if (authLoading) return <main className="min-h-[65vh] p-8 grid place-items-center"><section className="text-center"><h1 className="text-2xl font-bold text-ink-midnight">Secure payment recovery</h1><p className="mt-2 text-on-surface-variant">Restoring your account and booking…</p></section></main>;
  if (!accessToken) return <main className="min-h-[65vh] px-4 py-16 grid place-items-center"><section className="max-w-lg rounded-2xl border border-border-warm bg-surface-container-lowest p-8 text-center"><h1 className="text-2xl font-bold text-ink-midnight">Sign in to continue payment</h1><p className="mt-3 text-on-surface-variant">Your booking is saved. Sign in with the Google account used to book, and we’ll reopen the secure checkout.</p><button type="button" disabled={!configured} onClick={() => void signInWithGoogle("/payment/resume/").catch((e) => setError(e.message))} className="mt-6 rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">Continue with Google</button>{error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}</section></main>;

  const canRetrySame = Boolean(reference && (error || status.includes("closed") || status.includes("not been started")) && !paymentFailed);
  return <main className="min-h-[65vh] px-4 py-16 grid place-items-center"><section className="w-full max-w-xl rounded-2xl border border-border-warm bg-surface-container-lowest p-8 text-center shadow-md"><p className="text-xs uppercase tracking-widest text-primary font-bold">Secure payment</p><h1 className="mt-2 text-2xl font-bold text-ink-midnight">Booking {reference?.ticketId ?? ""}</h1><p className="mt-4 text-on-surface-variant" aria-live="polite">{status}</p>{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}{status.includes("confirmed") && <a href="/my-bookings/" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white">View My Bookings</a>}{canRetrySame && <button type="button" onClick={() => retryCheckout(false)} disabled={busy} className="mt-5 rounded-xl border border-primary px-5 py-3 font-semibold text-primary disabled:opacity-50">Reopen secure checkout</button>}{paymentFailed && <button type="button" onClick={() => retryCheckout(true)} disabled={busy} className="mt-5 rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-50">Retry payment</button>}{!reference && <a href="/my-bookings/" className="mt-5 inline-flex rounded-xl border border-primary px-5 py-3 font-semibold text-primary">Return to My Bookings</a>}</section></main>;
}

export default PaymentResumePage;
