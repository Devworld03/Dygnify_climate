
export default function InsightCards({ data, meta }) {
  if (!data) return null;

  const trend = data.trend || {};
  const quality = data.data_quality || meta?.data_quality || {};
  const baseline = data.baseline || {};

  const trendLabel =
    trend.method === "insufficient_data"
      ? "Insufficient data"
      : trend.trend || "Unavailable";

  const trendColor =
    trend.significant && trend.sen_slope > 0
      ? "#b91c1c"
      : trend.significant && trend.sen_slope < 0
      ? "#166534"
      : "#92400e";

  const cards = [
    {
      title: "Trend direction",
      value: trendLabel,
      detail:
        trend.significant == null
          ? "Statistical significance unavailable"
          : trend.significant
          ? `Statistically significant · p = ${trend.p_value}`
          : "No statistically significant trend detected",
      color: trendColor,
    },
    {
      title: "Sen's slope",
      value:
        trend.sen_slope == null
          ? "—"
          : `${trend.sen_slope > 0 ? "+" : ""}${trend.sen_slope.toFixed(2)}`,
      detail: "Heatwave days per year",
      color: "#1d4ed8",
    },
    {
      title: "Years analyzed",
      value: trend.n_years ?? data.yearly?.length ?? 0,
      detail: `${data.range?.start_year ?? "—"}–${data.range?.end_year ?? "—"}`,
      color: "#374151",
    },
    {
      title: "Data completeness",
      value:
        quality.missing_pct == null
          ? "—"
          : `${(100 - quality.missing_pct).toFixed(1)}%`,
      detail: `${quality.remaining_missing ?? "—"} missing days remaining`,
      color: "#7c3aed",
    },
  ];

  return (
    <div style={styles.stack}>
      <section style={styles.insight}>
        <div style={styles.eyebrow}>CLIMATE INSIGHT</div>
        <h2 style={styles.insightHeading}>What the data tells us</h2>
        <p style={styles.insightText}>
          {data.insight || "No summary insight is available."}
        </p>
        <p style={styles.baseline}>
          Baseline: {baseline.period || "Not specified"} ·{" "}
          {baseline.percentile ?? 95}th percentile ·{" "}
          {baseline.min_duration_days ?? 3} consecutive days
        </p>
      </section>

      <div style={styles.grid}>
        {cards.map((card) => (
          <section key={card.title} style={styles.card}>
            <div style={styles.cardTitle}>{card.title}</div>
            <div style={{ ...styles.value, color: card.color }}>
              {card.value}
            </div>
            <div style={styles.detail}>{card.detail}</div>
          </section>
        ))}
      </div>

      <section style={styles.card}>
        <h3 style={styles.sectionHeading}>Data quality report</h3>

        <div style={styles.qualityGrid}>
          <QualityRow label="Total days" value={quality.total_days} />
          <QualityRow label="Originally missing" value={quality.missing_raw} />
          <QualityRow label="Outliers removed" value={quality.outliers_removed} />
          <QualityRow label="Interpolated days" value={quality.interpolated_days} />
          <QualityRow
            label="Excluded years"
            value={
              quality.excluded_years?.length
                ? quality.excluded_years.join(", ")
                : "None"
            }
          />
          <QualityRow label="Temperature unit" value={quality.unit || "°C"} />
        </div>
      </section>
    </div>
  );
}

function QualityRow({ label, value }) {
  return (
    <div style={styles.qualityRow}>
      <span style={styles.qualityLabel}>{label}</span>
      <strong style={styles.qualityValue}>{value ?? "—"}</strong>
    </div>
  );
}

const styles = {
  stack: { display: "grid", gap: 18 },
  insight: {
    padding: 22,
    borderRadius: 14,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: "#047857",
  },
  insightHeading: { margin: "8px 0", fontSize: 21, color: "#064e3b" },
  insightText: { margin: 0, lineHeight: 1.8, color: "#065f46" },
  baseline: { marginBottom: 0, fontSize: 12, color: "#047857" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  card: {
    padding: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    minWidth: 0,
  },
  cardTitle: { fontSize: 13, color: "#6b7280" },
  value: { fontSize: 25, fontWeight: 750, margin: "10px 0" },
  detail: { fontSize: 12, color: "#6b7280", lineHeight: 1.6 },
  sectionHeading: { fontSize: 17, margin: "0 0 12px" },
  qualityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  qualityRow: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    padding: 12,
    background: "#f9fafb",
    borderRadius: 8,
  },
  qualityLabel: { fontSize: 12, color: "#6b7280" },
  qualityValue: { fontSize: 14, overflowWrap: "anywhere" },
};
