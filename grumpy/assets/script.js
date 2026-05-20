// Why Is Luis Grumpy? — shared script
//
// Two responsibilities:
//   1. Highlight the active nav link based on body[data-page].
//   2. On the home page, run the Grumpiness Index (read inputs,
//      compute score, render verdict, persist to localStorage).

(() => {
  const STORAGE_KEY = "grumpiness-index-v1";
  const DEFAULTS = {
    sleep: 7,
    tea: 2,
    meetings: 3,
    // Weather is no longer a form input — this is just the fallback
    // category if the live fetch fails before the user touches anything.
    weather: "cloudy",
    pings: 15,
  };

  // Single source of truth for the weather category that feeds the
  // score. Updated when live weather arrives, then read by readForm.
  let liveWeatherCategory = DEFAULTS.weather;
  let lastLiveWeather = null;

  // Sum of modifier shifts applied on top of WEATHER_SHIFTS[category].
  // Updated when fresh live weather arrives; consumed by calculateScore.
  let liveWeatherModifierShift = 0;

  // Per-meeting bonus points for meetings overlapping lunch (12:00–13:00)
  // and meetings starting at or after 16:00. Live data populates the
  // counts; these constants set how much each one stings the score.
  const MEETINGS_LUNCH_PENALTY = 2;
  const MEETINGS_LATE_PENALTY = 2;

  // Fixed score bonuses derived from today's meeting breakdown. Set
  // when live meetings data arrives, consumed by calculateScore.
  // Independent of the slider — these reflect what *actually*
  // happened today, not the user's "what if" exploration.
  let liveMeetingsLunchBonus = 0;
  let liveMeetingsLateBonus = 0;

  // How each weather category shifts the grumpiness score. Shared by
  // calculateScore and the impact-caption renderer so they can't drift.
  const WEATHER_SHIFTS = { sunny: -10, cloudy: 0, rainy: 5, cold: 10, hot: 10 };

  // Site voice: short, observational, lightly amused.
  const WEATHER_IMPACT_TEXT = {
    sunny: "Sun's taking the edge off",
    cloudy: "Cloudy day — weather's staying out of it",
    rainy: "Rain's adding a small grump tax",
    cold: "Cold's piling on",
    hot: "Heat's wearing him down",
  };

  const VERDICTS = [
    {
      max: 24,
      label: "Suspiciously Pleasant",
      caption:
        "Rare. Possibly a glitch. Check on him if it lasts more than an hour.",
    },
    {
      max: 49,
      label: "Mildly Tardar",
      caption: "Baseline functional. Avoid sudden movements.",
    },
    {
      max: 74,
      label: "Approaching Sauce",
      caption: "Avoid eye contact. Do not bring up the meeting.",
    },
    {
      max: 100,
      label: "Full Grump",
      caption: "Do not engage. Slide tea under the door and retreat.",
    },
  ];

  // ----------------------------------------------------------
  // Nav highlighting
  // ----------------------------------------------------------
  const setActiveNav = () => {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === page) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  };

  // ----------------------------------------------------------
  // Grumpiness Index
  // ----------------------------------------------------------
  const clamp = (lo, hi, n) => Math.min(hi, Math.max(lo, n));

  const calculateScore = ({ sleep, tea, meetings, weather, pings }) => {
    const sleepPenalty = clamp(0, 30, (8 - sleep) * 5);
    // Tea peaks at 2.5 cups; further from the peak = less boost.
    const teaBoost = -((1 - Math.abs(tea - 2.5) / 2.5) * 10);
    const meetingPenalty =
      meetings * 3 + liveMeetingsLunchBonus + liveMeetingsLateBonus;
    const pingPenalty = (pings / 50) * 25;
    const weatherShift =
      (WEATHER_SHIFTS[weather] ?? 0) + liveWeatherModifierShift;
    const base = 35;
    return clamp(
      0,
      100,
      Math.round(
        base +
          sleepPenalty +
          teaBoost +
          meetingPenalty +
          pingPenalty +
          weatherShift,
      ),
    );
  };

  const verdictFor = (score) => VERDICTS.find((v) => score <= v.max);

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch {
      return { ...DEFAULTS };
    }
  };

  const saveState = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* localStorage unavailable — skip silently */
    }
  };

  const readForm = (form) => {
    const fd = new FormData(form);
    return {
      sleep: parseFloat(fd.get("sleep")),
      tea: parseFloat(fd.get("tea")),
      meetings: parseInt(fd.get("meetings"), 10),
      // Weather is driven by the live API, not a form input.
      weather: liveWeatherCategory,
      pings: parseInt(fd.get("pings"), 10),
    };
  };

  const hydrateForm = (form, state) => {
    form.elements.sleep.value = state.sleep;
    form.elements.tea.value = state.tea;
    form.elements.meetings.value = state.meetings;
    form.elements.pings.value = state.pings;
    // Seed liveWeatherCategory from saved state so the first render
    // before the API responds isn't always "cloudy."
    liveWeatherCategory = state.weather || DEFAULTS.weather;
  };

  const render = (state) => {
    const score = calculateScore(state);
    const verdict = verdictFor(score);

    document.getElementById("score").textContent = String(score);
    document.getElementById("verdict").textContent = verdict.label;
    document.getElementById("verdict-caption").textContent = verdict.caption;

    document.getElementById("sleep-value").textContent = state.sleep;
    document.getElementById("tea-value").textContent = state.tea;
    document.getElementById("meetings-value").textContent = state.meetings;
    document.getElementById("pings-value").textContent = state.pings;
  };

  const initIndex = () => {
    const form = document.getElementById("grumpiness-form");
    if (!form) return;

    const state = loadState();
    hydrateForm(form, state);
    render(state);

    form.addEventListener("input", (event) => {
      // Defensive floor for the pings slider. The `min` attribute is
      // set when live data lands, but JS guards every path (keyboard,
      // synthetic events, browser quirks during the async window).
      if (
        pingsState.actual != null &&
        event.target &&
        event.target.name === "pings"
      ) {
        const v = parseInt(event.target.value, 10);
        if (Number.isFinite(v) && v < pingsState.actual) {
          event.target.value = String(pingsState.actual);
        }
      }

      const next = readForm(form);
      saveState(next);
      render(next);
    });
  };

  // ----------------------------------------------------------
  // Live weather → radio mapping
  // ----------------------------------------------------------
  // Temperature extremes win over sky conditions because Luis judges
  // weather by how miserable it makes him, not what's overhead.
  // 60°F or below is cold (or any snow, regardless of temp);
  // 85°F or above is hot. The middle band falls through to the sky
  // categories (sunny/cloudy) or the rain check.
  const categorizeWeather = (current) => {
    const code = current.weather_code;
    const temp = current.temperature_2m;

    const isSnow =
      (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
    if (isSnow) return "cold";

    const isWet =
      (code >= 51 && code <= 67) ||
      (code >= 80 && code <= 82) ||
      code >= 95;
    if (isWet) return "rainy";

    if (temp <= 60) return "cold";
    if (temp >= 85) return "hot";

    if (code === 0 || code === 1) return "sunny";

    // 2 / 3 / 45 / 48 — partly cloudy, overcast, fog
    return "cloudy";
  };

  // Modifiers that stack on top of the base category shift. Each one
  // returns a { shift, blurb } pair — shift adds to the score, blurb
  // gets appended to the impact caption so the user can see why the
  // number is higher than the base category alone would suggest.
  const weatherModifiers = (current, category) => {
    const code = current.weather_code;
    const humidity = current.relative_humidity_2m;
    const precip = current.precipitation;

    const isSnow =
      (code >= 71 && code <= 77) || (code >= 85 && code <= 86);

    const mods = [];

    // Category-direct intensifiers first — they describe the same
    // kind of weather, just more intensely, so they read most
    // naturally right next to the base impact text.
    if (isSnow) {
      mods.push({ shift: 5, blurb: "with snow making it worse" });
    }

    // Heavy precipitation only counts as a modifier when the category
    // is already rainy — a stray shower on a sunny day is already
    // reflected in the wet WMO codes elsewhere.
    if (precip >= 0.15 && category === "rainy") {
      mods.push({ shift: 3, blurb: "and it's coming down hard" });
    }

    // Humidity is a separate factor on top of whatever else is going
    // on, so it gets appended last.
    if (humidity >= 70) {
      if (category === "hot") {
        mods.push({ shift: 5, blurb: "and the humidity is making it gross" });
      } else if (category === "cold") {
        mods.push({ shift: 3, blurb: "with a damp chill on top" });
      } else {
        mods.push({ shift: 2, blurb: "with sticky humidity" });
      }
    }

    return mods;
  };

  // Called when fresh live weather arrives. Updates the score-driving
  // category, computes modifier shifts, and pushes the new state
  // through the normal pipeline.
  const applyLiveWeather = (current) => {
    liveWeatherCategory = categorizeWeather(current);
    const mods = weatherModifiers(current, liveWeatherCategory);
    liveWeatherModifierShift = mods.reduce((sum, m) => sum + m.shift, 0);
    renderWeatherImpact(liveWeatherCategory, mods);
    const form = document.getElementById("grumpiness-form");
    if (!form) return;
    const next = readForm(form);
    saveState(next);
    render(next);
  };

  // Use a real minus sign (U+2212) for the negative case so the
  // typography matches the site's tone.
  const formatShift = (shift) =>
    shift > 0 ? `+${shift}` : `−${Math.abs(shift)}`;

  const renderWeatherImpact = (category, mods) => {
    const node = document.getElementById("weather-impact");
    if (!node) return;
    const baseText = WEATHER_IMPACT_TEXT[category];
    const baseShift = WEATHER_SHIFTS[category];
    if (baseText === undefined || baseShift === undefined) {
      node.textContent = "";
      return;
    }

    const modList = mods || [];
    const totalShift =
      baseShift + modList.reduce((sum, m) => sum + m.shift, 0);

    let caption = baseText;
    if (modList.length) {
      caption += ", " + modList.map((m) => m.blurb).join(", ");
    }
    caption +=
      totalShift === 0 ? "." : ` (${formatShift(totalShift)} to the index).`;

    node.textContent = caption;
  };

  // ----------------------------------------------------------
  // Live weather (Open-Meteo, no key required)
  // ----------------------------------------------------------
  // Coords are intentionally hardcoded — we want the real conditions
  // for Luis's home base, not whatever ZIP the visitor is loading from.
  // The location name is deliberately *not* rendered.
  const WEATHER_URL =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=42.2079&longitude=-71.0040" +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day" +
    "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch" +
    "&timezone=America%2FNew_York";

  // WMO code → short label. Grouped to keep the line short.
  // Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
  const wmoLabel = (code, isDay) => {
    if (code === 0) return isDay ? "Clear" : "Clear night";
    if (code === 1) return "Mostly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code === 45 || code === 48) return "Foggy";
    if (code >= 51 && code <= 57) return "Drizzle";
    if (code >= 61 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code >= 85 && code <= 86) return "Snow showers";
    if (code >= 95) return "Thunderstorms";
    return "Weather";
  };

  // Same WMO buckets, but emoji. Day/night variants for clear sky.
  const wmoIcon = (code, isDay) => {
    if (code === 0) return isDay ? "☀️" : "🌙";
    if (code === 1) return isDay ? "🌤️" : "☁️";
    if (code === 2) return "⛅";
    if (code === 3) return "☁️";
    if (code === 45 || code === 48) return "🌫️";
    if (code >= 51 && code <= 57) return "🌦️";
    if (code >= 61 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌧️";
    if (code >= 85 && code <= 86) return "🌨️";
    if (code >= 95) return "⛈️";
    return "🌡️";
  };

  // Linear interpolation between RGB stops for the temperature pill.
  // Stops chosen for Boston-ish climate readability — deep blue at 0°F
  // through soft orange at 70°F to deep red at 95°F.
  const TEMP_STOPS = [
    { t: 0, rgb: [37, 99, 235] },
    { t: 35, rgb: [147, 197, 253] },
    { t: 70, rgb: [254, 215, 170] },
    { t: 95, rgb: [220, 38, 38] },
  ];

  const tempColor = (tempF) => {
    const stops = TEMP_STOPS;
    if (tempF <= stops[0].t) return stops[0].rgb;
    if (tempF >= stops[stops.length - 1].t)
      return stops[stops.length - 1].rgb;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (tempF <= b.t) {
        const u = (tempF - a.t) / (b.t - a.t);
        return [
          Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * u),
          Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * u),
          Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * u),
        ];
      }
    }
    return stops[stops.length - 1].rgb;
  };

  const rgbToCss = (rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

  // Pick black or white text based on perceived background luminance.
  // Threshold tuned so mid-range pills (around 70°F) read on dark text.
  const textColorFor = (rgb) => {
    const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return lum > 0.6 ? "#1f2024" : "#ffffff";
  };

  // Builds an array of pill descriptors. Each is { label, icon?,
  // background?, color? }. The temperature pill is colored by actual
  // temp and merges the feels-like value when it's meaningfully off
  // from real temp.
  const weatherPills = (current) => {
    const temp = Math.round(current.temperature_2m);
    const feels = Math.round(current.apparent_temperature);
    const humidity = Math.round(current.relative_humidity_2m);
    const isDay = current.is_day === 1;
    const code = current.weather_code;
    const precip = current.precipitation;
    const wind = Math.round(current.wind_speed_10m);

    const pills = [];

    // Temperature: colored by actual temp; merges feels-like inline.
    const tempRgb = tempColor(temp);
    const tempLabel =
      Math.abs(feels - temp) >= 3
        ? `${temp}°F (feels like ${feels}°F)`
        : `${temp}°F`;
    pills.push({
      label: tempLabel,
      background: rgbToCss(tempRgb),
      color: textColorFor(tempRgb),
    });

    // Sky: icon + condition label.
    pills.push({
      label: wmoLabel(code, isDay),
      icon: wmoIcon(code, isDay),
    });

    // Conditional extras — only shown when meaningful.
    if (humidity >= 70) pills.push({ label: `${humidity}% humidity` });
    if (precip > 0) pills.push({ label: `${precip.toFixed(2)}″ precip` });
    if (wind >= 15) pills.push({ label: `${wind} mph wind` });

    return pills;
  };

  const renderWeatherPills = (pills, modifier) => {
    const node = document.getElementById("weather-pills");
    if (!node) return;
    const els = pills.map((raw) => {
      const pill = typeof raw === "string" ? { label: raw } : raw;
      const el = document.createElement("span");
      el.className =
        "weather-pill" + (modifier ? ` weather-pill--${modifier}` : "");
      if (pill.background) {
        el.style.background = pill.background;
        el.style.borderColor = pill.background;
      }
      if (pill.color) el.style.color = pill.color;

      if (pill.icon) {
        const iconEl = document.createElement("span");
        iconEl.className = "weather-pill-icon";
        iconEl.setAttribute("aria-hidden", "true");
        iconEl.textContent = pill.icon;
        el.appendChild(iconEl);
      }

      const labelEl = document.createElement("span");
      labelEl.textContent = pill.label;
      el.appendChild(labelEl);

      return el;
    });
    node.replaceChildren(...els);
  };

  const initLiveWeather = () => {
    if (!document.getElementById("weather-pills")) return;

    fetch(WEATHER_URL, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data || !data.current) throw new Error("missing current block");
        lastLiveWeather = data.current;
        renderWeatherPills(weatherPills(data.current));
        applyLiveWeather(data.current);
      })
      .catch(() => {
        renderWeatherPills(["Couldn't reach the weather"], "error");
        const impact = document.getElementById("weather-impact");
        if (impact) impact.textContent = "";
      });
  };

  // ----------------------------------------------------------
  // Live data (meetings + slack) from a single local JSON file
  // ----------------------------------------------------------
  // scripts/refresh.sh writes assets/today.json with shape:
  //   {
  //     "meetings": { count: number, generated_at: ISO8601 } | null,
  //     "slack":    { count: number, generated_at: ISO8601 } | null
  //   }
  // We fetch it once (memoized) and let each module read its key.
  // Either key may be null if its source failed to collect — the
  // corresponding section of the page falls back to its hint copy.

  // Resolve where to fetch today.json from. Production sites set the
  // `grumpy-data-url` meta to a secret-gist raw URL; local dev leaves
  // it blank and reads the file the refresh script writes locally.
  // The query-string cachebust defeats GitHub's CDN cache (~5 min on
  // gist.githubusercontent.com); harmless for the local file.
  const resolveLiveDataUrl = () => {
    const meta = document.querySelector('meta[name="grumpy-data-url"]');
    const base = (meta && meta.content.trim()) || "assets/today.json";
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}_=${Date.now()}`;
  };

  let liveDataPromise = null;
  const loadLiveData = () => {
    if (!liveDataPromise) {
      liveDataPromise = fetch(resolveLiveDataUrl(), { cache: "no-store" })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        });
    }
    return liveDataPromise;
  };
  const meetingsState = {
    actual: null, // null = unknown, number once loaded
    lunch: 0,
    late: 0,
    snapped: false,
  };

  const getMeetingsForm = () => document.getElementById("grumpiness-form");

  const setMeetingsStatus = (text) => {
    const node = document.getElementById("meetings-status");
    if (node) node.textContent = text;
  };

  const showMeetingsButton = (id, visible) => {
    const btn = document.getElementById(id);
    if (btn) btn.hidden = !visible;
  };

  const formatAge = (ms) => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const initLiveMeetings = async () => {
    const node = document.getElementById("meetings-status");
    if (!node) return;

    let payload;
    try {
      payload = await loadLiveData();
    } catch {
      setMeetingsStatus("Run ./scripts/refresh.sh to pull today's count.");
      return;
    }

    const data = payload && payload.meetings;
    if (!data || typeof data.count !== "number" || !data.generated_at) {
      setMeetingsStatus("Run ./scripts/refresh.sh to pull today's count.");
      return;
    }

    const ageMs = Date.now() - new Date(data.generated_at).getTime();
    const isStale = ageMs > 24 * 60 * 60 * 1000;
    meetingsState.actual = data.count;
    meetingsState.lunch = typeof data.lunch === "number" ? data.lunch : 0;
    meetingsState.late = typeof data.late === "number" ? data.late : 0;

    // Score bonuses for time-of-day disruption. Read from the day's
    // actual schedule, applied irrespective of slider position.
    liveMeetingsLunchBonus = meetingsState.lunch * MEETINGS_LUNCH_PENALTY;
    liveMeetingsLateBonus = meetingsState.late * MEETINGS_LATE_PENALTY;

    const noun = data.count === 1 ? "meeting" : "meetings";
    const breakdown = [];
    if (meetingsState.lunch > 0) {
      breakdown.push(`${meetingsState.lunch} over lunch`);
    }
    if (meetingsState.late > 0) {
      breakdown.push(`${meetingsState.late} after 4PM`);
    }
    const breakdownStr =
      breakdown.length > 0 ? ` — ${breakdown.join(", ")}` : "";

    if (isStale) {
      setMeetingsStatus(
        `Today: ${data.count} ${noun}${breakdownStr} (stale — re-run refresh.sh).`,
      );
    } else {
      setMeetingsStatus(
        `Today: ${data.count} ${noun}${breakdownStr} · updated ${formatAge(ageMs)}.`,
      );
    }

    showMeetingsButton("meetings-reset", true);

    // Make sure the slider can reach reality, plus a bit of headroom.
    const form = getMeetingsForm();
    if (!form) return;
    const slider = form.elements.meetings;
    const currentMax = parseInt(slider.max, 10) || 10;
    if (data.count > currentMax) slider.max = String(data.count + 2);

    // Auto-snap to actual on first load so the score reflects reality.
    // After that the slider is yours — drag it for counterfactuals;
    // the Reset button below snaps back.
    if (!meetingsState.snapped) {
      slider.value = String(data.count);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      meetingsState.snapped = true;
    }
  };

  const handleResetClick = () => {
    const count = meetingsState.actual;
    if (count == null) return;
    const form = getMeetingsForm();
    if (!form) return;
    form.elements.meetings.value = String(count);
    form.elements.meetings.dispatchEvent(
      new Event("input", { bubbles: true }),
    );
  };

  const wireMeetingsButtons = () => {
    const reset = document.getElementById("meetings-reset");
    if (reset) reset.addEventListener("click", handleResetClick);
  };

  // ----------------------------------------------------------
  // Live Slack pings (macOS Notification Center via SQLite)
  // ----------------------------------------------------------
  // Mirror of the meetings flow. Difference: the slider's `min` gets
  // locked to today's actual count — you can only drag the value
  // *up* from there to simulate "what if I get more pings."
  const pingsState = {
    actual: null,
    snapped: false,
  };

  const setPingsStatus = (text) => {
    const node = document.getElementById("pings-status");
    if (node) node.textContent = text;
  };

  const showPingsButton = (id, visible) => {
    const btn = document.getElementById(id);
    if (btn) btn.hidden = !visible;
  };

  const initLivePings = async () => {
    const node = document.getElementById("pings-status");
    if (!node) return;

    let payload;
    try {
      payload = await loadLiveData();
    } catch {
      setPingsStatus("Run ./scripts/refresh.sh to pull today's count.");
      return;
    }

    const data = payload && payload.slack;
    if (!data || typeof data.count !== "number" || !data.generated_at) {
      setPingsStatus("Run ./scripts/refresh.sh to pull today's count.");
      return;
    }

    const ageMs = Date.now() - new Date(data.generated_at).getTime();
    const isStale = ageMs > 24 * 60 * 60 * 1000;
    pingsState.actual = data.count;

    const noun = data.count === 1 ? "ping" : "pings";
    if (isStale) {
      setPingsStatus(
        `Today: ${data.count} ${noun} (stale — re-run refresh.sh).`,
      );
    } else {
      setPingsStatus(
        `Today: ${data.count} ${noun} · updated ${formatAge(ageMs)}.`,
      );
    }

    showPingsButton("pings-reset", true);

    const form = document.getElementById("grumpiness-form");
    if (!form) return;
    const slider = form.elements.pings;

    // Lock the floor: the slider can only go up from today's actual
    // count. Native HTML range inputs respect `min` for both keyboard
    // and mouse interaction, so this needs no extra JS guarding.
    slider.min = String(data.count);

    // Make sure max can accommodate today's count plus headroom.
    const currentMax = parseInt(slider.max, 10) || 50;
    if (data.count >= currentMax) slider.max = String(data.count + 25);

    // Auto-snap to actual on first load. After that, only nudge up
    // when the persisted value would now violate the new floor.
    if (!pingsState.snapped) {
      slider.value = String(data.count);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      pingsState.snapped = true;
    } else if (parseInt(slider.value, 10) < data.count) {
      slider.value = String(data.count);
      slider.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const handlePingsReset = () => {
    const count = pingsState.actual;
    if (count == null) return;
    const form = document.getElementById("grumpiness-form");
    if (!form) return;
    form.elements.pings.value = String(count);
    form.elements.pings.dispatchEvent(
      new Event("input", { bubbles: true }),
    );
  };

  const wirePingsButtons = () => {
    const reset = document.getElementById("pings-reset");
    if (reset) reset.addEventListener("click", handlePingsReset);
  };

  // ----------------------------------------------------------
  // Live tea & sleep (user-declared via xbar plugin preferences)
  // ----------------------------------------------------------
  // The refresh script reads VAR_TEA and VAR_SLEEP from xbar's
  // plugin variables and writes them into today.json. On page load
  // we snap both sliders to whatever the user has declared. After
  // that, sliding is transient — refresh the page to re-snap to
  // xbar's current values, or update xbar prefs and wait for the
  // next refresh.
  const initLiveTeaSleep = async () => {
    let payload;
    try {
      payload = await loadLiveData();
    } catch {
      return; // silent — sliders keep their localStorage values
    }

    const form = document.getElementById("grumpiness-form");
    if (!form) return;

    let changed = false;
    if (typeof payload.tea === "number") {
      form.elements.tea.value = String(payload.tea);
      changed = true;
    }
    if (typeof payload.sleep === "number") {
      form.elements.sleep.value = String(payload.sleep);
      changed = true;
    }

    if (changed) {
      // Re-render through the normal save/render pipeline. Dispatching
      // on one element is enough — the listener reads the whole form.
      form.elements.tea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  // ----------------------------------------------------------
  // Boot
  // ----------------------------------------------------------
  setActiveNav();
  initIndex();
  initLiveWeather();
  wireMeetingsButtons();
  initLiveMeetings();
  wirePingsButtons();
  initLivePings();
  initLiveTeaSleep();
})();
