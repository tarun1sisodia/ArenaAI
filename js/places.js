/**
 * SK Baghel Tour & Travels — LocationIQ location search.
 *
 * The LocationIQ token is intentionally runtime-configured. Set
 * window.LOCATIONIQ_ACCESS_TOKEN, localStorage.locationiq_access_token, or
 * open the LocationIQ badge and enter the public browser token once.
 */
(function () {
  "use strict";

  window.SKB = window.SKB || {};

  var DESTINATIONS = [
    { id: "agra", name: "Agra", state: "Uttar Pradesh", code: "AGR", desc: "Taj Mahal, Agra Fort, Cantt", popular: true },
    { id: "delhi", name: "Delhi (IGI Airport / NCR)", state: "Delhi NCR", code: "DEL", desc: "Terminal 1/2/3, New Delhi Rly", popular: true },
    { id: "jaipur", name: "Jaipur (Pink City)", state: "Rajasthan", code: "JAI", desc: "Hawa Mahal, Amber Fort, Airport", popular: true },
    { id: "mathura", name: "Mathura", state: "Uttar Pradesh", code: "MAT", desc: "Krishna Janmabhoomi, Yamuna Ghats", popular: true },
    { id: "vrindavan", name: "Vrindavan", state: "Uttar Pradesh", code: "VRN", desc: "Prem Mandir, Banke Bihari, ISKCON", popular: true },
    { id: "gwalior", name: "Gwalior", state: "Madhya Pradesh", code: "GWL", desc: "Gwalior Fort, Jai Vilas Palace", popular: true },
    { id: "lucknow", name: "Lucknow", state: "Uttar Pradesh", code: "LKO", desc: "Rumi Darwaza, Airport, Charbagh", popular: true },
    { id: "ayodhya", name: "Ayodhya", state: "Uttar Pradesh", code: "AYD", desc: "Shri Ram Janmabhoomi, Airport", popular: true },
    { id: "varanasi", name: "Varanasi (Kashi)", state: "Uttar Pradesh", code: "VNS", desc: "Kashi Vishwanath, Dashashwamedh", popular: true },
    { id: "rishikesh", name: "Rishikesh", state: "Uttarakhand", code: "RKSH", desc: "Triveni Ghat, Laxman Jhula", popular: true },
    { id: "haridwar", name: "Haridwar", state: "Uttarakhand", code: "HW", desc: "Har Ki Pauri, Ganga Aarti", popular: true },
    { id: "dehradun", name: "Dehradun / Mussoorie", state: "Uttarakhand", code: "DED", desc: "Jolly Grant Airport, Mall Road", popular: false },
    { id: "chandigarh", name: "Chandigarh", state: "Punjab/Haryana", code: "IXC", desc: "Sukhna Lake, Sector 17", popular: true },
    { id: "shimla", name: "Shimla", state: "Himachal Pradesh", code: "SML", desc: "The Ridge, Mall Road, Kufri", popular: true },
    { id: "manali", name: "Manali & Solang", state: "Himachal Pradesh", code: "MNL", desc: "Solang Valley, Rohtang, Atal Tunnel", popular: true },
    { id: "fatehpur-sikri", name: "Fatehpur Sikri", state: "Uttar Pradesh", code: "FTS", desc: "Buland Darwaza, Salim Chishti", popular: true },
    { id: "bharatpur", name: "Bharatpur", state: "Rajasthan", code: "BTP", desc: "Keoladeo National Bird Sanctuary", popular: false },
    { id: "noida", name: "Noida / Greater Noida", state: "Uttar Pradesh", code: "NOI", desc: "Pari Chowk, Sector 18, Expressway", popular: false },
    { id: "gurgaon", name: "Gurugram (Gurgaon)", state: "Haryana", code: "GGN", desc: "Cyber City, DLF, Golf Course Rd", popular: false },
    { id: "amritsar", name: "Amritsar", state: "Punjab", code: "ATQ", desc: "Golden Temple, Wagah Border", popular: false },
    { id: "udaipur", name: "Udaipur", state: "Rajasthan", code: "UDR", desc: "City Palace, Lake Pichola", popular: false },
    { id: "jodhpur", name: "Jodhpur", state: "Rajasthan", code: "JDH", desc: "Mehrangarh Fort, Blue City", popular: false },
    { id: "ajmer", name: "Ajmer / Pushkar", state: "Rajasthan", code: "AII", desc: "Dargah Sharif, Brahma Temple", popular: false },
    { id: "prayagraj", name: "Prayagraj (Allahabad)", state: "Uttar Pradesh", code: "PRG", desc: "Triveni Sangam, Civil Lines", popular: false },
    { id: "nainital", name: "Nainital", state: "Uttarakhand", code: "NNT", desc: "Naini Lake, Mallital", popular: false }
  ];

  DESTINATIONS.forEach(function (dest) {
    if (SKB.cities && !SKB.cities.some(function (city) { return city.id === dest.id; })) {
      SKB.cities.push({ id: dest.id, name: dest.name, code: dest.code });
    }
  });

  function token() {
    var params = new URLSearchParams(window.location.search);
    return window.LOCATIONIQ_ACCESS_TOKEN ||
      localStorage.getItem("locationiq_access_token") ||
      params.get("locationiq_key") ||
      "";
  }

  function slug(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "custom-location";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function localResults(query) {
    var q = String(query || "").trim().toLowerCase();
    return DESTINATIONS.filter(function (item) {
      return !q || [item.name, item.state, item.code, item.desc].join(" ").toLowerCase().indexOf(q) !== -1;
    }).map(function (item) {
      return {
        id: item.id,
        name: item.name,
        subtitle: item.desc + " · " + item.state,
        code: item.code,
        isLocationIQ: false
      };
    });
  }

  function locationIQResults(query, done) {
    var key = token();
    if (!key || String(query || "").trim().length < 2) {
      done([]);
      return;
    }
    var url = "https://api.locationiq.com/v1/autocomplete?" +
      new URLSearchParams({ key: key, q: query, limit: "5", countrycodes: "in", format: "json" });
    fetch(url, { headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) throw new Error("LocationIQ request failed (" + response.status + ")");
        return response.json();
      })
      .then(function (places) {
        done((Array.isArray(places) ? places : []).map(function (place) {
          var address = place.address || {};
          var subtitle = place.display_name || [address.city, address.state].filter(Boolean).join(", ");
          return {
            id: "locationiq-" + (place.place_id || slug(place.display_name)),
            name: place.display_name || "Location",
            subtitle: subtitle,
            code: "IQ",
            isLocationIQ: true,
            lat: Number(place.lat),
            lon: Number(place.lon)
          };
        }));
      })
      .catch(function (error) {
        console.warn("[SKB Places] LocationIQ search unavailable; using local destinations.", error);
        done([]);
      });
  }

  SKB.searchLocations = function (query, callback) {
    var local = localResults(query);
    locationIQResults(query, function (remote) {
      callback(remote.concat(local));
    });
  };

  function updateApiBadges(active) {
    document.querySelectorAll(".loc-api-tag").forEach(function (tag) {
      tag.classList.toggle("is-active", active);
      tag.textContent = active ? "LocationIQ Active" : "Add LocationIQ token";
      tag.title = active ? "LocationIQ address search connected" : "Click to add the LocationIQ public browser token";
    });
  }

  function promptForToken() {
    var current = localStorage.getItem("locationiq_access_token") || "";
    var value = window.prompt(
      "Enter your LocationIQ access token to enable live address search.\n\nThe token is stored only in this browser.",
      current
    );
    if (value === null) return;
    value = value.trim();
    if (value) {
      localStorage.setItem("locationiq_access_token", value);
      updateApiBadges(true);
    } else {
      localStorage.removeItem("locationiq_access_token");
      updateApiBadges(false);
    }
  }

  function initPickupPointAutocomplete() {
    var input = document.getElementById("pickupPoint");
    if (!input) return;
    var list = document.createElement("datalist");
    list.id = "locationiq-pickup-suggestions";
    input.setAttribute("list", list.id);
    input.parentNode.appendChild(list);
    var timer;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        locationIQResults(input.value, function (items) {
          list.innerHTML = "";
          items.forEach(function (item) {
            var option = document.createElement("option");
            option.value = item.name;
            list.appendChild(option);
          });
        });
      }, 220);
    });
  }

  function initLocationPickers() {
    var pickers = document.querySelectorAll(".loc-picker");
    if (!pickers.length) return;
    updateApiBadges(Boolean(token()));

    pickers.forEach(function (picker) {
      var display = picker.querySelector(".loc-display-btn");
      var hidden = picker.querySelector('input[type="hidden"]');
      var select = picker.querySelector("select");
      var dropdown = picker.querySelector(".loc-dropdown");
      var search = picker.querySelector(".loc-search-query");
      var results = picker.querySelector(".loc-results");
      var tags = picker.querySelectorAll(".loc-tag");
      var apiTag = picker.querySelector(".loc-api-tag");
      if (!display || !dropdown || (!hidden && !select)) return;

      function selectLocation(item) {
        var id = item.id;
        if (hidden) hidden.value = id;
        if (select) {
          var option = Array.from(select.options).find(function (entry) { return entry.value === id; });
          if (!option) {
            option = new Option(item.name, id);
            select.add(option);
          }
          select.value = id;
        }
        var value = display.querySelector(".loc-value");
        if (value) value.textContent = item.name + (item.code && item.code !== "LOC" && item.code !== "IQ" ? " (" + item.code + ")" : "");
        (hidden || select).dispatchEvent(new Event("change", { bubbles: true }));
        dropdown.hidden = true;
        display.setAttribute("aria-expanded", "false");
      }

      function render(items) {
        if (!results) return;
        results.innerHTML = "";
        if (!items.length) {
          var empty = document.createElement("div");
          empty.className = "loc-empty";
          empty.innerHTML = 'No exact location found. Press Enter to use "<strong>' + escapeHtml(search && search.value) + '</strong>".';
          results.appendChild(empty);
          return;
        }
        items.slice(0, 10).forEach(function (item) {
          var row = document.createElement("div");
          row.className = "loc-result-item";
          row.setAttribute("role", "option");
          row.innerHTML = '<span class="loc-item-icon">' + (item.isLocationIQ ? "📍" : "🏛") +
            '</span><span class="loc-item-text"><span class="loc-item-name">' +
            escapeHtml(item.name) + '</span><span class="loc-item-sub">' +
            escapeHtml(item.subtitle) + '</span></span><span class="loc-item-code">' +
            escapeHtml(item.code) + "</span>";
          row.addEventListener("click", function () { selectLocation(item); });
          results.appendChild(row);
        });
      }

      function open() {
        document.querySelectorAll(".loc-dropdown").forEach(function (other) { if (other !== dropdown) other.hidden = true; });
        dropdown.hidden = false;
        display.setAttribute("aria-expanded", "true");
        if (search) { search.value = ""; search.focus(); }
        SKB.searchLocations("", render);
      }

      display.addEventListener("click", function (event) {
        event.preventDefault();
        dropdown.hidden ? open() : (dropdown.hidden = true, display.setAttribute("aria-expanded", "false"));
      });
      if (search) {
        var timer;
        search.addEventListener("input", function () {
          clearTimeout(timer);
          timer = setTimeout(function () { SKB.searchLocations(search.value, render); }, 180);
        });
        search.addEventListener("keydown", function (event) {
          if (event.key === "Escape") { dropdown.hidden = true; display.focus(); }
          if (event.key === "Enter") {
            event.preventDefault();
            var first = results && results.querySelector(".loc-result-item");
            if (first) first.click();
            else if (search.value.trim()) selectLocation({ id: slug(search.value), name: search.value.trim(), code: "LOC", subtitle: "Custom location" });
          }
        });
      }
      tags.forEach(function (tag) {
        tag.addEventListener("click", function () {
          var item = DESTINATIONS.find(function (dest) { return dest.id === tag.dataset.val; });
          if (item) selectLocation({ id: item.id, name: item.name, code: item.code, subtitle: item.desc });
        });
      });
      apiTag && apiTag.addEventListener("click", function (event) { event.preventDefault(); event.stopPropagation(); promptForToken(); });
    });
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".loc-picker")) document.querySelectorAll(".loc-dropdown").forEach(function (dropdown) { dropdown.hidden = true; });
    });
  }

  if (document.readyState !== "loading") {
    initLocationPickers();
    initPickupPointAutocomplete();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      initLocationPickers();
      initPickupPointAutocomplete();
    });
  }
})();
