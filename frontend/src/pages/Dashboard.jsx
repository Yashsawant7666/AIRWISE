import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import "./Dashboard.css";


const API_URL = "https://airwise-api.onrender.com";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [fares, setFares] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryResponse, faresResponse] =
        await Promise.all([
          fetch(`${API_URL}/summary`),
          fetch(`${API_URL}/fares`),
        ]);

      if (!summaryResponse.ok) {
        throw new Error("Failed to load summary.");
      }

      if (!faresResponse.ok) {
        throw new Error("Failed to load fares.");
      }

      const summaryData =
        await summaryResponse.json();

      const faresData =
        await faresResponse.json();

      if (summaryData.status !== "success") {
        throw new Error(
          summaryData.message ||
            "Summary API error."
        );
      }

      setSummary(summaryData);
      setFares(faresData.fares || []);

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to connect to AIRWISE API."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // ROUTE INTELLIGENCE
  // ==========================================================

  const routeData = useMemo(() => {
    const routeMap = {};

    fares.forEach((fare) => {
      const key =
        `${fare.origin}-${fare.destination}`;

      if (!routeMap[key]) {
        routeMap[key] = {
          origin: fare.origin,
          destination: fare.destination,
          fares: [],
        };
      }

      routeMap[key].fares.push(fare);
    });

    return Object.values(routeMap)
      .map((route) => {

        const sorted = [
          ...route.fares,
        ].sort(
          (a, b) =>
            Number(
              a.current_fare ||
                a.total_fare ||
                0
            ) -
            Number(
              b.current_fare ||
                b.total_fare ||
                0
            )
        );

        const cheapest = sorted[0];

        return {
          ...route,
          cheapest,
        };
      })
      .sort(
        (a, b) =>
          Number(
            a.cheapest.current_fare ||
              a.cheapest.total_fare ||
              0
          ) -
          Number(
            b.cheapest.current_fare ||
              b.cheapest.total_fare ||
              0
          )
      );
  }, [fares]);


  // ==========================================================
  // BOOKING OPPORTUNITIES
  // ==========================================================

  const opportunities = useMemo(() => {

    return fares
      .filter(
        (fare) =>
          fare.recommendation === "BOOK NOW"
      )
      .sort(
        (a, b) =>
          Number(
            a.fare_difference_percent || 0
          ) -
          Number(
            b.fare_difference_percent || 0
          )
      )
      .slice(0, 5);

  }, [fares]);


  // ==========================================================
  // BEST SIGNAL
  // ==========================================================

  const bestOpportunity =
    opportunities.length > 0
      ? opportunities[0]
      : null;


  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const money = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };


  // ==========================================================
  // SEARCH URL
  // ==========================================================

  const searchUrl =
    `/search?origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(
      destination
    )}`;


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="dashboard-page">

      <main className="dashboard-main">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="airwise-hero">

          <div className="hero-content">

            <div className="hero-eyebrow">
              AI-POWERED AIRFARE INTELLIGENCE
            </div>

            <h1>
              Know the price.
              <br />
              Know the right time.
            </h1>

            <p>
              AIRWISE analyzes airfare patterns,
              detects unusual prices and recommends
              when to book.
            </p>


            <div className="hero-actions">

              <Link
                to="/search"
                className="hero-button primary"
              >
                Analyze Fare →
              </Link>

              <Link
                to="/analytics"
                className="hero-button secondary"
              >
                View Analytics
              </Link>

            </div>

          </div>


          <div className="hero-route">

            <div className="hero-airport">
              <strong>
                DEL
              </strong>

              <span>
                Delhi
              </span>
            </div>


            <div className="flight-path">

              <div className="path-line"></div>

              <div className="flight-icon">
                ✈
              </div>

            </div>


            <div className="hero-airport">
              <strong>
                BOM
              </strong>

              <span>
                Mumbai
              </span>
            </div>

          </div>

        </section>


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}


        {/* =====================================================
            KPI STRIP
        ===================================================== */}

        <section className="kpi-strip">

          <div className="kpi-item">

            <span>
              TOTAL FARES
            </span>

            <strong>
              {loading
                ? "..."
                : summary?.total_fares ?? 0}
            </strong>

            <small>
              observations
            </small>

          </div>


          <div className="kpi-item">

            <span>
              BOOK NOW
            </span>

            <strong className="kpi-green">
              {loading
                ? "..."
                : summary?.book_now ?? 0}
            </strong>

            <small>
              opportunities
            </small>

          </div>


          <div className="kpi-item">

            <span>
              MONITOR
            </span>

            <strong className="kpi-yellow">
              {loading
                ? "..."
                : summary?.monitor ?? 0}
            </strong>

            <small>
              watch signals
            </small>

          </div>


          <div className="kpi-item">

            <span>
              ANOMALIES
            </span>

            <strong className="kpi-red">
              {loading
                ? "..."
                : summary?.unusual_fares ?? 0}
            </strong>

            <small>
              detected
            </small>

          </div>

        </section>


        {/* =====================================================
            QUICK SEARCH
        ===================================================== */}

        <section className="search-panel">

          <div className="search-panel-heading">

            <div>

              <span>
                ROUTE ANALYZER
              </span>

              <h2>
                Analyze an airfare
              </h2>

            </div>

            <span className="live-badge">
              ● LIVE DATA
            </span>

          </div>


          <div className="route-form">

            <div className="airport-input">

              <label>
                FROM
              </label>

              <input
                value={origin}
                maxLength={3}
                onChange={(e) =>
                  setOrigin(
                    e.target.value.toUpperCase()
                  )
                }
              />

            </div>


            <div className="form-arrow">
              ━ ✈ ━
            </div>


            <div className="airport-input">

              <label>
                TO
              </label>

              <input
                value={destination}
                maxLength={3}
                onChange={(e) =>
                  setDestination(
                    e.target.value.toUpperCase()
                  )
                }
              />

            </div>


            <Link
              to={searchUrl}
              className="analyze-button"
            >
              Analyze Fare
            </Link>

          </div>

        </section>


        {/* =====================================================
            MAIN INTELLIGENCE GRID
        ===================================================== */}

        <section className="intelligence-dashboard-grid">


          {/* ROUTE INTELLIGENCE */}

          <div className="route-intelligence-panel">

            <div className="panel-heading">

              <div>

                <span>
                  ROUTE INTELLIGENCE
                </span>

                <h2>
                  Best Available Routes
                </h2>

              </div>

              <Link to="/compare">
                Compare →
              </Link>

            </div>


            <div className="route-card-grid">

              {routeData
                .slice(0, 6)
                .map((route) => (

                  <div
                    className="air-route-card"
                    key={`${route.origin}-${route.destination}`}
                  >

                    <div className="route-top">

                      <div>

                        <span>
                          ROUTE
                        </span>

                        <h3>
                          {route.origin}
                          {" → "}
                          {route.destination}
                        </h3>

                      </div>


                      <div className="route-fare-count">
                        {route.fares.length}
                      </div>

                    </div>


                    <div className="route-main-price">

                      <span>
                        LOWEST FARE
                      </span>

                      <strong>
                        {money(
                          route.cheapest
                            .current_fare ||
                            route.cheapest
                              .total_fare
                        )}
                      </strong>

                    </div>


                    <div className="route-info-row">

                      <div>

                        <span>
                          EXPECTED
                        </span>

                        <strong>
                          {money(
                            route.cheapest
                              .expected_fare
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          AIRLINE
                        </span>

                        <strong>
                          {route.cheapest.airline}
                        </strong>

                      </div>

                    </div>


                    <div className="route-action-row">

                      <span
                        className={
                          route.cheapest
                            .recommendation ===
                          "BOOK NOW"
                            ? "decision book"
                            : route.cheapest
                                .recommendation ===
                              "WAIT"
                            ? "decision wait"
                            : "decision monitor"
                        }
                      >

                        {route.cheapest
                          .recommendation ||
                          "MONITOR"}

                      </span>


                      <Link
                        to={`/search?origin=${route.origin}&destination=${route.destination}`}
                      >
                        View →
                      </Link>

                    </div>

                  </div>

                ))}

            </div>

          </div>


          {/* AI SIGNAL */}

          <div className="ai-signal-panel">

            <div className="panel-heading">

              <div>

                <span>
                  AIRWISE AI
                </span>

                <h2>
                  Smart Signal
                </h2>

              </div>

              <div className="ai-badge">
                AI
              </div>

            </div>


            {bestOpportunity ? (

              <>

                <div className="ai-score-ring">

                  <div>

                    <strong>
                      {Math.max(
                        0,
                        Math.min(
                          99,
                          Math.round(
                            Math.abs(
                              Number(
                                bestOpportunity
                                  .fare_difference_percent ||
                                  0
                              )
                            ) * 10
                          )
                        )
                      )}
                    </strong>

                    <span>
                      SIGNAL
                    </span>

                  </div>

                </div>


                <div className="ai-signal-decision">

                  <span>
                    RECOMMENDED ACTION
                  </span>

                  <h3>
                    BOOK NOW
                  </h3>

                  <p>

                    {bestOpportunity.origin}
                    {" → "}
                    {bestOpportunity.destination}

                    {" · "}

                    {bestOpportunity.airline}

                  </p>

                </div>


                <div className="ai-signal-price">

                  <div>

                    <span>
                      CURRENT
                    </span>

                    <strong>
                      {money(
                        bestOpportunity
                          .current_fare
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      EXPECTED
                    </span>

                    <strong>
                      {money(
                        bestOpportunity
                          .expected_fare
                      )}
                    </strong>

                  </div>

                </div>


                <Link
                  to={`/fare/${bestOpportunity.id}`}
                  className="ai-analysis-button"
                >
                  View AI Analysis →
                </Link>

              </>

            ) : (

              <div className="no-signal">

                <strong>
                  No current booking signal
                </strong>

                <p>
                  AIRWISE will display the strongest
                  booking opportunity here.
                </p>

              </div>

            )}

          </div>

        </section>


        {/* =====================================================
            BOOKING OPPORTUNITIES
        ===================================================== */}

        <section className="opportunity-panel">

          <div className="panel-heading">

            <div>

              <span>
                AI OPPORTUNITIES
              </span>

              <h2>
                Booking Opportunities
              </h2>

            </div>


            <Link to="/analytics">
              View All →
            </Link>

          </div>


          <div className="opportunity-list">

            {opportunities.map(
              (fare) => (

                <div
                  className="opportunity-row"
                  key={fare.id}
                >

                  <div className="opportunity-route">

                    <strong>
                      {fare.origin}
                      {" → "}
                      {fare.destination}
                    </strong>

                    <span>
                      {fare.airline}
                    </span>

                  </div>


                  <div>

                    <span>
                      CURRENT
                    </span>

                    <strong>
                      {money(
                        fare.current_fare
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      EXPECTED
                    </span>

                    <strong>
                      {money(
                        fare.expected_fare
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      DIFFERENCE
                    </span>

                    <strong className="saving">
                      {Number(
                        fare.fare_difference_percent ||
                          0
                      ).toFixed(2)}
                      %
                    </strong>

                  </div>


                  <Link
                    to={`/fare/${fare.id}`}
                  >
                    Analyze →
                  </Link>

                </div>

              )
            )}

          </div>

        </section>


        {/* =====================================================
            ML PIPELINE
        ===================================================== */}

        <section className="pipeline-panel">

          <div className="panel-heading">

            <div>

              <span>
                AIRWISE ENGINE
              </span>

              <h2>
                From Fare Data to Decision
              </h2>

            </div>

          </div>


          <div className="modern-pipeline">

            <div className="modern-step">

              <div>
                01
              </div>

              <strong>
                Data
              </strong>

              <span>
                Fare observations
              </span>

            </div>


            <div className="modern-line"></div>


            <div className="modern-step">

              <div>
                02
              </div>

              <strong>
                Baseline
              </strong>

              <span>
                Expected fare
              </span>

            </div>


            <div className="modern-line"></div>


            <div className="modern-step">

              <div>
                03
              </div>

              <strong>
                Detect
              </strong>

              <span>
                Anomaly score
              </span>

            </div>


            <div className="modern-line"></div>


            <div className="modern-step">

              <div>
                04
              </div>

              <strong>
                Decide
              </strong>

              <span>
                BOOK / MONITOR / WAIT
              </span>

            </div>

          </div>

        </section>

      </main>


      <footer className="dashboard-footer">

        <div>
          AIRWISE
        </div>

        <span>
          AI-powered airfare intelligence
        </span>

      </footer>

    </div>
  );
}

export default Dashboard;