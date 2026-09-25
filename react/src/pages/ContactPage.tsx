import React, { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";

export interface ContactPageProps {
  language?: SupportedLanguage;
}

const FAQ_ITEMS = [
  {
    q: "How quickly will your dispatch team respond to my booking or inquiry?",
    a: "Our 24×7 Taj Ganj dispatch team responds within 2 to 5 minutes on WhatsApp (+91 98765 43210) or direct phone call. Inquiries submitted via the form are confirmed within 15 minutes with a transparent fare breakdown.",
  },
  {
    q: "Can I book a cab for a 5:00 AM Taj Mahal sunrise tour on short notice?",
    a: "Yes, absolutely. Sunrise Taj Mahal tours are our everyday specialty. We maintain standby chauffeur-driven sedans and MPVs in Taj Ganj and Fatehabad Road hotel areas, ready for 5:00 AM or 5:30 AM pickups.",
  },
  {
    q: "What exact information is required to confirm my outstation trip?",
    a: "To confirm, we only need: (1) Pickup date and exact time, (2) Pickup address or hotel name in Agra/Delhi, (3) Drop destination, (4) Passenger count, and (5) Preferred car tier. No complicated registrations required.",
  },
  {
    q: "Is there any waiting penalty if my train or flight is delayed?",
    a: "No. When you provide your train number (e.g., Gatimaan Express, Shatabdi at Agra Cantt) or flight number (at Delhi IGI Airport), our dispatch team tracks real-time arrivals. Chauffeurs wait at the exit gate with zero delay penalty.",
  },
  {
    q: "Do you issue official GST invoices for corporate expense claims?",
    a: "Yes. Every booking includes a verified GST tax invoice (GSTIN: 09ABCDE1234F1Z5) with itemized kilometer logs, expressway tolls, and state passenger permits.",
  },
];

export function ContactPage({ language = "en" }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    serviceType: "outstation-oneway",
    vehiclePreference: "sedan",
    tripDate: "",
    tripTime: "",
    pickupLocation: "",
    notes: "",
    gstRequired: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const text = `Hello SK Baghel Travels, I would like to book a trip:%0A- Name: ${encodeURIComponent(
      formData.name
    )}%0A- Phone: ${encodeURIComponent(formData.phone)}%0A- Email: ${encodeURIComponent(
      formData.email
    )}%0A- Service: ${encodeURIComponent(formData.serviceType)}%0A- Vehicle: ${encodeURIComponent(
      formData.vehiclePreference
    )}%0A- Date/Time: ${encodeURIComponent(formData.tripDate)} at ${encodeURIComponent(
      formData.tripTime
    )}%0A- Pickup: ${encodeURIComponent(formData.pickupLocation)}%0A- Notes: ${encodeURIComponent(
      formData.notes
    )}%0A- GST: ${formData.gstRequired ? "Yes" : "No"}`;

    setTimeout(() => {
      window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
    }, 400);
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="bg-surface-container-low/70 border-b border-border-warm py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs sm:text-sm font-medium mb-4 text-on-surface-variant font-label-caps">
            <a className="text-primary hover:underline" href="/">
              Home
            </a>
            <span className="text-secondary text-xs">/</span>
            <span className="text-ink-charcoal font-semibold">Contact &amp; 24×7 Dispatch Desk</span>
          </nav>

          <div className="max-w-4xl">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-caps text-[11px] uppercase tracking-wider font-bold inline-block mb-3">
              Taj Ganj Central Dispatch
            </span>
            <h1 className="font-headline-hero text-ink-charcoal text-headline-hero tracking-tight leading-tight mb-3">
              Your chauffeur is stationed. We&apos;re a ring away.
            </h1>
            <p className="text-on-surface-variant font-body-lg text-base sm:text-lg leading-relaxed mb-6">
              Headquartered directly beside the Taj Mahal in Taj Ganj, Agra. Dedicated round-the-clock dispatch for airport drops,
              outstation cabs across North India, and bespoke heritage tours.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3 items-center">
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="size-2 rounded-full bg-success-jade animate-pulse shrink-0" />
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                24×7 Active Garage &amp; Dispatch (&lt; 3 mins response)
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="material-symbols-outlined text-xs sm:text-sm text-success-jade shrink-0">chat</span>
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                Direct WhatsApp Travel Desk (+91 98765 43210)
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="material-symbols-outlined text-xs sm:text-sm text-terracotta-sandstone shrink-0">
                verified_user
              </span>
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                Official GST Billing &amp; Invoices
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container border border-border-warm px-3.5 py-1.5 shadow-xs">
              <span className="material-symbols-outlined text-xs sm:text-sm text-terracotta-sandstone shrink-0">
                location_on
              </span>
              <p className="text-ink-charcoal text-xs sm:text-sm font-medium whitespace-nowrap">
                Taj Ganj Physical Garage (Near Taj East Gate Rd)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE CONTACT CHANNELS (3 ELEVATED CARDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-12">
        <div>
          <span className="text-terracotta-sandstone font-label-caps uppercase tracking-wider text-xs font-bold block mb-1">
            Direct Communication Channels
          </span>
          <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">
            Immediate Connectivity with Central Fleet Operations
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Card 1: Immediate Call Dispatch */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <span className="bg-terracotta-sandstone text-white font-label-caps text-[10px] px-3 py-1 rounded-bl uppercase tracking-wider font-semibold">
                Average Pick-up: 2 Rings
              </span>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone mb-4 mt-2">
                <span className="material-symbols-outlined text-2xl">phone_in_talk</span>
              </div>
              <h3 className="font-headline-sm text-ink-charcoal text-xl mb-1 font-semibold">Immediate Call Dispatch (24×7)</h3>
              <p className="font-title-lg text-terracotta-sandstone mb-3 font-bold text-lg">+91 98765 43210</p>
              <p className="text-on-surface-variant font-body-sm leading-relaxed mb-6">
                Immediate taxi allocation, late-night expressway emergencies, 3:00 AM airport pickups, and instant driver
                assignment.
              </p>
            </div>
            <a
              className="w-full inline-flex items-center justify-center gap-2 bg-terracotta-sandstone hover:bg-primary text-white font-label-lg py-3 px-4 rounded-lg transition-colors text-center text-sm font-semibold shadow-xs"
              href="tel:+919876543210"
            >
              <span className="material-symbols-outlined text-lg">call</span>
              <span>Call Dispatch Now</span>
            </a>
          </div>

          {/* Card 2: WhatsApp Concierge Desk */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <span className="bg-success-jade text-white font-label-caps text-[10px] px-3 py-1 rounded-bl uppercase tracking-wider font-semibold">
                Typical Reply: &lt; 5 mins
              </span>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-[#E8F3EE] flex items-center justify-center text-success-jade mb-4 mt-2">
                <span className="material-symbols-outlined text-2xl">chat</span>
              </div>
              <h3 className="font-headline-sm text-ink-charcoal text-xl mb-1 font-semibold">
                WhatsApp Concierge Desk (Fastest)
              </h3>
              <p className="font-title-lg text-ink-charcoal mb-3 font-bold text-lg">+91 98765 43210</p>
              <p className="text-on-surface-variant font-body-sm leading-relaxed mb-6">
                Send itinerary details, receive vehicle photos, driver credentials, live location tracking, and instant quote
                cards with UPI advance links.
              </p>
            </div>
            <a
              className="w-full inline-flex items-center justify-center gap-2 bg-success-jade hover:bg-[#23533e] text-white font-label-lg py-3 px-4 rounded-lg transition-colors text-center text-sm font-semibold shadow-xs"
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noreferrer"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              <span>Chat on WhatsApp ↗</span>
            </a>
          </div>

          {/* Card 3: Corporate & Tour Desk */}
          <div className="bg-surface-container-lowest border border-border-warm rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0">
              <span className="bg-secondary text-white font-label-caps text-[10px] px-3 py-1 rounded-bl uppercase tracking-wider font-semibold">
                Corporate Rates &amp; GST
              </span>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-sandstone-wash flex items-center justify-center text-terracotta-sandstone mb-4 mt-2">
                <span className="material-symbols-outlined text-2xl">business_center</span>
              </div>
              <h3 className="font-headline-sm text-ink-charcoal text-xl mb-1 font-semibold">Corporate &amp; Tour Desk</h3>
              <p className="font-title-md text-ink-charcoal mb-0.5 font-semibold text-sm break-all">
                bookings@skbagheltravels.in
              </p>
              <p className="text-on-surface-variant font-body-sm mb-3 text-xs break-all">dispatch@skbagheltravels.in</p>
              <p className="text-on-surface-variant font-body-sm leading-relaxed mb-6">
                Multi-day Golden Triangle itineraries, wedding group transit in Tempo Travellers/Urbania, and B2B GST tax
                invoices.
              </p>
            </div>
            <a
              className="w-full inline-flex items-center justify-center gap-2 bg-surface-container-high hover:bg-surface-container-highest text-ink-charcoal font-label-lg py-3 px-4 rounded-lg transition-colors border border-outline-variant text-center text-sm font-semibold"
              href="mailto:bookings@skbagheltravels.in"
            >
              <span className="material-symbols-outlined text-lg">mail</span>
              <span>Email Itinerary</span>
            </a>
          </div>
        </div>

        {/* 3. TWO-COLUMN LAYOUT: INQUIRY FORM + GARAGE DETAILS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-6">
          {/* Left Column (7 cols): Booking / Quote Form */}
          <div className="lg:col-span-7 bg-surface-container-lowest border border-border-warm rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="border-b border-border-warm pb-5 mb-6">
              <div className="flex items-center gap-2 text-terracotta-sandstone text-xs font-bold uppercase tracking-wider font-label-caps mb-1.5">
                <span className="material-symbols-outlined text-base">speed</span>
                <span>15-Minute Guaranteed Confirmation</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-ink-charcoal">
                Send Itinerary or Request Direct Quote
              </h2>
              <p className="text-on-surface-variant font-body-sm mt-1 text-sm">
                Receive customized rates with zero hidden charges within 15 minutes directly on WhatsApp or Call.
              </p>
            </div>

            {submitted && (
              <div className="mb-6 p-4 rounded-lg bg-success-jade/10 border border-success-jade/30 text-success-jade flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
                <div>
                  <h4 className="font-bold text-sm">Inquiry Dispatched to Taj Ganj Control Desk!</h4>
                  <p className="text-xs mt-0.5">Connecting you with our concierge on WhatsApp shortly...</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-lg text-ink-charcoal text-xs mb-1.5 uppercase tracking-wider font-bold">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full rounded-lg border border-border-warm bg-surface-bright px-3.5 py-2.5 text-sm text-ink-charcoal focus:border-terracotta-sandstone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-lg text-ink-charcoal text-xs mb-1.5 uppercase tracking-wider font-bold">
                    WhatsApp Number *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-border-warm bg-sandstone-wash text-ink-charcoal text-xs font-semibold rounded-l-lg">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="98765 43210"
                      className="w-full rounded-r-lg border border-border-warm bg-surface-bright px-3.5 py-2.5 text-sm text-ink-charcoal focus:border-terracotta-sandstone focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-label-lg text-ink-charcoal text-xs mb-1.5 uppercase tracking-wider font-bold">
                  Email Address{" "}
                  <span className="text-secondary text-xs normal-case font-normal">(For GST Tax Receipt &amp; Voucher)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-border-warm bg-surface-bright px-3.5 py-2.5 text-sm text-ink-charcoal focus:border-terracotta-sandstone focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-lg text-ink-charcoal text-xs mb-1.5 uppercase tracking-wider font-bold">
                    Service Category *
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full rounded-lg border border-border-warm bg-surface-bright px-3.5 py-2.5 text-sm text-ink-charcoal focus:border-terracotta-sandstone focus:outline-none cursor-pointer"
                  >
                    <option value="outstation-oneway">One-Way Outstation Drop (Delhi/Jaipur/Lucknow)</option>
                    <option value="roundtrip">Multi-Day Round Trip (Rajasthan / Golden Triangle)</option>
                    <option value="sightseeing">Taj Mahal &amp; Agra Sightseeing (8h/80km)</option>
                    <option value="airport">Airport/Railway Station Transfer (IGI / Cantt)</option>
                    <option value="tempo">Tempo Traveller Group Booking</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-lg text-ink-charcoal text-xs mb-1.5 uppercase tracking-wider font-bold">
                    Preferred Vehicle *
                  </label>
                  <select
                    value={formData.vehiclePreference}
                    onChange={(e) => setFormData({ ...formData, vehiclePreference: e.target.value })}
                    className="w-full rounded-lg border border-border-warm bg-surface-bright px-3.5 py-2.5 text-sm text-ink-charcoal focus:border-terracotta-sandstone focus:outline-none cursor-pointer"
                  >
                    <option value="sedan">Sedan (Dzire / Etios) - 4 Pax</option>
                    <option value="ertiga">Ertiga MPV (6+1 Seater AC) - 5-6 Pax</option>
                    <option value="crysta">Innova Crysta Captain Seats - 6-7 Pax</option>
                    <option value="tempo">Force Tempo Traveller (12 to 26 Seater)</option>
                    <option value="urbania">Force Urbania VIP Luxury Van</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-lg text-ink-charcoal text-xs mb-1.5 uppercase tracking-wider font-bold">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tripDate}
                    onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                    className="w-full rounded-lg border border-border-warm bg-surface-bright px-3.5 py-2.5 text-sm text-ink-charcoal focus:border-terracotta-sandstone focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-lg text-ink-charcoal text-xs mb-1.5 uppercase tracking-wider font-bold">
                    Pickup Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.tripTime}
                    onChange={(e) => setFormData({ ...formData, tripTime: e.target.value })}
                    className="w-full rounded-lg border border-border-warm bg-surface-bright px-3.5 py-2.5 text-sm text-ink-charcoal focus:border-terracotta-sandstone focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-lg text-ink-charcoal text-xs mb-1.5 uppercase tracking-wider font-bold">
                  Pickup Location in Agra or NCR *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                  placeholder="e.g. Hotel Clarks Shiraz / Agra Cantt (AGC) / Delhi IGI Airport T3"
                  className="w-full rounded-lg border border-border-warm bg-surface-bright px-3.5 py-2.5 text-sm text-ink-charcoal focus:border-terracotta-sandstone focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-label-lg text-ink-charcoal text-xs mb-1.5 uppercase tracking-wider font-bold">
                  Destination / Itinerary Details
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Arriving by Gatimaan Express at 9:50 AM, need Taj Mahal + Agra Fort + Fatehpur Sikri drop at hotel."
                  className="w-full rounded-lg border border-border-warm bg-surface-bright px-3.5 py-2.5 text-sm text-ink-charcoal focus:border-terracotta-sandstone focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="gst-invoice"
                  checked={formData.gstRequired}
                  onChange={(e) => setFormData({ ...formData, gstRequired: e.target.checked })}
                  className="rounded border-border-warm text-terracotta-sandstone focus:ring-terracotta-sandstone size-4"
                />
                <label htmlFor="gst-invoice" className="text-xs text-on-surface font-medium select-none cursor-pointer">
                  I require an official GST tax invoice for corporate / personal expense filing
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-lg bg-terracotta-sandstone hover:bg-primary text-white font-label-lg text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 mt-4"
              >
                <span>Request Guaranteed Quote (15-Min Response)</span>
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </div>

          {/* Right Column (5 cols): Garage & Express Corridors */}
          <div className="lg:col-span-5 space-y-6">
            {/* Physical Garage Box */}
            <div className="bg-surface-container-lowest border border-border-warm rounded-xl p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-sandstone-wash flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                </div>
                <div>
                  <h4 className="font-title-md text-ink-charcoal font-bold">Taj Ganj Operational Hub</h4>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Headquarters &amp; Garage</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001. Operating 24 hours daily with round-the-clock vehicle
                sanitization bays and relief driver quarters.
              </p>
              <div className="space-y-2 text-xs border-t border-border-warm/60 pt-3">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Agra Cantt Railway Station:</span>
                  <span className="font-semibold text-ink-charcoal">12 mins (4.8 km)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Yamuna Expressway Toll Plaza:</span>
                  <span className="font-semibold text-ink-charcoal">15 mins (11 km)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Taj Mahal East Gate Entrance:</span>
                  <span className="font-semibold text-ink-charcoal">3 mins (800 m)</span>
                </div>
              </div>
            </div>

            {/* Quick Distance Benchmark */}
            <div className="bg-sandstone-wash/40 border border-border-warm/70 rounded-xl p-6">
              <h4 className="font-headline-sm text-ink-charcoal text-lg font-semibold mb-3">Popular Distance Benchmark</h4>
              <div className="space-y-2.5 text-xs text-on-surface-variant">
                <div className="flex items-center justify-between pb-2 border-b border-border-warm/40">
                  <span className="font-medium text-ink-charcoal">Agra → Delhi IGI T3</span>
                  <span className="text-primary font-bold">230 km · 3h 30m</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border-warm/40">
                  <span className="font-medium text-ink-charcoal">Agra → Jaipur Pink City</span>
                  <span className="text-primary font-bold">240 km · 4h 30m</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border-warm/40">
                  <span className="font-medium text-ink-charcoal">Agra → Mathura Vrindavan</span>
                  <span className="text-primary font-bold">55 km · 1h 15m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink-charcoal">Agra → Gwalior Fort</span>
                  <span className="text-primary font-bold">120 km · 2h 30m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. DISPATCH FAQS */}
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center mb-8">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest font-bold block mb-1">
              Dispatch Questions
            </span>
            <h2 className="font-headline-lg text-headline-sm sm:text-headline-lg text-ink-charcoal font-semibold">
              Frequently Asked Dispatch Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="border border-border-warm/70 rounded-xl overflow-hidden bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left p-space-md flex items-center justify-between gap-4 hover:bg-sandstone-wash/20 transition-colors"
                  >
                    <span className="font-title-md text-sm sm:text-base font-semibold text-ink-charcoal">{faq.q}</span>
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-space-md pt-0 text-on-surface-variant font-body-sm leading-relaxed border-t border-border-warm/40 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
