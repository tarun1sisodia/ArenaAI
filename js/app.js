/* Shared chrome: header, mobile sheet, toast, forms, filters, calculators. */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const toastEl = $("#toast");
  let toastTimer;

  window.SKB = window.SKB || {};
  SKB.toast = (message) => {
    if (!toastEl) return;
    window.clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toastEl.classList.remove("is-visible"), 3200);
  };

  SKB.track = (name, detail = {}) => {
    console.info("[skb]", name, detail);
  };

  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const page = document.body?.dataset.page;
  $$(".nav-desktop a, .nav-sheet a[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.setAttribute("aria-current", "page");
  });

  const sheet = $("#nav-sheet");
  const toggle = $("#nav-toggle");
  const closeSheet = $("#nav-close");
  const setSheet = (open) => {
    if (!sheet || !toggle) return;
    sheet.classList.toggle("is-open", open);
    sheet.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle?.addEventListener("click", () => setSheet(true));
  closeSheet?.addEventListener("click", () => setSheet(false));
  sheet?.addEventListener("click", (e) => {
    if (e.target.closest("a")) setSheet(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setSheet(false);
  });

  $$("[data-event]").forEach((el) => {
    el.addEventListener("click", () => SKB.track(el.dataset.event, { href: el.getAttribute("href") }));
  });

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const isoTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  $$('input[type="date"]').forEach((input) => {
    if (!input.min) input.min = isoTomorrow();
    if (!input.value) input.value = isoTomorrow();
  });

  const contactForm = $("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = contactForm.name.value.trim();
      const phone = contactForm.phone.value.trim();
      const message = contactForm.message.value.trim();
      let ok = true;
      const setErr = (field, on) => {
        field.closest(".field")?.classList.toggle("is-error", on);
        if (on) ok = false;
      };
      setErr(contactForm.name, name.length < 2);
      setErr(contactForm.phone, !/^[0-9+\-\s]{8,}$/.test(phone));
      setErr(contactForm.message, message.length < 4);
      const hi = document.body?.dataset.lang === "hi";
      if (!ok) {
        SKB.toast(hi ? "हाइलाइट फ़ील्ड पूरा करें।" : "Please complete the highlighted fields.");
        return;
      }
      SKB.track("enquiry_submit", { name });
      contactForm.reset();
      SKB.toast(hi ? "डेमो में संदेश सुरक्षित है — कहीं नहीं भेजा गया।" : "Message captured in this demo — nothing was sent.");
    });
  }

  const enquire = new URLSearchParams(location.search).get("enquire");
  if (enquire && contactForm?.message) {
    const pack = SKB.packageById?.(enquire);
    if (pack) {
      contactForm.message.value = `I'd like to enquire about the ${pack.name} package.`;
    }
  }

  const calc = $("#fare-calc");
  if (calc && SKB.calcFare) {
    const render = () => {
      const from = calc.from.value;
      const to = calc.to.value;
      const vehicleId = calc.vehicle.value;
      const tripType = calc.tripType.value;
      const out = $("#fare-result");
      const fare = SKB.calcFare({ from, to, vehicleId, tripType });
      if (!fare) {
        out.hidden = false;
        out.innerHTML = `<p>We don't publish that pair yet. Try Agra → Delhi, or call <a href="tel:${SKB.contact.phone}">${SKB.contact.phoneDisplay}</a>.</p>`;
        return;
      }
      out.hidden = false;
      out.innerHTML = `
        <p class="eyebrow">Sample fare</p>
        <p class="fare">${SKB.inr(fare.total)}</p>
        <p class="muted">${fare.label} · ${fare.vehicle.name} · ${fare.duration}${fare.km ? " · " + fare.km + " km" : ""}</p>
        <p class="muted">Advance ${SKB.inr(fare.advance)} now, ${SKB.inr(fare.remaining)} to the driver.</p>
        <a class="btn-primary" href="/book.html?from=${from}&to=${to}&vehicle=${vehicleId}&trip=${tripType}" data-event="cta_click">Book this route <span>↗</span></a>
      `;
    };
    calc.addEventListener("change", render);
    calc.addEventListener("submit", (e) => {
      e.preventDefault();
      render();
    });
    render();
  }

  $$("[data-filter-group]").forEach((group) => {
    const buttons = $$("button", group);
    const target = document.querySelector(group.dataset.filterGroup);
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("is-on"));
        btn.classList.add("is-on");
        const key = btn.dataset.filter;
        $$("[data-seats], [data-kind]", target || document).forEach((card) => {
          const seats = Number(card.dataset.seats || 99);
          const kind = card.dataset.kind;
          let show = true;
          if (key === "all") show = true;
          else if (key === "sedan") show = seats <= 4;
          else if (key === "mpv") show = seats === 6;
          else if (key === "group") show = seats >= 12;
          else if (key.startsWith("from-")) show = kind === key.slice(5);
          card.hidden = !show;
        });
      });
    });
  });

  $$("table.data tbody tr[data-href]").forEach((row) => {
    row.addEventListener("click", () => {
      location.href = row.dataset.href;
    });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter") location.href = row.dataset.href;
    });
  });

  if (page && page !== "book") {
    document.body.classList.add("has-lead");
  }

  SKB.track("view", { page: page || location.pathname });
})();
