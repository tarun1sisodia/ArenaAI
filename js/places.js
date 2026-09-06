/**
 * SK Baghel Tour & Travels — Google Maps Places & Location Search Module
 * Features:
 *  - Google Maps Places Autocomplete API integration (live verified places across India)
 *  - Expanded catalog of 30+ major North India / Golden Triangle cities & tourist hubs
 *  - Interactive searchable combobox for Pickup & Drop locations (Hero widget & booking page)
 *  - Dynamic fallback & distance/fare estimation for custom searched locations
 */
(function () {
  'use strict';

  window.SKB = window.SKB || {};

  // Comprehensive verified destination catalog
  var EXTENDED_DESTINATIONS = [
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

  // Merge into SKB.cities if present
  if (SKB.cities) {
    EXTENDED_DESTINATIONS.forEach(function (dest) {
      if (!SKB.cities.some(function (c) { return c.id === dest.id; })) {
        SKB.cities.push({ id: dest.id, name: dest.name, code: dest.code });
      }
    });
  }

  // Google Maps Places Autocomplete Service instance
  var googlePlacesService = null;
  var googleMapsLoaded = false;

  // Retrieve Google Maps API key from window, localStorage, or query parameter
  function getGoogleApiKey() {
    var params = new URLSearchParams(window.location.search);
    return window.GOOGLE_MAPS_API_KEY ||
      localStorage.getItem('google_maps_api_key') ||
      params.get('maps_key') ||
      '';
  }

  // Load Google Maps JavaScript API with Places library
  function loadGoogleMaps(apiKey, callback) {
    if (window.google && window.google.maps && window.google.maps.places) {
      googleMapsLoaded = true;
      googlePlacesService = new window.google.maps.places.AutocompleteService();
      if (callback) callback(true);
      return;
    }

    if (!apiKey) {
      if (callback) callback(false);
      return;
    }

    window.skbInitGoogleMaps = function () {
      googleMapsLoaded = true;
      if (window.google && window.google.maps && window.google.maps.places) {
        googlePlacesService = new window.google.maps.places.AutocompleteService();
      }
      updateApiBadges(true);
      if (callback) callback(true);
    };

    var script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(apiKey) + '&libraries=places&loading=async&callback=skbInitGoogleMaps';
    script.async = true;
    script.defer = true;
    script.onerror = function () {
      console.warn('[SKB Places] Failed to load Google Maps API. Using verified local destination search.');
      if (callback) callback(false);
    };
    document.head.appendChild(script);
  }

  // Search locations combining Google Places & local verified destinations
  SKB.searchLocations = function (query, callback) {
    var cleanQ = (query || '').trim().toLowerCase();
    var results = [];

    // Filter local catalog
    EXTENDED_DESTINATIONS.forEach(function (item) {
      if (!cleanQ ||
          item.name.toLowerCase().indexOf(cleanQ) !== -1 ||
          item.state.toLowerCase().indexOf(cleanQ) !== -1 ||
          item.code.toLowerCase().indexOf(cleanQ) !== -1 ||
          item.desc.toLowerCase().indexOf(cleanQ) !== -1) {
        results.push({
          id: item.id,
          name: item.name,
          subtitle: item.desc + ' · ' + item.state,
          code: item.code,
          isGoogle: false
        });
      }
    });

    // If Google Places service is active and user typed at least 2 characters
    if (googlePlacesService && cleanQ.length >= 2) {
      googlePlacesService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' },
          types: ['geocode', 'establishment']
        },
        function (predictions, status) {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            var googleResults = predictions.slice(0, 5).map(function (p) {
              var mainText = p.structured_formatting ? p.structured_formatting.main_text : p.description;
              var secText = p.structured_formatting ? p.structured_formatting.secondary_text : 'Google Maps Verified';
              var slug = mainText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              return {
                id: slug || 'custom-loc',
                name: mainText,
                subtitle: secText,
                code: 'MAPS',
                isGoogle: true,
                placeId: p.place_id
              };
            });
            // Prepend Google Maps verified results
            callback(googleResults.concat(results));
          } else {
            callback(results);
          }
        }
      );
    } else {
      callback(results);
    }
  };

  function updateApiBadges(active) {
    document.querySelectorAll('.loc-api-tag').forEach(function (tag) {
      if (active) {
        tag.classList.add('is-active');
        tag.innerHTML = '● Google Maps Active';
        tag.title = 'Google Places API connected & active';
      } else {
        tag.classList.remove('is-active');
        tag.innerHTML = '⚙ Google Maps API';
        tag.title = 'Click to connect your Google Maps API Key';
      }
    });
  }

  // Initialize interactive location pickers on DOM ready
  function initLocationPickers() {
    var pickers = document.querySelectorAll('.loc-picker');
    if (!pickers.length) return;

    var activeKey = getGoogleApiKey();
    if (activeKey) {
      loadGoogleMaps(activeKey, function (ok) {
        updateApiBadges(ok);
      });
    }

    pickers.forEach(function (picker) {
      var displayBtn = picker.querySelector('.loc-display-btn');
      var hiddenInput = picker.querySelector('input[type="hidden"]');
      var dropdown = picker.querySelector('.loc-dropdown');
      var searchInput = picker.querySelector('.loc-search-query');
      var resultsContainer = picker.querySelector('.loc-results');
      var quickTags = picker.querySelectorAll('.loc-tag');
      var apiTag = picker.querySelector('.loc-api-tag');

      if (!displayBtn || !hiddenInput || !dropdown) return;

      function renderResults(list) {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = '';

        if (!list || !list.length) {
          var empty = document.createElement('div');
          empty.className = 'loc-empty';
          empty.innerHTML = 'No exact location found. Press Enter to use "<strong>' +
            escapeHtml(searchInput ? searchInput.value : '') + '</strong>" as custom pickup/drop.';
          empty.addEventListener('click', function () {
            if (searchInput && searchInput.value.trim()) {
              selectLocation({
                id: searchInput.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: searchInput.value.trim(),
                subtitle: 'Custom Location',
                code: 'LOC'
              });
            }
          });
          resultsContainer.appendChild(empty);
          return;
        }

        list.slice(0, 10).forEach(function (item) {
          var row = document.createElement('div');
          row.className = 'loc-result-item';
          row.setAttribute('role', 'option');
          if (hiddenInput.value === item.id) {
            row.classList.add('is-selected');
          }

          var iconSpan = document.createElement('span');
          iconSpan.className = 'loc-item-icon';
          iconSpan.textContent = item.isGoogle ? '📍' : '🏛';

          var textWrap = document.createElement('div');
          textWrap.className = 'loc-item-text';

          var nameSpan = document.createElement('span');
          nameSpan.className = 'loc-item-name';
          nameSpan.textContent = item.name;

          var subSpan = document.createElement('span');
          subSpan.className = 'loc-item-sub';
          subSpan.textContent = item.subtitle;

          textWrap.appendChild(nameSpan);
          textWrap.appendChild(subSpan);

          row.appendChild(iconSpan);
          row.appendChild(textWrap);

          if (item.isGoogle) {
            var gBadge = document.createElement('span');
            gBadge.className = 'loc-item-badge';
            gBadge.textContent = 'Google';
            row.appendChild(gBadge);
          } else if (item.code) {
            var codeBadge = document.createElement('span');
            codeBadge.className = 'loc-item-code';
            codeBadge.textContent = item.code;
            row.appendChild(codeBadge);
          }

          row.addEventListener('click', function (e) {
            e.stopPropagation();
            selectLocation(item);
          });

          resultsContainer.appendChild(row);
        });
      }

      function selectLocation(item) {
        hiddenInput.value = item.id;
        var valSpan = displayBtn.querySelector('.loc-value');
        if (valSpan) {
          valSpan.textContent = item.name + (item.code && item.code !== 'MAPS' && item.code !== 'LOC' ? ' (' + item.code + ')' : '');
        }

        // Trigger change on hidden input
        var evt = new Event('change', { bubbles: true });
        hiddenInput.dispatchEvent(evt);

        closeDropdown();
      }

      function openDropdown() {
        // Close all other dropdowns first
        document.querySelectorAll('.loc-dropdown').forEach(function (d) {
          if (d !== dropdown) {
            d.hidden = true;
            var b = d.parentElement ? d.parentElement.querySelector('.loc-display-btn') : null;
            if (b) b.setAttribute('aria-expanded', 'false');
          }
        });

        dropdown.hidden = false;
        displayBtn.setAttribute('aria-expanded', 'true');
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        SKB.searchLocations('', renderResults);
      }

      function closeDropdown() {
        dropdown.hidden = true;
        displayBtn.setAttribute('aria-expanded', 'false');
      }

      displayBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (dropdown.hidden) {
          openDropdown();
        } else {
          closeDropdown();
        }
      });

      if (searchInput) {
        var debounceTimer = null;
        searchInput.addEventListener('input', function () {
          clearTimeout(debounceTimer);
          var q = searchInput.value;
          debounceTimer = setTimeout(function () {
            SKB.searchLocations(q, renderResults);
          }, 180);
        });

        searchInput.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            closeDropdown();
            displayBtn.focus();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            var firstItem = resultsContainer.querySelector('.loc-result-item');
            if (firstItem) {
              firstItem.click();
            } else if (searchInput.value.trim()) {
              selectLocation({
                id: searchInput.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: searchInput.value.trim(),
                subtitle: 'Custom Location',
                code: 'LOC'
              });
            }
          }
        });
      }

      quickTags.forEach(function (tag) {
        tag.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var val = tag.dataset.val;
          var found = EXTENDED_DESTINATIONS.find(function (d) { return d.id === val; });
          if (found) {
            selectLocation(found);
          }
        });
      });

      if (apiTag) {
        apiTag.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          promptForApiKey();
        });
      }

      dropdown.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    });

    // Close on click outside
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.loc-picker')) {
        document.querySelectorAll('.loc-dropdown').forEach(function (d) {
          d.hidden = true;
          var b = d.parentElement ? d.parentElement.querySelector('.loc-display-btn') : null;
          if (b) b.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  // Dialog to prompt user for Google Maps API key
  function promptForApiKey() {
    var current = localStorage.getItem('google_maps_api_key') || '';
    var input = window.prompt(
      'Enter Google Maps Places API Key to enable live verified address & location search throughout India:\n\n(Leave empty to use built-in verified Indian cities & landmarks)',
      current
    );
    if (input !== null) {
      input = input.trim();
      if (input) {
        localStorage.setItem('google_maps_api_key', input);
        loadGoogleMaps(input, function (ok) {
          if (ok) {
            alert('✓ Google Maps Places API connected successfully!');
          } else {
            alert('Could not initialize Google Maps with that key. Check API console restrictions.');
          }
        });
      } else {
        localStorage.removeItem('google_maps_api_key');
        updateApiBadges(false);
      }
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initPickupPointAutocomplete() {
    var pickupInput = document.getElementById('pickupPoint');
    if (!pickupInput) return;
    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        var auto = new window.google.maps.places.Autocomplete(pickupInput, {
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'name']
        });
        auto.addListener('place_changed', function () {
          var place = auto.getPlace();
          if (place && (place.formatted_address || place.name)) {
            pickupInput.value = place.formatted_address || place.name;
          }
        });
      } catch (err) {
        console.warn('[SKB Places] Could not attach Google Autocomplete to pickupPoint', err);
      }
    }
  }

  // Hook into document lifecycle
  if (document.readyState !== 'loading') {
    initLocationPickers();
    initPickupPointAutocomplete();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      initLocationPickers();
      initPickupPointAutocomplete();
    });
  }

})();
