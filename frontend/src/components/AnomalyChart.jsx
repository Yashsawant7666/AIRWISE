import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";


function AnomalyChart({
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
          ✓
        </div>

        <h3>
          No anomaly signals
        </h3>

        <p>
          AIRWISE has not detected unusual fare
          observations for the current dataset.
        </p>

      </div>
    );

  }


  return (

    <div
      style={{
        width: "100%",
        minHeight: "300px",
      }}
    >

      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <BarChart
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
            dataKey="origin"
            tick={{
              fill: "#7188a4",
              fontSize: 8,
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
              fontSize: 8,
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
              fontSize: "9px",
              fontWeight: 800,
            }}

            itemStyle={{
              color: "#dbeafe",
              fontSize: "9px",
            }}
          />


          <Bar
            dataKey="anomaly_score"
            name="Anomaly Score"
            fill="#3b82f6"
            radius={[
              5,
              5,
              0,
              0,
            ]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}


export default AnomalyChart;