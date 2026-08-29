import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import "./Dashboard.css";


/*
  LOCAL TESTING

  Replay data is currently stored in your local PostgreSQL.
  Therefore React must call your local FastAPI server.

  Later, when the replay data is moved to Supabase/Render,
  change this to:

  const API_URL = "https://airwise-api.onrender.com";
*/
const API_URL =
  "https://airwise-api.onrender.com";

function Dashboard() {

  const [summary, setSummary] =
    useState(null);

  const [fares, setFares] =
    useState([]);

  const [indexData, setIndexData] =
    useState(null);

  const [hourlyData, setHourlyData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [origin, setOrigin] =
    useState("DEL");

  const [destination, setDestination] =
    useState("BOM");


  // ==========================================================
  // LOAD EVERYTHING
  // ==========================================================

  useEffect(() => {

    loadDashboard();
    loadHourlyIndex();


    /*
      Refresh frontend every 60 seconds.

      Backend creates hourly snapshots.
      Frontend checks for new values every minute.
    */

    const interval =
      setInterval(() => {

        loadDashboard();
        loadHourlyIndex();

      }, 60000);


    return () => {

      clearInterval(interval);

    };

  }, []);


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  const loadDashboard = async () => {

    try {

      setLoading(true);
      setError("");


      // ------------------------------------------------------
      // SUMMARY
      // ------------------------------------------------------

      const summaryResponse =
        await fetch(
          `${API_URL}/summary`
        );


      if (!summaryResponse.ok) {

        throw new Error(
          `Summary API returned ${summaryResponse.status}`
        );

      }


      // ------------------------------------------------------
      // FARES
      // ------------------------------------------------------

      const faresResponse =
        await fetch(
          `${API_URL}/fares`
        );


      if (!faresResponse.ok) {

        throw new Error(
          `Fares API returned ${faresResponse.status}`
        );

      }


      const summaryData =
        await summaryResponse.json();


      const faresData =
        await faresResponse.json();


      if (
        summaryData.status !==
        "success"
      ) {

        throw new Error(
          summaryData.message ||
          "Summary API error."
        );

      }


      setSummary(
        summaryData
      );


      setFares(
        faresData.fares || []
      );


      // ------------------------------------------------------
      // CURRENT AIRFARE INDEX
      // ------------------------------------------------------

      try {

        const indexResponse =
          await fetch(
            `${API_URL}/index`
          );


        if (
          indexResponse.ok
        ) {

          const indexResult =
            await indexResponse.json();


          if (
            indexResult.status ===
            "success"
          ) {

            setIndexData(
              indexResult
            );

          }

        }

      } catch (indexError) {

        console.warn(
          "AIRWISE INDEX ERROR:",
          indexError
        );

      }

    } catch (err) {

      console.error(
        "DASHBOARD ERROR:",
        err
      );


      setError(
        err.message ||
        "Unable to connect to AIRWISE API."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // LOAD HOURLY INDEX
  // ==========================================================

  const loadHourlyIndex =
    async () => {

      try {

        const response =
          await fetch(
            `${API_URL}/index/hourly`
          );


        if (!response.ok) {

          throw new Error(
            `Hourly API returned ${response.status}`
          );

        }


        const data =
          await response.json();


        console.log(
          "AIRWISE HOURLY INDEX:",
          data
        );


        if (
          data.status ===
          "success"
        ) {

          setHourlyData(
            data
          );

        }

      } catch (err) {

        console.warn(
          "HOURLY INDEX ERROR:",
          err
        );

      }

    };


  // ==========================================================
  // ROUTE INTELLIGENCE
  // ==========================================================

  const routeData =
    useMemo(() => {

      const routeMap = {};


      fares.forEach((fare) => {

        const key =
          `${fare.origin}-${fare.destination}`;


        if (!routeMap[key]) {

          routeMap[key] = {

            origin:
              fare.origin,

            destination:
              fare.destination,

            fares: [],

          };

        }


        routeMap[key].fares.push(
          fare
        );

      });


      return Object.values(
        routeMap
      )

        .map((route) => {

          const sorted =
            [...route.fares].sort(
              (a, b) =>
                Number(
                  a.current_fare ||
                  a.total_fare ||
                  0
                )
                -
                Number(
                  b.current_fare ||
                  b.total_fare ||
                  0
                )
            );


          return {

            ...route,

            cheapest:
              sorted[0],

          };

        })

        .filter(
          (route) =>
            route.cheapest
        )

        .sort(
          (a, b) =>
            Number(
              a.cheapest.current_fare ||
              a.cheapest.total_fare ||
              0
            )
            -
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

  const opportunities =
    useMemo(() => {

      return fares

        .filter(
          (fare) =>
            fare.recommendation ===
            "BOOK NOW"
        )

        .sort(
          (a, b) =>
            Number(
              a.fare_difference_percent ||
              0
            )
            -
            Number(
              b.fare_difference_percent ||
              0
            )
        )

        .slice(0, 5);

    }, [fares]);


  // ==========================================================
  // BEST OPPORTUNITY
  // ==========================================================

  const bestOpportunity =
    opportunities.length > 0
      ? opportunities[0]
      : null;


  // ==========================================================
  // MONEY
  // ==========================================================

  const money =
    (value) => {

      const number =
        Number(value || 0);


      return `₹${number.toLocaleString(
        "en-IN"
      )}`;

    };


  // ==========================================================
  // INDEX VALUES
  // ==========================================================

  const currentIndex =
    Number(
      hourlyData?.current_index ??
      indexData?.current_index ??
      100
    );


  const indexPressure =
    hourlyData?.price_pressure ||
    indexData?.price_pressure ||
    "STABLE";


  const last1Hour =
    hourlyData?.changes?.last_1_hour;


  const last2Hours =
    hourlyData?.changes?.last_2_hours;


  const last6Hours =
    hourlyData?.changes?.last_6_hours;


  const last24Hours =
    hourlyData?.changes?.last_24_hours;


  const lastUpdated =
    hourlyData?.last_updated;


  // ==========================================================
  // FORMAT HOURLY CHANGE
  // ==========================================================

  const formatHourlyChange =
    (value) => {

      if (
        value === null ||
        value === undefined
      ) {

        return "--";

      }


      const number =
        Number(value);


      if (
        Number.isNaN(number)
      ) {

        return "--";

      }


      return `${
        number >= 0
          ? "+"
          : ""
      }${number.toFixed(2)}%`;

    };


  // ==========================================================
  // HOURLY CLASS
  // ==========================================================

  const getHourlyClass =
    (value) => {

      if (
        value === null ||
        value === undefined
      ) {

        return "neutral";

      }


      return Number(value) >= 0
        ? "cpi-positive"
        : "cpi-negative";

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

              AIRWISE analyzes airfare
              patterns, detects unusual
              prices and recommends
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
            CPI AUGMENTATION
        ===================================================== */}

        <section className="cpi-dashboard-card">

          <div className="cpi-card-glow"></div>


          <div className="cpi-dashboard-content">

            <div className="cpi-top-line">

              <span className="cpi-dashboard-label">
                CPI AUGMENTATION
              </span>


              <span className="cpi-signal-badge">
                HIGH-FREQUENCY SIGNAL
              </span>

            </div>


            <h2>
              AIRWISE Airfare Price Index
            </h2>


            <p>

              Monitor domestic airfare movement
              as a high-frequency analytical signal
              alongside official Consumer Price Index
              data.

            </p>


            <div className="cpi-dashboard-stats">


              {/* CURRENT INDEX */}

              <div className="cpi-mini-card">

                <span>
                  CURRENT INDEX
                </span>


                <strong>
                  {currentIndex.toFixed(2)}
                </strong>


                <small>
                  Base Index = 100
                </small>

              </div>


              {/* 1 HOUR */}

              <div className="cpi-mini-card">

                <span>
                  LAST 1 HOUR
                </span>


                <strong
                  className={
                    getHourlyClass(
                      last1Hour
                    )
                  }
                >

                  {formatHourlyChange(
                    last1Hour
                  )}

                </strong>


                <small>
                  hourly movement
                </small>

              </div>


              {/* 2 HOURS */}

              <div className="cpi-mini-card">

                <span>
                  LAST 2 HOURS
                </span>


                <strong
                  className={
                    getHourlyClass(
                      last2Hours
                    )
                  }
                >

                  {formatHourlyChange(
                    last2Hours
                  )}

                </strong>


                <small>
                  short-term movement
                </small>

              </div>


              {/* PRESSURE */}

              <div className="cpi-mini-card">

                <span>
                  PRICE PRESSURE
                </span>


                <strong
                  className={
                    indexPressure === "HIGH"
                      ? "cpi-high"
                      : indexPressure ===
                        "ELEVATED"
                      ? "cpi-elevated"
                      : indexPressure === "LOW"
                      ? "cpi-low"
                      : "cpi-stable"
                  }
                >

                  {indexPressure}

                </strong>


                <small>
                  AIRWISE signal
                </small>

              </div>

            </div>


            <Link
              to="/airfare-index"
              className="cpi-dashboard-button"
            >

              View CPI Analysis

              <span>
                →
              </span>

            </Link>


            <div className="cpi-update-info">

              <span>

                {lastUpdated

                  ? `Last updated: ${new Date(
                      lastUpdated
                    ).toLocaleString(
                      "en-IN",
                      {
                        dateStyle:
                          "medium",

                        timeStyle:
                          "short",
                      }
                    )}`

                  : "No hourly snapshot yet"}

              </span>


              <span>
                Update frequency: Every 1 hour
              </span>

            </div>

          </div>


          {/* ==================================================
              INDEX VISUAL
          ================================================== */}

          <div className="cpi-visual">

            <div className="cpi-orbit orbit-one"></div>

            <div className="cpi-orbit orbit-two"></div>

            <div className="cpi-orbit orbit-three"></div>


            <div className="cpi-core">

              <span>
                AIRFARE
              </span>


              <strong>
                {currentIndex.toFixed(1)}
              </strong>


              <small>
                INDEX
              </small>

            </div>

          </div>


          <div className="cpi-footnote">

            DEMO / REPLAY — analytical airfare
            signal, not an official CPI publication.

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
              ● FARE DATA
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
            MAIN INTELLIGENCE
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
                            ?.current_fare ||
                          route.cheapest
                            ?.total_fare
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
                              ?.expected_fare
                          )}

                        </strong>

                      </div>


                      <div>

                        <span>
                          AIRLINE
                        </span>


                        <strong>
                          {route.cheapest?.airline}
                        </strong>

                      </div>

                    </div>


                    <div className="route-action-row">


                      <span
                        className={
                          route.cheapest
                            ?.recommendation ===
                          "BOOK NOW"

                            ? "decision book"

                            : route.cheapest
                                ?.recommendation ===
                              "WAIT"

                            ? "decision wait"

                            : "decision monitor"
                        }
                      >

                        {route.cheapest
                          ?.recommendation ||
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
                        bestOpportunity.current_fare
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      EXPECTED
                    </span>


                    <strong>
                      {money(
                        bestOpportunity.expected_fare
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
                  AIRWISE will display the
                  strongest booking opportunity here.
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


      {/* =====================================================
          FOOTER
      ===================================================== */}

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