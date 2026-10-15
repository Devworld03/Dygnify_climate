
import { useState } from "react";
import { analyzeRegion, getHeatwaveData } from "./api";
import RegionPicker from "./RegionPicker";
import RangePicker from "./RangePicker";
import Charts from "./Charts";
import InsightCards from "./InsightCards";

const initialRegion = {
  name: "Indore, Madhya Pradesh, India",
  lat: 22.7196,
  lon: 75.8577,
};

const initialRange = {
  startYear: 1991,
  endYear: 2020,
};

export default function App() {
  const [region, setRegion] = useState(initialRegion);
  const [range, setRange] = useState(initialRange);
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRequest, setLastRequest] = useState(null);

  const runAnalysis = async () => {
    const lat = Number(region.lat);
    const lon = Number(region.lon);
    const startYear = Number(range.startYear);
    const endYear = Number(range.endYear);

    if (
      region.lat === "" ||
      region.lon === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      setError("Please select a valid region or enter valid coordinates.");
      return;
    }

    if (
      !Number.isInteger(startYear) ||
      !Number.isInteger(endYear) ||
      startYear < 1950 ||
      endYear > new Date().getFullYear() - 1 ||
      endYear < startYear ||
      endYear - startYear + 1 > 80
    ) {
      setError("Please select a valid historical year range.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);
    setMeta(null);

    try {
      // Step 1: Prepare or retrieve historical data.
      const analysisMeta = await analyzeRegion({
        lat,
        lon,
        startYear,
        endYear,
      });

      setMeta(analysisMeta);

      // Step 2: Read the processed heatwave results.
      const result = await getHeatwaveData({
        lat,
        lon,
        startYear,
        endYear,
      });

      setData(result);
      setLastRequest({
        name: region.name || "Selected region",
        lat,
        lon,
        startYear,
        endYear,
        cached: analysisMeta.cached,
      });
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <span style={styles.logo}>🌍</span>
            <div>
              <div style={styles.brandTitle}>ClimateScope</div>
              <div style={styles.brandSubtitle}>
                Climate Hazard Trend Analyzer
              </div>
            </div>
          </div>
          <span style={styles.hazardBadge}>HEATWAVE ANALYSIS</span>
        </div>
      </header>

      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>HISTORICAL CLIMATE EXPLORER</div>
          <h1 style={styles.title}>Understand changing heatwave patterns.</h1>
          <p style={styles.description}>
            Explore historical temperature extremes, detect heatwave events,
            and investigate long-term trends using statistical analysis.
          </p>
        </section>

        <section style={styles.controls}>
          <RegionPicker region={region} onChange={setRegion} />

          <RangePicker
            range={range}
            onChange={setRange}
            onAnalyze={runAnalysis}
            disabled={loading}
          />
        </section>

        {error && (
          <div role="alert" style={styles.error}>
            <strong>Analysis error</strong>
            <p style={{ margin: "6px 0 0" }}>{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              style={styles.dismiss}
            >
              Dismiss
            </button>
          </div>
        )}

        {loading && (
          <section style={styles.loading} aria-live="polite">
            <div style={styles.spinner} />
            <h2 style={{ marginBottom: 6 }}>Analyzing historical climate data</h2>
            <p style={styles.muted}>
              Fetching or preparing weather data and calculating heatwave
              trends. First-time requests may take a little longer.
            </p>
          </section>
        )}

        {!loading && data && (
          <div style={styles.results}>
            <section style={styles.locationBanner}>
              <div>
                <div style={styles.locationName}>
                  {lastRequest?.name || "Selected region"}
                </div>
                <div style={styles.muted}>
                  Grid point: {data.region.grid_point.lat},{" "}
                  {data.region.grid_point.lon} · {range.startYear}–
                  {range.endYear}
                </div>
              </div>
              <span style={styles.readyBadge}>Analysis ready</span>
            </section>

            <InsightCards data={data} meta={meta} />

            <Charts data={data} />

            <p style={styles.disclaimer}>
              Results are estimates based on gridded historical weather data
              and the heatwave definition shown above. Statistical significance
              does not establish causation. Data gaps and interpolation may
              affect results.
            </p>
          </div>
        )}

        {!loading && !data && !error && (
          <section style={styles.empty}>
            <div style={{ fontSize: 38 }}>🌡️</div>
            <h2 style={{ marginBottom: 8 }}>Ready to explore?</h2>
            <p style={styles.muted}>
              Choose a region and historical period, then click Analyze Climate
              Trends to view heatwave statistics and insights.
            </p>
          </section>
        )}

        <footer style={styles.footer}>
          ClimateScope · Historical heatwave analysis · Powered by Open-Meteo
        </footer>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f6fa",
    color: "#172033",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    background: "#102a43",
    color: "#fff",
    padding: "16px 24px",
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 32 },
  brandTitle: { fontSize: 19, fontWeight: 750 },
  brandSubtitle: { fontSize: 12, color: "#cbd5e1", marginTop: 3 },
  hazardBadge: {
    padding: "7px 11px",
    background: "#244765",
    color: "#bae6fd",
    fontSize: 11,
    fontWeight: 750,
    letterSpacing: 1,
    borderRadius: 20,
  },
  container: { maxWidth: 1200, padding: "0 22px", margin: "0 auto" },
  hero: { padding: "36px 0 26px" },
  eyebrow: {
    color: "#0369a1",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: "clamp(27px, 4vw, 40px)",
    lineHeight: 1.2,
    letterSpacing: "-1px",
    margin: "12px 0",
    maxWidth: 760,
  },
  description: {
    color: "#64748b",
    lineHeight: 1.8,
    maxWidth: 700,
    fontSize: 15,
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: 18,
    alignItems: "start",
  },
  results: { display: "grid", gap: 20, marginTop: 24 },
  locationBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    padding: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
  },
  locationName: { fontWeight: 750, fontSize: 17, marginBottom: 5 },
  readyBadge: {
    padding: "7px 10px",
    borderRadius: 20,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 12,
    fontWeight: 700,
  },
  muted: { color: "#64748b", fontSize: 13, lineHeight: 1.7 },
  error: {
    marginTop: 20,
    padding: 18,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    borderRadius: 12,
    color: "#991b1b",
  },
  dismiss: {
    marginTop: 10,
    padding: "7px 12px",
    border: "1px solid #fecaca",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
  },
  loading: {
    marginTop: 24,
    padding: 32,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    textAlign: "center",
  },
  spinner: {
    width: 30,
    height: 30,
    margin: "0 auto 18px",
    border: "3px solid #dbeafe",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "climate-spin 0.8s linear infinite",
  },
  empty: {
    marginTop: 24,
    padding: 36,
    background: "#fff",
    border: "1px dashed #cbd5e1",
    borderRadius: 14,
    textAlign: "center",
  },
  disclaimer: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 1.8,
    padding: "4px 2px",
  },
  footer: {
    textAlign: "center",
    padding: "30px 0",
    fontSize: 12,
    color: "#94a3b8",
  },
};
