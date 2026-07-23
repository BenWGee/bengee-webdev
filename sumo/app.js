window.SUMO_EXPLORER_BOOTED = true;

const API_BASE_URL = "https://sumo-api.com";

const ENDPOINTS = [
    { key: "rikishis", label: "All rikishis", pathTemplate: "/api/rikishis", requiredFields: [] },
    { key: "rikishi", label: "Rikishi by ID", pathTemplate: "/api/rikishi/{rikishi_id}", requiredFields: ["rikishi_id"] },
    { key: "rikishi_stats", label: "Rikishi stats", pathTemplate: "/api/rikishi/{rikishi_id}/stats", requiredFields: ["rikishi_id"] },
    { key: "rikishi_matches", label: "Rikishi matches", pathTemplate: "/api/rikishi/{rikishi_id}/matches", requiredFields: ["rikishi_id"] },
    {
        key: "rikishi_vs_opponent",
        label: "Rikishi vs opponent",
        pathTemplate: "/api/rikishi/{rikishi_id}/matches/{opponent_id}",
        requiredFields: ["rikishi_id", "opponent_id"]
    },
    { key: "basho", label: "Basho by ID", pathTemplate: "/api/basho/{basho_id}", requiredFields: ["basho_id"] },
    {
        key: "banzuke",
        label: "Basho banzuke",
        pathTemplate: "/api/basho/{basho_id}/banzuke/{division}",
        requiredFields: ["basho_id", "division"]
    },
    {
        key: "torikumi",
        label: "Torikumi by day",
        pathTemplate: "/api/basho/{basho_id}/torikumi/{division}/{day}",
        requiredFields: ["basho_id", "division", "day"]
    },
    { key: "kimarite", label: "All kimarite", pathTemplate: "/api/kimarite", requiredFields: [] },
    { key: "kimarite_detail", label: "Kimarite detail", pathTemplate: "/api/kimarite/{kimarite}", requiredFields: ["kimarite"] },
    { key: "measurements", label: "Measurements", pathTemplate: "/api/measurements", requiredFields: [] },
    { key: "ranks", label: "Ranks", pathTemplate: "/api/ranks", requiredFields: [] },
    { key: "shikonas", label: "Shikonas", pathTemplate: "/api/shikonas", requiredFields: [] },
    { key: "custom", label: "Custom GET path", pathTemplate: "{custom_path}", requiredFields: ["custom_path"] }
];

const FIELD_LABELS = {
    rikishi_id: "Rikishi ID",
    opponent_id: "Opponent ID",
    basho_id: "Basho ID",
    division: "Division",
    day: "Day",
    kimarite: "Kimarite",
    custom_path: "Custom Path"
};

const DEFAULT_VALUES = {
    endpoint: "rikishis",
    rikishi_id: "",
    opponent_id: "",
    basho_id: "202405",
    division: "makuuchi",
    day: "1",
    kimarite: "yorikiri",
    custom_path: "/api/rikishis",
    limit: "",
    skip: "",
    intai: "",
    shikonaEn: ""
};

function cleanValue(value) {
    return (value || "").trim();
}

function flattenValue(value) {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return JSON.stringify(value);
}

function flattenRow(row, prefix = "") {
    const flattened = {};
    for (const [key, value] of Object.entries(row)) {
        const columnName = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
            Object.assign(flattened, flattenRow(value, columnName));
        } else {
            flattened[columnName] = flattenValue(value);
        }
    }
    return flattened;
}

function buildTable(payload) {
    const rawJson = JSON.stringify(payload, null, 2);

    let rows = [];
    if (Array.isArray(payload)) {
        rows = payload.filter((item) => item && typeof item === "object" && !Array.isArray(item));
        if (!rows.length) {
            return {
                columns: ["value"],
                rows: payload.map((item) => ({ value: flattenValue(item) })),
                rawJson
            };
        }
    } else if (payload && typeof payload === "object") {
        const listKey = Object.keys(payload).find((key) => {
            const value = payload[key];
            return Array.isArray(value) && value.length && value.every((item) => item && typeof item === "object" && !Array.isArray(item));
        });
        rows = listKey ? payload[listKey] : [payload];
    } else {
        return {
            columns: ["value"],
            rows: [{ value: flattenValue(payload) }],
            rawJson
        };
    }

    const columns = [];
    const normalizedRows = [];

    for (const row of rows) {
        const flatRow = flattenRow(row);
        normalizedRows.push(flatRow);
        for (const key of Object.keys(flatRow)) {
            if (!columns.includes(key)) {
                columns.push(key);
            }
        }
    }

    const orderedRows = normalizedRows.map((row) => {
        const result = {};
        for (const column of columns) {
            result[column] = row[column] || "";
        }
        return result;
    });

    return { columns, rows: orderedRows, rawJson };
}

function getSelectedEndpoint(endpointKey) {
    return ENDPOINTS.find((endpoint) => endpoint.key === endpointKey) || ENDPOINTS[0];
}

function buildRequestPath(values) {
    const endpoint = getSelectedEndpoint(values.endpoint);

    const missingFields = endpoint.requiredFields.filter((field) => !cleanValue(values[field]));
    if (missingFields.length) {
        const labels = missingFields.map((field) => FIELD_LABELS[field] || field);
        throw new Error(`Missing required fields: ${labels.join(", ")}`);
    }

    const pathValues = {};
    for (const fieldName of Object.keys(FIELD_LABELS)) {
        pathValues[fieldName] = cleanValue(values[fieldName]);
    }

    let path = endpoint.pathTemplate.replace(/\{(\w+)\}/g, (_, fieldName) => pathValues[fieldName] || "");

    if (endpoint.key === "custom" && !path.startsWith("/")) {
        path = `/${path}`;
    }

    const params = new URLSearchParams();
    ["limit", "skip", "intai", "shikonaEn"].forEach((param) => {
        const value = cleanValue(values[param]);
        if (value) {
            params.set(param, value);
        }
    });

    if ([...params.keys()].length) {
        path += `${path.includes("?") ? "&" : "?"}${params.toString()}`;
    }

    return { endpoint, path };
}

function getFormValues(form) {
    const values = { ...DEFAULT_VALUES };
    const formData = new FormData(form);
    for (const key of Object.keys(values)) {
        values[key] = cleanValue(formData.get(key) || values[key]);
    }
    return values;
}

function showMessage(element, text) {
    element.textContent = text;
    element.classList.toggle("hidden", !text);
}

function renderEndpointOptions(select) {
    select.innerHTML = ENDPOINTS.map(
        (endpoint) => `<option value="${endpoint.key}">${endpoint.label}</option>`
    ).join("");
}

function renderPathFields(container, values) {
    const endpoint = getSelectedEndpoint(values.endpoint);

    container.innerHTML = Object.entries(FIELD_LABELS)
        .map(([fieldName, label]) => {
            const required = endpoint.requiredFields.includes(fieldName);
            const placeholder = required ? "" : "placeholder=\"Optional for this endpoint\"";
            const value = values[fieldName] || "";
            return `
                <div class="field-row">
                    <label for="${fieldName}">${label}</label>
                    <input id="${fieldName}" name="${fieldName}" value="${value}" ${placeholder}>
                </div>
            `;
        })
        .join("");
}

function renderTable(container, columns, rows) {
    const header = columns.map((column) => `<th>${column}</th>`).join("");
    const body = rows
        .map((row) => {
            const cells = columns
                .map((column) => {
                    const cell = row[column] || "";
                    const wrapClass = typeof cell === "string" && cell.length > 40 ? "wrap" : "";
                    return `<td class="${wrapClass}">${cell}</td>`;
                })
                .join("");
            return `<tr>${cells}</tr>`;
        })
        .join("");

    container.innerHTML = `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Request failed: ${response.status} ${response.statusText}${body ? ` - ${body.slice(0, 160)}` : ""}`);
    }
    return response.json();
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
    const values = { ...DEFAULT_VALUES };
    const params = new URLSearchParams(window.location.search);
    for (const key of Object.keys(values)) {
        if (params.has(key)) {
            values[key] = cleanValue(params.get(key));
        }
    }
    return values;
}

function fillForm(form, values) {
    for (const [key, value] of Object.entries(values)) {
        const input = form.elements.namedItem(key);
        if (input) {
            input.value = value;
        }
    }
}

function setMeta(endpointLabel, path, url) {
    document.getElementById("meta-endpoint").textContent = endpointLabel || "-";
    document.getElementById("meta-path").textContent = path || "Not built yet";
    document.getElementById("meta-url").textContent = url || "No request sent";
}

async function loadData(form) {
    const values = getFormValues(form);
    writeQueryParams(values);

    const errorElement = document.getElementById("error-message");
    const warningElement = document.getElementById("warning-message");
    const tableShell = document.getElementById("table-shell");
    const emptyState = document.getElementById("empty-state");
    const jsonShell = document.getElementById("json-shell");
    const rawJson = document.getElementById("raw-json");

    showMessage(errorElement, "");
    showMessage(warningElement, "");

    try {
        const { endpoint, path } = buildRequestPath(values);
        const requestUrl = `${API_BASE_URL}${path}`;
        setMeta(endpoint.label, path, requestUrl);

        const payload = await fetchJson(requestUrl);
        const { columns, rows, rawJson: rawJsonText } = buildTable(payload);

        if (rows.length && columns.length) {
            renderTable(tableShell, columns, rows);
            tableShell.classList.remove("hidden");
            emptyState.classList.add("hidden");
        } else {
            tableShell.classList.add("hidden");
            emptyState.classList.remove("hidden");
            emptyState.textContent = "The API returned no rows to display.";
        }

        rawJson.textContent = rawJsonText;
        jsonShell.classList.remove("hidden");
    } catch (error) {
        tableShell.classList.add("hidden");
        jsonShell.classList.add("hidden");
        emptyState.classList.remove("hidden");
        emptyState.textContent = "Submit a request to view data.";
        showMessage(errorElement, error.message || "Unknown error while loading data.");
    }
}

function initialize() {
    const form = document.getElementById("explorer-form");
    const endpointSelect = document.getElementById("endpoint");
    const pathFields = document.getElementById("path-fields");

    document.getElementById("api-base-url").textContent = API_BASE_URL;
    renderEndpointOptions(endpointSelect);

    const initialValues = readInitialValues();
    endpointSelect.value = initialValues.endpoint;
    renderPathFields(pathFields, initialValues);
    fillForm(form, initialValues);
    setMeta(getSelectedEndpoint(initialValues.endpoint).label, "", "");

    endpointSelect.addEventListener("change", () => {
        const values = getFormValues(form);
        renderPathFields(pathFields, values);
        fillForm(form, values);
        setMeta(getSelectedEndpoint(values.endpoint).label, "", "");
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await loadData(form);
    });

    if (window.location.search) {
        loadData(form).catch(() => {
            // User-facing error is already rendered by loadData.
        });
    }
}

initialize();
