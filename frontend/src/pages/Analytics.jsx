import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import "./Analytics.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://airwise-api.onrender.com";


// ============================================================
// AIRWISE CHART COLORS
// ============================================================

const RECOMMENDATION_COLORS = [
  "#22c55e", // BOOK NOW
  "#f59e0b", // MONITOR
  "#ef4444", // WAIT
];

const AIRWISE_BLUE = "#3b82f6";
const AIRWISE_CYAN = "#22d3ee";


// ============================================================
// COMPONENT
// ============================================================

function Analytics() {

  const [summary, setSummary] =
    useState(null);

  const [fares, setFares] =
    useState([]);

  const [anomalies, setAnomalies] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {

    loadAnalytics();

  }, []);


  const loadAnalytics =
    async () => {

      try {

        setLoading(true);

        setError("");


        const [
          summaryResponse,
          faresResponse,
          anomalyResponse,
        ] = await Promise.all([

          fetch(
            `${API_URL}/summary`
          ),

          fetch(
            `${API_URL}/fares`
          ),

          fetch(
            `${API_URL}/anomalies`
          ),

        ]);


        if (
          !summaryResponse.ok
        ) {

          throw new Error(
            `Summary API returned ${summaryResponse.status}`
          );

        }


        if (
          !faresResponse.ok
        ) {

          throw new Error(
            `Fares API returned ${faresResponse.status}`
          );

        }


        if (
          !anomalyResponse.ok
        ) {

          throw new Error(
            `Anomaly API returned ${anomalyResponse.status}`
          );

        }


        const summaryData =
          await summaryResponse.json();

        const faresData =
          await faresResponse.json();

        const anomalyData =
          await anomalyResponse.json();


        if (
          summaryData.status !==
          "success"
        ) {

          throw new Error(
            summaryData.message ||
            "Unable to load summary."
          );

        }


        setSummary(
          summaryData
        );


        setFares(
          Array.isArray(
            faresData.fares
          )
            ? faresData.fares
            : []
        );


        setAnomalies(
          Array.isArray(
            anomalyData.data
          )
            ? anomalyData.data
            : []
        );

      } catch (err) {

        console.error(
          "AIRWISE ANALYTICS ERROR:",
          err
        );


        setError(
          err.message ||
          "Unable to load AIRWISE analytics."
        );

      } finally {

        setLoading(false);

      }

    };


  // ==========================================================
  // MONEY FORMAT
  // ==========================================================

  const money =
    (value) => {

      const number =
        Number(value || 0);


      if (
        Number.isNaN(number)
      ) {

        return "₹0";

      }


      return `₹${number.toLocaleString(
        "en-IN"
      )}`;

    };


  // ==========================================================
  // AIRLINE DATA
  // ==========================================================

  const airlineData =
    useMemo(() => {

      const airlineMap = {};


      fares.forEach((fare) => {

        const airline =
          fare.airline ||
          "Unknown";


        if (
          !airlineMap[airline]
        ) {

          airlineMap[airline] = {

            airline,

            count: 0,

            totalFare: 0,

            totalExpected: 0,

          };

        }


        airlineMap[airline].count += 1;


        airlineMap[airline].totalFare +=
          Number(
            fare.current_fare ||
            fare.total_fare ||
            0
          );


        airlineMap[airline].totalExpected +=
          Number(
            fare.expected_fare ||
            0
          );

      });


      return Object.values(
        airlineMap
      )

        .map((item) => ({

          airline:
            item.airline,

          averageFare:
            item.count
              ? Math.round(
                  item.totalFare /
                  item.count
                )
              : 0,

          averageExpected:
            item.count
              ? Math.round(
                  item.totalExpected /
                  item.count
                )
              : 0,

          count:
            item.count,

        }))

        .sort(
          (a, b) =>
            a.averageFare -
            b.averageFare
        );

    }, [fares]);


  // ==========================================================
  // MARKET METRICS
  // ==========================================================

  const averageFare =
    fares.length > 0

      ? fares.reduce(
          (
            sum,
            fare
          ) =>
            sum +
            Number(
              fare.current_fare ||
              fare.total_fare ||
              0
            ),
          0
        ) /
        fares.length

      : 0;


  const averageExpected =
    fares.length > 0

      ? fares.reduce(
          (
            sum,
            fare
          ) =>
            sum +
            Number(
              fare.expected_fare ||
              0
            ),
          0
        ) /
        fares.length

      : 0;


  const averageDifference =
    averageExpected === 0
      ? 0
      : (
          (
            averageFare -
            averageExpected
          ) /
          averageExpected
        ) * 100;


  const anomalyRate =
    fares.length === 0
      ? 0
      : (
          Number(
            summary?.unusual_fares ||
            0
          ) /
          fares.length
        ) * 100;


  const cheapestAirline =
    airlineData.length > 0
      ? airlineData[0]
      : null;


  // ==========================================================
  // RECOMMENDATION DATA
  // ==========================================================

  const recommendationData = [

    {
      name: "BOOK NOW",

      value:
        Number(
          summary?.book_now ||
          0
        ),

    },

    {
      name: "MONITOR",

      value:
        Number(
          summary?.monitor ||
          0
        ),

    },

    {
      name: "WAIT",

      value:
        Number(
          summary?.wait ||
          0
        ),

    },

  ];


  // ==========================================================
  // ANOMALY DATA
  // ==========================================================

  const anomalyData = [

    {
      name: "NORMAL",

      value:
        Number(
          summary?.normal_fares ||
          0
        ),

    },

    {
      name: "LOW",

      value:
        Number(
          summary?.low_anomalies ||
          0
        ),

    },

    {
      name: "MEDIUM",

      value:
        Number(
          summary?.medium_anomalies ||
          0
        ),

    },

    {
      name: "HIGH",

      value:
        Number(
          summary?.high_anomalies ||
          0
        ),

    },

  ];


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {

    return (

      <div className="analytics-page">

        <main className="analytics-main">

          <div className="analytics-loading">

            <div className="analytics-spinner"></div>


            <span>
              AIRWISE INTELLIGENCE
            </span>


            <h2>
              Loading Analytics...
            </h2>


            <p>
              Fetching airfare data and
              statistical signals.
            </p>

          </div>

        </main>

      </div>

    );

  }


  // ==========================================================
  // ERROR SCREEN
  // ==========================================================

  if (error) {

    return (

      <div className="analytics-page">

        <main className="analytics-main">

          <div className="analytics-error">

            <div className="analytics-error-icon">
              !
            </div>


            <span>
              AIRWISE INTELLIGENCE
            </span>


            <h2>
              Analytics Unavailable
            </h2>


            <p>
              {error}
            </p>


            <button
              onClick={loadAnalytics}
            >
              Try Again
            </button>

          </div>

        </main>

      </div>

    );

  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="analytics-page">

      <main className="analytics-main">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <section className="analytics-header">

          <div>

            <div className="analytics-eyebrow">
              AIRWISE MARKET INTELLIGENCE
            </div>


            <h1>
              Analytics Dashboard
            </h1>


            <p>
              Understand airfare behavior,
              anomaly patterns, airline pricing
              and AIRWISE booking recommendations.
            </p>

          </div>


          <div className="analytics-status">
            ● DATA ENGINE ONLINE
          </div>

        </section>


        {/* ====================================================
            KPI GRID
        ==================================================== */}

        <section className="analytics-kpi-grid">


          <div className="kpi-card featured">

            <span>
              TOTAL OBSERVATIONS
            </span>


            <strong>
              {summary?.total_fares || 0}
            </strong>


            <p>
              Fare records analyzed
            </p>

          </div>


          <div className="kpi-card">

            <span>
              AVERAGE FARE
            </span>


            <strong>
              {money(
                averageFare
              )}
            </strong>


            <p>
              Current observed average
            </p>

          </div>


          <div className="kpi-card">

            <span>
              VS EXPECTED
            </span>


            <strong
              className={
                averageDifference <= 0
                  ? "good-value"
                  : "bad-value"
              }
            >

              {averageDifference >= 0
                ? "+"
                : ""}

              {averageDifference.toFixed(2)}
              %

            </strong>


            <p>
              Average fare difference
            </p>

          </div>


          <div className="kpi-card">

            <span>
              ANOMALY RATE
            </span>


            <strong>
              {anomalyRate.toFixed(1)}%
            </strong>


            <p>
              Unusual observations
            </p>

          </div>


          <div className="kpi-card">

            <span>
              BOOK NOW
            </span>


            <strong className="book-value">
              {summary?.book_now || 0}
            </strong>


            <p>
              Booking opportunities
            </p>

          </div>


          <div className="kpi-card">

            <span>
              MONITOR
            </span>


            <strong className="monitor-value">
              {summary?.monitor || 0}
            </strong>


            <p>
              Watch signals
            </p>

          </div>


          <div className="kpi-card">

            <span>
              WAIT
            </span>


            <strong className="wait-value">
              {summary?.wait || 0}
            </strong>


            <p>
              Wait signals
            </p>

          </div>


          <div className="kpi-card">

            <span>
              AIRLINES
            </span>


            <strong>
              {airlineData.length}
            </strong>


            <p>
              Airlines represented
            </p>

          </div>

        </section>


        {/* ====================================================
            MARKET INSIGHT
        ==================================================== */}

        <section className="analytics-insight-banner">

          <div>

            <span>
              MARKET INSIGHT
            </span>


            <h2>

              {cheapestAirline

                ? `${cheapestAirline.airline} currently has the lowest average observed fare.`

                : "AIRWISE is building the market picture."}

            </h2>


            <p>
              AIRWISE combines observed fares,
              expected pricing, anomaly detection
              and decision signals to create a
              structured airfare intelligence layer.
            </p>

          </div>


          <div className="insight-number">

            <span>
              LOWEST AVG
            </span>


            <strong>

              {cheapestAirline

                ? money(
                    cheapestAirline.averageFare
                  )

                : "—"}

            </strong>

          </div>

        </section>


        {/* ====================================================
            CHART GRID
        ==================================================== */}

        <section className="chart-grid">


          {/* ==================================================
              RECOMMENDATIONS
          ================================================== */}

          <div className="chart-card">

            <div className="chart-header">

              <div>

                <span>
                  DECISION ENGINE
                </span>


                <h2>
                  Booking Signals
                </h2>

              </div>


              <span className="chart-badge">
                3 STATES
              </span>

            </div>


            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <PieChart>

                <Pie
                  data={
                    recommendationData
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                  innerRadius={62}
                  paddingAngle={4}
                  label
                  stroke="none"
                >

                  {recommendationData.map(
                    (item, index) => (

                      <Cell
                        key={
                          `recommendation-${item.name}-${index}`
                        }
                        fill={
                          RECOMMENDATION_COLORS[
                            index
                          ]
                        }
                        stroke="none"
                      />

                    )
                  )}

                </Pie>


                <Tooltip
                  contentStyle={{
                    background:
                      "#0d1b2a",

                    border:
                      "1px solid rgba(148,163,184,0.14)",

                    borderRadius:
                      "10px",

                    color:
                      "#f8fafc",

                    boxShadow:
                      "0 12px 30px rgba(0,0,0,0.25)",
                  }}

                  labelStyle={{
                    color:
                      "#67e8f9",

                    fontSize:
                      "9px",

                    fontWeight:
                      800,
                  }}

                  itemStyle={{
                    color:
                      "#dbeafe",

                    fontSize:
                      "9px",
                  }}
                />


                <Legend
                  wrapperStyle={{
                    fontSize: "9px",

                    color: "#8ea3bb",

                    paddingTop: "8px",
                  }}
                />

              </PieChart>

            </ResponsiveContainer>

          </div>


          {/* ==================================================
              ANOMALIES
          ================================================== */}

          <div className="chart-card">

            <div className="chart-header">

              <div>

                <span>
                  MACHINE LEARNING
                </span>


                <h2>
                  Anomaly Distribution
                </h2>

              </div>


              <span className="chart-badge">
                OUTLIERS
              </span>

            </div>


            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <BarChart
                data={anomalyData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  stroke="rgba(148,163,184,0.08)"
                  strokeDasharray="3 3"
                  vertical={false}
                />


                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#7188a4",
                    fontSize: 9,
                  }}
                  axisLine={{
                    stroke:
                      "rgba(148,163,184,0.10)",
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
                    background:
                      "#0d1b2a",

                    border:
                      "1px solid rgba(148,163,184,0.14)",

                    borderRadius:
                      "10px",

                    color:
                      "#f8fafc",
                  }}

                  labelStyle={{
                    color:
                      "#67e8f9",

                    fontSize:
                      "9px",

                    fontWeight:
                      800,
                  }}

                  itemStyle={{
                    color:
                      "#dbeafe",

                    fontSize:
                      "9px",
                  }}
                />


                <Legend
                  wrapperStyle={{
                    fontSize: "9px",

                    color: "#8ea3bb",
                  }}
                />


                <Bar
                  dataKey="value"
                  name="Fare Count"
                  fill={AIRWISE_BLUE}
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>


        {/* ====================================================
            AIRLINE ANALYTICS
        ==================================================== */}

        <section className="airline-section">

          <div className="chart-header">

            <div>

              <span>
                AIRLINE ANALYTICS
              </span>


              <h2>
                Current vs Expected Fare
              </h2>

            </div>


            <span className="chart-badge">
              MARKET COMPARISON
            </span>

          </div>


          <div className="airline-chart">

            {airlineData.length === 0 ? (

              <div className="analytics-chart-empty">

                <strong>
                  No airline data available
                </strong>


                <p>
                  AIRWISE needs fare observations
                  to build the airline comparison.
                </p>

              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height={360}
              >

                <BarChart
                  data={airlineData}
                  margin={{
                    top: 10,
                    right: 15,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    stroke="rgba(148,163,184,0.08)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />


                  <XAxis
                    dataKey="airline"
                    tick={{
                      fill: "#7188a4",
                      fontSize: 9,
                    }}
                    axisLine={{
                      stroke:
                        "rgba(148,163,184,0.10)",
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
                      background:
                        "#0d1b2a",

                      border:
                        "1px solid rgba(148,163,184,0.14)",

                      borderRadius:
                        "10px",

                      color:
                        "#f8fafc",
                    }}

                    labelStyle={{
                      color:
                        "#67e8f9",

                      fontSize:
                        "9px",

                      fontWeight:
                        800,
                    }}

                    itemStyle={{
                      fontSize:
                        "9px",
                    }}

                    formatter={(value) =>
                      money(value)
                    }
                  />


                  <Legend
                    wrapperStyle={{
                      fontSize: "9px",

                      color: "#8ea3bb",
                    }}
                  />


                  <Bar
                    dataKey="averageFare"
                    name="Average Current Fare"
                    fill={AIRWISE_BLUE}
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />


                  <Bar
                    dataKey="averageExpected"
                    name="Average Expected Fare"
                    fill={AIRWISE_CYAN}
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            )}

          </div>

        </section>


        {/* ====================================================
            ANOMALY TABLE
        ==================================================== */}

        <section className="unusual-section">

          <div className="chart-header">

            <div>

              <span>
                ANOMALY MONITOR
              </span>


              <h2>
                Detected Unusual Fares
              </h2>

            </div>


            <span className="chart-badge">
              {anomalies.length} SIGNALS
            </span>

          </div>


          {anomalies.length === 0 ? (

            <div className="empty-anomalies">

              <strong>
                No unusual fares detected.
              </strong>


              <p>
                AIRWISE currently considers
                the analyzed observations
                within the normal range.
              </p>

            </div>

          ) : (

            <div className="anomaly-table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      ROUTE
                    </th>

                    <th>
                      AIRLINE
                    </th>

                    <th>
                      CURRENT
                    </th>

                    <th>
                      EXPECTED
                    </th>

                    <th>
                      DIFFERENCE
                    </th>

                    <th>
                      SCORE
                    </th>

                    <th>
                      STATUS
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {anomalies.map(
                    (item) => (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>

                          <strong>

                            {item.origin}

                            {" → "}

                            {item.destination}

                          </strong>

                        </td>


                        <td>

                          {item.airline}

                        </td>


                        <td>

                          {money(
                            item.current_fare
                          )}

                        </td>


                        <td>

                          {money(
                            item.expected_fare
                          )}

                        </td>


                        <td
                          className={
                            Number(
                              item.fare_difference_percent ||
                              0
                            ) <= 0
                              ? "good-value"
                              : "bad-value"
                          }
                        >

                          {Number(
                            item.fare_difference_percent ||
                            0
                          ) > 0
                            ? "+"
                            : ""}

                          {Number(
                            item.fare_difference_percent ||
                            0
                          ).toFixed(2)}

                          %

                        </td>


                        <td>

                          {Number(
                            item.anomaly_score ||
                            0
                          ).toFixed(2)}

                        </td>


                        <td>

                          <span
                            className={
                              `anomaly-status ${
                                String(
                                  item.anomaly_status ||
                                  "normal"
                                ).toLowerCase()
                              }`
                            }
                          >

                            {item.anomaly_status ||
                              "NORMAL"}

                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ====================================================
            FOOTER NOTE
        ==================================================== */}

        <div className="analytics-note">

          AIRWISE analytics are calculated from
          available airfare observations, statistical
          baselines and model outputs for analytical
          decision support.

        </div>

      </main>

    </div>

  );

}


export default Analytics;