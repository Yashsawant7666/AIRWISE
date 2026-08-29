import { useState } from "react";
import { Link } from "react-router-dom";

import "./RouteComparison.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://airwise-api.onrender.com";


function RouteComparison() {

  const [origin, setOrigin] =
    useState("DEL");

  const [destination, setDestination] =
    useState("BOM");

  const [fares, setFares] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================================
  // COMPARE ROUTE
  // ==========================================================

  const compareRoute = async (event) => {

    event.preventDefault();


    const from =
      origin
        .trim()
        .toUpperCase();

    const to =
      destination
        .trim()
        .toUpperCase();


    if (
      from.length !== 3 ||
      to.length !== 3
    ) {

      setError(
        "Please enter valid 3-letter airport codes."
      );

      return;

    }


    try {

      setLoading(true);

      setError("");

      setSearched(true);

      setFares([]);


      const response =
        await fetch(
          `${API_URL}/search?origin=${encodeURIComponent(
            from
          )}&destination=${encodeURIComponent(
            to
          )}`
        );


      const data =
        await response.json();


      console.log(
        "AIRWISE COMPARISON:",
        data
      );


      if (
        !response.ok ||
        data.status !== "success"
      ) {

        throw new Error(
          data.message ||
          "No fare data found."
        );

      }


      setFares(
        Array.isArray(data.fares)
          ? data.fares
          : []
      );

    } catch (err) {

      console.error(
        "COMPARISON ERROR:",
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
  // HELPERS
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


  const recommendationClass =
    (recommendation) => {

      const value =
        String(
          recommendation || ""
        ).toUpperCase();


      if (
        value === "BOOK NOW"
      ) {

        return "compare-book";

      }


      if (
        value === "WAIT"
      ) {

        return "compare-wait";

      }


      return "compare-monitor";

    };


  // ==========================================================
  // AIRLINE GROUPING
  // ==========================================================

  const airlineMap = {};


  fares.forEach((fare) => {

    const airline =
      fare.airline ||
      "Unknown";


    if (
      !airlineMap[airline]
    ) {

      airlineMap[airline] = [];

    }


    airlineMap[airline].push(
      fare
    );

  });


  // ==========================================================
  // AIRLINE ANALYTICS
  // ==========================================================

  const airlines =
    Object.keys(
      airlineMap
    ).map((airline) => {


      const airlineFares =
        airlineMap[airline];


      const cheapestFare =
        [...airlineFares]
          .sort(
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
          )[0];


      const averageFare =
        airlineFares.reduce(
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
        airlineFares.length;


      const averageExpected =
        airlineFares.reduce(
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
        airlineFares.length;


      const difference =
        averageFare -
        averageExpected;


      const differencePercent =
        averageExpected === 0
          ? 0
          : (
              difference /
              averageExpected
            ) * 100;


      return {

        airline,

        cheapestFare,

        averageFare,

        averageExpected,

        differencePercent,

      };

    });


  // ==========================================================
  // SORT AIRLINES
  // ==========================================================

  const sortedAirlines =
    [...airlines].sort(
      (a, b) =>
        Number(
          a.cheapestFare?.current_fare ||
          a.cheapestFare?.total_fare ||
          0
        ) -
        Number(
          b.cheapestFare?.current_fare ||
          b.cheapestFare?.total_fare ||
          0
        )
    );


  const bestAirline =
    sortedAirlines.length > 0
      ? sortedAirlines[0]
      : null;


  // ==========================================================
  // SUMMARY
  // ==========================================================

  const averageRouteFare =
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
        ) / fares.length
      : 0;


  const bestPrice =
    bestAirline?.cheapestFare
      ?.current_fare ||
    bestAirline?.cheapestFare
      ?.total_fare ||
    0;


  const bestExpected =
    bestAirline?.cheapestFare
      ?.expected_fare ||
    0;


  const savings =
    Number(bestExpected) -
    Number(bestPrice);


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="comparison-page">

      <main className="comparison-main">


        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="comparison-header">

          <div className="comparison-header-glow"></div>


          <span>
            AIRWISE MARKET INTELLIGENCE
          </span>


          <h1>
            Compare the market.
            <br />
            Find the better fare.
          </h1>


          <p>
            Compare airlines, observed fares,
            expected pricing and AIRWISE
            booking signals for a selected route.
          </p>


          <div className="comparison-meta">

            <div>
              <strong>
                ROUTE
              </strong>

              <span>
                {origin} → {destination}
              </span>
            </div>


            <div>
              <strong>
                ANALYSIS
              </strong>

              <span>
                AIRLINE + FARE
              </span>
            </div>


            <div>
              <strong>
                SIGNAL
              </strong>

              <span>
                AI DECISION
              </span>
            </div>

          </div>

        </section>


        {/* ====================================================
            SEARCH
        ==================================================== */}

        <section className="comparison-search">

          <div className="comparison-search-heading">

            <div>

              <span>
                ROUTE ANALYZER
              </span>


              <h2>
                Select a route
              </h2>

            </div>


            <span className="comparison-live">
              ● AIRFARE DATA
            </span>

          </div>


          <form
            className="comparison-form"
            onSubmit={compareRoute}
          >


            <div className="compare-field">

              <label>
                FROM
              </label>


              <input
                value={origin}
                maxLength={3}
                onChange={(e) =>
                  setOrigin(
                    e.target.value
                      .toUpperCase()
                      .replace(
                        /[^A-Z]/g,
                        ""
                      )
                  )
                }
              />


              <small>
                Origin airport
              </small>

            </div>


            <button
              type="button"
              className="compare-swap"
              onClick={() => {

                setOrigin(
                  destination
                );

                setDestination(
                  origin
                );

              }}
            >
              ⇄
            </button>


            <div className="compare-field">

              <label>
                TO
              </label>


              <input
                value={destination}
                maxLength={3}
                onChange={(e) =>
                  setDestination(
                    e.target.value
                      .toUpperCase()
                      .replace(
                        /[^A-Z]/g,
                        ""
                      )
                  )
                }
              />


              <small>
                Destination airport
              </small>

            </div>


            <button
              type="submit"
              className="compare-button"
              disabled={loading}
            >

              {loading
                ? "ANALYZING..."
                : "COMPARE AIRLINES →"}

            </button>

          </form>

        </section>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (

          <div className="comparison-error">

            <span>
              !
            </span>


            <div>

              <strong>
                Comparison unavailable
              </strong>


              <p>
                {error}
              </p>

            </div>

          </div>

        )}


        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (

          <div className="comparison-loading">

            <div className="comparison-spinner"></div>


            <h3>
              Analyzing the route
            </h3>


            <p>
              AIRWISE is comparing available airline fares.
            </p>

          </div>

        )}


        {/* ====================================================
            RESULTS
        ==================================================== */}

        {!loading &&
          searched &&
          airlines.length > 0 && (

            <>

              {/* ================================================
                  SUMMARY
              ================================================= */}

              <section className="comparison-summary">


                <div className="compare-stat featured">

                  <span>
                    BEST FARE
                  </span>


                  <strong>
                    {money(bestPrice)}
                  </strong>


                  <small>
                    Lowest observed fare
                  </small>

                </div>


                <div className="compare-stat">

                  <span>
                    ROUTE AVERAGE
                  </span>


                  <strong>
                    {money(
                      averageRouteFare
                    )}
                  </strong>


                  <small>
                    Across available fares
                  </small>

                </div>


                <div className="compare-stat">

                  <span>
                    AIRLINES
                  </span>


                  <strong>
                    {airlines.length}
                  </strong>


                  <small>
                    Compared
                  </small>

                </div>


                <div className="compare-stat">

                  <span>
                    POTENTIAL SAVING
                  </span>


                  <strong
                    className={
                      savings > 0
                        ? "saving"
                        : ""
                    }
                  >
                    {savings > 0
                      ? money(savings)
                      : "—"}
                  </strong>


                  <small>
                    Vs expected fare
                  </small>

                </div>

              </section>


              {/* ================================================
                  BEST OPTION
              ================================================= */}

              {bestAirline && (

                <section className="best-option">

                  <div className="best-option-glow"></div>


                  <div className="best-option-badge">
                    ★ BEST AVAILABLE OPTION
                  </div>


                  <div className="best-option-content">

                    <div className="best-airline-name">

                      <span>
                        LOWEST OBSERVED FARE
                      </span>


                      <h2>
                        {bestAirline.airline}
                      </h2>


                      <p>
                        {origin} → {destination}
                      </p>

                    </div>


                    <div className="best-price">

                      <span>
                        CURRENT FARE
                      </span>


                      <strong>
                        {money(
                          bestPrice
                        )}
                      </strong>

                    </div>


                    <div className="best-price">

                      <span>
                        EXPECTED
                      </span>


                      <strong>
                        {money(
                          bestExpected
                        )}
                      </strong>

                    </div>


                    <div className="best-decision">

                      <span>
                        AIRWISE DECISION
                      </span>


                      <strong
                        className={
                          recommendationClass(
                            bestAirline
                              .cheapestFare
                              ?.recommendation
                          )
                        }
                      >

                        {bestAirline
                          .cheapestFare
                          ?.recommendation ||
                          "MONITOR"}

                      </strong>

                    </div>

                  </div>

                </section>

              )}


              {/* ================================================
                  AIRLINE CARDS
              ================================================= */}

              <section>

                <div className="comparison-section-title">

                  <div>

                    <span>
                      MARKET BREAKDOWN
                    </span>


                    <h2>
                      Airline Comparison
                    </h2>

                  </div>


                  <span>
                    {airlines.length} airlines
                  </span>

                </div>


                <div className="airline-grid">

                  {sortedAirlines.map(
                    (airline, index) => (

                      <article
                        className={
                          `airline-card ${
                            index === 0
                              ? "winner"
                              : ""
                          }`
                        }
                        key={
                          airline.airline
                        }
                      >


                        {index === 0 && (

                          <div className="winner-badge">
                            BEST PRICE
                          </div>

                        )}


                        <div className="airline-card-header">

                          <div>

                            <span>
                              AIRLINE
                            </span>


                            <h2>
                              {airline.airline}
                            </h2>

                          </div>


                          <div className="airline-rank">

                            #{index + 1}

                          </div>

                        </div>


                        <div className="comparison-main-price">

                          <span>
                            LOWEST FARE
                          </span>


                          <strong>
                            {money(
                              airline
                                .cheapestFare
                                ?.current_fare ||
                              airline
                                .cheapestFare
                                ?.total_fare
                            )}
                          </strong>

                        </div>


                        <div className="comparison-metrics">

                          <div>

                            <span>
                              EXPECTED
                            </span>


                            <strong>
                              {money(
                                airline
                                  .cheapestFare
                                  ?.expected_fare
                              )}
                            </strong>

                          </div>


                          <div>

                            <span>
                              AVG FARE
                            </span>


                            <strong>
                              {money(
                                airline.averageFare
                              )}
                            </strong>

                          </div>

                        </div>


                        <div className="comparison-difference">

                          <span>
                            VS EXPECTED
                          </span>


                          <strong
                            className={
                              airline.differencePercent <= 0
                                ? "good"
                                : "bad"
                            }
                          >

                            {airline
                              .differencePercent <= 0
                              ? ""
                              : "+"}

                            {airline
                              .differencePercent
                              .toFixed(2)}
                            %

                          </strong>

                        </div>


                        <div className="comparison-recommendation">

                          <div>

                            <span>
                              AIRWISE DECISION
                            </span>


                            <strong
                              className={
                                recommendationClass(
                                  airline
                                    .cheapestFare
                                    ?.recommendation
                                )
                              }
                            >

                              {airline
                                .cheapestFare
                                ?.recommendation ||
                                "MONITOR"}

                            </strong>

                          </div>


                          <Link
                            to={`/fare/${airline.cheapestFare.id}`}
                            className="view-analysis"
                          >
                            Analyze →
                          </Link>

                        </div>

                      </article>

                    )
                  )}

                </div>

              </section>


              {/* ================================================
                  TABLE
              ================================================= */}

              <section className="comparison-table-section">

                <div className="comparison-section-title">

                  <div>

                    <span>
                      DETAILED VIEW
                    </span>


                    <h2>
                      Side-by-Side Comparison
                    </h2>

                  </div>

                </div>


                <div className="comparison-table-wrapper">

                  <table>

                    <thead>

                      <tr>

                        <th>
                          AIRLINE
                        </th>

                        <th>
                          LOWEST
                        </th>

                        <th>
                          EXPECTED
                        </th>

                        <th>
                          DIFFERENCE
                        </th>

                        <th>
                          ANOMALY
                        </th>

                        <th>
                          DECISION
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {sortedAirlines.map(
                        (airline) => {

                          const fare =
                            airline
                              .cheapestFare;


                          return (

                            <tr
                              key={
                                airline.airline
                              }
                            >

                              <td>

                                <strong>
                                  {
                                    airline.airline
                                  }
                                </strong>

                              </td>


                              <td>

                                {money(
                                  fare.current_fare ||
                                  fare.total_fare
                                )}

                              </td>


                              <td>

                                {money(
                                  fare.expected_fare
                                )}

                              </td>


                              <td
                                className={
                                  Number(
                                    fare
                                      .fare_difference_percent ||
                                    0
                                  ) <= 0
                                    ? "good"
                                    : "bad"
                                }
                              >

                                {Number(
                                  fare
                                    .fare_difference_percent ||
                                  0
                                ) > 0
                                  ? "+"
                                  : ""}

                                {Number(
                                  fare
                                    .fare_difference_percent ||
                                  0
                                ).toFixed(2)}

                                %

                              </td>


                              <td>

                                <span
                                  className={
                                    `table-status ${
                                      String(
                                        fare
                                          .anomaly_status ||
                                        "NORMAL"
                                      ).toLowerCase()
                                    }`
                                  }
                                >
                                  {fare.anomaly_status ||
                                    "NORMAL"}
                                </span>

                              </td>


                              <td>

                                <span
                                  className={
                                    recommendationClass(
                                      fare.recommendation
                                    )
                                  }
                                >
                                  {fare.recommendation ||
                                    "MONITOR"}
                                </span>

                              </td>

                            </tr>

                          );

                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </section>

            </>

          )}


        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!loading &&
          searched &&
          airlines.length === 0 &&
          !error && (

            <div className="no-results">

              <div>
                ?
              </div>


              <span>
                NO MARKET DATA
              </span>


              <h2>
                No fare data found
              </h2>


              <p>
                Try another route with available
                AIRWISE fare observations.
              </p>

            </div>

          )}

      </main>

    </div>

  );

}


export default RouteComparison;