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

import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/search"
          element={<FareSearch />}
        />

        <Route
          path="/fare/:id"
          element={<FareDetails />}
        />

        <Route
          path="/compare"
          element={<RouteComparison />}
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;