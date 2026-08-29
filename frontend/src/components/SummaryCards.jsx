function SummaryCards({ summary }) {

  if (!summary) {
    return null;
  }

  return (
    <section className="summary-grid">

      <div className="summary-card">
        <p>Total Fares</p>

        <h2>
          {summary.total_fares ?? 0}
        </h2>

        <span>
          Fare observations analyzed
        </span>
      </div>

      <div className="summary-card">
        <p>Unusual Fares</p>

        <h2>
          {summary.unusual_fares ?? 0}
        </h2>

        <span>
          Potential anomalies detected
        </span>
      </div>

      <div className="summary-card">
        <p>Book Now</p>

        <h2>
          {summary.book_now ?? 0}
        </h2>

        <span>
          Good booking opportunities
        </span>
      </div>

      <div className="summary-card">
        <p>Monitor</p>

        <h2>
          {summary.monitor ?? 0}
        </h2>

        <span>
          Prices worth monitoring
        </span>
      </div>

    </section>
  );
}

export default SummaryCards;