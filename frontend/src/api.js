
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Unable to connect to the backend. Check that the API server is running."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = "Something went wrong.";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((error) => error.msg || "Invalid input")
        .join(", ");
    }

    if (response.status === 429) {
      message = "Too many requests. Please wait and try again.";
    }

    throw new Error(message);
  }

  return data;
}

// GET /api/geocode?q=Indore
export async function searchRegions(query) {
  const q = query.trim();

  if (q.length < 2) return [];

  return request(`/api/geocode?q=${encodeURIComponent(q)}`);
}

// POST /api/analyze
// Fetches historical weather data if the selected range is not cached.
export async function analyzeRegion({
  lat,
  lon,
  startYear,
  endYear,
}) {
  return request("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hazard: "heatwave",
      lat: Number(lat),
      lon: Number(lon),
      start_year: Number(startYear),
      end_year: Number(endYear),
    }),
  });
}

// GET /api/hazards/heatwave
// Returns yearly statistics, events, trends, insights and data quality.
export async function getHeatwaveData({
  lat,
  lon,
  startYear,
  endYear,
}) {
  const params = new URLSearchParams({
    lat: String(Number(lat)),
    lon: String(Number(lon)),
    start_year: String(Number(startYear)),
    end_year: String(Number(endYear)),
  });

  return request(`/api/hazards/heatwave?${params.toString()}`);
}
