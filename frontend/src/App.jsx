import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import FareSearch from "./pages/FareSearch";
import FareDetails from "./pages/FareDetails";
import RouteComparison from "./pages/RouteComparison";
import Analytics from "./pages/Analytics";
import AirfareIndex from "./pages/AirfareIndex";


import "./App.css";


function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        {/* =====================================================
            DASHBOARD
        ===================================================== */}

        <Route
          path="/"
          element={<Dashboard />}
        />


        {/* =====================================================
            FARE SEARCH
        ===================================================== */}

        <Route
          path="/search"
          element={<FareSearch />}
        />


        {/* =====================================================
            FARE DETAILS
        ===================================================== */}

        <Route
          path="/fare/:id"
          element={<FareDetails />}
        />


        {/* =====================================================
            ROUTE COMPARISON
        ===================================================== */}

        <Route
          path="/compare"
          element={<RouteComparison />}
        />


        {/* =====================================================
            ANALYTICS
        ===================================================== */}

        <Route
          path="/analytics"
          element={<Analytics />}
        />


        {/* =====================================================
            AIRFARE PRICE INDEX
        ===================================================== */}

        <Route
          path="/airfare-index"
          element={<AirfareIndex />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;