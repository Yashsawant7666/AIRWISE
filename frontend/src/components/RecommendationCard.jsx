function RecommendationCard({ data }) {

  if (!data) {
    return null;
  }

  const status =
    data.anomaly_status || "NORMAL";

  const recommendation =
    data.recommendation || "MONITOR";


  const differencePercent =
    Number(data.fare_difference_percent || 0);


  const isGoodDeal =
    differencePercent < 0;


  return (

    <section className="recommendation-section">


      {/* HEADER */}

      <div className="recommendation-header">

        <div>

          <p className="small-label">
            AI FARE ANALYSIS
          </p>

          <h2>
            {data.airline}
          </h2>

          <p className="route">

            {data.route?.origin}

            <span className="arrow">
              →
            </span>

            {data.route?.destination}

          </p>

        </div>


        <div
          className={
            `recommendation-badge ${
              recommendation
                .toLowerCase()
                .replace(" ", "-")
            }`
          }
        >

          {recommendation}

        </div>

      </div>


      {/* DEAL MESSAGE */}

      <div className="deal-message">

        <div className="deal-icon">

          {isGoodDeal ? "✓" : "!"}

        </div>

        <div>

          <strong>

            {isGoodDeal
              ? "Potentially good booking opportunity"
              : "Fare requires monitoring"}

          </strong>

          <p>

            Current fare is{" "}

            <b>
              {Math.abs(differencePercent).toFixed(2)}%
            </b>{" "}

            {isGoodDeal
              ? "below"
              : "above"}{" "}

            the expected fare.

          </p>

        </div>

      </div>


      {/* FARE CARDS */}

      <div className="fare-comparison">


        <div className="fare-box">

          <span>
            CURRENT FARE
          </span>

          <strong>
            ₹{Number(data.current_fare).toLocaleString()}
          </strong>

        </div>


        <div className="fare-box expected">

          <span>
            EXPECTED FARE
          </span>

          <strong>
            ₹{Number(data.expected_fare).toLocaleString()}
          </strong>

        </div>


        <div className="fare-box">

          <span>
            DIFFERENCE
          </span>

          <strong
            className={
              data.fare_difference < 0
                ? "price-good"
                : "price-high"
            }
          >

            {data.fare_difference < 0
              ? "-"
              : "+"}

            ₹
            {Math.abs(
              Number(data.fare_difference)
            ).toLocaleString()}

          </strong>

        </div>


        <div className="fare-box">

          <span>
            DIFFERENCE %
          </span>

          <strong
            className={
              differencePercent < 0
                ? "price-good"
                : "price-high"
            }
          >

            {differencePercent > 0
              ? "+"
              : ""}

            {differencePercent.toFixed(2)}%

          </strong>

        </div>

      </div>


      {/* ANALYSIS */}

      <div className="analysis-section">

        <div className="analysis-title">

          <h3>
            AIRWISE Analysis
          </h3>

          <span>
            ML-powered result
          </span>

        </div>


        <div className="analysis-grid">


          <div className="analysis-item">

            <span className="label">
              Anomaly Score
            </span>

            <strong className="score">

              {Number(
                data.anomaly_score || 0
              ).toFixed(2)}

            </strong>

          </div>


          <div className="analysis-item">

            <span className="label">
              Anomaly Status
            </span>

            <strong
              className={
                `status-text ${status.toLowerCase()}`
              }
            >

              {status}

            </strong>

          </div>


          <div className="analysis-item">

            <span className="label">
              Price Position
            </span>

            <strong>

              {differencePercent < 0
                ? "Below Expected"
                : differencePercent > 0
                ? "Above Expected"
                : "At Expected"}

            </strong>

          </div>

        </div>

      </div>


      {/* REASON */}

      <div className="reason-box">

        <div className="reason-heading">

          <span className="ai-icon">
            AI
          </span>

          <h3>
            Why AIRWISE recommends this
          </h3>

        </div>

        <p>

          {data.recommendation_reason}

        </p>

      </div>


    </section>

  );
}

export default RecommendationCard;