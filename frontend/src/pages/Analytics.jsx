import { useEffect, useState } from "react";

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

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [fares, setFares] = useState([]);
  const [anomalies, setAnomalies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    loadAnalytics();
  }, []);


  const loadAnalytics = async () => {

    try {

      setLoading(true);
      setError("");


      const [
        summaryResponse,
        faresResponse,
        anomalyResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/summary`),
        fetch(`${API_URL}/fares`),
        fetch(`${API_URL}/anomalies`),
      ]);


      const summaryData =
        await summaryResponse.json();

      const faresData =
        await faresResponse.json();

      const anomalyData =
        await anomalyResponse.json();


      if (
        !summaryResponse.ok ||
        summaryData.status !== "success"
      ) {
        throw new Error(
          "Unable to load analytics."
        );
      }


      setSummary(summaryData);

      setFares(
        faresData.fares || []
      );

      setAnomalies(
        anomalyData.data || []
      );


    } catch (err) {

      console.error(err);

      setError(
        "Unable to load AIRWISE analytics."
      );

    } finally {

      setLoading(false);

    }

  };


  const money = (value) => {

    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;

  };


  // ============================================================
  // AIRLINE DATA
  // ============================================================

  const airlineMap = {};


  fares.forEach((fare) => {

    const airline =
      fare.airline || "Unknown";


    if (!airlineMap[airline]) {

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


  const airlineData =
    Object.values(
      airlineMap
    ).map((item) => ({

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

    }));


  // ============================================================
  // RECOMMENDATION DATA
  // ============================================================

  const recommendationData = [

    {
      name: "BOOK NOW",
      value:
        Number(
          summary?.book_now || 0
        ),
    },

    {
      name: "MONITOR",
      value:
        Number(
          summary?.monitor || 0
        ),
    },

    {
      name: "WAIT",
      value:
        Number(
          summary?.wait || 0
        ),
    },

  ];


  // ============================================================
  // ANOMALY DATA
  // ============================================================

  const anomalyData = [

    {
      name: "NORMAL",
      value:
        Number(
          summary?.normal_fares || 0
        ),
    },

    {
      name: "LOW",
      value:
        Number(
          summary?.low_anomalies || 0
        ),
    },

    {
      name: "MEDIUM",
      value:
        Number(
          summary?.medium_anomalies || 0
        ),
    },

    {
      name: "HIGH",
      value:
        Number(
          summary?.high_anomalies || 0
        ),
    },

  ];


  if (loading) {

    return (

      <div className="analytics-page">

        <div className="analytics-loading">

          <div className="analytics-spinner"></div>

          <h2>
            Loading AIRWISE Analytics...
          </h2>

          <p>
            Fetching fare intelligence.
          </p>

        </div>

      </div>

    );

  }


  if (error) {

    return (

      <div className="analytics-page">

        <div className="analytics-error">

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

      </div>

    );

  }


  return (

    <div className="analytics-page">

      <main className="analytics-main">


        {/* HEADER */}

        <section className="analytics-header">

          <span>
            AIRWISE MARKET INTELLIGENCE
          </span>

          <h1>
            Analytics Dashboard
          </h1>

          <p>
            Analyze fare behavior, anomalies
            and booking recommendations.
          </p>

        </section>


        {/* KPI */}

        <section className="analytics-kpi-grid">

          <div className="kpi-card">

            <span>
              TOTAL FARES
            </span>

            <strong>
              {summary?.total_fares || 0}
            </strong>

            <p>
              Observations analyzed
            </p>

          </div>


          <div className="kpi-card">

            <span>
              NORMAL
            </span>

            <strong>
              {summary?.normal_fares || 0}
            </strong>

            <p>
              Normal observations
            </p>

          </div>


          <div className="kpi-card">

            <span>
              UNUSUAL
            </span>

            <strong>
              {summary?.unusual_fares || 0}
            </strong>

            <p>
              Fare anomalies
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
              Fares to monitor
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

        </section>


        {/* CHARTS */}

        <section className="chart-grid">


          <div className="chart-card">

            <div className="chart-header">

              <span>
                DECISION ENGINE
              </span>

              <h2>
                Recommendations
              </h2>

            </div>


            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <PieChart>

                <Pie
                  data={recommendationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >

                  {recommendationData.map(
                    (_, index) => (
                      <Cell
                        key={
                          `recommendation-${index}`
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>


          <div className="chart-card">

            <div className="chart-header">

              <span>
                MACHINE LEARNING
              </span>

              <h2>
                Anomaly Distribution
              </h2>

            </div>


            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <BarChart
                data={anomalyData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="value"
                  name="Fare Count"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>


        {/* AIRLINE */}

        <section className="airline-section">

          <div className="chart-header">

            <span>
              AIRLINE ANALYTICS
            </span>

            <h2>
              Average Fare Comparison
            </h2>

          </div>


          <div className="airline-chart">

            <ResponsiveContainer
              width="100%"
              height={360}
            >

              <BarChart
                data={airlineData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="airline"
                />

                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    money(value)
                  }
                />

                <Legend />

                <Bar
                  dataKey="averageFare"
                  name="Average Current Fare"
                />

                <Bar
                  dataKey="averageExpected"
                  name="Average Expected Fare"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </section>


        {/* ANOMALIES */}

        <section className="unusual-section">

          <div className="chart-header">

            <span>
              ANOMALY MONITOR
            </span>

            <h2>
              Detected Unusual Fares
            </h2>

          </div>


          {anomalies.length === 0 ? (

            <div className="empty-anomalies">

              <strong>
                No unusual fares detected.
              </strong>

              <p>
                AIRWISE currently considers
                the analyzed fares within
                normal range.
              </p>

            </div>

          ) : (

            <div className="anomaly-table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>Route</th>
                    <th>Airline</th>
                    <th>Current</th>
                    <th>Expected</th>
                    <th>Difference</th>
                    <th>Score</th>
                    <th>Status</th>

                  </tr>

                </thead>


                <tbody>

                  {anomalies.map(
                    (item) => (

                      <tr
                        key={item.id}
                      >

                        <td>
                          {item.origin}
                          {" → "}
                          {item.destination}
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

                        <td>
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
                                  item.anomaly_status
                                ).toLowerCase()
                              }`
                            }
                          >
                            {item.anomaly_status}
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

      </main>

    </div>
  );
}

export default Analytics;