/**
 * populate-links.js
 *
 * Reads the `?type=` URL parameter, loads the matching entry from
 * links/link_lookup.json, applies a dynamic color theme, populates
 * the page header/footer, then renders each link as a card.
 *
 * Entry point: loadLinks() — called at the bottom of this file.
 */

// ---------------------------------------------------------------------------
// Theme engine
// ---------------------------------------------------------------------------

/**
 * Maps human-readable color names to HSL hue angles (0–360).
 * The hue alone drives the full palette; saturation and lightness are derived
 * algorithmically so every color produces a cohesive set of variables.
 */
const COLOR_HUES = {
  red: 0, orange: 30, amber: 45, yellow: 60,
  lime: 90, green: 130, teal: 165, cyan: 180,
  sky: 200, blue: 220, indigo: 255, violet: 270,
  purple: 290, pink: 330, rose: 345,
};

/**
 * Generates and injects a <style id="dynamic-theme"> block that defines
 * all CSS custom properties and the body gradient for the chosen palette.
 *
 * @param {string} theme - A string in the form "<color> <variant>" where
 *   color is a key from COLOR_HUES (or a raw 0–360 hue number) and variant
 *   is "dark", "light", or omitted (follows the OS preference via
 *   prefers-color-scheme).
 *
 * Examples: "blue dark", "orange light", "indigo", "42 dark"
 */
function applyTheme(theme = "green dark") {
  const parts   = String(theme).trim().toLowerCase().split(/\s+/);
  const color   = parts[0];
  const variant = parts[1]; // "dark" | "light" | undefined

  // Resolve color name → hue; fall back to green for unknown values.
  const hue = color in COLOR_HUES
    ? COLOR_HUES[color]
    : (!isNaN(parseFloat(color)) ? parseFloat(color) : COLOR_HUES.green);

  // Dark palette: rich, saturated surfaces; light text.
  const darkCSS = `
:root {
  --surface:        hsla(${hue}, 60%, 12%, 0.72);
  --surface-hover:  hsla(${hue}, 60%, 17%, 0.82);
  --border:         hsla(${hue}, 65%, 45%, 0.35);
  --text-primary:   hsl(${hue}, 40%, 88%);
  --text-secondary: hsl(${hue}, 30%, 60%);
  --accent:         hsl(${hue}, 70%, 58%);
  --accent-glow:    hsla(${hue}, 70%, 58%, 0.22);
}
body {
  background: linear-gradient(158deg,
    hsl(${hue}, 60%,  5%) 0%,
    hsl(${hue}, 58%,  8%) 30%,
    hsl(${hue}, 55%, 12%) 58%,
    hsl(${hue}, 52%, 16%) 78%,
    hsl(${hue}, 50%, 20%) 100%
  );
}`;

  // Light palette: pale, airy surfaces; dark text.
  const lightCSS = `
:root {
  --surface:        hsla(${hue}, 50%, 93%, 0.78);
  --surface-hover:  hsla(${hue}, 50%, 88%, 0.90);
  --border:         hsla(${hue}, 65%, 45%, 0.28);
  --text-primary:   hsl(${hue}, 60%, 10%);
  --text-secondary: hsl(${hue}, 50%, 35%);
  --accent:         hsl(${hue}, 70%, 32%);
  --accent-glow:    hsla(${hue}, 70%, 32%, 0.15);
}
body {
  background: linear-gradient(158deg,
    hsl(${hue}, 50%, 88%) 0%,
    hsl(${hue}, 52%, 82%) 25%,
    hsl(${hue}, 55%, 76%) 55%,
    hsl(${hue}, 57%, 70%) 78%,
    hsl(${hue}, 60%, 64%) 100%
  );
}`;

  // Explicit variant locks the palette; omitting it follows the OS preference.
  const css = variant === "light" ? lightCSS
    : variant === "dark"  ? darkCSS
    : `${darkCSS}\n@media (prefers-color-scheme: light) {\n${lightCSS}\n}`;

  // Replace any previously injected theme block.
  const existing = document.getElementById("dynamic-theme");
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = "dynamic-theme";
  style.textContent = css;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Page text
// ---------------------------------------------------------------------------

/**
 * Populates the page title, subtitle, and footer from the lookup entry.
 * Any field that is empty or missing hides the corresponding element.
 *
 * @param {Object} entry - A single entry from link_lookup.json.
 */
function applyPageText(entry) {
  const fields = {
    "page-title":    entry.page_title,
    "page-subtitle": entry.page_subtitle,
    "page-footer":   entry.page_footer,
  };
  for (const [id, text] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (text) {
      el.textContent = text;
    } else {
      el.hidden = true;
    }
  }
}

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------

/**
 * Entry point. Reads ?type= from the URL, resolves it against
 * link_lookup.json, then fetches and renders the appropriate link file.
 * Falls back to the first entry in the lookup when no parameter is given.
 */
async function loadLinks() {
  const container = document.getElementById("link-list");
  const typeParam = new URLSearchParams(window.location.search).get("type");

  // Step 1: load the lookup manifest.
  let lookup;
  try {
    const res = await fetch("link_config/link_lookup.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    lookup = await res.json();
  } catch (err) {
    container.innerHTML = `<p id="error-msg">Could not load link_lookup.json: ${err.message}</p>`;
    return;
  }

  // Step 2: match the ?type= parameter to a lookup entry.
  const entry = typeParam
    ? lookup.find((e) => e.name === typeParam)
    : lookup[0];

  if (!entry) {
    const valid = lookup.map((e) => e.name).join(", ");
    container.innerHTML = `<p id="error-msg">Unknown type "${typeParam}". Valid options: ${valid}</p>`;
    return;
  }

  // Step 3: apply the color theme and page text from the entry.
  applyTheme(entry.theme);
  applyPageText(entry);

  // Step 4: fetch and render the link cards.
  let items;
  try {
    const res = await fetch(`link_config/${entry.file}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    items = await res.json();
  } catch (err) {
    container.innerHTML = `<p id="error-msg">Could not load ${entry.file}: ${err.message}</p>`;
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = `<p id="error-msg">No links found in ${entry.file}.</p>`;
    return;
  }

  container.innerHTML = "";

  for (const item of items) {
    const type = item.type || "text";
    container.appendChild(type === "text" ? buildTextCard(item) : buildLinkCard(item));
  }
}

// ---------------------------------------------------------------------------
// Card builders
// ---------------------------------------------------------------------------

/**
 * Builds a clickable link card that opens a URL in a new tab.
 *
 * @param {Object} entry - A link entry. Uses `entry.url` or `entry.content`
 *   as the href, and `entry.title` as the label.
 * @returns {HTMLAnchorElement}
 */
function buildLinkCard(entry) {
  const a = document.createElement("a");
  a.className = "link-card";
  a.href = entry.url ?? entry.content ?? "#";
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  const titleEl = document.createElement("span");
  titleEl.className = "link-title";
  titleEl.textContent = entry.title ?? entry.url ?? entry.content ?? "Untitled";

  const arrow = document.createElement("span");
  arrow.className = "link-arrow";
  arrow.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  a.append(buildIcon(entry.icon, entry.title), titleEl, arrow);
  return a;
}

/**
 * Builds an expandable text card. Clicking reveals the full content;
 * the chevron rotates to indicate open/closed state.
 *
 * @param {Object} entry - A text entry. Uses `entry.title` as the label
 *   and `entry.content` as the expanded body text.
 * @returns {HTMLButtonElement}
 */
function buildTextCard(entry) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "link-card link-card--text";

  const titleEl = document.createElement("span");
  titleEl.className = "link-title";
  titleEl.textContent = entry.title ?? "Untitled";

  const arrow = document.createElement("span");
  arrow.className = "link-arrow link-arrow--chevron";
  arrow.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  // Unique ID links the button to its panel for screen readers (aria-controls).
  const panelId = `text-panel-${Math.random().toString(16).slice(2)}`;
  const panel = document.createElement("div");
  panel.className = "link-text-panel";
  panel.id = panelId;
  panel.hidden = true;

  const content = document.createElement("div");
  content.className = "link-text-content";
  content.textContent = entry.content ?? "";
  panel.appendChild(content);

  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", panelId);
  button.append(buildIcon(entry.icon, entry.title), titleEl, arrow, panel);

  arrow.style.transform = "translateY(1px) rotate(0deg)";
  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    panel.hidden = isOpen;
    arrow.style.transform = isOpen
      ? "translateY(1px) rotate(0deg)"
      : "translateY(1px) rotate(180deg)";
  });

  return button;
}

// ---------------------------------------------------------------------------
// Icon builder
// ---------------------------------------------------------------------------

/**
 * Builds the icon element for a card. Accepts an emoji, image URL, or file
 * path. Falls back to the first letter of the title if no icon is provided.
 *
 * @param {string|undefined} icon  - Emoji, image URL, or file path.
 * @param {string|undefined} title - Used for the fallback letter and img alt.
 * @returns {HTMLSpanElement}
 */
function buildIcon(icon, title) {
  const wrapper = document.createElement("span");
  wrapper.className = "link-icon";

  if (!icon) {
    wrapper.textContent = (title ?? "?")[0].toUpperCase();
    return wrapper;
  }

  // Treat the value as an image if it looks like a URL or has an image extension.
  const isImageUrl =
    /^https?:\/\/|^\.{0,2}\//.test(icon) ||
    /\.(png|jpe?g|svg|ico|webp|gif)$/i.test(icon);

  if (isImageUrl) {
    const img = document.createElement("img");
    img.src = icon;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => { wrapper.textContent = (title ?? "?")[0].toUpperCase(); };
    wrapper.appendChild(img);
  } else {
    // Assume emoji or plain text icon.
    wrapper.textContent = icon;
  }

  return wrapper;
}

// ---------------------------------------------------------------------------

loadLinks();
