
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function Charts({ data }) {
  if (!data) return null;

  const yearly = data.yearly || [];
  const events = data.events || [];

  const chartData = yearly.map((item) => ({
    year: item.year,
    heatwaveDays: item.heatwave_days,
    rollingMean: item.heatwave_days_rolling5,
  }));

  const formatDate = (value) =>
    value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "—";

  return (
    <div style={styles.stack}>
      <section style={styles.card}>
        <h2 style={styles.heading}>📈 Heatwave Trends</h2>
        <p style={styles.muted}>
          Annual heatwave days compared with the centered five-year rolling mean.
        </p>

        {chartData.length === 0 ? (
          <p>No yearly data available for this selection.</p>
        ) : (
          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12 }}
                  minTickGap={25}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "Heatwave days",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 12 },
                  }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="heatwaveDays"
                  name="Annual heatwave days"
                  stroke="#ea580c"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="rollingMean"
                  name="5-year rolling mean"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.heading}>🌡️ Detected Heatwave Events</h2>
        <p style={styles.muted}>
          Each event represents at least three consecutive days above the
          seasonal temperature threshold.
        </p>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Start</th>
                <th style={styles.th}>End</th>
                <th style={styles.th}>Duration</th>
                <th style={styles.th}>Peak (°C)</th>
                <th style={styles.th}>Intensity (°C)</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={`${event.start}-${index}`}>
                  <td style={styles.td}>{formatDate(event.start)}</td>
                  <td style={styles.td}>{formatDate(event.end)}</td>
                  <td style={styles.td}>{event.duration} days</td>
                  <td style={styles.td}>
                    {Number(event.peak_temp).toFixed(1)}
                  </td>
                  <td style={styles.td}>
                    {Number(event.intensity).toFixed(2)}
                  </td>
                </tr>
              ))}

              {events.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={5}>
                    No detected events in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const styles = {
  stack: { display: "grid", gap: 20, minWidth: 0 },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
    minWidth: 0,
  },
  heading: { fontSize: 19, margin: "0 0 8px" },
  muted: { fontSize: 13, color: "#6b7280", lineHeight: 1.6 },
  tableWrap: { width: "100%", overflowX: "auto", marginTop: 12 },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    textAlign: "left",
  },
  th: {
    padding: "12px 10px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #f3f4f6",
    whiteSpace: "nowrap",
  },
};
