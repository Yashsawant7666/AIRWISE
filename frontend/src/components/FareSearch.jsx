import { useState } from "react";

function FareSearch({ onSearch, loading }) {

  const [origin, setOrigin] = useState("DEL");
  const [destination, setDestination] = useState("BOM");
  const [airline, setAirline] = useState("IndiGo");

  const handleSubmit = (event) => {

    event.preventDefault();

    if (!origin || !destination || !airline) {
      return;
    }

    onSearch(
      origin.toUpperCase(),
      destination.toUpperCase(),
      airline
    );
  };

  return (
    <section className="search-section">

      <div className="section-heading">
        <p className="small-label">
          FARE ANALYSIS
        </p>

        <h2>
          Check Flight Fare
        </h2>

        <p>
          Enter a route and airline to receive
          an AI-powered booking recommendation.
        </p>
      </div>

      <form
        className="search-form"
        onSubmit={handleSubmit}
      >

        <div className="input-group">

          <label>
            Origin
          </label>

          <input
            type="text"
            placeholder="DEL"
            value={origin}
            onChange={(e) =>
              setOrigin(e.target.value)
            }
            maxLength="3"
          />

        </div>

        <div className="input-group">

          <label>
            Destination
          </label>

          <input
            type="text"
            placeholder="BOM"
            value={destination}
            onChange={(e) =>
              setDestination(e.target.value)
            }
            maxLength="3"
          />

        </div>

        <div className="input-group">

          <label>
            Airline
          </label>

          <select
            value={airline}
            onChange={(e) =>
              setAirline(e.target.value)
            }
          >
            <option value="IndiGo">
              IndiGo
            </option>

            <option value="Air India">
              Air India
            </option>
          </select>

        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Analyzing..."
            : "Analyze Fare"}
        </button>

      </form>

    </section>
  );
}

export default FareSearch;