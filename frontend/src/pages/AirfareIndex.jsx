import { useEffect, useMemo, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import "./AirfareIndex.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://airwise-api.onrender.com";


function AirfareIndex() {

  const [indexData, setIndexData] =
    useState(null);

  const [hourlyData, setHourlyData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD MAIN INDEX
  // ==========================================================

  const loadIndex = async () => {

    const response =
      await fetch(
        `${API_URL}/index`,
        {
          cache: "no-store",
        }
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
      data.status !== "success"
    ) {

      throw new Error(
        data.message ||
        "Unable to load Airfare Index."
      );

    }


    setIndexData(data);

  };


  // ==========================================================
  // LOAD HOURLY INDEX
  // ==========================================================

  const loadHourlyIndex = async () => {

    const response =
      await fetch(
        `${API_URL}/index/hourly`,
        {
          cache: "no-store",
        }
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
      data.status !== "success"
    ) {

      throw new Error(
        data.message ||
        "Unable to load hourly index."
      );

    }


    setHourlyData(data);

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

        } catch (err) {

          console.error(
            "AIRWISE INDEX ERROR:",
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


    initialize();

  }, []);


  // ==========================================================
  // AUTO REFRESH
  // ==========================================================

  useEffect(() => {

    const refreshData =
      async () => {

        try {

          setRefreshing(true);


          await Promise.all([
            loadIndex(),
            loadHourlyIndex(),
          ]);


          setError("");

        } catch (err) {

          console.error(
            "AIRWISE REFRESH ERROR:",
            err
          );

        } finally {

          setRefreshing(false);

        }

      };


    const interval =
      setInterval(
        refreshData,
        60000
      );


    return () => {

      clearInterval(interval);

    };

  }, []);


  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const money = (value) => {

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
  // FORMAT PERCENTAGE
  // ==========================================================

  const formatChange = (value) => {

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

  const changeClass = (value) => {

    if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
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

  const pressureClass = (pressure) => {

    const value =
      String(
        pressure || "STABLE"
      ).toUpperCase();


    if (
      value === "HIGH"
    ) {

      return "pressure-high";

    }


    if (
      value === "ELEVATED"
    ) {

      return "pressure-elevated";

    }


    if (
      value === "LOW"
    ) {

      return "pressure-low";

    }


    return "pressure-stable";

  };


  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  const formatDateTime = (value) => {

    if (!value) {

      return "--";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return String(value);

    }


    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );

  };


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
    hourlyData?.changes?.last_1_hour ??
    null;


  const last2Hours =
    hourlyData?.changes?.last_2_hours ??
    null;


  const last6Hours =
    hourlyData?.changes?.last_6_hours ??
    null;


  const last24Hours =
    hourlyData?.changes?.last_24_hours ??
    null;


  const lastUpdated =
    hourlyData?.last_updated ??
    null;


  const snapshotCount =
    Number(
      hourlyData?.snapshot_count ||
      0
    );


  // ==========================================================
  // HISTORICAL DATA
  // ==========================================================

  const history =
    Array.isArray(
      indexData?.history
    )
      ? indexData.history
      : [];


  // ==========================================================
  // HOURLY HISTORY
  // ==========================================================

  const hourlyHistory =
    useMemo(() => {

      let source = [];


      if (
        Array.isArray(
          hourlyData?.history
        )
      ) {

        source =
          hourlyData.history;

      } else if (
        Array.isArray(
          hourlyData?.snapshots
        )
      ) {

        source =
          hourlyData.snapshots;

      } else if (
        Array.isArray(
          hourlyData?.data
        )
      ) {

        source =
          hourlyData.data;

      }


      return source
        .map(
          (
            item,
            index
          ) => {

            const timestamp =
              item.timestamp ||
              item.snapshot_time ||
              item.recorded_at ||
              item.created_at ||
              item.time ||
              item.datetime;


            const indexValue =
              Number(
                item.index ??
                item.current_index ??
                item.airfare_index ??
                100
              );


            let chartTime =
              `H${index + 1}`;


            if (
              timestamp
            ) {

              const date =
                new Date(
                  timestamp
                );


              if (
                !Number.isNaN(
                  date.getTime()
                )
              ) {

                chartTime =
                  date.toLocaleTimeString(
                    "en-IN",
                    {
                      hour:
                        "2-digit",

                      minute:
                        "2-digit",
                    }
                  );

              }

            }


            return {

              ...item,

              chartIndex:
                Number.isNaN(
                  indexValue
                )
                  ? 100
                  : indexValue,

              chartTime,

              fullTime:
                timestamp
                  ? formatDateTime(
                      timestamp
                    )
                  : "--",

            };

          }
        );

    }, [hourlyData]);


  const hasHourlyHistory =
    hourlyHistory.length > 0;


  // ==========================================================
  // ROUTE DATA
  // ==========================================================

  const routes =
    Array.isArray(
      indexData?.routes
    )
      ? indexData.routes
      : [];


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="index-page">

        <main className="index-container">

          <div className="index-loading">

            <div className="loading-circle"></div>


            <span>
              AIRWISE ECONOMIC INTELLIGENCE
            </span>


            <h2>
              Loading Airfare Price Index...
            </h2>


            <p>
              Retrieving current and hourly airfare signals.
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


            <span>
              AIRWISE ECONOMIC INTELLIGENCE
            </span>


            <h2>
              Airfare Index Unavailable
            </h2>


            <p>
              {error}
            </p>


            <button
              onClick={() =>
                window.location.reload()
              }
            >
              Retry
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

    <div className="index-page">

      <main className="index-container">


        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="index-hero">

          <div className="index-hero-content">


            <div className="index-live-line">

              <span className="index-eyebrow">
                AIRWISE ECONOMIC INTELLIGENCE
              </span>


              <span className="index-update-badge">

                <span className="index-live-dot"></span>

                {refreshing
                  ? "UPDATING"
                  : "HOURLY SIGNAL"}

              </span>

            </div>


            <h1>
              Airfare Price Index
            </h1>


            <p>
              A high-frequency analytical indicator
              designed to monitor movement in domestic
              airfare and provide an airfare signal for
              CPI augmentation research.
            </p>


            <div className="index-hero-metrics">


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
                  BASE INDEX
                </span>


                <strong>
                  100
                </strong>

              </div>


              <div>

                <span>
                  PRESSURE
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

              </div>

            </div>

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


            <div className="index-period-divider"></div>


            <span>
              CURRENT PERIOD
            </span>


            <strong className="current-period">
              {currentPeriod}
            </strong>

          </div>

        </section>



        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section className="index-summary-grid">


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

              <small>
                from base
              </small>

            </div>

          </div>


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
            HOURLY MOVEMENT
        ==================================================== */}

        <section className="hourly-index-panel">


          <div className="hourly-panel-header">

            <div className="hourly-panel-heading-content">

              <div className="hourly-section-label">

                <span className="section-status-dot"></span>

                REAL-TIME AIRFARE MOVEMENT

              </div>


              <h2>
                High-Frequency Index Monitor
              </h2>


              <p>
                Short-term movement calculated from
                timestamped AIRWISE replay observations.
              </p>

            </div>


            <div className="hourly-live-badge">

              <span className="live-dot"></span>

              DEMO / REPLAY

            </div>

          </div>


          {/* ==================================================
              FOUR CARDS
          ================================================== */}

          <div className="hourly-index-grid">


            {/* 1 HOUR */}

            <div className="hourly-stat">

              <div className="hourly-stat-header">

                <span>
                  LAST 1 HOUR
                </span>


                <span className="hourly-period-icon">
                  1H
                </span>

              </div>


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
                latest hourly movement
              </small>

            </div>


            {/* 2 HOURS */}

            <div className="hourly-stat">

              <div className="hourly-stat-header">

                <span>
                  LAST 2 HOURS
                </span>


                <span className="hourly-period-icon">
                  2H
                </span>

              </div>


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

              <div className="hourly-stat-header">

                <span>
                  LAST 6 HOURS
                </span>


                <span className="hourly-period-icon">
                  6H
                </span>

              </div>


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

              <div className="hourly-stat-header">

                <span>
                  LAST 24 HOURS
                </span>


                <span className="hourly-period-icon">
                  24H
                </span>

              </div>


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


            <div className="hourly-footer-item">

              <span>
                LAST UPDATED
              </span>


              <strong>
                {formatDateTime(
                  lastUpdated
                )}
              </strong>

            </div>


            <div className="hourly-footer-item">

              <span>
                SNAPSHOTS
              </span>


              <strong>
                {snapshotCount}
              </strong>

            </div>


            <div className="hourly-footer-item">

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

                ? `${snapshotCount} timestamped replay snapshots available for high-frequency analysis.`

                : "Waiting for the first hourly replay snapshot."}

            </span>

          </div>

        </section>



        {/* ====================================================
            HOURLY GRAPH
        ==================================================== */}

        <section className="index-panel">


          <div className="panel-header">

            <div>

              <span>
                HIGH-FREQUENCY SERIES
              </span>


              <h2>
                Hourly Airfare Index Movement
              </h2>

            </div>


            <div className="observation-pill">

              {snapshotCount}

              {" snapshots"}

            </div>

          </div>


          {hasHourlyHistory ? (

            <div className="index-chart">

              <ResponsiveContainer
                width="100%"
                height={360}
              >

                <LineChart
                  data={hourlyHistory}
                  margin={{
                    top: 15,
                    right: 20,
                    left: 0,
                    bottom: 15,
                  }}
                >

                  <CartesianGrid
                    stroke="rgba(148,163,184,0.08)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />


                  <XAxis
                    dataKey="chartTime"
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
                    domain={[
                      "auto",
                      "auto",
                    ]}
                    tick={{
                      fill: "#7188a4",
                      fontSize: 9,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />


                  <ReferenceLine
                    y={100}
                    stroke="rgba(34,211,238,0.22)"
                    strokeDasharray="5 5"
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


                    formatter={(value) => [
                      Number(value).toFixed(2),
                      "Airfare Index",
                    ]}

                  />


                  <Line
                    type="monotone"
                    dataKey="chartIndex"
                    name="Airfare Index"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      r: 3,
                      fill: "#3b82f6",
                      stroke: "#07111f",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "#22d3ee",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          ) : (

            <div className="empty-index">

              <div className="empty-icon">
                ⏱
              </div>


              <h3>
                Hourly series is being built
              </h3>


              <p>
                The dashboard does not create artificial
                hourly values. New values appear when
                timestamped replay snapshots are available.
              </p>


              <div className="hourly-empty-badge">
                UPDATE FREQUENCY: EVERY 1 HOUR
              </div>

            </div>

          )}

        </section>



        {/* ====================================================
            MONTHLY TREND
        ==================================================== */}

        <section className="index-panel">


          <div className="panel-header">

            <div>

              <span>
                HISTORICAL MOVEMENT
              </span>


              <h2>
                Monthly Airfare Index Trend
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
                    top: 15,
                    right: 20,
                    left: 0,
                    bottom: 15,
                  }}
                >

                  <CartesianGrid
                    stroke="rgba(148,163,184,0.08)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />


                  <XAxis
                    dataKey="period"
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
                    domain={[
                      "auto",
                      "auto",
                    ]}
                    tick={{
                      fill: "#7188a4",
                      fontSize: 9,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />


                  <ReferenceLine
                    y={100}
                    stroke="rgba(34,211,238,0.22)"
                    strokeDasharray="5 5"
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

                    formatter={(value) =>
                      [
                        Number(value).toFixed(2),
                        "Airfare Index",
                      ]
                    }

                  />


                  <Line
                    type="monotone"
                    dataKey="index"
                    name="Airfare Index"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#3b82f6",
                      stroke: "#07111f",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "#22d3ee",
                      stroke: "#ffffff",
                      strokeWidth: 2,
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


            <div className="observation-pill">
              {routes.length} routes
            </div>

          </div>


          {routes.length === 0 ? (

            <div className="empty-index">

              <h3>
                No route index data
              </h3>


              <p>
                Route-level index information will
                appear when valid fare observations
                are available.
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
            CPI AUGMENTATION
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
              AIRWISE creates a dedicated airfare
              price signal that can be studied alongside
              official CPI data. The high-frequency layer
              is intended for analytical comparison and
              research, not as a replacement for official CPI.
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
                Current Airfare Index
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
                RESEARCH OUTPUT
              </span>


              <strong>
                High-Frequency Airfare Signal
              </strong>


              <small>
                Potential input for CPI augmentation analysis
              </small>

            </div>

          </div>


          <div className="cpi-disclaimer">

            AIRWISE PROTOTYPE — The displayed index is
            calculated from AIRWISE airfare and replay
            observations. It is not an official Government
            of India CPI value.

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
                How AIRWISE calculates the signal
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
                Gather domestic airfare observations
                from the AIRWISE dataset.
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
                Compare fares across routes, airlines
                and available observations.
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
                Normalize the selected base period
                to an index value of 100.
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
                Track monthly and timestamped airfare
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
            The Airfare Price Index and hourly movement
            displayed here are analytical outputs generated
            from AIRWISE data. They are not an official
            Government of India CPI publication.
          </span>

        </div>

      </main>

    </div>

  );

}


export default AirfareIndex;