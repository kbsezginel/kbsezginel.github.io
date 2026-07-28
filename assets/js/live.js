/* =============================================================================
   Live calendar  —  /live/
   Data comes from _data/live.yml, injected into the page as window.LIVE.
   All view logic runs here so "upcoming" is relative to the visitor's today,
   not to the last time the site was built.
   ========================================================================== */

(function () {
  "use strict";

  var DATA = window.LIVE || { acts: {}, venues: {}, shows: [] };
  var PALETTE = ["rose", "amber", "azure", "jade", "violet", "copper"];
  var MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Data prep ---------------------------------------------------------- */

  // Acts with no registry entry still get a stable color, so adding a new act
  // to _data/live.yml needs no setup at all.
  function colorFor(act) {
    var entry = DATA.acts && DATA.acts[act];
    if (entry && entry.color) return entry.color;
    var sum = 0;
    for (var i = 0; i < act.length; i++) sum += act.charCodeAt(i);
    return PALETTE[sum % PALETTE.length];
  }

  function urlFor(act) {
    var entry = DATA.acts && DATA.acts[act];
    return (entry && entry.url) || null;
  }

  // "Madam's Organ, Washington DC" -> venue + location
  function splitVenue(v) {
    var i = (v || "").indexOf(",");
    if (i === -1) return { venue: v || "", where: "" };
    return { venue: v.slice(0, i).trim(), where: v.slice(i + 1).trim() };
  }

  // A Maps search on "Venue, City" resolves these places reliably and costs
  // nothing to maintain. The venues registry pins the exceptions.
  function mapFor(venue, where) {
    var pinned = DATA.venues && DATA.venues[venue];
    if (pinned) return pinned;
    var q = where ? venue + ", " + where : venue;
    return "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(q);
  }

  var shows = (DATA.shows || [])
    .filter(function (s) { return s && s.date && s.act; })
    .map(function (s, i) {
      var p = s.date.split("-");
      // Local midnight. new Date("2026-08-14") would parse as UTC and land on
      // the 13th for anyone west of Greenwich.
      var dt = new Date(+p[0], +p[1] - 1, +p[2]);
      var loc = splitVenue(s.venue);
      return {
        key: s.date + "-" + i,
        dt: dt,
        date: s.date,
        act: s.act,
        venue: loc.venue,
        where: loc.where,
        map: mapFor(loc.venue, loc.where),
        event: s.event || "",
        time: s.time || "",
        tickets: s.tickets || "",
        kind: s.kind || "",
        note: s.note || "",
        color: colorFor(s.act),
        url: urlFor(s.act),
        past: dt < TODAY
      };
    })
    .sort(function (a, b) { return a.dt - b.dt; });

  var years = shows.map(function (s) { return s.dt.getFullYear(); });
  // One year of headroom past the last booked show, so you can look ahead.
  var NAV_MIN = Math.min.apply(null, years.concat([TODAY.getFullYear()]));
  var NAV_MAX = Math.max.apply(null, years.concat([TODAY.getFullYear()])) + 1;

  var upcoming = shows.filter(function (s) { return !s.past; });
  var past = shows.filter(function (s) { return s.past; }).reverse();

  /* --- State -------------------------------------------------------------- */

  // Open on the next show. With nothing booked, open on the most recent one
  // rather than on an empty current month.
  var anchor = upcoming.length ? upcoming[0].dt
             : shows.length    ? shows[shows.length - 1].dt
             : TODAY;

  var state = {
    year: anchor.getFullYear(),
    month: anchor.getMonth(),
    act: null,          // null = all acts
    selected: null,     // "YYYY-MM-DD"
    showPast: upcoming.length === 0
  };

  function visible(s) {
    return !state.act || s.act === state.act;
  }

  /* --- Elements ----------------------------------------------------------- */

  var el = {
    filters:   document.getElementById("filters"),
    yearLabel: document.getElementById("yearLabel"),
    yearPrev:  document.getElementById("yearPrev"),
    yearNext:  document.getElementById("yearNext"),
    months:    document.getElementById("yearMonths"),
    calMonth:  document.getElementById("calMonth"),
    calGrid:   document.getElementById("calGrid"),
    prevMonth: document.getElementById("prevMonth"),
    nextMonth: document.getElementById("nextMonth"),
    listCount: document.getElementById("listCount"),
    listItems: document.getElementById("listItems"),
    listEmpty: document.getElementById("listEmpty"),
    pastToggle: document.getElementById("pastToggle"),
    pastItems: document.getElementById("pastItems")
  };

  function pinIcon() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "show__pin");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z");
    svg.appendChild(p);
    return svg;
  }

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* --- Filters ------------------------------------------------------------ */

  // Built once. Toggling a filter only flips aria-pressed, so keyboard focus
  // stays on the button you just pressed.
  function buildFilters() {
    el.filters.textContent = "";

    var counts = {};
    shows.forEach(function (s) { counts[s.act] = (counts[s.act] || 0) + 1; });

    function hasUpcoming(a) {
      return upcoming.some(function (s) { return s.act === a; });
    }

    // Acts with a date still to come lead, then the rest by how often they play.
    var acts = Object.keys(counts).sort(function (a, b) {
      var au = hasUpcoming(a), bu = hasUpcoming(b);
      if (au !== bu) return au ? -1 : 1;
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      return a.localeCompare(b);
    });

    // One-off collaborations would triple the length of this row for no real
    // filtering value, so they stay in the listings only.
    acts = acts.filter(function (a) {
      return hasUpcoming(a) || counts[a] > 1;
    }).slice(0, 8);

    el.filters.appendChild(filterBtn(null, "All", shows.length));
    acts.forEach(function (a) {
      el.filters.appendChild(filterBtn(a, a, counts[a]));
    });
  }

  function filterBtn(act, label, n) {
    var b = make("button", "filter" + (act ? "" : " filter--all"));
    b.type = "button";
    b.dataset.act = act || "";
    b.setAttribute("aria-pressed", String(state.act === act));
    if (act) b.style.setProperty("--act", "var(--" + colorFor(act) + ")");
    b.appendChild(make("span", "filter__label", label));
    b.appendChild(make("span", "filter__n", n));
    b.addEventListener("click", function () {
      state.act = state.act === act ? null : act;
      state.selected = null;
      syncFilters();
      renderYear();
      renderCal();
      renderList();
    });
    return b;
  }

  function syncFilters() {
    var btns = el.filters.querySelectorAll(".filter");
    Array.prototype.forEach.call(btns, function (b) {
      var act = b.dataset.act || null;
      b.setAttribute("aria-pressed", String(state.act === act));
    });
  }

  /* --- Year strip --------------------------------------------------------- */

  function renderYear() {
    el.yearLabel.textContent = state.year;
    el.yearPrev.disabled = state.year <= NAV_MIN;
    el.yearNext.disabled = state.year >= NAV_MAX;

    el.months.textContent = "";

    for (var m = 0; m < 12; m++) {
      var inMonth = shows.filter(function (s) {
        return s.dt.getFullYear() === state.year && s.dt.getMonth() === m && visible(s);
      });

      var li = make("li");
      var b = make("button", "month");
      b.type = "button";
      b.setAttribute("aria-current", String(m === state.month));
      b.setAttribute("aria-label",
        MONTHS[m] + " " + state.year + ", " + inMonth.length +
        (inMonth.length === 1 ? " show" : " shows"));

      var beats = make("span", "month__beats");
      if (inMonth.length) {
        inMonth.slice(0, 14).forEach(function (s) {
          var beat = make("span", "month__beat");
          beat.style.setProperty("--act", "var(--" + s.color + ")");
          beats.appendChild(beat);
        });
      } else {
        beats.appendChild(make("span", "month__rest"));
      }

      b.appendChild(beats);
      b.appendChild(make("span", "month__name", MON[m]));

      (function (mm) {
        b.addEventListener("click", function () { goTo(state.year, mm); });
      })(m);

      li.appendChild(b);
      el.months.appendChild(li);
    }
  }

  /* --- Month grid --------------------------------------------------------- */

  function renderCal() {
    el.calMonth.textContent = MONTHS[state.month] + " " + state.year;
    el.calGrid.textContent = "";

    var first = new Date(state.year, state.month, 1);
    var daysIn = new Date(state.year, state.month + 1, 0).getDate();
    var lead = first.getDay();

    for (var p = 0; p < lead; p++) {
      var pad = make("div", "day day--pad");
      pad.setAttribute("aria-hidden", "true");
      el.calGrid.appendChild(pad);
    }

    for (var d = 1; d <= daysIn; d++) {
      el.calGrid.appendChild(dayCell(d));
    }
  }

  function dayCell(d) {
    var iso = state.year + "-" + pad2(state.month + 1) + "-" + pad2(d);
    var all = shows.filter(function (s) { return s.date === iso; });
    var shown = all.filter(visible);

    var cell = make(all.length ? "button" : "div", "day");
    if (all.length) cell.type = "button";

    var isToday =
      state.year === TODAY.getFullYear() &&
      state.month === TODAY.getMonth() &&
      d === TODAY.getDate();

    if (all.length) {
      cell.classList.add("day--has");
      cell.style.setProperty("--act", "var(--" + (shown[0] || all[0]).color + ")");
    }
    if (all.length && !shown.length) cell.classList.add("day--muted");
    if (isToday) cell.classList.add("day--today");
    if (state.selected === iso) cell.classList.add("day--selected");

    cell.appendChild(make("span", "day__n", d));

    if (all.length) {
      var beats = make("span", "day__beats");
      all.slice(0, 4).forEach(function (s) {
        var b = make("span", "day__beat");
        b.style.setProperty("--act", "var(--" + s.color + ")");
        beats.appendChild(b);
      });
      cell.appendChild(beats);

      cell.setAttribute("aria-label",
        MONTHS[state.month] + " " + d + ": " +
        all.map(function (s) { return s.act + " at " + s.venue; }).join(", "));

      cell.addEventListener("click", function () {
        state.selected = iso;
        // A day in the past needs the past list open before it can be reached.
        if (all.some(function (s) { return s.past; })) state.showPast = true;
        renderCal();
        renderList();
        jumpTo(iso);
      });
    } else if (isToday) {
      cell.setAttribute("aria-label", "Today, " + MONTHS[state.month] + " " + d);
    }

    return cell;
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /* --- Listings ----------------------------------------------------------- */

  function renderList() {
    var up = upcoming.filter(visible);
    var pastList = past.filter(visible);

    el.listCount.textContent =
      up.length ? up.length + (up.length === 1 ? " date" : " dates") : "";

    el.listItems.textContent = "";
    up.forEach(function (s, i) { el.listItems.appendChild(card(s, i)); });

    el.listEmpty.hidden = up.length > 0;
    if (!up.length) renderEmpty(pastList.length);

    // Past section
    el.pastToggle.hidden = pastList.length === 0;
    el.pastToggle.textContent =
      (state.showPast ? "Hide " : "Show ") + pastList.length + " past " +
      (pastList.length === 1 ? "date" : "dates");
    el.pastToggle.setAttribute("aria-expanded", String(state.showPast));

    el.pastItems.hidden = !state.showPast || pastList.length === 0;
    el.pastItems.textContent = "";
    if (state.showPast) {
      pastList.forEach(function (s, i) { el.pastItems.appendChild(card(s, i)); });
    }
  }

  function renderEmpty(pastCount) {
    el.listEmpty.textContent = "";
    var head = state.act
      ? "Nothing booked for " + state.act + "."
      : "No dates on the books.";
    var body = state.act
      ? "Pick another act above, or look through what's already played."
      : "Next show goes up here as soon as it's confirmed. " +
        (pastCount ? "Until then, the archive is below." : "");
    var p = make("p");
    p.appendChild(make("strong", null, head));
    p.appendChild(document.createTextNode(body));
    el.listEmpty.appendChild(p);
  }

  function card(s, i) {
    var li = make("li");

    var art = make("article", "show" + (s.past ? " show--past" : ""));
    art.style.setProperty("--act", "var(--" + s.color + ")");
    art.dataset.date = s.date;
    if (!REDUCED) art.style.animationDelay = Math.min(i, 12) * 35 + "ms";

    // Date block
    var when = make("div", "show__when");
    when.appendChild(make("span", "show__mon", MON[s.dt.getMonth()].toUpperCase()));
    when.appendChild(make("span", "show__day", s.dt.getDate()));
    when.appendChild(make("span", "show__dow", DOW[s.dt.getDay()].toUpperCase()));
    art.appendChild(when);

    var body = make("div", "show__body");

    // The night or bill this show is part of, above the act playing it.
    if (s.event) body.appendChild(make("p", "show__event", s.event));

    // Act
    var h = make("h3");
    var name = s.url ? make("a", "show__act", s.act) : make("span", "show__act", s.act);
    if (s.url) name.href = s.url;
    h.appendChild(name);
    if (s.kind) h.appendChild(make("span", "show__kind", s.kind));
    body.appendChild(h);

    // Venue · location · time
    var where = make("p", "show__where");
    var vlink = make("a", "show__venue", s.venue);
    vlink.href = s.map;
    vlink.rel = "noopener";
    vlink.target = "_blank";
    vlink.title = "Find " + s.venue + " on Google Maps";
    vlink.appendChild(pinIcon());
    where.appendChild(vlink);
    if (s.where) {
      where.appendChild(make("span", "show__sep", "·"));
      where.appendChild(document.createTextNode(s.where));
    }
    if (s.time) {
      where.appendChild(make("span", "show__sep", "·"));
      where.appendChild(document.createTextNode(s.time));
    }
    body.appendChild(where);

    if (s.note) body.appendChild(make("p", "show__note", s.note));

    if (s.tickets && !s.past) {
      var t = make("a", "show__tickets", "Tickets");
      t.href = s.tickets;
      t.rel = "noopener";
      t.target = "_blank";
      body.appendChild(t);
    }

    art.appendChild(body);
    li.appendChild(art);
    return li;
  }

  /* --- Grid to list sync -------------------------------------------------- */

  function jumpTo(iso) {
    var cards = document.querySelectorAll('.show[data-date="' + iso + '"]');
    if (!cards.length) return;
    cards[0].scrollIntoView({
      behavior: REDUCED ? "auto" : "smooth",
      block: "center"
    });
    cards.forEach(function (c) {
      c.classList.remove("show--flash");
      void c.offsetWidth; // restart the animation
      c.classList.add("show--flash");
    });
  }

  /* --- Wiring ------------------------------------------------------------- */

  function goTo(year, month) {
    if (year < NAV_MIN || year > NAV_MAX) return;
    state.year = year;
    state.month = month;
    state.selected = null;
    renderYear();
    renderCal();
  }

  function shiftMonth(delta) {
    var m = state.month + delta;
    goTo(state.year + Math.floor(m / 12), ((m % 12) + 12) % 12);
  }

  el.prevMonth.addEventListener("click", function () { shiftMonth(-1); });
  el.nextMonth.addEventListener("click", function () { shiftMonth(1); });

  el.yearPrev.addEventListener("click", function () {
    goTo(state.year - 1, state.month);
  });
  el.yearNext.addEventListener("click", function () {
    goTo(state.year + 1, state.month);
  });

  el.pastToggle.addEventListener("click", function () {
    state.showPast = !state.showPast;
    renderList();
  });

  buildFilters();
  renderYear();
  renderCal();
  renderList();
})();
