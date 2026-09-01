/* 5-step booking flow — mock data, sessionStorage, simulated payment. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Relative base to site root, set by the build per page (".", "../..", …).
  const BASE = (document.body && document.body.dataset.base) || ".";

  const KEY = "skb-booking";
  const params = new URLSearchParams(location.search);

  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const load = () => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || "null") || {};
    } catch {
      return {};
    }
  };

  const saved = load();
  const state = {
    step: 1,
    from: params.get("from") || saved.from || "agra",
    to: params.get("to") || saved.to || "delhi",
    route: params.get("route") || saved.route || "",
    date: params.get("date") || saved.date || tomorrow(),
    time: params.get("time") || saved.time || "08:30",
    tripType: params.get("trip") || saved.tripType || "one-way",
    passengers: Number(params.get("pax") || saved.passengers || 3),
    vehicleId: params.get("vehicle") || saved.vehicleId || "sedan",
    packageId: params.get("package") || saved.packageId || "",
    name: saved.name || "",
    phone: saved.phone || "",
    pickupPoint: saved.pickupPoint || "",
    note: saved.note || "",
    pay: saved.pay || "upi",
    bookingId: saved.bookingId || "",
  };

  if (state.route) {
    const r = SKB.route(state.route);
    if (r) {
      state.from = r.from;
      state.to = r.to;
      if (r.kind === "local") state.tripType = "one-way";
    }
  }

  const persist = () => sessionStorage.setItem(KEY, JSON.stringify(state));

  const fareNow = () =>
    SKB.calcFare({
      from: state.from,
      to: state.to,
      vehicleId: state.vehicleId,
      tripType: state.tripType,
      packageId: state.packageId || undefined,
    });

  const fillSelect = (el, items, value, labelFn) => {
    el.innerHTML = items
      .map((item) => `<option value="${item.id}" ${item.id === value ? "selected" : ""}>${labelFn(item)}</option>`)
      .join("");
  };

  const paxLabel = (n) => {
    if (n <= 4) return 4;
    if (n <= 6) return 6;
    if (n <= 12) return 12;
    return 16;
  };

  const renderStepper = () => {
    $$(".stepper button").forEach((btn) => {
      const step = Number(btn.dataset.step);
      btn.classList.toggle("is-current", step === state.step);
      btn.classList.toggle("is-done", step < state.step);
      btn.disabled = step > state.step && !state.bookingId;
    });
    $$(".panel").forEach((panel) => {
      panel.classList.toggle("is-active", Number(panel.dataset.step) === state.step);
    });
  };

  const renderSummary = () => {
    const fare = fareNow();
    const origin = SKB.city(state.from);
    const dest = SKB.city(state.to);
    const box = $("#booking-summary");
    if (!box) return;
    if (!fare) {
      box.innerHTML = `<p class="eyebrow">Booking summary</p><p>Choose a published route to see a fare.</p>`;
      return;
    }
    const codes = state.packageId
      ? `<div class="codes"><span>PKG</span></div>`
      : `<div class="codes"><span>${origin.code}</span><b>→</b><span>${dest.code}</span></div>`;
    box.innerHTML = `
      <p class="eyebrow">${state.bookingId ? "Confirmed" : "Live summary"}</p>
      ${codes}
      <p>${fare.label}</p>
      <div class="summary-lines">
        <div><span>When</span><strong>${state.date || "—"} · ${state.time}</strong></div>
        <div><span>Vehicle</span><strong>${fare.vehicle.name}</strong></div>
        <div><span>Passengers</span><strong>${state.passengers}</strong></div>
        <div><span>Trip</span><strong>${fare.tripType}</strong></div>
        <div><span>Advance now</span><strong>${SKB.inr(fare.advance)}</strong></div>
        <div><span>To driver</span><strong>${SKB.inr(fare.remaining)}</strong></div>
      </div>
      <div class="total"><span>Total fare</span><b>${SKB.inr(fare.total)}</b></div>
    `;
  };

  const renderVehicles = () => {
    const list = $("#vehicle-pick");
    const pax = paxLabel(state.passengers);
    list.innerHTML = SKB.vehicles
      .map((v) => {
        const fare = SKB.calcFare({
          from: state.from,
          to: state.to,
          vehicleId: v.id,
          tripType: state.tripType,
          packageId: state.packageId || undefined,
        });
        const ok = SKB.fitsPassengers(v, pax) && fare;
        const selected = v.id === state.vehicleId;
        return `
          <label class="${selected ? "is-selected" : ""} ${ok ? "" : "is-disabled"}">
            <img src="${v.image}" alt="" width="160" height="100" />
            <span>
              <strong>${v.name}</strong><br />
              <small class="muted">${v.tags.join(" · ")}</small>
            </span>
            <span class="fare">${fare ? SKB.inr(fare.total) : "—"}</span>
            <input type="radio" name="vehicle" value="${v.id}" ${selected ? "checked" : ""} ${ok ? "" : "disabled"} />
          </label>`;
      })
      .join("");
    list.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        state.vehicleId = input.value;
        persist();
        renderVehicles();
        renderSummary();
      });
    });
  };

  const hydrateStep1 = () => {
    fillSelect($("#from"), SKB.cities, state.from, (c) => `${c.name} (${c.code})`);
    fillSelect($("#to"), SKB.cities, state.to, (c) => `${c.name} (${c.code})`);
    $("#date").value = state.date;
    $("#date").min = tomorrow();
    $("#time").value = state.time;
    $("#tripType").value = state.tripType;
    $("#passengers").value = String(paxLabel(state.passengers));
    if (state.packageId) {
      const pack = SKB.packageById(state.packageId);
      const banner = $("#package-banner");
      if (pack && banner) {
        banner.hidden = false;
        banner.innerHTML = `<strong>${pack.name}</strong> · ${pack.duration} · from ${SKB.inr(pack.from)}. Vehicle upgrades add to the sample fare.`;
      }
    }
  };

  const readStep1 = () => {
    state.from = $("#from").value;
    state.to = $("#to").value;
    state.date = $("#date").value;
    state.time = $("#time").value;
    state.tripType = $("#tripType").value;
    state.passengers = Number($("#passengers").value);
    const vehicle = SKB.vehicle(state.vehicleId);
    if (vehicle && !SKB.fitsPassengers(vehicle, paxLabel(state.passengers))) {
      const next = SKB.vehicles.find((v) => SKB.fitsPassengers(v, paxLabel(state.passengers)));
      if (next) state.vehicleId = next.id;
    }
  };

  const validate = (step) => {
    if (step === 1) {
      readStep1();
      if (!state.date) {
        SKB.toast("Pick a travel date.");
        return false;
      }
      if (!fareNow()) {
        SKB.toast("That city pair isn't in the mock timetable yet.");
        return false;
      }
    }
    if (step === 2) {
      if (!SKB.vehicle(state.vehicleId)) {
        SKB.toast("Choose a vehicle.");
        return false;
      }
    }
    if (step === 3) {
      state.name = $("#fullName").value.trim();
      state.phone = $("#phone").value.trim();
      state.pickupPoint = $("#pickupPoint").value.trim();
      state.note = $("#note").value.trim();
      let ok = true;
      $("#fullName").closest(".field").classList.toggle("is-error", state.name.length < 2);
      $("#phone").closest(".field").classList.toggle("is-error", !/^[0-9+\-\s]{10,}$/.test(state.phone));
      $("#pickupPoint").closest(".field").classList.toggle("is-error", state.pickupPoint.length < 3);
      if (state.name.length < 2 || !/^[0-9+\-\s]{10,}$/.test(state.phone) || state.pickupPoint.length < 3) {
        ok = false;
        SKB.toast("Add a name, mobile number and pickup point.");
      }
      return ok;
    }
    return true;
  };

  const go = (step) => {
    state.step = step;
    persist();
    renderStepper();
    renderSummary();
    if (step === 2) renderVehicles();
    if (step === 3) {
      $("#fullName").value = state.name;
      $("#phone").value = state.phone;
      $("#pickupPoint").value = state.pickupPoint;
      $("#note").value = state.note;
    }
    if (step === 4) {
      const fare = fareNow();
      $("#pay-amount").textContent = fare ? SKB.inr(fare.advance) : "—";
      $$("input[name=pay]").forEach((el) => {
        el.checked = el.value === state.pay;
      });
    }
    if (step === 5) renderTicket();
    SKB.track("booking_step", { step });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderTicket = () => {
    const fare = fareNow();
    const first = state.name.split(" ")[0] || "traveller";
    $("#ticket").innerHTML = `
      <div class="ticket">
        <div class="ticket-top"><span>BOOKING CONFIRMED</span><b>✓</b></div>
        <h2>See you on the road,<br /><i>${first}.</i></h2>
        <div class="ticket-id">${state.bookingId} <span>·</span> PAID (DEMO)</div>
        <div class="summary-lines">
          <div><span>Route</span><strong>${fare.label}</strong></div>
          <div><span>Date / time</span><strong>${state.date} · ${state.time}</strong></div>
          <div><span>Vehicle</span><strong>${fare.vehicle.name}</strong></div>
          <div><span>Driver</span><strong>Rakesh · 4.9/5 · arrives 15 min early</strong></div>
          <div><span>Remaining</span><strong>${SKB.inr(fare.remaining)} to driver</strong></div>
        </div>
        <p class="muted">This is a frontend preview. No payment was taken and no driver was assigned.</p>
        <div class="form-actions">
          <a class="btn-outline" href="${BASE}/">Back home</a>
          <a class="btn-primary" href="https://wa.me/${SKB.contact.whatsapp}?text=${encodeURIComponent("Booking " + state.bookingId + " — " + fare.label)}" target="_blank" rel="noreferrer">WhatsApp the team <span>↗</span></a>
        </div>
      </div>`;
  };

  $("#step-1")?.addEventListener("change", () => {
    readStep1();
    persist();
    renderSummary();
  });

  $$("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const from = Number(btn.dataset.next) - 1;
      if (!validate(from)) return;
      persist();
      go(Number(btn.dataset.next));
    });
  });

  $$("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => go(Number(btn.dataset.back)));
  });

  $$(".stepper button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.step);
      if (step <= state.step || state.bookingId) go(step);
    });
  });

  $("#pay-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const fare = fareNow();
    if (!fare) return;
    const method = $("input[name=pay]:checked")?.value || "upi";
    state.pay = method;
    const btn = $("#pay-button");
    btn.classList.add("is-loading");
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.innerHTML = `<span class="spinner"></span> Verifying`;
    await new Promise((r) => setTimeout(r, 900));
    state.bookingId = "AGR-" + String(Math.floor(Math.random() * 80) + 20).padStart(3, "0");
    persist();
    SKB.track("booking_paid_demo", { id: state.bookingId, method });
    SKB.toast("Demo payment verified on the client. Ticket ready.");
    go(5);
  });

  hydrateStep1();
  renderSummary();
  renderStepper();
  if (params.get("vehicle") || params.get("package")) {
    /* Stay on step 1 so the guest still confirms date/time. */
  }
})();
