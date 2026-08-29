import { useState } from "react";
import { Link } from "react-router-dom";

import "./RouteComparison.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://airwise-api.onrender.com";

function RouteComparison() {
  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");

  const [fares, setFares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const compareRoute = async (event) => {
    event.preventDefault();

    const from = origin.trim().toUpperCase();
    const to = destination.trim().toUpperCase();

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

      const response = await fetch(
        `${API_URL}/search?origin=${encodeURIComponent(
          from
        )}&destination=${encodeURIComponent(to)}`
      );

      const data = await response.json();

      if (
        !response.ok ||
        data.status !== "success"
      ) {
        throw new Error(
          data.message ||
            "No fare data found."
        );
      }

      setFares(data.fares || []);

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


  const money = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };


  const airlineMap = {};

  fares.forEach((fare) => {
    const airline =
      fare.airline || "Unknown";

    if (!airlineMap[airline]) {
      airlineMap[airline] = [];
    }

    airlineMap[airline].push(fare);
  });


  const airlines = Object.keys(
    airlineMap
  ).map((airline) => {

    const airlineFares =
      airlineMap[airline];

    const cheapestFare =
      [...airlineFares].sort(
        (a, b) =>
          Number(
            a.current_fare || 0
          ) -
          Number(
            b.current_fare || 0
          )
      )[0];

    const averageFare =
      airlineFares.reduce(
        (sum, fare) =>
          sum +
          Number(
            fare.current_fare || 0
          ),
        0
      ) /
      airlineFares.length;

    const averageExpected =
      airlineFares.reduce(
        (sum, fare) =>
          sum +
          Number(
            fare.expected_fare || 0
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
        : (difference /
            averageExpected) *
          100;

    return {
      airline,
      cheapestFare,
      averageFare,
      averageExpected,
      differencePercent
    };
  });


  const bestAirline =
    airlines.length > 0
      ? [...airlines].sort(
          (a, b) =>
            Number(
              a.cheapestFare.current_fare
            ) -
            Number(
              b.cheapestFare.current_fare
            )
        )[0]
      : null;


  const recommendationClass = (
    recommendation
  ) => {

    const value =
      String(
        recommendation || ""
      ).toUpperCase();

    if (value === "BOOK NOW") {
      return "book";
    }

    if (value === "WAIT") {
      return "wait";
    }

    return "monitor";
  };


  return (
    <div className="comparison-page">

      <main className="comparison-main">

        <section className="comparison-header">

          <span>
            AIRWISE MARKET INTELLIGENCE
          </span>

          <h1>
            Route & Airline Comparison
          </h1>

          <p>
            Compare available airlines and identify
            the best fare for a route.
          </p>

        </section>


        <form
          className="comparison-search"
          onSubmit={compareRoute}
        >

          <div>

            <label>
              Origin
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


          <div className="comparison-arrow">
            →
          </div>


          <div>

            <label>
              Destination
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


          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Comparing..."
              : "Compare Airlines"}
          </button>

        </form>


        {error && (
          <div className="comparison-error">
            {error}
          </div>
        )}


        {loading && (
          <div className="comparison-loading">
            <div className="comparison-spinner"></div>

            <h3>
              Comparing airline fares...
            </h3>

            <p>
              AIRWISE is analyzing the route.
            </p>
          </div>
        )}


        {!loading &&
          searched &&
          airlines.length > 0 && (

            <>

              <section className="best-option">

                <div className="best-option-badge">
                  ★ BEST AVAILABLE OPTION
                </div>


                <div className="best-option-grid">

                  <div>

                    <span>
                      AIRLINE
                    </span>

                    <h2>
                      {bestAirline.airline}
                    </h2>

                  </div>


                  <div>

                    <span>
                      LOWEST FARE
                    </span>

                    <strong>
                      {money(
                        bestAirline
                          .cheapestFare
                          .current_fare
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      EXPECTED FARE
                    </span>

                    <strong>
                      {money(
                        bestAirline
                          .cheapestFare
                          .expected_fare
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      DECISION
                    </span>

                    <strong
                      className={
                        recommendationClass(
                          bestAirline
                            .cheapestFare
                            .recommendation
                        )
                      }
                    >
                      {
                        bestAirline
                          .cheapestFare
                          .recommendation
                      }
                    </strong>

                  </div>

                </div>

              </section>


              <h2 className="comparison-title">
                Airline Comparison
              </h2>


              <section className="airline-grid">

                {airlines.map(
                  (airline) => (

                    <article
                      className={
                        `airline-card ${
                          bestAirline.airline ===
                          airline.airline
                            ? "winner"
                            : ""
                        }`
                      }
                      key={
                        airline.airline
                      }
                    >

                      {bestAirline.airline ===
                        airline.airline && (

                        <div className="winner-badge">
                          BEST PRICE
                        </div>

                      )}


                      <div className="airline-card-header">

                        <span>
                          AIRLINE
                        </span>

                        <h2>
                          {airline.airline}
                        </h2>

                      </div>


                      <div className="comparison-metric">

                        <span>
                          LOWEST FARE
                        </span>

                        <strong>
                          {money(
                            airline
                              .cheapestFare
                              .current_fare
                          )}
                        </strong>

                      </div>


                      <div className="comparison-row">

                        <span>
                          Expected Fare
                        </span>

                        <strong>
                          {money(
                            airline
                              .cheapestFare
                              .expected_fare
                          )}
                        </strong>

                      </div>


                      <div className="comparison-row">

                        <span>
                          Average Fare
                        </span>

                        <strong>
                          {money(
                            airline.averageFare
                          )}
                        </strong>

                      </div>


                      <div className="comparison-row">

                        <span>
                          Difference
                        </span>

                        <strong
                          className={
                            airline
                              .differencePercent <= 0
                              ? "good"
                              : "bad"
                          }
                        >
                          {airline
                            .differencePercent
                            .toFixed(2)}
                          %
                        </strong>

                      </div>


                      <div className="comparison-recommendation">

                        <span>
                          AIRWISE DECISION
                        </span>

                        <strong
                          className={
                            recommendationClass(
                              airline
                                .cheapestFare
                                .recommendation
                            )
                          }
                        >
                          {
                            airline
                              .cheapestFare
                              .recommendation
                          }
                        </strong>

                      </div>


                      <Link
                        to={`/fare/${airline.cheapestFare.id}`}
                        className="view-analysis"
                      >
                        View AI Analysis →
                      </Link>

                    </article>

                  )
                )}

              </section>


              <section className="comparison-table-section">

                <h2>
                  Side-by-Side Comparison
                </h2>

                <div className="comparison-table-wrapper">

                  <table>

                    <thead>

                      <tr>

                        <th>
                          Airline
                        </th>

                        <th>
                          Lowest Fare
                        </th>

                        <th>
                          Expected
                        </th>

                        <th>
                          Difference
                        </th>

                        <th>
                          Anomaly
                        </th>

                        <th>
                          Decision
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {airlines.map(
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
                                  fare.current_fare
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
                                    fare.fare_difference_percent ||
                                      0
                                  ) <= 0
                                    ? "good"
                                    : "bad"
                                }
                              >
                                {Number(
                                  fare.fare_difference_percent ||
                                    0
                                ).toFixed(2)}
                                %
                              </td>

                              <td>
                                {
                                  fare.anomaly_status
                                }
                              </td>

                              <td>
                                {
                                  fare.recommendation
                                }
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


        {!loading &&
          searched &&
          airlines.length === 0 &&
          !error && (

            <div className="no-results">

              <h2>
                No fare data found
              </h2>

              <p>
                Try another route.
              </p>

            </div>

          )}

      </main>

    </div>
  );
}

export default RouteComparison;