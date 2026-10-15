
import { useEffect, useState } from "react";
import { searchRegions } from "./api";

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
};

export default function RegionPicker({ region, onChange }) {
  const [query, setQuery] = useState(region?.name || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await searchRegions(query);
        if (active) setResults(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const updateCoordinate = (field, value) => {
    onChange({
      ...region,
      [field]: value === "" ? "" : Number(value),
      name: region?.name || "Custom coordinates",
    });
  };

  const selectCity = (city) => {
    const name = [city.name, city.state, city.country]
      .filter(Boolean)
      .join(", ");

    onChange({
      name,
      lat: city.lat,
      lon: city.lon,
    });

    setQuery(name);
    setResults([]);
    setError("");
  };

  return (
    <section style={styles.card}>
      <h2 style={styles.heading}>📍 Select Region</h2>
      <p style={styles.muted}>
        Search for a city or enter coordinates manually.
      </p>

      <label style={styles.label} htmlFor="city-search">
        Search city
      </label>

      <input
        id="city-search"
        style={inputStyle}
        value={query}
        placeholder="e.g. Indore, Mumbai, Delhi"
        onChange={(e) => {
          setQuery(e.target.value);
          setResults([]);
        }}
      />

      {loading && <p style={styles.muted}>Searching locations...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {results.length > 0 && (
        <div style={styles.results}>
          {results.map((city, index) => (
            <button
              type="button"
              key={`${city.lat}-${city.lon}-${index}`}
              onClick={() => selectCity(city)}
              style={styles.resultButton}
            >
              <strong>{city.name}</strong>
              <span style={styles.muted}>
                {[city.state, city.country].filter(Boolean).join(", ")}
              </span>
            </button>
          ))}
        </div>
      )}

      <div style={styles.coordinates}>
        <div>
          <label style={styles.label} htmlFor="latitude">
            Latitude
          </label>
          <input
            id="latitude"
            type="number"
            min="-90"
            max="90"
            step="any"
            style={inputStyle}
            value={region?.lat ?? ""}
            onChange={(e) => updateCoordinate("lat", e.target.value)}
            placeholder="22.72"
          />
        </div>

        <div>
          <label style={styles.label} htmlFor="longitude">
            Longitude
          </label>
          <input
            id="longitude"
            type="number"
            min="-180"
            max="180"
            step="any"
            style={inputStyle}
            value={region?.lon ?? ""}
            onChange={(e) => updateCoordinate("lon", e.target.value)}
            placeholder="75.86"
          />
        </div>
      </div>

      <p style={styles.muted}>
        {region?.lat !== "" &&
        region?.lat != null &&
        region?.lon !== "" &&
        region?.lon != null
          ? `Selected: ${Number(region.lat).toFixed(2)}, ${Number(
              region.lon
            ).toFixed(2)}`
          : "Choose a city or enter both coordinates."}
      </p>
    </section>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
    position: "relative",
  },
  heading: { fontSize: 19, margin: "0 0 8px" },
  muted: { color: "#6b7280", fontSize: 13, lineHeight: 1.5 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    margin: "14px 0 7px",
  },
  coordinates: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  results: {
    position: "absolute",
    zIndex: 10,
    left: 20,
    right: 20,
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    maxHeight: 230,
    overflowY: "auto",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  },
  resultButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
    width: "100%",
    padding: 12,
    background: "#fff",
    border: 0,
    borderBottom: "1px solid #f3f4f6",
    cursor: "pointer",
    textAlign: "left",
  },
  error: { color: "#b91c1c", fontSize: 13 },
};
