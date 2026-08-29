import { NavLink, Link } from "react-router-dom";

import "./Navbar.css";


function Navbar() {

  return (

    <nav className="airwise-navbar">


      {/* ====================================================
          LOGO
      ==================================================== */}

      <Link
        to="/"
        className="airwise-logo"
      >

        <div className="logo-icon">
          A
        </div>


        <div className="logo-text">

          <strong>
            AIRWISE
          </strong>

          <span>
            Fare Intelligence
          </span>

        </div>

      </Link>


      {/* ====================================================
          NAVIGATION
      ==================================================== */}

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
          <span className="nav-icon">
            ⌂
          </span>

          <span>
            Dashboard
          </span>
        </NavLink>


        <NavLink
          to="/search"
          className={({ isActive }) =>
            isActive
              ? "nav-link active"
              : "nav-link"
          }
        >
          <span className="nav-icon">
            ⌕
          </span>

          <span>
            Fare Search
          </span>
        </NavLink>


        <NavLink
          to="/compare"
          className={({ isActive }) =>
            isActive
              ? "nav-link active"
              : "nav-link"
          }
        >
          <span className="nav-icon">
            ⇄
          </span>

          <span>
            Compare
          </span>
        </NavLink>


        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            isActive
              ? "nav-link active"
              : "nav-link"
          }
        >
          <span className="nav-icon">
            ◫
          </span>

          <span>
            Analytics
          </span>
        </NavLink>


        {/* ==================================================
            CPI
        ================================================== */}

        <NavLink
          to="/airfare-index"
          className={({ isActive }) =>
            isActive
              ? "nav-link cpi-nav-link active"
              : "nav-link cpi-nav-link"
          }
        >

          <span className="nav-icon">
            ◈
          </span>

          <span>
            CPI
          </span>

          <span className="cpi-nav-badge">
            HF
          </span>

        </NavLink>

      </div>


      {/* ====================================================
          SYSTEM STATUS
      ==================================================== */}

      <div className="navbar-status">

        <span className="navbar-status-dot"></span>

        <span>
          SYSTEM ONLINE
        </span>

      </div>

    </nav>

  );

}


export default Navbar;