import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import FareTrend from "../components/FareTrend";
import AnomalyChart from "../components/AnomalyChart";

import "./FareDetails.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://airwise-api.onrender.com";


function FareDetails() {

  const { id } =
    useParams();


  const [fare, setFare] =
    useState(null);


  const [trendData, setTrendData] =
    useState([]);


  const [anomalies, setAnomalies] =
    useState([]);


  const [loading, setLoading] =
    useState(true);


  const [trendLoading, setTrendLoading] =
    useState(false);


  const [anomalyLoading, setAnomalyLoading] =
    useState(false);


  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD FARE
  // ==========================================================

  useEffect(() => {

    loadFare();

  }, [id]);


  const loadFare = async () => {

    try {

      setLoading(true);

      setError("");


      const response =
        await fetch(
          `${API_URL}/fare/${id}`
        );


      const fareData =
        await response.json();


      if (
        !response.ok
      ) {

        throw new Error(
          fareData.detail ||
          fareData.message ||
          "Fare not found."
        );

      }


      setFare(
        fareData
      );


      // ======================================================
      // TREND
      // ======================================================

      setTrendLoading(true);


      try {

        const trendResponse =
          await fetch(
            `${API_URL}/fare-trend?origin=${encodeURIComponent(
              fareData.origin
            )}&destination=${encodeURIComponent(
              fareData.destination
            )}`
          );


        if (
          trendResponse.ok
        ) {

          const trendResult =
            await trendResponse.json();


          setTrendData(
            Array.isArray(
              trendResult.data
            )
              ? trendResult.data
              : []
          );

        }

      } catch (trendError) {

        console.error(
          "Trend error:",
          trendError
        );


        setTrendData([]);

      } finally {

        setTrendLoading(false);

      }


      // ======================================================
      // ANOMALIES
      // ======================================================

      setAnomalyLoading(true);


      try {

        const anomalyResponse =
          await fetch(
            `${API_URL}/anomalies`
          );


        if (
          anomalyResponse.ok
        ) {

          const anomalyResult =
            await anomalyResponse.json();


          setAnomalies(
            Array.isArray(
              anomalyResult.data
            )
              ? anomalyResult.data
              : []
          );

        }

      } catch (anomalyError) {

        console.error(
          "Anomaly error:",
          anomalyError
        );


        setAnomalies([]);

      } finally {

        setAnomalyLoading(false);

      }

    } catch (loadError) {

      console.error(
        "Fare detail error:",
        loadError
      );


      setError(
        loadError.message ||
        "Unable to load fare analysis."
      );

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // HELPERS
  // ==========================================================

  const number =
    (value) => {

      const result =
        Number(value);


      return Number.isNaN(result)
        ? 0
        : result;

    };


  const money =
    (value) => {

      return `₹${number(
        value
      ).toLocaleString(
        "en-IN"
      )}`;

    };


  // ==========================================================
  // SAFE FARE VALUES
  // ==========================================================

  const difference =
    number(
      fare?.fare_difference
    );


  const differencePercent =
    number(
      fare?.fare_difference_percent
    );


  const anomalyScore =
    number(
      fare?.anomaly_score
    );


  const currentFare =
    number(
      fare?.current_fare ??
      fare?.total_fare
    );


  const expectedFare =
    number(
      fare?.expected_fare
    );


  const status =
    String(
      fare?.anomaly_status ||
      "NORMAL"
    ).toUpperCase();


  const recommendation =
    String(
      fare?.recommendation ||
      "MONITOR"
    ).toUpperCase();


  // ==========================================================
  // STATUS
  // ==========================================================

  let statusClass =
    "normal";


  if (
    status === "HIGH"
  ) {

    statusClass = "high";

  } else if (
    status === "MEDIUM"
  ) {

    statusClass = "medium";

  } else if (
    status === "LOW"
  ) {

    statusClass = "low";

  }


  // ==========================================================
  // RECOMMENDATION
  // ==========================================================

  let recommendationClass =
    "monitor";


  if (
    recommendation ===
    "BOOK NOW"
  ) {

    recommendationClass =
      "book";

  } else if (
    recommendation ===
    "WAIT"
  ) {

    recommendationClass =
      "wait";

  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div className="fare-details-page">

        <main className="fare-details-container">

          <div className="details-message">

            <div className="details-spinner"></div>


            <span>
              AIRWISE INTELLIGENCE
            </span>


            <h2>
              Loading Fare Analysis...
            </h2>


            <p>
              Retrieving fare, trend and
              anomaly intelligence.
            </p>

          </div>

        </main>

      </div>

    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (

      <div className="fare-details-page">

        <main className="fare-details-container">

          <div className="details-message error">

            <div className="details-error-icon">
              !
            </div>


            <span>
              AIRWISE INTELLIGENCE
            </span>


            <h2>
              Fare Analysis Unavailable
            </h2>


            <p>
              {error}
            </p>


            <Link
              to="/search"
              className="details-button"
            >
              ← Back to Fare Search
            </Link>

          </div>

        </main>

      </div>

    );

  }


  if (!fare) {

    return null;

  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div className="fare-details-page">

      <main className="fare-details-container">


        {/* ====================================================
            BACK
        ==================================================== */}

        <Link
          to="/search"
          className="back-link"
        >
          ← Back to Fare Search
        </Link>


        {/* ====================================================
            HEADER
        ==================================================== */}

        <section className="details-title">

          <div className="details-title-label">
            AIRWISE AI ANALYSIS
          </div>


          <div className="details-title-row">

            <div>

              <h1>
                Fare Intelligence Report
              </h1>


              <p>
                Detailed analysis of the selected
                airfare observation.
              </p>

            </div>


            <div
              className={
                `header-status ${recommendationClass}`
              }
            >

              <span>
                RECOMMENDED ACTION
              </span>


              <strong>
                {recommendation}
              </strong>

            </div>

          </div>

        </section>


        {/* ====================================================
            ROUTE HERO
        ==================================================== */}

        <section className="route-card">


          <div className="route-airline">

            <span>
              AIRLINE
            </span>


            <strong>
              {fare.airline}
            </strong>

          </div>


          <div className="route-display">


            <div className="route-airport">

              <strong>
                {fare.origin}
              </strong>

              <span>
                ORIGIN
              </span>

            </div>


            <div className="route-connection">

              <div className="route-connection-line"></div>

              <div className="route-plane">
                ✈
              </div>

            </div>


            <div className="route-airport">

              <strong>
                {fare.destination}
              </strong>

              <span>
                DESTINATION
              </span>

            </div>

          </div>

        </section>


        {/* ====================================================
            PRICE INTELLIGENCE
        ==================================================== */}

        <section className="analysis-section">


          <div className="section-heading">

            <div>

              <span>
                PRICE INTELLIGENCE
              </span>


              <h2>
                Fare Comparison
              </h2>

            </div>


            <span className="section-tag">
              OBSERVED DATA
            </span>

          </div>


          <div className="metrics-grid">


            {/* CURRENT */}

            <div className="metric-card featured">

              <span>
                CURRENT FARE
              </span>


              <strong>
                {money(
                  currentFare
                )}
              </strong>


              <p>
                Observed airfare
              </p>

            </div>


            {/* EXPECTED */}

            <div className="metric-card">

              <span>
                EXPECTED FARE
              </span>


              <strong>
                {money(
                  expectedFare
                )}
              </strong>


              <p>
                AIRWISE expected baseline
              </p>

            </div>


            {/* DIFFERENCE */}

            <div className="metric-card">

              <span>
                DIFFERENCE
              </span>


              <strong
                className={
                  difference < 0
                    ? "good-value"
                    : difference > 0
                    ? "bad-value"
                    : ""
                }
              >

                {difference > 0
                  ? "+"
                  : ""}

                {money(
                  difference
                )}

              </strong>


              <p>
                Current minus expected
              </p>

            </div>


            {/* DIFFERENCE % */}

            <div className="metric-card">

              <span>
                DIFFERENCE %
              </span>


              <strong
                className={
                  differencePercent < 0
                    ? "good-value"
                    : differencePercent > 0
                    ? "bad-value"
                    : ""
                }
              >

                {differencePercent > 0
                  ? "+"
                  : ""}

                {differencePercent.toFixed(2)}
                %

              </strong>


              <p>
                Relative price difference
              </p>

            </div>

          </div>

        </section>


        {/* ====================================================
            AI ANALYSIS
        ==================================================== */}

        <section className="analysis-section">


          <div className="section-heading">

            <div>

              <span>
                MACHINE LEARNING
              </span>


              <h2>
                AI Analysis
              </h2>

            </div>


            <span className="section-tag">
              MODEL SIGNAL
            </span>

          </div>


          <div className="analysis-grid">


            {/* ANOMALY */}

            <div className="analysis-card">

              <span>
                ANOMALY SCORE
              </span>


              <strong className="anomaly-score">
                {anomalyScore.toFixed(2)}
              </strong>


              <div className="score-meter">

                <div
                  style={{
                    width:
                      `${Math.min(
                        100,
                        anomalyScore * 10
                      )}%`,
                  }}
                ></div>

              </div>


              <p>
                Measures how unusual this fare
                is compared with comparable fares.
              </p>

            </div>


            {/* STATUS */}

            <div className="analysis-card">

              <span>
                ANOMALY STATUS
              </span>


              <div
                className={
                  `status-badge ${statusClass}`
                }
              >
                {status}
              </div>


              <p>
                AIRWISE classification of the
                selected fare observation.
              </p>

            </div>

          </div>

        </section>


        {/* ====================================================
            TREND
        ==================================================== */}

        <section className="trend-section">


          <div className="section-heading">

            <div>

              <span>
                MARKET ANALYTICS
              </span>


              <h2>
                Fare Trend
              </h2>

            </div>


            <span className="section-tag">
              ROUTE HISTORY
            </span>

          </div>


          <p className="trend-description">

            Current fares compared with AIRWISE
            expected pricing across the selected route.

          </p>


          <div className="trend-card">

            {trendLoading ? (

              <div className="trend-loading">

                <div className="details-spinner"></div>


                <p>
                  Loading fare trend...
                </p>

              </div>

            ) : (

              <FareTrend
                data={trendData}
              />

            )}

          </div>

        </section>


        {/* ====================================================
            ANOMALY DETECTION
        ==================================================== */}

        <section className="anomaly-section">


          <div className="section-heading">

            <div>

              <span>
                MACHINE LEARNING
              </span>


              <h2>
                Anomaly Detection
              </h2>

            </div>


            <span className="section-tag">
              OUTLIER MONITOR
            </span>

          </div>


          <p className="anomaly-description">

            AIRWISE identifies fare observations
            that differ significantly from
            comparable pricing patterns.

          </p>


          <div className="anomaly-card">

            {anomalyLoading ? (

              <div className="trend-loading">

                <div className="details-spinner"></div>


                <p>
                  Loading anomaly analysis...
                </p>

              </div>

            ) : (

              <AnomalyChart
                data={anomalies}
              />

            )}

          </div>


          {/* DETECTED LIST */}

          <div className="anomaly-list">

            <div className="anomaly-list-heading">

              <h3>
                Detected Unusual Fares
              </h3>


              <span>
                {anomalies.length} signals
              </span>

            </div>


            {anomalies.length === 0 ? (

              <p className="no-anomalies">
                No unusual fares were detected.
              </p>

            ) : (

              anomalies.map(
                (item) => (

                  <div
                    className="anomaly-item"
                    key={item.id}
                  >


                    <div>

                      <strong>

                        {item.origin}

                        {" → "}

                        {item.destination}

                      </strong>


                      <span>
                        {item.airline}
                      </span>

                    </div>


                    <div>

                      <span>
                        CURRENT
                      </span>


                      <strong>
                        {money(
                          item.current_fare
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        EXPECTED
                      </span>


                      <strong>
                        {money(
                          item.expected_fare
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        SCORE
                      </span>


                      <strong>
                        {number(
                          item.anomaly_score
                        ).toFixed(2)}
                      </strong>

                    </div>


                    <div>

                      <span
                        className={
                          `anomaly-label ${
                            String(
                              item.anomaly_status ||
                              "normal"
                            ).toLowerCase()
                          }`
                        }
                      >

                        {item.anomaly_status}

                      </span>

                    </div>

                  </div>

                )

              )

            )}

          </div>

        </section>


        {/* ====================================================
            FINAL RECOMMENDATION
        ==================================================== */}

        <section className="analysis-section">


          <div className="section-heading">

            <div>

              <span>
                DECISION ENGINE
              </span>


              <h2>
                AIRWISE Recommendation
              </h2>

            </div>


            <span className="section-tag">
              FINAL SIGNAL
            </span>

          </div>


          <div
            className={
              `final-recommendation ${
                recommendationClass
              }`
            }
          >


            <div className="recommendation-icon">

              {recommendation ===
                "BOOK NOW"

                ? "✓"

                : recommendation ===
                  "WAIT"

                ? "↓"

                : "◉"}

            </div>


            <div>

              <span>
                RECOMMENDED ACTION
              </span>


              <h2>
                {recommendation}
              </h2>


              <p>

                {fare.recommendation_reason ||
                  "AIRWISE completed the fare analysis."}

              </p>

            </div>

          </div>

        </section>


        {/* ====================================================
            EXPLANATION
        ==================================================== */}

        <section className="explanation-card">


          <span>
            DECISION EXPLANATION
          </span>


          <h2>
            Why AIRWISE made this decision
          </h2>


          {difference < 0 ? (

            <p>
              The current fare is below the
              AIRWISE expected fare. This indicates
              a potentially attractive booking
              opportunity.
            </p>

          ) : difference > 0 ? (

            <p>
              The current fare is above the
              AIRWISE expected fare. Monitoring the
              price may provide a better opportunity.
            </p>

          ) : (

            <p>
              The current fare is approximately equal
              to the expected fare for this comparable
              fare group.
            </p>

          )}

        </section>


        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="details-actions">

          <Link
            to="/search"
            className="details-button"
          >
            Search Another Fare
          </Link>


          <Link
            to="/"
            className="details-button secondary"
          >
            Back to Dashboard
          </Link>

        </div>


        {/* ====================================================
            FOOTER NOTE
        ==================================================== */}

        <div className="details-disclaimer">

          AIRWISE analytical output is based on
          available airfare observations, statistical
          baselines and anomaly signals.

        </div>

      </main>

    </div>

  );

}


export default FareDetails;