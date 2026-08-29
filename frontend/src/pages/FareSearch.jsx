import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import "./FareSearch.css";

const API_URL = "http://127.0.0.1:8000";

function FareSearch() {

  const [searchParams] =
    useSearchParams();


  const [origin, setOrigin] =
    useState(
      searchParams.get("origin")?.toUpperCase() ||
        "DEL"
    );


  const [destination, setDestination] =
    useState(
      searchParams.get("destination")?.toUpperCase() ||
        "BOM"
    );


  const [fares, setFares] =
    useState([]);


  const [route, setRoute] =
    useState(null);


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState("");


  // ============================================================
  // URL SEARCH
  // ============================================================

  useEffect(() => {

    const urlOrigin =
      searchParams.get("origin");

    const urlDestination =
      searchParams.get("destination");

    if (
      urlOrigin &&
      urlDestination
    ) {

      setOrigin(
        urlOrigin.toUpperCase()
      );

      setDestination(
        urlDestination.toUpperCase()
      );

      searchFares(
        urlOrigin,
        urlDestination
      );

    }

  }, [searchParams]);


  // ============================================================
  // SEARCH
  // ============================================================

  const searchFares = async (
    from = origin,
    to = destination
  ) => {

    const cleanOrigin =
      String(from)
        .trim()
        .toUpperCase();

    const cleanDestination =
      String(to)
        .trim()
        .toUpperCase();


    if (
      cleanOrigin.length !== 3 ||
      cleanDestination.length !== 3
    ) {

      setError(
        "Please enter valid 3-letter airport codes."
      );

      return;

    }


    try {

      setLoading(true);

      setError("");

      setFares([]);

      setRoute(null);


      const response =
        await fetch(
          `${API_URL}/search?origin=${encodeURIComponent(
            cleanOrigin
          )}&destination=${encodeURIComponent(
            cleanDestination
          )}`
        );


      const data =
        await response.json();


      console.log(
        "AIRWISE SEARCH:",
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


      setRoute(
        data.route
      );

      setFares(
        data.fares || []
      );


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


  // ============================================================
  // FORM
  // ============================================================

  const handleSubmit = (
    event
  ) => {

    event.preventDefault();

    searchFares();

  };


  // ============================================================
  // HELPERS
  // ============================================================

  const money = (value) => {

    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;

  };


  const recommendationClass = (
    recommendation
  ) => {

    const value =
      String(
        recommendation || ""
      ).toUpperCase();


    if (value === "BOOK NOW") {
      return "recommend-book";
    }

    if (value === "WAIT") {
      return "recommend-wait";
    }

    return "recommend-monitor";

  };


  const statusClass = (
    status
  ) => {

    const value =
      String(
        status || "NORMAL"
      ).toUpperCase();


    if (value === "HIGH") {
      return "status-high";
    }

    if (value === "MEDIUM") {
      return "status-medium";
    }

    if (value === "LOW") {
      return "status-low";
    }

    return "status-normal";

  };


  return (
    <div className="fare-search-page">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="search-header">

        <span>
          AIRWISE INTELLIGENCE
        </span>

        <h1>
          Fare Search
        </h1>

        <p>
          Find and compare airfare intelligence
          for your selected route.
        </p>

      </section>


      {/* ======================================================
          SEARCH FORM
      ====================================================== */}

      <form
        className="search-box"
        onSubmit={handleSubmit}
      >

        <div className="input-group">

          <label>
            Origin
          </label>

          <input
            type="text"
            value={origin}
            maxLength={3}
            placeholder="DEL"
            onChange={(event) =>
              setOrigin(
                event.target.value.toUpperCase()
              )
            }
          />

        </div>


        <div className="route-arrow">
          →
        </div>


        <div className="input-group">

          <label>
            Destination
          </label>

          <input
            type="text"
            value={destination}
            maxLength={3}
            placeholder="BOM"
            onChange={(event) =>
              setDestination(
                event.target.value.toUpperCase()
              )
            }
          />

        </div>


        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Searching..."
            : "Search Fares"}
        </button>

      </form>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="search-error">
          {error}
        </div>

      )}


      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (

        <div className="search-loading">

          <div className="search-spinner"></div>

          <h3>
            AIRWISE is analyzing fares...
          </h3>

          <p>
            Checking PostgreSQL fare intelligence.
          </p>

        </div>

      )}


      {/* ======================================================
          RESULTS
      ====================================================== */}

      {!loading &&
        fares.length > 0 && (

          <section className="results-container">

            <div className="results-header">

              <div>

                <span>
                  SEARCH RESULTS
                </span>

                <h2>

                  {route?.origin ||
                    origin}

                  <span className="result-arrow">
                    →
                  </span>

                  {route?.destination ||
                    destination}

                </h2>

              </div>


              <div className="result-count">

                {fares.length}

                <span>
                  fares found
                </span>

              </div>

            </div>


            {/* BEST FARE */}

            <div className="best-fare-card">

              <div className="best-badge">
                ★ BEST FARE
              </div>


              <div className="best-fare-content">

                <div>

                  <span>
                    AIRLINE
                  </span>

                  <h2>
                    {fares[0].airline}
                  </h2>

                </div>


                <div>

                  <span>
                    CURRENT FARE
                  </span>

                  <strong className="best-price">

                    {money(
                      fares[0].current_fare
                    )}

                  </strong>

                </div>


                <div>

                  <span>
                    EXPECTED FARE
                  </span>

                  <strong>

                    {money(
                      fares[0].expected_fare
                    )}

                  </strong>

                </div>


                <div>

                  <span>
                    AIRWISE DECISION
                  </span>

                  <strong
                    className={
                      recommendationClass(
                        fares[0]
                          .recommendation
                      )
                    }
                  >
                    {
                      fares[0]
                        .recommendation
                    }
                  </strong>

                </div>

              </div>

            </div>


            {/* ALL FARES */}

            <h2 className="all-fares-title">
              All Fare Options
            </h2>


            <div className="fare-grid">

              {fares.map(
                (fare) => (

                  <article
                    className={
                      `fare-card ${
                        fare.is_best_fare
                          ? "best-card"
                          : ""
                      }`
                    }
                    key={fare.id}
                  >

                    <div className="fare-card-header">

                      <div>

                        <span>
                          AIRLINE
                        </span>

                        <h2>
                          {fare.airline}
                        </h2>

                      </div>


                      {fare.is_best_fare && (

                        <span className="mini-best">
                          BEST
                        </span>

                      )}

                    </div>


                    <div className="fare-price">

                      <span>
                        CURRENT FARE
                      </span>

                      <strong>
                        {money(
                          fare.current_fare
                        )}
                      </strong>

                    </div>


                    <div className="fare-details">

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

                        <strong
                          className={
                            Number(
                              fare.fare_difference_percent ||
                                0
                            ) <= 0
                              ? "difference-good"
                              : "difference-bad"
                          }
                        >
                          {Number(
                            fare.fare_difference_percent ||
                              0
                          ).toFixed(2)}
                          %
                        </strong>

                      </div>

                    </div>


                    <div className="fare-analysis">

                      <div>

                        <span>
                          ANOMALY SCORE
                        </span>

                        <strong>
                          {Number(
                            fare.anomaly_score ||
                              0
                          ).toFixed(2)}
                        </strong>

                      </div>


                      <div>

                        <span>
                          STATUS
                        </span>

                        <div
                          className={
                            `status-badge ${
                              statusClass(
                                fare.anomaly_status
                              )
                            }`
                          }
                        >
                          {fare.anomaly_status ||
                            "NORMAL"}
                        </div>

                      </div>

                    </div>


                    <div className="fare-recommendation">

                      <span>
                        AIRWISE RECOMMENDATION
                      </span>

                      <strong
                        className={
                          recommendationClass(
                            fare.recommendation
                          )
                        }
                      >
                        {fare.recommendation ||
                          "MONITOR"}
                      </strong>

                    </div>


                    <div className="fare-reason">

                      <p>
                        {fare.recommendation_reason ||
                          "AIRWISE recommendation generated from fare analysis."}
                      </p>

                    </div>


                    <Link
                      to={`/fare/${fare.id}`}
                      className="analysis-button"
                    >
                      View AI Analysis →
                    </Link>

                  </article>

                )
              )}

            </div>

          </section>

        )}


      {!loading &&
        !error &&
        fares.length === 0 && (

          <div className="empty-results">

            <h2>
              Search for a route
            </h2>

            <p>
              Enter airport codes such as
              DEL and BOM to view fare intelligence.
            </p>

          </div>

        )}

    </div>
  );
}

export default FareSearch;