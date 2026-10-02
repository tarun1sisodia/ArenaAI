import { contact } from "../../data/contact";
import { WhatsAppIcon } from "../../components/icons";

/**
 * SK Concierge — the desk's custom booking agent.
 *
 * A guided, chat-style assistant docked into the booking flow. It reacts to
 * the customer's current step and selection, offers one-tap smart picks on
 * the trip step, explains the fare split before payment, and can hand the
 * whole selection to a human travel agent over WhatsApp (prefilled with the
 * exact trip + vehicle + date) to complete the purchase.
 */

export type QuickPick = "popular" | "family" | "budget" | "sunrise";

export const QUICK_PICK_LABELS: Record<QuickPick, string> = {
  popular: "Most booked",
  family: "Family favourite",
  budget: "Best value",
  sunrise: "Sunrise special",
};

interface BookingAssistantProps {
  /** 2 = trip selection, 3 = booking & billing form */
  step: 2 | 3;
  vehicleName: string;
  tripName: string | null;
  totalFare: number | null;
  advanceAmount: number | null;
  tourDate?: string;
  tripCount?: number;
  onQuickPick?: (pick: QuickPick) => void;
}

export function BookingAssistant({
  step,
  vehicleName,
  tripName,
  totalFare,
  advanceAmount,
  tourDate,
  tripCount,
  onQuickPick,
}: BookingAssistantProps) {
  const inr = (v: number | null | undefined) => `₹${(v ?? 0).toLocaleString("en-IN")}`;

  const whatsappContext =
    step === 2
      ? `Hello SK Baghel Travels, I have selected the ${vehicleName} and need help choosing the right trip. Can your agent assist me?`
      : `Hello SK Baghel Travels, I would like your agent to complete my booking: ${tripName ?? "a private tour"} in the ${vehicleName}${tourDate ? ` on ${tourDate}` : ""}${totalFare ? ` (quoted ${inr(totalFare)})` : ""}.`;

  return (
    <aside
      aria-label="SK Concierge booking assistant"
      className="bg-surface-container-lowest rounded-xl border border-border-warm shadow-sm overflow-hidden flex flex-col"
    >
      {/* Agent header */}
      <div className="bg-ink-charcoal text-ivory-surface px-space-md py-space-sm flex items-center gap-space-sm">
        <span className="relative flex shrink-0">
          <span className="w-9 h-9 rounded-full bg-gold-accent/20 border border-gold-accent/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-icon-20 text-gold-accent">support_agent</span>
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-jade border-2 border-ink-charcoal animate-pulse" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-title-md text-title-md text-ivory-surface font-semibold leading-tight">
            SK Concierge
          </p>
          <p className="font-label-caps text-label-caps uppercase tracking-wider text-surface-variant">
            Booking agent • online now
          </p>
        </div>
      </div>

      {/* Agent messages */}
      <div className="p-space-md flex flex-col gap-2.5">
        {step === 2 ? (
          <>
            <AgentBubble>
              Your <strong>{vehicleName}</strong> is locked in. Now pick the trip you want to take in it —
              search the live desk catalogue below, or tap a suggestion and I'll shortlist it for you.
            </AgentBubble>
            {typeof tripCount === "number" && tripCount > 0 && (
              <AgentBubble>
                I found <strong>{tripCount} bookable {tripCount === 1 ? "trip" : "trips"}</strong> for
                today, straight from our Agra operations desk — availability is live.
              </AgentBubble>
            )}
            {onQuickPick && (
              <div className="flex flex-wrap gap-1.5 pt-space-xs" role="group" aria-label="Assistant quick picks">
                {(Object.keys(QUICK_PICK_LABELS) as QuickPick[]).map((pick) => (
                  <button
                    key={pick}
                    type="button"
                    onClick={() => onQuickPick(pick)}
                    className="px-2.5 py-1.5 rounded-full bg-sandstone-wash text-primary font-label-lg text-label-lg font-semibold hover:bg-terracotta-deep hover:text-on-primary transition-colors border border-border-warm/60"
                  >
                    {QUICK_PICK_LABELS[pick]}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <AgentBubble>
              Excellent choice — <strong>{tripName ?? "your trip"}</strong> in the {vehicleName}
              {totalFare ? <> comes to <strong>{inr(totalFare)}</strong> all-inclusive (tolls, parking, chauffeur)</> : null}.
            </AgentBubble>
            <AgentBubble>
              {advanceAmount && advanceAmount > 0 ? (
                <>
                  Pay the <strong>28% advance ({inr(advanceAmount)})</strong> now to lock your chauffeur —
                  the balance is payable to the driver after the trip.
                </>
              ) : (
                "Complete the form and we'll lock your chauffeur immediately."
              )}
            </AgentBubble>
            <ul className="flex flex-col gap-1.5 pt-space-xs font-body-sm text-body-sm text-on-surface-variant">
              {[
                "Free cancellation up to 24 hours before pickup",
                "Police-verified chauffeur & sanitized AC vehicle",
                "Zero forced shopping — monuments only",
              ].map((point) => (
                <li key={point} className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-icon-15 text-success-jade shrink-0 mt-0.5" aria-hidden="true">
                    check_circle
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Agent handoff CTA */}
      <div className="px-space-md pb-space-md">
        <a
          href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(whatsappContext)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#ffffff" }}
          className="w-full py-2.5 px-space-sm rounded-lg bg-success-jade text-white font-label-lg text-label-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
          <span className="text-white font-semibold" style={{ color: "#ffffff" }}>
            {step === 2 ? "Let our agent pick for me" : "Let our agent book this for me"}
          </span>
        </a>
        <p className="font-label-caps text-label-caps uppercase tracking-wider text-secondary text-center mt-1.5">
          24×7 Agra desk • replies in ~2 min
        </p>
      </div>
    </aside>
  );
}

function AgentBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-low rounded-xl rounded-tl-sm px-3 py-2.5 border border-border-warm/60 font-body-md text-body-md text-on-surface-variant leading-relaxed">
      {children}
    </div>
  );
}

export default BookingAssistant;
