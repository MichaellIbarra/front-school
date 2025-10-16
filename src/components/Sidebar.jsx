/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { Link } from "react-router-dom";
import { blog, dashboard, doctor, doctorschedule, logout, menuicon04, menuicon06, menuicon08, menuicon09, menuicon10, menuicon11, menuicon12, menuicon14, menuicon15, menuicon16, patients, sidemenu } from './imagepath';
import Scrollbars from "react-custom-scrollbars-2";
import useAuth from "../hooks/useAuth";
import { hasRole, isAdmin, isDirector, isTeacher, isAuxiliary, isSecretary, getUserInstitution, hasAnyRole } from "../auth/authService";


const Sidebar = (props) => {
  const [sidebar, setSidebar] = useState("");
  const { user, isAuthenticated, logout } = useAuth();

  // Función para obtener los estilos dinámicos del sidebar
  const getSidebarStyles = () => {
    if (user && (isDirector() || hasAnyRole(['teacher', 'auxiliary', 'secretary']))) {
      const institution = getUserInstitution();
      if (institution && institution.uiSettings && institution.uiSettings.color) {
        const color = institution.uiSettings.color;
        return {
          background: `linear-gradient(180deg, ${color} 0%, ${color}ee 100%)`,
          borderRight: `1px solid ${color}33`
        };
      }
    }
    return {}; // Estilos por defecto
  };

  // Aplicar estilos dinámicos a los enlaces del sidebar usando CSS inyectado
  useEffect(() => {
    const applySidebarLinkStyles = () => {
      // Limpiar estilos previos
      const existingStyle = document.getElementById('sidebar-theme-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Aplicar estilos si es director o personal educativo y tiene institución
      if (user && (isDirector() || hasAnyRole(['teacher', 'auxiliary', 'secretary']))) {
        const institution = getUserInstitution();
        
        if (institution && institution.uiSettings && institution.uiSettings.color) {
          const color = institution.uiSettings.color;
          
          // Crear elemento style dinámico para el sidebar
          const style = document.createElement('style');
          style.id = 'sidebar-theme-styles';
          style.innerHTML = `
            /* Estilos dinámicos para los enlaces del sidebar */
            .sidebar .sidebar-menu a {
              color: rgba(255, 255, 255, 0.9) !important;
              transition: all 0.3s ease !important;
            }
            
            .sidebar .sidebar-menu a:hover,
            .sidebar .sidebar-menu .active {
              color: white !important;
              background-color: rgba(255, 255, 255, 0.15) !important;
              border-left: 4px solid white !important;
              padding-left: 20px !important;
            }
            
            .sidebar .sidebar-menu .submenu a {
              color: rgba(255, 255, 255, 0.8) !important;
            }
            
            .sidebar .sidebar-menu .submenu a:hover {
              color: white !important;
              background-color: rgba(255, 255, 255, 0.1) !important;
            }
            
            /* Ajustar iconos en sidebar si existen */
            .sidebar .sidebar-menu img {
              filter: brightness(0) invert(1) opacity(0.9) !important;
            }
            
            .sidebar .sidebar-menu a:hover img,
            .sidebar .sidebar-menu .active img {
              filter: brightness(0) invert(1) !important;
            }
          `;
          
          document.head.appendChild(style);
          
          console.log('🎨 Estilos de sidebar aplicados:', {
            institutionName: institution.name,
            color: color,
            userRoles: user.roles
          });
        }
      } else {
        console.log('👤 Usuario no requiere tema de sidebar o no tiene institución');
      }
    };

    // Aplicar estilos cuando el componente se monte o cuando cambien los datos del usuario
    applySidebarLinkStyles();

    // Cleanup al desmontar el componente
    return () => {
      const existingStyle = document.getElementById('sidebar-theme-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [user]);

  const handleClick = (e, item, item1, item3) => {
    const div = document.querySelector(`#${item}`);
    const ulDiv = document.querySelector(`.${item1}`);

    // Validar que los elementos existan antes de manipularlos
    if (ulDiv) {
      e?.target?.className ? ulDiv.style.display = 'none' : ulDiv.style.display = 'block'
    }
    if (div) {
      e?.target?.className ? div.classList.remove('subdrop') : div.classList.add('subdrop');
    }
  }

  useEffect(() => {
    if (props?.id && props?.id1) {
      const ele = document.getElementById(`${props?.id}`);
      if (ele) {
        handleClick(ele, props?.id, props?.id1);
      }
    }
  }, [])


  const expandMenu = () => {
    document.body.classList.remove("expand-menu");
  };
  const expandMenuOpen = () => {
    document.body.classList.add("expand-menu");
  };
  return (
    <>
      <div className="sidebar" id="sidebar" style={getSidebarStyles()}>
        <Scrollbars
          autoHide
          autoHideTimeout={1000}
          autoHideDuration={200}
          autoHeight
          autoHeightMin={0}
          autoHeightMax="95vh"
          thumbMinSize={30}
          universal={false}
          hideTracksWhenNotNeeded={true}
        >
          <div className="sidebar-inner slimscroll">
            <div id="sidebar-menu" className="sidebar-menu"
              onMouseLeave={expandMenu}
              onMouseOver={expandMenuOpen}
            >
              <ul>
                <li className="menu-title">Main</li>
                <li>
                  <Link className={props?.activeClassName === 'activity' ? 'active' : ''} to="/dashboard">
                    <span className="menu-side">
                      <img src={dashboard} alt="" />
                    </span>{" "}
                    <span>Dashboard</span>
                  </Link>
                </li>

                {/* Gestión de FUTS - Solo Secretary */}
                {isSecretary() && (
                  <li className="submenu">
                    <Link to="#" id="menu-item-fut" onClick={(e) => handleClick(e, "menu-item-fut", "menu-items-fut")}>
                      <span className="menu-side">
                        <img src={menuicon09} alt="" />
                      </span>{" "}
                      <span> Gestión de FUTS </span> <span className="menu-arrow" />
                    </Link>
                    <ul style={{ display: "none" }} className="menu-items-fut">
                      <li>
                        <Link className={props?.activeClassName === 'fut-list' ? 'active' : ''} to="/fut">Listas de futs</Link>
                      </li>
                    </ul>
                  </li>
                )}

                {/* Settings - Solo Admin */}
                {isAdmin() && (
                  <li>
                    <Link to="/admin/institution">
                      <span className="menu-side">
                        <img src={blog} alt="" />
                      </span>{" "}
                      <span>Instituciones</span>
                    </Link>
                  </li>
                )}

                {isAdmin() && (
                  <li className="submenu">
                  <Link to="#" id="menu-item-admin-users" onClick={(e) => handleClick(e, "menu-item-admin-users", "menu-items-admin-users")}>
                    <span className="menu-side">
                      <i className="fa fa-users"></i>
                    </span>{" "}
                    <span>Directores</span> <span className="menu-arrow" />
                  </Link>
                  <ul style={{ display: "none" }} className="menu-items-admin-users">
                    <li>
                      <Link className={props?.activeClassName === 'admin-director-users-list' ? 'active' : ''} to="/admin/admin-director/users">Lista de Usuarios</Link>
                    </li>
                    <li>
                      <Link className={props?.activeClassName === 'admin-director-users-create' ? 'active' : ''} to="/admin/admin-director/users/create">Crear Usuario</Link>
                    </li>
                  </ul>
                </li>
                )}

                {(isAuxiliary()) && (
                  <li className="submenu">
                    <Link to="#" id="menu-item-attendance" onClick={(e) => handleClick(e, "menu-item-attendance", "menu-items-attendance")}>
                      <span className="menu-side">
                        <img src={menuicon09} alt="" />
                      </span>{" "}
                      <span> Asistencias </span> <span className="menu-arrow" />
                    </Link>
                    <ul style={{ display: "none" }} className="menu-items-attendance">
                      <li>
                        <Link className={props?.activeClassName === 'attendance-list' ? 'active' : ''} to="/auxiliary/attendance">
                          🔍 Buscar Estudiantes
                        </Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'justification-management' ? 'active' : ''} to="/auxiliary/justifications">
                          📋 Justificaciones
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}

                {/* Sección para Teachers - Calificaciones y Notificaciones */}
                {isTeacher() && (
                  <li className="submenu">
                    <Link to="#" id="menu-item-grades" onClick={(e) => handleClick(e, "menu-item-grades", "menu-items-grades")}>
                      <span className="menu-side">
                        <img src={menuicon16} alt="" />
                      </span>{" "}
                      <span>Calificaciones</span> <span className="menu-arrow" />
                    </Link>
                    <ul style={{ display: "none" }} className="menu-items-grades">
                      <li>
                        <Link className={props?.activeClassName === 'grades-list' ? 'active' : ''} to="/teacher/grades">
                          Lista de Calificaciones
                        </Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'notifications-list' ? 'active' : ''} to="/teacher/notifications">
                          Notificaciones
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}

               {/* Settings - Solo Admin */}
                {isDirector() && (
                  <li>
                    <Link to="/director/institution">
                      <span className="menu-side">
                        <img src={blog} alt="" />
                      </span>{" "}
                      <span>Instituciones</span>
                    </Link>
                  </li>
                )}

                {/* Ejemplo - Solo isDirector */}
                {isDirector() && (
                     <li className="submenu">
                  <Link to="#" id="menu-item-director-personal" onClick={(e) => handleClick(e, "menu-item-director-personal", "menu-items-director-personal")}>
                    <span className="menu-side">
                      <i className="fa fa-user-tie"></i>
                    </span>{" "}
                    <span>Personal Director</span> <span className="menu-arrow" />
                  </Link>
                  <ul style={{ display: "none" }} className="menu-items-director-personal">
                    <li>
                      <Link className={props?.activeClassName === 'director-personal-list' ? 'active' : ''} to="/admin/admin-director/director-personal">Lista de Personal</Link>
                    </li>
                    <li>
                      <Link className={props?.activeClassName === 'director-personal-create' ? 'active' : ''} to="/admin/admin-director/director-personal/create">Crear Personal</Link>
                    </li>
                  </ul>
                </li>
                )}

                {isDirector() && (
                     <li className="submenu">
                  <Link to="#" id="menu-item-user-institution" onClick={(e) => handleClick(e, "menu-item-user-institution", "menu-items-user-institution")}>
                    <span className="menu-side">
                      <i className="fa fa-university"></i>
                    </span>{" "}
                    <span>Usuario-Institución</span> <span className="menu-arrow" />
                  </Link>
                  <ul style={{ display: "none" }} className="menu-items-user-institution">
                    <li>
                      <Link className={props?.activeClassName === 'user-institution-list' ? 'active' : ''} to="/admin-director/user-institution">Lista de Relaciones</Link>
                    </li>
                    <li>
                      <Link className={props?.activeClassName === 'user-institution-create' ? 'active' : ''} to="/admin-director/user-institution/create">Asignar Usuario</Link>
                    </li>
                  </ul>
                </li>
                )}

                {/* Estudiantes - Solo isSecretary */}
                {isSecretary() && (
                  <li className="submenu">
                    <Link to="#" id="menu-item-students" onClick={(e) => handleClick(e, "menu-item-students", "menu-items-students")}>
                      <span className="menu-side">
                        <img src={patients} alt="" />
                      </span>{" "}
                      <span> Estudiantes </span> <span className="menu-arrow" />
                    </Link>
                    <ul style={{ display: "none" }} className="menu-items-students">
                      <li>
                        <Link className={props?.activeClassName === 'student-list' ? 'active' : ''} to="/secretary/students">Lista de Estudiantes</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'add-student' ? 'active' : ''} to="/secretary/students/add">Agregar Estudiante</Link>
                      </li>
                    </ul>
                  </li>
                )}

                {/* Matrículas - Solo isSecretary */}
                {isSecretary() && (
                  <li className="submenu">
                    <Link to="#" id="menu-item-enrollments" onClick={(e) => handleClick(e, "menu-item-enrollments", "menu-items-enrollments")}>
                      <span className="menu-side">
                        <img src={doctorschedule} alt="" />
                      </span>{" "}
                      <span> Matrículas </span> <span className="menu-arrow" />
                    </Link>
                    <ul style={{ display: "none" }} className="menu-items-enrollments">
                      <li>
                        <Link className={props?.activeClassName === 'enrollment-list' ? 'active' : ''} to="/secretary/enrollments">Lista de Matrículas</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'add-enrollment' ? 'active' : ''} to="/secretary/enrollments/add">Agregar Matrícula</Link>
                      </li>
                    </ul>
                  </li>
                )}

                {/* Ejemplo - Solo isSecretary */}
                {/* Menú de Gestión Académica - Solo Secretary */}
                {isSecretary() && (
                  <li className="submenu">
                    <Link to="#" id="menu-item-courses" onClick={(e) => handleClick(e, "menu-item-courses", "menu-items-courses")}>
                      <span className="menu-side">
                        <i className="fa fa-graduation-cap"></i>
                      </span>{" "}
                      <span> Académico </span> <span className="menu-arrow" />
                    </Link>
                    <ul style={{ display: "none" }} className="menu-items-courses">
                      <li>
                        <Link className={props?.activeClassName === 'course-list' ? 'active' : ''} to="/secretary/courses">Gestión de Cursos</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'course-add' ? 'active' : ''} to="/secretary/courses/add">Agregar Curso</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'period-list' ? 'active' : ''} to="/secretary/periods">Gestión de Períodos</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'period-add' ? 'active' : ''} to="/secretary/periods/add">Agregar Período</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'classroom-list' ? 'active' : ''} to="/secretary/classrooms">Gestión de Aulas</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'classroom-add' ? 'active' : ''} to="/secretary/classrooms/add">Agregar Aula</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'teacher-assignment-list' ? 'active' : ''} to="/secretary/teacher-assignments">Asignaciones de Profesores</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'teacher-assignment-add' ? 'active' : ''} to="/secretary/teacher-assignments/add">Agregar Asignación</Link>
                      </li>
                    </ul>
                  </li>
                )}


              </ul>

            </div>
          </div>
        </Scrollbars>
      </div>
    </>
  )
}
export default Sidebar