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

const API_URL = "http://127.0.0.1:8000";

function FareDetails() {
  const { id } = useParams();

  const [fare, setFare] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [anomalyLoading, setAnomalyLoading] = useState(false);

  const [error, setError] = useState("");


  // ============================================================
  // LOAD DATA
  // ============================================================

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

      if (!response.ok) {

        throw new Error(
          fareData.detail ||
            fareData.message ||
            "Fare not found."
        );

      }

      setFare(fareData);


      // ========================================================
      // TREND
      // ========================================================

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


        if (trendResponse.ok) {

          const trendResult =
            await trendResponse.json();

          setTrendData(
            trendResult.data || []
          );

        }

      } catch (error) {

        console.error(
          "Trend error:",
          error
        );

        setTrendData([]);

      } finally {

        setTrendLoading(false);

      }


      // ========================================================
      // ANOMALIES
      // ========================================================

      setAnomalyLoading(true);

      try {

        const anomalyResponse =
          await fetch(
            `${API_URL}/anomalies`
          );


        if (anomalyResponse.ok) {

          const anomalyResult =
            await anomalyResponse.json();

          setAnomalies(
            anomalyResult.data || []
          );

        }

      } catch (error) {

        console.error(
          "Anomaly error:",
          error
        );

        setAnomalies([]);

      } finally {

        setAnomalyLoading(false);

      }

    } catch (error) {

      console.error(
        "Fare detail error:",
        error
      );

      setError(
        error.message ||
          "Unable to load fare analysis."
      );

    } finally {

      setLoading(false);

    }

  };


  const number = (value) => {

    const result =
      Number(value);

    return Number.isNaN(result)
      ? 0
      : result;

  };


  const money = (value) => {

    return `₹${number(
      value
    ).toLocaleString("en-IN")}`;

  };


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


  let statusClass = "normal";

  if (status === "HIGH") {
    statusClass = "high";
  } else if (status === "MEDIUM") {
    statusClass = "medium";
  } else if (status === "LOW") {
    statusClass = "low";
  }


  let recommendationClass =
    "monitor";

  if (recommendation === "BOOK NOW") {
    recommendationClass = "book";
  } else if (recommendation === "WAIT") {
    recommendationClass = "wait";
  }


  if (loading) {

    return (

      <div className="fare-details-page">

        <div className="details-message">

          <div className="details-spinner"></div>

          <h2>
            Loading Fare Analysis...
          </h2>

          <p>
            AIRWISE is retrieving fare intelligence.
          </p>

        </div>

      </div>

    );

  }


  if (error) {

    return (

      <div className="fare-details-page">

        <div className="details-message">

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

      </div>

    );

  }


  if (!fare) {
    return null;
  }


  return (

    <div className="fare-details-page">

      <main className="details-main">

        {/* BACK */}

        <Link
          to="/search"
          className="back-link"
        >
          ← Back to Fare Search
        </Link>


        {/* TITLE */}

        <section className="details-title">

          <span>
            AIRWISE AI ANALYSIS
          </span>

          <h1>
            Fare Intelligence Report
          </h1>

          <p>
            Detailed analysis of the selected
            airfare observation.
          </p>

        </section>


        {/* ROUTE */}

        <section className="route-card">

          <div>

            <span className="field-label">
              AIRLINE
            </span>

            <h2>
              {fare.airline}
            </h2>

          </div>


          <div className="route-display">

            <div>

              <strong>
                {fare.origin}
              </strong>

              <span>
                Origin
              </span>

            </div>


            <div className="route-line">
              →
            </div>


            <div>

              <strong>
                {fare.destination}
              </strong>

              <span>
                Destination
              </span>

            </div>

          </div>

        </section>


        {/* FARE COMPARISON */}

        <section className="analysis-section">

          <div className="section-heading">

            <span>
              PRICE INTELLIGENCE
            </span>

            <h2>
              Fare Comparison
            </h2>

          </div>


          <div className="metrics-grid">

            <div className="metric-card">

              <span>
                CURRENT FARE
              </span>

              <strong>
                {money(
                  fare.current_fare ??
                    fare.total_fare
                )}
              </strong>

              <p>
                Observed airfare
              </p>

            </div>


            <div className="metric-card">

              <span>
                EXPECTED FARE
              </span>

              <strong>
                {money(
                  fare.expected_fare
                )}
              </strong>

              <p>
                AIRWISE expected baseline
              </p>

            </div>


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


        {/* AI */}

        <section className="analysis-section">

          <div className="section-heading">

            <span>
              MACHINE LEARNING
            </span>

            <h2>
              AI Analysis
            </h2>

          </div>


          <div className="analysis-grid">

            <div className="analysis-card">

              <span>
                ANOMALY SCORE
              </span>

              <strong className="anomaly-score">
                {anomalyScore.toFixed(2)}
              </strong>

              <p>
                Measures how unusual this fare
                is compared with comparable fares.
              </p>

            </div>


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
                AIRWISE classification of the fare.
              </p>

            </div>

          </div>

        </section>


        {/* TREND */}

        <section className="trend-section">

          <div className="section-heading">

            <span>
              MARKET ANALYTICS
            </span>

            <h2>
              Fare Trend
            </h2>

          </div>


          <p className="trend-description">
            Current fares compared with AIRWISE
            expected pricing.
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


        {/* ANOMALY */}

        <section className="anomaly-section">

          <div className="section-heading">

            <span>
              MACHINE LEARNING
            </span>

            <h2>
              Anomaly Detection
            </h2>

          </div>


          <p className="anomaly-description">

            AIRWISE identifies fare observations
            that differ from comparable pricing patterns.

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


          <div className="anomaly-list">

            <h3>
              Detected Unusual Fares
            </h3>


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


        {/* RECOMMENDATION */}

        <section className="analysis-section">

          <div className="section-heading">

            <span>
              DECISION ENGINE
            </span>

            <h2>
              AIRWISE Recommendation
            </h2>

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
                : recommendation === "WAIT"
                ? "↓"
                : "◉"}

            </div>


            <div>

              <span>
                RECOMMENDED ACTION
              </span>

              <h2>
                {fare.recommendation ||
                  "MONITOR"}
              </h2>

              <p>
                {fare.recommendation_reason ||
                  "AIRWISE completed the fare analysis."}
              </p>

            </div>

          </div>

        </section>


        {/* EXPLANATION */}

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
              expected fare calculated by AIRWISE.
              This indicates a potentially attractive
              booking opportunity.
            </p>

          ) : difference > 0 ? (

            <p>
              The current fare is above the
              expected fare. AIRWISE recommends
              monitoring the price before booking.
            </p>

          ) : (

            <p>
              The current fare is approximately equal
              to the expected fare for this comparable
              fare group.
            </p>

          )}

        </section>


        {/* ACTIONS */}

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

      </main>

    </div>

  );
}

export default FareDetails;