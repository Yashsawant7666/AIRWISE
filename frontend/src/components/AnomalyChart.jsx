import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function AnomalyChart({ data }) {

  if (!data || data.length === 0) {
    return (
      <div className="anomaly-empty">
        No unusual fares detected.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    id: item.id,
    route: `${item.origin} → ${item.destination}`,
    score: Number(item.anomaly_score || 0),
    status: item.anomaly_status,
  }));

  return (
    <div className="anomaly-chart">

      <ResponsiveContainer
        width="100%"
        height={360}
      >

        <BarChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 30,
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="id"
            label={{
              value: "Fare Observation",
              position: "insideBottom",
              offset: -18,
            }}
          />

          <YAxis
            label={{
              value: "Anomaly Score",
              angle: -90,
              position: "insideLeft",
            }}
          />

          <Tooltip
            formatter={(value) =>
              Number(value).toFixed(2)
            }
            labelFormatter={(value) =>
              `Observation #${value}`
            }
          />

          <Bar
            dataKey="score"
            name="Anomaly Score"
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}

export default AnomalyChart;