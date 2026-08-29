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


function FareTrend({
  data = [],
}) {

  const chartData =
    Array.isArray(data)
      ? data
      : [];


  if (chartData.length === 0) {

    return (
      <div className="chart-empty-state">

        <div className="chart-empty-icon">
          ↗
        </div>

        <h3>
          No fare trend data
        </h3>

        <p>
          AIRWISE needs multiple fare observations
          to display the route trend.
        </p>

      </div>
    );

  }


  return (

    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "300px",
      }}
    >

      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 20,
            left: 5,
            bottom: 10,
          }}
        >

          <CartesianGrid
            stroke="rgba(148,163,184,0.08)"
            strokeDasharray="3 3"
          />


          <XAxis
            dataKey="id"
            tick={{
              fill: "#7188a4",
              fontSize: 9,
            }}
            axisLine={{
              stroke:
                "rgba(148,163,184,0.12)",
            }}
            tickLine={false}
          />


          <YAxis
            tick={{
              fill: "#7188a4",
              fontSize: 9,
            }}
            axisLine={false}
            tickLine={false}
          />


          <Tooltip
            contentStyle={{
              background: "#0d1b2a",
              border:
                "1px solid rgba(148,163,184,0.15)",
              borderRadius: "10px",
              color: "#f8fafc",
              boxShadow:
                "0 12px 30px rgba(0,0,0,0.25)",
            }}

            labelStyle={{
              color: "#67e8f9",
              fontSize: "10px",
              fontWeight: 800,
            }}

            itemStyle={{
              color: "#dbeafe",
              fontSize: "10px",
            }}

            formatter={(value) =>
              `₹${Number(value || 0).toLocaleString(
                "en-IN"
              )}`
            }
          />


          <Legend
            wrapperStyle={{
              fontSize: "9px",
              color: "#8da3bc",
              paddingTop: "10px",
            }}
          />


          <Line
            type="monotone"
            dataKey="current_fare"
            name="Current Fare"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{
              r: 3,
              fill: "#3b82f6",
              stroke: "#07111f",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: "#22d3ee",
            }}
          />


          <Line
            type="monotone"
            dataKey="expected_fare"
            name="Expected Fare"
            stroke="#22d3ee"
            strokeWidth={2}
            strokeDasharray="6 5"
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}


export default FareTrend;