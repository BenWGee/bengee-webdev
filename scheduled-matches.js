window.SUMO_MATCHES_BOOTED = true;

const API_BASE_URL = "https://sumo-api.com";

function cleanValue(value) {
    return (value || "").trim();
}

function toInt(value, fieldName) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        throw new Error(`${fieldName} must be a number.`);
    }
    return parsed;
}

function emptyRecord() {
    return { wins: 0, losses: 0 };
}

function formatRecord(record) {
    return `${record.wins}-${record.losses}`;
}

function classifyRecord(record, day) {
    const wins = record.wins;
    const remainingMatches = Math.max(0, 16 - day);

    if (wins >= 8) {
        return { status: "winning", label: "Winning record" };
    }
    if (wins === 7) {
        return { status: "bubble", label: "One win from a winning record" };
    }
    if (wins + remainingMatches >= 8) {
        return { status: "alive", label: "Can still reach eight wins" };
    }
    return { status: "eliminated", label: "Cannot reach eight wins" };
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Request failed: ${response.status} ${response.statusText}${body ? ` - ${body.slice(0, 160)}` : ""}`);
    }
    return response.json();
}

async function buildPreMatchRecords(bashoId, day, rikishiIds) {
    const records = new Map();
    rikishiIds.forEach((rikishiId) => records.set(rikishiId, emptyRecord()));

    for (let previousDay = 1; previousDay < day; previousDay += 1) {
        const url = `${API_BASE_URL}/api/basho/${encodeURIComponent(bashoId)}/torikumi/makuuchi/${previousDay}`;
        const payload = await fetchJson(url);

        if (!payload || typeof payload !== "object") {
            throw new Error("Unexpected response shape while building pre-match records.");
        }

        const matches = payload.torikumi;
        if (!Array.isArray(matches)) {
            throw new Error("The torikumi field was missing while building pre-match records.");
        }

        matches.forEach((match) => {
            if (!match || typeof match !== "object") {
                return;
            }

            const eastId = match.eastId;
            const westId = match.westId;
            const winnerId = match.winnerId;

            if (!rikishiIds.has(eastId) && !rikishiIds.has(westId)) {
                return;
            }

            if (winnerId === eastId) {
                if (records.has(eastId)) {
                    records.get(eastId).wins += 1;
                }
                if (records.has(westId)) {
                    records.get(westId).losses += 1;
                }
            } else if (winnerId === westId) {
                if (records.has(westId)) {
                    records.get(westId).wins += 1;
                }
                if (records.has(eastId)) {
                    records.get(eastId).losses += 1;
                }
            }
        });
    }

    return records;
}

async function getScheduledMatches(bashoId, dayString) {
    const day = toInt(dayString, "Day");
    if (day < 1) {
        throw new Error("Day must be 1 or greater.");
    }

    const requestPath = `/api/basho/${encodeURIComponent(bashoId)}/torikumi/makuuchi/${day}`;
    const payload = await fetchJson(`${API_BASE_URL}${requestPath}`);

    if (!payload || typeof payload !== "object") {
        throw new Error("Unexpected response shape for the torikumi endpoint.");
    }

    const matches = payload.torikumi;
    if (!Array.isArray(matches)) {
        throw new Error("The torikumi field was missing or invalid.");
    }

    const rikishiIds = new Set();
    matches.forEach((match) => {
        if (!match || typeof match !== "object") {
            return;
        }
        if (Number.isInteger(match.eastId)) {
            rikishiIds.add(match.eastId);
        }
        if (Number.isInteger(match.westId)) {
            rikishiIds.add(match.westId);
        }
    });

    const preMatchRecords = await buildPreMatchRecords(bashoId, day, rikishiIds);

    const enrichedMatches = matches
        .filter((match) => match && typeof match === "object")
        .map((match) => {
            const eastRecord = Number.isInteger(match.eastId) ? (preMatchRecords.get(match.eastId) || emptyRecord()) : emptyRecord();
            const westRecord = Number.isInteger(match.westId) ? (preMatchRecords.get(match.westId) || emptyRecord()) : emptyRecord();
            const eastClassification = classifyRecord(eastRecord, day);
            const westClassification = classifyRecord(westRecord, day);

            return {
                ...match,
                eastRecord: formatRecord(eastRecord),
                westRecord: formatRecord(westRecord),
                eastRecordStatus: eastClassification.status,
                eastRecordLabel: eastClassification.label,
                westRecordStatus: westClassification.status,
                westRecordLabel: westClassification.label
            };
        });

    const summary = {
        bashoId,
        day,
        division: matches.length ? (matches[0].division || "Makuuchi") : "Makuuchi",
        location: payload.location || "",
        startDate: payload.startDate || "",
        endDate: payload.endDate || "",
        matchCount: enrichedMatches.length,
        requestPath
    };

    return { summary, matches: enrichedMatches };
}

function showMessage(element, text) {
    element.textContent = text;
    element.classList.toggle("hidden", !text);
}

function renderTable(container, matches, day, showSpoilers) {
    const header = showSpoilers
        ? "<tr><th>Match</th><th>East</th><th>West</th><th>Winner</th><th>Kimarite</th></tr>"
        : "<tr><th>Match</th><th>East</th><th>West</th><th>Result</th></tr>";

    const body = matches
        .map((match) => {
            const dayLabel = day > 1 ? `Record through day ${day - 1}` : "Starting record";
            const east = `
                <div class=\"rikishi\">
                    <strong>${match.eastShikona || "-"}</strong>
                    <span class=\"rank\">${match.eastRank || "-"}</span>
                    <span class=\"record record-${match.eastRecordStatus}\">${dayLabel}: ${match.eastRecord}</span>
                    <span class=\"record-note\">${match.eastRecordLabel}</span>
                </div>
            `;
            const west = `
                <div class=\"rikishi\">
                    <strong>${match.westShikona || "-"}</strong>
                    <span class=\"rank\">${match.westRank || "-"}</span>
                    <span class=\"record record-${match.westRecordStatus}\">${dayLabel}: ${match.westRecord}</span>
                    <span class=\"record-note\">${match.westRecordLabel}</span>
                </div>
            `;

            const spoilerCells = showSpoilers
                ? `<td class=\"winner\">${match.winnerEn || "Pending"}</td><td>${match.kimarite || "Pending"}</td>`
                : "<td class=\"spoiler-off\">Hidden</td>";

            return `<tr><td>${match.matchNo || "-"}</td><td>${east}</td><td>${west}</td>${spoilerCells}</tr>`;
        })
        .join("");

    container.innerHTML = `<table><thead>${header}</thead><tbody>${body}</tbody></table>`;
}

function writeQueryParams(values) {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });

    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
}

function readInitialValues() {
    const params = new URLSearchParams(window.location.search);
    return {
        basho_id: cleanValue(params.get("basho_id") || "202405"),
        day: cleanValue(params.get("day") || "1"),
        spoiler: params.get("spoiler") === "true" || params.get("spoiler") === "1"
    };
}

function setMeta(summary) {
    document.getElementById("meta-basho").textContent = summary.bashoId || "-";
    document.getElementById("meta-day").textContent = String(summary.day || "-");
    document.getElementById("meta-division").textContent = summary.division || "Makuuchi";
    document.getElementById("meta-count").textContent = String(summary.matchCount || 0);
    document.getElementById("meta-location").textContent = summary.location || "Not returned";
}

async function loadMatches(form) {
    const errorElement = document.getElementById("error-message");
    const warningElement = document.getElementById("warning-message");
    const tableShell = document.getElementById("table-shell");
    const emptyState = document.getElementById("empty-state");

    showMessage(errorElement, "");
    showMessage(warningElement, "");

    const bashoId = cleanValue(form.elements.basho_id.value);
    const day = cleanValue(form.elements.day.value);
    const showSpoilers = form.elements.spoiler.checked;

    writeQueryParams({ basho_id: bashoId, day, spoiler: showSpoilers ? "1" : "" });

    try {
        const { summary, matches } = await getScheduledMatches(bashoId, day);

        setMeta(summary);

        if (matches.length) {
            renderTable(tableShell, matches, summary.day, showSpoilers);
            tableShell.classList.remove("hidden");
            emptyState.classList.add("hidden");
        } else {
            tableShell.classList.add("hidden");
            emptyState.classList.remove("hidden");
        }
    } catch (error) {
        tableShell.classList.add("hidden");
        emptyState.classList.remove("hidden");
        showMessage(errorElement, error.message || "Unknown error while loading matches.");
    }
}

function initialize() {
    const form = document.getElementById("matches-form");
    const initialValues = readInitialValues();

    form.elements.basho_id.value = initialValues.basho_id;
    form.elements.day.value = initialValues.day;
    form.elements.spoiler.checked = initialValues.spoiler;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await loadMatches(form);
    });

    if (window.location.search) {
        loadMatches(form).catch(() => {
            // User-facing error is already rendered by loadMatches.
        });
    }
}

initialize();