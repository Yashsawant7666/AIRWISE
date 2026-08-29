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

function FareTrend({ data }) {

  if (!data || data.length === 0) {

    return (
      <div className="fare-trend-empty">
        No fare trend data available.
      </div>
    );

  }

  const chartData = data.map(
    (item, index) => ({

      observation:
        item.id || index + 1,

      current:
        Number(
          item.current_fare || 0
        ),

      expected:
        Number(
          item.expected_fare || 0
        ),

    })
  );


  return (

    <div className="fare-trend-chart">

      <ResponsiveContainer
        width="100%"
        height={360}
      >

        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 20,
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="observation"
            label={{
              value: "Observation",
              position: "insideBottom",
              offset: -10,
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
              `₹${Number(
                value
              ).toLocaleString("en-IN")}`
            }
          />

          <Legend />

          <Line
            type="monotone"
            dataKey="current"
            name="Current Fare"
            strokeWidth={3}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="expected"
            name="Expected Fare"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );
}

export default FareTrend;