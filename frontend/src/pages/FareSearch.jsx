import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import "./FareSearch.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://airwise-api.onrender.com";


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


  // ==========================================================
  // URL SEARCH
  // ==========================================================

  useEffect(() => {

    const urlOrigin =
      searchParams.get("origin");

    const urlDestination =
      searchParams.get("destination");


    if (
      urlOrigin &&
      urlDestination
    ) {

      const cleanOrigin =
        urlOrigin.toUpperCase();

      const cleanDestination =
        urlDestination.toUpperCase();


      setOrigin(
        cleanOrigin
      );

      setDestination(
        cleanDestination
      );


      searchFares(
        cleanOrigin,
        cleanDestination
      );

    }

  }, [searchParams]);


  // ==========================================================
  // SEARCH FARES
  // ==========================================================

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
        "AIRWISE SEARCH RESPONSE:",
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
        data.route || null
      );


      setFares(
        Array.isArray(data.fares)
          ? data.fares
          : []
      );

    } catch (err) {

      console.error(
        "AIRWISE SEARCH ERROR:",
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
  // FORM SUBMIT
  // ==========================================================

  const handleSubmit =
    (event) => {

      event.preventDefault();

      searchFares();

    };


  // ==========================================================
  // SWAP ROUTE
  // ==========================================================

  const swapRoute =
    () => {

      setOrigin(
        destination
      );

      setDestination(
        origin
      );

    };


  // ==========================================================
  // MONEY
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
  // RECOMMENDATION CLASS
  // ==========================================================

  const recommendationClass =
    (recommendation) => {

      const value =
        String(
          recommendation || ""
        ).toUpperCase();


      if (
        value === "BOOK NOW"
      ) {

        return "recommend-book";

      }


      if (
        value === "WAIT"
      ) {

        return "recommend-wait";

      }


      return "recommend-monitor";

    };


  // ==========================================================
  // ANOMALY CLASS
  // ==========================================================

  const statusClass =
    (status) => {

      const value =
        String(
          status || "NORMAL"
        ).toUpperCase();


      if (
        value === "HIGH"
      ) {

        return "status-high";

      }


      if (
        value === "MEDIUM"
      ) {

        return "status-medium";

      }


      if (
        value === "LOW"
      ) {

        return "status-low";

      }


      return "status-normal";

    };


  // ==========================================================
  // BEST FARE
  // ==========================================================

  const bestFare =
    fares.length > 0
      ? fares[0]
      : null;


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="fare-search-page">

      <main className="fare-search-container">


        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="fare-search-hero">

          <div className="fare-search-eyebrow">
            AIRWISE INTELLIGENCE
          </div>


          <h1>
            Search smarter.
            <br />
            Book at the right time.
          </h1>


          <p>
            Compare domestic airfare observations,
            expected pricing, anomaly signals and
            AIRWISE booking recommendations.
          </p>


          <div className="fare-search-hero-meta">

            <span>
              FARE INTELLIGENCE
            </span>

            <span>
              ANOMALY DETECTION
            </span>

            <span>
              AI RECOMMENDATION
            </span>

          </div>

        </section>


        {/* ====================================================
            SEARCH BOX
        ==================================================== */}

        <section className="fare-search-box">


          <div className="fare-search-box-header">

            <div>

              <span>
                ROUTE ANALYZER
              </span>

              <h2>
                Search Airfare
              </h2>

            </div>


            <span className="fare-search-live">
              ● FARE DATA
            </span>

          </div>


          <form
            className="fare-search-form"
            onSubmit={handleSubmit}
          >


            {/* ORIGIN */}

            <div className="fare-search-field">

              <label>
                FROM
              </label>


              <input
                type="text"
                value={origin}
                maxLength={3}
                placeholder="DEL"
                onChange={(event) =>
                  setOrigin(
                    event.target.value
                      .toUpperCase()
                      .replace(
                        /[^A-Z]/g,
                        ""
                      )
                  )
                }
              />


              <small>
                Airport code
              </small>

            </div>


            {/* SWAP */}

            <button
              type="button"
              className="route-swap-button"
              onClick={swapRoute}
              aria-label="Swap route"
            >
              ⇄
            </button>


            {/* DESTINATION */}

            <div className="fare-search-field">

              <label>
                TO
              </label>


              <input
                type="text"
                value={destination}
                maxLength={3}
                placeholder="BOM"
                onChange={(event) =>
                  setDestination(
                    event.target.value
                      .toUpperCase()
                      .replace(
                        /[^A-Z]/g,
                        ""
                      )
                  )
                }
              />


              <small>
                Airport code
              </small>

            </div>


            {/* SEARCH */}

            <button
              type="submit"
              className="fare-search-submit"
              disabled={loading}
            >

              {loading
                ? "ANALYZING..."
                : "SEARCH FARES →"}

            </button>

          </form>

        </section>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (

          <div className="fare-search-error">

            <span>
              !
            </span>

            <div>

              <strong>
                Search unavailable
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

          <div className="fare-search-loading">

            <div className="fare-search-spinner"></div>


            <h3>
              AIRWISE is analyzing the route
            </h3>


            <p>
              Comparing observed fares with
              AIRWISE expected pricing.
            </p>

          </div>

        )}


        {/* ====================================================
            RESULTS
        ==================================================== */}

        {!loading &&
          fares.length > 0 && (

            <section className="fare-results-section">


              {/* RESULTS HEADER */}

              <div className="fare-results-header">


                <div>

                  <span>
                    SEARCH RESULTS
                  </span>


                  <h2>

                    {route?.origin ||
                      origin}

                    <b>
                      →
                    </b>

                    {route?.destination ||
                      destination}

                  </h2>

                </div>


                <div className="fare-result-count">

                  <strong>
                    {fares.length}
                  </strong>

                  <span>
                    fares
                  </span>

                </div>

              </div>


              {/* ==================================================
                  BEST FARE
              ================================================== */}

              {bestFare && (

                <div className="best-fare-card">


                  <div className="best-fare-glow"></div>


                  <div className="best-fare-label">
                    ★ BEST AVAILABLE FARE
                  </div>


                  <div className="best-fare-grid">


                    <div className="best-fare-airline">

                      <span>
                        AIRLINE
                      </span>

                      <strong>
                        {bestFare.airline}
                      </strong>

                      <small>
                        Lowest observed option
                      </small>

                    </div>


                    <div className="best-fare-price">

                      <span>
                        CURRENT FARE
                      </span>

                      <strong>
                        {money(
                          bestFare.current_fare
                        )}
                      </strong>

                    </div>


                    <div className="best-fare-price muted">

                      <span>
                        EXPECTED FARE
                      </span>

                      <strong>
                        {money(
                          bestFare.expected_fare
                        )}
                      </strong>

                    </div>


                    <div className="best-fare-action">

                      <span>
                        AIRWISE DECISION
                      </span>


                      <strong
                        className={
                          recommendationClass(
                            bestFare.recommendation
                          )
                        }
                      >
                        {bestFare.recommendation ||
                          "MONITOR"}
                      </strong>

                    </div>

                  </div>

                </div>

              )}


              {/* ==================================================
                  ALL FARES
              ================================================== */}

              <div className="fare-all-header">

                <div>

                  <span>
                    FARE MARKET
                  </span>

                  <h2>
                    Compare Options
                  </h2>

                </div>


                <span>
                  Sorted by current fare
                </span>

              </div>


              <div className="fare-grid">

                {fares.map(
                  (fare, index) => (

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


                      {/* CARD HEADER */}

                      <div className="fare-card-header">

                        <div>

                          <span>
                            {index === 0
                              ? "BEST OPTION"
                              : "AIRLINE"}
                          </span>


                          <h2>
                            {fare.airline}
                          </h2>

                        </div>


                        {fare.is_best_fare && (

                          <div className="mini-best">
                            BEST
                          </div>

                        )}

                      </div>


                      {/* PRICE */}

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


                      {/* DETAILS */}

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
                            ) > 0
                              ? "+"
                              : ""}

                            {Number(
                              fare.fare_difference_percent ||
                              0
                            ).toFixed(2)}

                            %

                          </strong>

                        </div>

                      </div>


                      {/* ANALYSIS */}

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


                      {/* RECOMMENDATION */}

                      <div className="fare-recommendation">

                        <span>
                          AIRWISE DECISION
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


                      {/* REASON */}

                      <div className="fare-reason">

                        <p>

                          {fare.recommendation_reason ||
                            "AIRWISE recommendation generated from fare analysis."}

                        </p>

                      </div>


                      {/* ACTION */}

                      <Link
                        to={`/fare/${fare.id}`}
                        className="analysis-button"
                      >

                        View AI Analysis

                        <span>
                          →
                        </span>

                      </Link>

                    </article>

                  )
                )}

              </div>

            </section>

          )}


        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!loading &&
          !error &&
          fares.length === 0 && (

            <div className="fare-empty-state">

              <div className="fare-empty-icon">
                ✈
              </div>


              <span>
                READY TO ANALYZE
              </span>


              <h2>
                Search for a domestic route
              </h2>


              <p>
                Enter airport codes such as DEL
                and BOM to compare airfare intelligence.
              </p>


              <div className="fare-example-routes">

                <button
                  onClick={() => {
                    setOrigin("DEL");
                    setDestination("BOM");
                  }}
                >
                  DEL → BOM
                </button>


                <button
                  onClick={() => {
                    setOrigin("BOM");
                    setDestination("DEL");
                  }}
                >
                  BOM → DEL
                </button>

              </div>

            </div>

          )}

      </main>

    </div>

  );

}


export default FareSearch;