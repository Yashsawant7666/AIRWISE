import { NavLink, Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="airwise-navbar">

      <Link to="/" className="airwise-logo">

        <div className="logo-icon">
          A
        </div>

        <div className="logo-text">
          <strong>AIRWISE</strong>
          <span>Fare Intelligence</span>
        </div>

      </Link>


      <div className="airwise-nav-links">

        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive
              ? "nav-link active"
              : "nav-link"
          }
        >
          Dashboard
        </NavLink>


        <NavLink
          to="/search"
          className={({ isActive }) =>
            isActive
              ? "nav-link active"
              : "nav-link"
          }
        >
          Fare Search
        </NavLink>


        <NavLink
          to="/compare"
          className={({ isActive }) =>
            isActive
              ? "nav-link active"
              : "nav-link"
          }
        >
          Compare
        </NavLink>


        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            isActive
              ? "nav-link active"
              : "nav-link"
          }
        >
          Analytics
        </NavLink>

      </div>

    </nav>
  );
}

export default Navbar;