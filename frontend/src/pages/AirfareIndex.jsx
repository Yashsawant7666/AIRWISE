import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./AirfareIndex.css";


/*
  LOCAL TESTING

  Your replay observations are currently stored
  in local PostgreSQL.

  Therefore this page uses local FastAPI.
*/
const API_URL =
  "https://airwise-api.onrender.com";


function AirfareIndex() {

  const [indexData, setIndexData] =
    useState(null);

  const [hourlyData, setHourlyData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD CURRENT INDEX
  // ==========================================================

  const loadIndex = async () => {

    try {

      const response =
        await fetch(
          `${API_URL}/index`
        );


      if (!response.ok) {

        throw new Error(
          `Index API returned ${response.status}`
        );

      }


      const data =
        await response.json();


      console.log(
        "AIRWISE INDEX RESPONSE:",
        data
      );


      if (
        data.status !==
        "success"
      ) {

        throw new Error(
          data.message ||
          "Unable to load Airfare Index."
        );

      }


      setIndexData(
        data
      );

    } catch (err) {

      console.error(
        "AIRFARE INDEX ERROR:",
        err
      );


      setError(
        err.message ||
        "Unable to connect to AIRWISE API."
      );

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
          "AIRWISE HOURLY RESPONSE:",
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
          "HOURLY API ERROR:",
          err
        );

      }

    };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    const initialize =
      async () => {

        try {

          setLoading(true);
          setError("");


          await Promise.all([
            loadIndex(),
            loadHourlyIndex(),
          ]);

        } finally {

          setLoading(false);

        }

      };


    initialize();

  }, []);


  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {

    const interval =
      setInterval(() => {

        loadIndex();
        loadHourlyIndex();

      }, 60000);


    return () => {

      clearInterval(interval);

    };

  }, []);


  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const money =
    (value) => {

      const number =
        Number(value);


      if (
        Number.isNaN(number)
      ) {

        return "₹0";

      }


      return `₹${number.toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 0,
        }
      )}`;

    };


  // ==========================================================
  // FORMAT CHANGE
  // ==========================================================

  const formatChange =
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
  // CHANGE CLASS
  // ==========================================================

  const changeClass =
    (value) => {

      if (
        value === null ||
        value === undefined
      ) {

        return "neutral";

      }


      return Number(value) >= 0
        ? "hourly-positive"
        : "hourly-negative";

    };


  // ==========================================================
  // PRESSURE CLASS
  // ==========================================================

  const pressureClass =
    (pressure) => {

      if (
        pressure === "HIGH"
      ) {

        return "pressure-high";

      }


      if (
        pressure === "ELEVATED"
      ) {

        return "pressure-elevated";

      }


      if (
        pressure === "LOW"
      ) {

        return "pressure-low";

      }


      return "pressure-stable";

    };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="index-page">

        <main className="index-container">

          <div className="index-loading">

            <div className="loading-circle"></div>


            <h2>
              Loading Airfare Price Index...
            </h2>


            <p>
              AIRWISE is retrieving airfare intelligence.
            </p>

          </div>

        </main>

      </div>

    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error &&
    !indexData
  ) {

    return (

      <div className="index-page">

        <main className="index-container">

          <div className="index-error">

            <div className="error-symbol">
              !
            </div>


            <h2>
              Airfare Index unavailable
            </h2>


            <p>
              {error}
            </p>


            <button
              onClick={() => {
                window.location.reload();
              }}
            >
              Retry
            </button>

          </div>

        </main>

      </div>

    );

  }


  // ==========================================================
  // SAFE DATA
  // ==========================================================

  const currentIndex =
    Number(
      hourlyData?.current_index ??
      indexData?.current_index ??
      100
    );


  const currentAverage =
    Number(
      hourlyData?.current_average_fare ??
      indexData?.current_average_fare ??
      0
    );


  const baseAverage =
    Number(
      indexData?.base_average_fare ??
      hourlyData?.base_average_fare ??
      0
    );


  const currentPeriod =
    indexData?.current_period ||
    "--";


  const basePeriod =
    indexData?.base_period ||
    "--";


  const history =
    Array.isArray(
      indexData?.history
    )
      ? indexData.history
      : [];


  const routes =
    Array.isArray(
      indexData?.routes
    )
      ? indexData.routes
      : [];


  const overallChange =
    Number(
      indexData?.change_percent ??
      0
    );


  const pressure =
    hourlyData?.price_pressure ||
    indexData?.price_pressure ||
    "STABLE";


  // ==========================================================
  // HOURLY CHANGES
  // ==========================================================

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
  // SNAPSHOT COUNT
  // ==========================================================

  const snapshotCount =
    Number(
      hourlyData?.snapshot_count ||
      0
    );


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="index-page">

      <main className="index-container">


        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="index-hero">

          <div className="index-hero-content">

            <span className="index-eyebrow">
              AIRWISE ECONOMIC INTELLIGENCE
            </span>


            <h1>
              Airfare Price Index
            </h1>


            <p>
              A statistical indicator designed to
              track movement in domestic airfare
              relative to the AIRWISE base period.
            </p>

          </div>


          <div className="index-period-box">

            <span>
              BASE PERIOD
            </span>


            <strong>
              {basePeriod}
            </strong>


            <small>
              Base Index = 100
            </small>

          </div>

        </section>



        {/* ====================================================
            MAIN INDEX CARDS
        ==================================================== */}

        <section className="index-summary-grid">


          {/* CURRENT INDEX */}

          <div className="current-index-card">

            <span>
              CURRENT AIRFARE INDEX
            </span>


            <div className="index-number">
              {currentIndex.toFixed(2)}
            </div>


            <div
              className={
                overallChange >= 0
                  ? "change-positive"
                  : "change-negative"
              }
            >

              {overallChange >= 0
                ? "↑"
                : "↓"}

              {" "}

              {Math.abs(
                overallChange
              ).toFixed(2)}

              %

              {" from base"}

            </div>

          </div>


          {/* CURRENT AVERAGE */}

          <div className="index-stat-card">

            <span>
              CURRENT AVG FARE
            </span>


            <strong>
              {money(
                currentAverage
              )}
            </strong>


            <small>
              Period: {currentPeriod}
            </small>

          </div>


          {/* BASE AVERAGE */}

          <div className="index-stat-card">

            <span>
              BASE AVG FARE
            </span>


            <strong>
              {money(
                baseAverage
              )}
            </strong>


            <small>
              Base Index = 100
            </small>

          </div>


          {/* PRESSURE */}

          <div className="index-stat-card">

            <span>
              PRICE PRESSURE
            </span>


            <strong
              className={
                pressureClass(
                  pressure
                )
              }
            >
              {pressure}
            </strong>


            <small>
              AIRWISE airfare signal
            </small>

          </div>

        </section>



        {/* ====================================================
            REAL-TIME HOURLY MOVEMENT
        ==================================================== */}

        <section className="hourly-index-panel">


          <div className="hourly-panel-header">

            <div>

              <span>
                REAL-TIME AIRFARE MOVEMENT
              </span>


              <h2>
                Index Change by Time
              </h2>

            </div>


            <div className="hourly-live-badge">

              <span className="live-dot">
                ●
              </span>

              DEMO / REPLAY

            </div>

          </div>


          {/* ==================================================
              FOUR TIME WINDOWS
          ================================================== */}

          <div className="hourly-index-grid">


            {/* 1 HOUR */}

            <div className="hourly-stat">

              <span>
                LAST 1 HOUR
              </span>


              <strong
                className={
                  changeClass(
                    last1Hour
                  )
                }
              >
                {formatChange(
                  last1Hour
                )}
              </strong>


              <small>
                hourly movement
              </small>

            </div>


            {/* 2 HOURS */}

            <div className="hourly-stat">

              <span>
                LAST 2 HOURS
              </span>


              <strong
                className={
                  changeClass(
                    last2Hours
                  )
                }
              >
                {formatChange(
                  last2Hours
                )}
              </strong>


              <small>
                short-term movement
              </small>

            </div>


            {/* 6 HOURS */}

            <div className="hourly-stat">

              <span>
                LAST 6 HOURS
              </span>


              <strong
                className={
                  changeClass(
                    last6Hours
                  )
                }
              >
                {formatChange(
                  last6Hours
                )}
              </strong>


              <small>
                intraday movement
              </small>

            </div>


            {/* 24 HOURS */}

            <div className="hourly-stat">

              <span>
                LAST 24 HOURS
              </span>


              <strong
                className={
                  changeClass(
                    last24Hours
                  )
                }
              >
                {formatChange(
                  last24Hours
                )}
              </strong>


              <small>
                daily movement
              </small>

            </div>

          </div>


          {/* ==================================================
              UPDATE INFORMATION
          ================================================== */}

          <div className="hourly-footer">


            <div>

              <span>
                LAST UPDATED
              </span>


              <strong>

                {lastUpdated

                  ? new Date(
                      lastUpdated
                    ).toLocaleString(
                      "en-IN",
                      {
                        dateStyle:
                          "medium",

                        timeStyle:
                          "short",
                      }
                    )

                  : "--"}

              </strong>

            </div>


            <div>

              <span>
                CURRENT INDEX
              </span>


              <strong>
                {currentIndex.toFixed(2)}
              </strong>

            </div>


            <div>

              <span>
                UPDATE FREQUENCY
              </span>


              <strong>
                Every 1 hour
              </strong>

            </div>

          </div>


          {/* ==================================================
              DATA STATUS
          ================================================== */}

          <div className="hourly-data-note">

            <span className="status-dot"></span>


            <span>

              {snapshotCount > 0

                ? `${snapshotCount} timestamped
                   replay snapshots available.`

                : "Waiting for hourly replay snapshots."}

            </span>

          </div>

        </section>



        {/* ====================================================
            HISTORICAL TREND
        ==================================================== */}

        <section className="index-panel">

          <div className="panel-header">

            <div>

              <span>
                HISTORICAL MOVEMENT
              </span>


              <h2>
                Airfare Index Trend
              </h2>

            </div>


            <div className="observation-pill">

              {indexData?.observations || 0}

              {" observations"}

            </div>

          </div>


          {history.length > 0 ? (

            <div className="index-chart">

              <ResponsiveContainer
                width="100%"
                height={360}
              >

                <LineChart
                  data={history}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />


                  <XAxis
                    dataKey="period"
                  />


                  <YAxis
                    domain={[
                      "auto",
                      "auto",
                    ]}
                  />


                  <Tooltip />


                  <Line
                    type="monotone"
                    dataKey="index"
                    stroke="#14213d"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                    }}
                    activeDot={{
                      r: 7,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          ) : (

            <div className="empty-index">

              <div className="empty-icon">
                📊
              </div>


              <h3>
                Historical index unavailable
              </h3>


              <p>
                AIRWISE needs airfare observations
                from multiple periods to display
                a historical trend.
              </p>

            </div>

          )}

        </section>



        {/* ====================================================
            ROUTE INDEX
        ==================================================== */}

        <section className="index-panel">

          <div className="panel-header">

            <div>

              <span>
                ROUTE ANALYSIS
              </span>


              <h2>
                Route-wise Airfare Pressure
              </h2>

            </div>

          </div>


          {routes.length === 0 ? (

            <div className="empty-index">

              <h3>
                No route index data
              </h3>


              <p>
                Route-level index data will appear
                when valid fare observations exist.
              </p>

            </div>

          ) : (

            <div className="route-index-grid">

              {routes.map(
                (route, index) => (

                  <div
                    className="route-index-card"
                    key={
                      route.route ||
                      `${route.origin}-${route.destination}-${index}`
                    }
                  >

                    <div className="route-card-heading">

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


                      <div className="route-rank">
                        #{index + 1}
                      </div>

                    </div>


                    <div className="route-index-number">

                      <span>
                        AIRFARE INDEX
                      </span>


                      <strong>

                        {Number(
                          route.index || 100
                        ).toFixed(2)}

                      </strong>

                    </div>


                    <div className="route-details">


                      <div>

                        <span>
                          AVG FARE
                        </span>


                        <strong>
                          {money(
                            route.average_fare
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          CHANGE
                        </span>


                        <strong
                          className={
                            Number(
                              route.change_percent ||
                              0
                            ) >= 0
                              ? "change-positive"
                              : "change-negative"
                          }
                        >

                          {formatChange(
                            route.change_percent
                          )}

                        </strong>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>



        {/* ====================================================
            CPI AUGMENTATION EXPLANATION
        ==================================================== */}

        <section className="cpi-panel">

          <div className="cpi-heading">

            <span>
              CPI AUGMENTATION
            </span>


            <h2>
              AIRWISE as a High-Frequency Airfare Signal
            </h2>


            <p>

              AIRWISE provides an airfare price
              signal that can be analysed alongside
              official CPI data to study transport
              price pressure.

            </p>

          </div>


          <div className="cpi-flow">


            <div className="cpi-card airwise-cpi">

              <span>
                AIRWISE
              </span>


              <strong>
                {currentIndex.toFixed(2)}
              </strong>


              <small>
                Airfare Price Index
              </small>

            </div>


            <div className="cpi-symbol">
              +
            </div>


            <div className="cpi-card official-cpi">

              <span>
                OFFICIAL
              </span>


              <strong>
                CPI
              </strong>


              <small>
                Government reference series
              </small>

            </div>


            <div className="cpi-symbol">
              →
            </div>


            <div className="cpi-output">

              <span>
                ANALYTICAL OUTPUT
              </span>


              <strong>
                Airfare Price Signal
              </strong>


              <small>

                Potential high-frequency input
                for CPI augmentation analysis

              </small>

            </div>

          </div>


          <div className="cpi-disclaimer">

            DEMO / REPLAY MODE — this AIRWISE index is
            an analytical prototype and is not an
            official Government of India CPI value.

          </div>

        </section>



        {/* ====================================================
            METHODOLOGY
        ==================================================== */}

        <section className="method-panel">

          <div className="panel-header">

            <div>

              <span>
                INDEX METHODOLOGY
              </span>


              <h2>
                How AIRWISE calculates the index
              </h2>

            </div>

          </div>


          <div className="method-grid">


            <div className="method-card">

              <div>
                01
              </div>


              <strong>
                Collect
              </strong>


              <p>
                Gather domestic airfare observations.
              </p>

            </div>


            <div className="method-card">

              <div>
                02
              </div>


              <strong>
                Compare
              </strong>


              <p>
                Group comparable airfare observations.
              </p>

            </div>


            <div className="method-card">

              <div>
                03
              </div>


              <strong>
                Normalize
              </strong>


              <p>
                Set the base period index to 100.
              </p>

            </div>


            <div className="method-card">

              <div>
                04
              </div>


              <strong>
                Monitor
              </strong>


              <p>
                Track hourly and historical airfare
                movement.
              </p>

            </div>

          </div>

        </section>



        {/* ====================================================
            DISCLAIMER
        ==================================================== */}

        <div className="index-disclaimer">

          <strong>
            AIRWISE Prototype
          </strong>


          <span>

            Current index and hourly movement are
            calculated from AIRWISE airfare data and
            timestamped DEMO / REPLAY observations.
            This is not an official Government of India
            CPI publication.

          </span>

        </div>

      </main>

    </div>

  );

}


export default AirfareIndex;