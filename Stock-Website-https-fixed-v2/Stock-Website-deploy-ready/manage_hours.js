function normalizeApiOrigin(origin) {
  return String(origin || "").trim().replace(/\/$/, "");
}

const API_ORIGIN_QUERY_PARAM = new URLSearchParams(window.location.search).get("apiOrigin");
if (API_ORIGIN_QUERY_PARAM) {
  const normalizedQueryOrigin = normalizeApiOrigin(API_ORIGIN_QUERY_PARAM);
  if (normalizedQueryOrigin) {
    localStorage.setItem("apiOrigin", normalizedQueryOrigin);
  }
}

function getApiOrigin() {
  return normalizeApiOrigin(window.__API_ORIGIN__ || localStorage.getItem("apiOrigin") || "");
}

function apiUrl(path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const apiOrigin = getApiOrigin();
  return apiOrigin ? `${apiOrigin}${normalized}` : normalized;
}

function getAuthToken() {
  return localStorage.getItem("authToken") || null;
}

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const apiOrigin = getApiOrigin();
  if (window.location.protocol === "https:" && apiOrigin.startsWith("http://")) {
    throw new Error(`Mixed content blocked: this site is HTTPS but the backend is HTTP (${apiOrigin}).`);
  }
  if (!apiOrigin) {
    throw new Error("Backend API origin is not configured. Set config.js to your deployed backend HTTPS URL.");
  }

  const token = getAuthToken();
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(apiUrl(path), { ...options, headers });
  } catch {
    throw new Error(`API request to ${apiOrigin} failed. Open DevTools > Console/Network for details.`);
  }
}

function buildTimeOptions(select, selectedValue) {
  if (!select) return;
  select.innerHTML = "";
  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value.slice(0, 5);
      if (value === selectedValue) option.selected = true;
      select.appendChild(option);
    }
  }
}

async function loadHours() {
  const response = await apiFetch("/api/admin/market/hours");
  if (!response.ok) throw new Error("Failed to load market hours");
  const data = await response.json();
  const weekly = Array.isArray(data?.weeklyHours) ? data.weeklyHours : [];
  const rows = document.querySelectorAll("#hoursTable tbody tr");
  rows.forEach((row, idx) => {
    const openSelect = row.querySelector("select.open");
    const closeSelect = row.querySelector("select.close");
    const match = weekly.find((item) => Number(item.dayOfWeek) === idx + 1);
    buildTimeOptions(openSelect, match?.open || "13:30:00");
    buildTimeOptions(closeSelect, match?.close || "20:00:00");
    if (idx >= 5) {
      openSelect.disabled = true;
      closeSelect.disabled = true;
    }
  });
  buildTimeOptions(document.getElementById("holidayOpen"), "13:30:00");
  buildTimeOptions(document.getElementById("holidayClose"), "20:00:00");
}

window.confirmWeekly = async function confirmWeekly() {
  try {
    const rows = document.querySelectorAll("#hoursTable tbody tr");
    for (let i = 0; i < 5; i += 1) {
      const row = rows[i];
      const openTimeUtc = row.querySelector("select.open")?.value;
      const closeTimeUtc = row.querySelector("select.close")?.value;
      const response = await apiFetch("/api/admin/market/hours", {
        method: "POST",
        body: JSON.stringify({ dayOfWeek: i + 1, openTimeUtc, closeTimeUtc }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Failed to save weekly hours");
    }
    alert("Weekly market hours saved.");
  } catch (error) {
    console.error(error);
    alert(error.message || "Failed to save weekly hours.");
  }
};

window.confirmHoliday = function confirmHoliday() {
  alert("Holiday editing is not wired to the backend in this deployment package.");
};
window.submitConfirmed = function submitConfirmed() {};
window.closePopup = function closePopup() {
  const popup = document.getElementById("confirmPopup");
  if (popup) popup.style.display = "none";
};

document.addEventListener("DOMContentLoaded", () => {
  loadHours().catch((error) => {
    console.error(error);
    alert(error.message || "Failed to load market hours.");
  });
});
