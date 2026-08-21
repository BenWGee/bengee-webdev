async function loadLinks() {
  const container = document.getElementById("link-list");

  let items;
  try {
    const res = await fetch("links.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    items = await res.json();
  } catch (err) {
    container.innerHTML = `<p id="error-msg">Could not load links.json: ${err.message}</p>`;
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = `<p id="error-msg">No links found in links.json.</p>`;
    return;
  }

  container.innerHTML = "";

  for (const entry of items) {
    const type = entry.type || (entry.url ? "link" : "text");

    if (type === "text") {
      container.appendChild(buildTextCard(entry));
    } else {
      container.appendChild(buildLinkCard(entry));
    }
  }
}

function buildLinkCard(entry) {
  const a = document.createElement("a");
  a.className = "link-card";
  a.href = entry.url ?? "#";
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  const iconEl = buildIcon(entry.icon, entry.title);
  const titleEl = document.createElement("span");
  titleEl.className = "link-title";
  titleEl.textContent = entry.title ?? entry.url ?? "Untitled";

  const arrow = document.createElement("span");
  arrow.className = "link-arrow";
  arrow.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  a.append(iconEl, titleEl, arrow);
  return a;
}

function buildTextCard(entry) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "link-card link-card--text";

  const iconEl = buildIcon(entry.icon, entry.title);

  const titleEl = document.createElement("span");
  titleEl.className = "link-title";
  titleEl.textContent = entry.title ?? "Untitled";

  // Reuse your arrow container but make it a chevron
  const arrow = document.createElement("span");
  arrow.className = "link-arrow link-arrow--chevron";
  arrow.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  // Expand panel
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

  button.append(iconEl, titleEl, arrow, panel);

  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";

    button.setAttribute("aria-expanded", String(!isOpen));
    panel.hidden = isOpen;

    // Rotate the chevron by toggling a style (keeps CSS changes minimal)
    // (We don't rely on class changes for simplicity.)
    arrow.style.transform = isOpen ? "translateY(1px) rotate(0deg)" : "translateY(1px) rotate(180deg)";
  });

  // Initial arrow transform
  arrow.style.transform = "translateY(1px) rotate(0deg)";

  return button;
}

function buildIcon(icon, title) {
  const wrapper = document.createElement("span");
  wrapper.className = "link-icon";

  if (!icon) {
    wrapper.textContent = (title ?? "?")[0].toUpperCase();
    return wrapper;
  }

  const isImageUrl =
    /^https?:\/\/|^\.{0,2}\//.test(icon) ||
    /\.(png|jpe?g|svg|ico|webp|gif)$/i.test(icon);

  if (isImageUrl) {
    const img = document.createElement("img");
    img.src = icon;
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => {
      wrapper.textContent = (title ?? "?")[0].toUpperCase();
    };
    wrapper.appendChild(img);
  } else {
    wrapper.textContent = icon;
  }

  return wrapper;
}

loadLinks();
