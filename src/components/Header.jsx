/* eslint-disable no-unused-vars */
import React, { useEffect} from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { formatUserRoles, getUserInstitution, isDirector, hasAnyRole } from "../services/auth/authService";
// import "../../src/assets/js/app";
// import { baricon1, imguser, logo, noteicon, noteicon1, searchnormal, settingicon01, user06 } from './imagepath';
import {
  logo,
  baricon,
  baricon1,
  searchnormal,
  imguser,
  noteicon,
  user06,
  settingicon01,
  noteicon1,
} from "./imagepath";

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Función para obtener los datos dinámicos del logo y nombre
  const getBrandingData = () => {
    if (user && (isDirector() || hasAnyRole(['teacher', 'auxiliary', 'secretary']))) {
      const institution = getUserInstitution();
      if (institution) {
        return {
          logo: institution.logo || logo, // Usar logo de institución o fallback al logo por defecto
          name: institution.name || 'Eduassist' // Usar nombre de institución o fallback
        };
      }
    }
    
    // Valores por defecto para usuarios que no requieren institución o sin institución
    return {
      logo: logo,
      name: 'Eduassist'
    };
  };

  // Función para obtener los estilos dinámicos del header
  const getHeaderStyles = () => {
    if (user && (isDirector() || hasAnyRole(['teacher', 'auxiliary', 'secretary']))) {
      const institution = getUserInstitution();
      if (institution && institution.uiSettings && institution.uiSettings.color) {
        const color = institution.uiSettings.color;
        return {
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
          borderBottom: `3px solid ${color}22`
        };
      }
    }
    return {}; // Estilos por defecto (sin cambios)
  };

  // Función para obtener los estilos de texto del header
  const getHeaderTextStyles = () => {
    if (user && (isDirector() || hasAnyRole(['teacher', 'auxiliary', 'secretary']))) {
      const institution = getUserInstitution();
      if (institution && institution.uiSettings && institution.uiSettings.color) {
        return {
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        };
      }
    }
    return {}; // Estilos por defecto
  };
  
  const handlesidebar = () => {
    document.body.classList.toggle("mini-sidebar");
  };

  const handlesidebarmobilemenu = () => {
    document.body.classList.toggle("slide-nav");
    document.getElementsByTagName("html")[0].classList.toggle('menu-opened');
    // document.getElementsByClassName("sidebar-overlay")[0].classList.toggle("opened");
  };

  const openDrawer = () => {
    const div = document.querySelector(".main-wrapper");
    if (div?.className?.includes("open-msg-box")) {
      div?.classList?.remove("open-msg-box");
    } else {
      div?.classList?.add("open-msg-box");
    }
  };

  useEffect(() => {
    const handleClick = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };

    const maximizeBtn = document.querySelector(".win-maximize");
    // maximizeBtn.addEventListener('click', handleClick);

    return () => {
      // maximizeBtn.removeEventListener('click', handleClick);
    };
  }, []);
  return (
    <div className="main-wrapper">
      <div className="header" style={getHeaderStyles()}>
        <div className="header-left">
          <Link to="/dashboard" className="logo">
            <img src={getBrandingData().logo} width={35} height={35} alt={getBrandingData().name} />{" "}
            <span style={getHeaderTextStyles()}>{getBrandingData().name}</span>
          </Link>
        </div>
        <Link id="toggle_btn" to="#" onClick={handlesidebar}>
          <img src={baricon} alt="" />
        </Link>
        <Link id="mobile_btn" className="mobile_btn float-start" to="#" onClick={handlesidebarmobilemenu}>
          <img src={baricon1} alt="" />
        </Link>
        <div className="top-nav-search mob-view">
          <form>
            <input
              type="text"
              className="form-control"
              placeholder="Search here"
            />
            <Link className="btn">
              <img src={searchnormal} alt="" />
            </Link>
          </form>
        </div>
        <ul className="nav user-menu float-end">
          <li className="nav-item dropdown has-arrow user-profile-list">
            <Link
              to="#"
              className="dropdown-toggle nav-link user-link"
              data-bs-toggle="dropdown"
            >
              <div className="user-names">
                <h5 style={getHeaderTextStyles()}>{user?.name || 'Usuario'}</h5>
                <span style={getHeaderTextStyles()}>{formatUserRoles(user, 2)}</span>
              </div>
              <span className="user-img">
                <img src={user06} alt="Admin" />
              </span>
            </Link>
            <div className="dropdown-menu">
              <Link className="dropdown-item" to="/profile">
                My Profile
              </Link>
              <Link className="dropdown-item" to="/edit-profile">
                Edit Profile
              </Link>
              <Link className="dropdown-item" to="/settings">
                Settings
              </Link>
              <Link 
                className="dropdown-item" 
                to="/login"
                onClick={logout}
              >
                Logout
              </Link>
            </div>
          </li>
        </ul>
        <div className="dropdown mobile-user-menu float-end">
          <Link
            to="#"
            className="dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa-solid fa-ellipsis-vertical" />
          </Link>
          <div className="dropdown-menu dropdown-menu-end">
            <Link className="dropdown-item" to="/profile">
              My Profile
            </Link>
            <Link className="dropdown-item" to="edit-profile.html">
              Edit Profile
            </Link>
            <Link className="dropdown-item" to="/settings">
              Settings
            </Link>
            <Link 
              className="dropdown-item" 
              to="/login"
              onClick={logout}
            >
              Logout
            </Link>
          </div>
        </div>
      </div>

  
    </div>
  );
};

export default Header;
