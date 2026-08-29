import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function FareChart({ data }) {

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        No fare data available.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    id: item.id,
    fare: item.current_fare,
    expected: item.expected_fare,
  }));

  return (
    <div className="chart-container">

      <ResponsiveContainer
        width="100%"
        height={350}
      >

        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="id"
            label={{
              value: "Fare Observation",
              position: "insideBottom",
              offset: -5,
            }}
          />

          <YAxis
            label={{
              value: "Fare (₹)",
              angle: -90,
              position: "insideLeft",
            }}
          />

          <Tooltip
            formatter={(value) =>
              `₹${Number(value).toLocaleString()}`
            }
          />

          <Legend />

          <Line
            type="monotone"
            dataKey="fare"
            name="Current Fare"
            strokeWidth={3}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="expected"
            name="Expected Fare"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}

export default FareChart;