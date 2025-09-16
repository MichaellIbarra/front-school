/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { Link } from "react-router-dom";
import { blog, dashboard, doctor, doctorschedule, logout, menuicon04, menuicon06, menuicon08, menuicon09, menuicon10, menuicon11, menuicon12, menuicon14, menuicon15, menuicon16, patients, sidemenu } from './imagepath';
import Scrollbars from "react-custom-scrollbars-2";
import useAuth from "../hooks/useAuth";
import { hasRole, isAdmin, isDirector, isTeacher, isAuxiliary, isSecretary } from "../auth/authService";


const Sidebar = (props) => {
  const [sidebar, setSidebar] = useState("");
  const { user, isAuthenticated, logout } = useAuth();

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
      <div className="sidebar" id="sidebar">
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

                <li className="submenu">
                  <Link to="#" id="menu-item3" onClick={(e) => handleClick(e, "menu-item3", "menu-items3")}>
                    <span className="menu-side">
                      <img src={menuicon08} alt="" />
                    </span>{" "}
                    <span> Staff </span> <span className="menu-arrow" />
                  </Link>
                  <ul style={{ display: "none" }} className="menu-items3">
                      <li>
                        <Link className={props?.activeClassName === 'staff-list' ? 'active' : ''} to="/stafflist">Staff List</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'add-staff' ? 'active' : ''} to="/addstaff">Add Staff</Link>
                      </li>
                    <li>
                      <Link className={props?.activeClassName === 'staff-profile' ? 'active' : ''} to="/staffprofile">Staff Profile</Link>
                    </li>
                      <li>
                        <Link className={props?.activeClassName === 'leaves' ? 'active' : ''} to="/leave">Leaves</Link>
                      </li>

                      <li>
                        <Link className={props?.activeClassName === 'holidays' ? 'active' : ''} to="/holiday">Holidays</Link>
                      </li>
                      <li>
                        <Link className={props?.activeClassName === 'attendance' ? 'active' : ''} to="/attendence">Attendance</Link>
                      </li>
                  </ul>
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

                <li className="submenu">
                  <Link to="#" id="menu-item13" onClick={(e) => handleClick(e, "menu-item13", "menu-items13")}>
                    <span className="menu-side">
                      <img src={menuicon15} alt="" />
                    </span>{" "}
                    <span> Invoice </span> <span className="menu-arrow" />
                  </Link>
                  <ul style={{ display: "none" }} className="menu-items13">
                        <li>
                          <Link className={props?.activeClassName === 'add-invoice' ? 'active' : ''} to="/add-invoice"> Add Invoices</Link>
                        </li>
                        <li>
                          <Link className={props?.activeClassName === 'edit-invoice' ? 'active' : ''} to="/edit-invoice"> Edit Invoices</Link>
                        </li>
                  </ul>
                </li>

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
                    <span>Admin/Director</span> <span className="menu-arrow" />
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

                {/* Ejemplo - Solo Admin */}
                {isAdmin() && (
                     <li>
                    <Link to="/admin/prueba">
                      <span className="menu-side">
                        <img src={menuicon16} alt="" />
                      </span>{" "}
                      <span>pruebaAdmin</span>
                    </Link>
                  </li>
                )}

                {/* Ejemplo - Solo isTeacher */}
                {isTeacher() && (
                     <li>
                    <Link to="/teacher/prueba">
                      <span className="menu-side">
                        <img src={menuicon16} alt="" />
                      </span>{" "}
                      <span>pruebaTeacher</span>
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

                
                {/* Ejemplo - Solo isAuxiliary */}
                {isAuxiliary() && (
                     <li>
                    <Link to="/auxiliary/prueba">
                      <span className="menu-side">
                        <img src={menuicon16} alt="" />
                      </span>{" "}
                      <span>pruebaAuxiliar</span>
                    </Link>
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
                      <span> Director Académico </span> <span className="menu-arrow" />
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
                    </ul>
                  </li>
                )}

                <li className="menu-title">UI Elements</li>
                <li className="submenu">
                  <Link to="#" id="menu-item14" onClick={(e) => handleClick(e, "menu-item14", "menu-items14")}>
                    <i className="fa fa-laptop" /> <span> Components</span>{" "}
                    <span className="menu-arrow" />
                  </Link>
                  <ul style={{ display: "none" }} className="menu-items14">
                    <li>
                      <Link className={props?.activeClassName === 'uikit' ? 'active' : ''} to="/ui-kit">UI Kit</Link>
                    </li>
                    <li>
                      <Link className={props?.activeClassName === 'typography' ? 'active' : ''} to="/typography">Typography</Link>
                    </li>
                    <li>
                      <Link className={props?.activeClassName === 'tabs' ? 'active' : ''} to="/tab">Tabs</Link>
                    </li>
                  </ul>
                </li>

                <li className="submenu">
                  <Link to="#" id="menu-item15" onClick={(e) => handleClick(e, "menu-item15", "menu-items15")}>
                    <i className="fa fa-edit" /> <span> Forms</span>{" "}
                    <span className="menu-arrow" />
                  </Link>
                  <ul style={{ display: "none" }} className="menu-items15">
                    {/* Teacher puede usar formularios básicos */}
                    {(isTeacher() || isDirector() || isAdmin()) && (
                      <>
                        <li>
                          <Link className={props?.activeClassName === 'basic-input' ? 'active' : ''} to="/basic-input">Basic Inputs</Link>
                        </li>
                        <li>
                          <Link className={props?.activeClassName === 'horizontal-form' ? 'active' : ''} to="/horizontal-form">Horizontal Form</Link>
                        </li>
                      </>
                    )}

                    {/* Solo Director y Admin pueden usar formularios avanzados */}
                    {(isDirector() || isAdmin()) && (
                      <>
                        <li>
                          <Link className={props?.activeClassName === 'input-groups' ? 'active' : ''} to="/inputgroup">Input Groups</Link>
                        </li>
                        <li>
                          <Link className={props?.activeClassName === 'vertical-form' ? 'active' : ''} to="/vertical-form">Vertical Form</Link>
                        </li>
                      </>
                    )}
                  </ul>
                </li>

                <li className="submenu">
                  <Link to="#" id="menu-item16" onClick={(e) => handleClick(e, "menu-item16", "menu-items16")}>
                    <i className="fa fa-table" /> <span> Tables</span>{" "}
                    <span className="menu-arrow" />
                  </Link>
                  <ul style={{ display: "none" }} className="menu-items16">
                    <li>
                      <Link className={props?.activeClassName === 'basic-table' ? 'active' : ''} to="/basic-table">Basic Tables</Link>
                    </li>

                    {/* Solo Director y Admin pueden usar Data Tables avanzadas */}
                    {(isDirector() || isAdmin()) && (
                      <li>
                        <Link className={props?.activeClassName === 'data-table' ? 'active' : ''} to="/data-table">Data Table</Link>
                      </li>
                    )}
                  </ul>
                </li>

                <li className="menu-title">Extras</li>
                <li className="submenu">
                  <Link to="#" id="menu-item17" onClick={(e) => handleClick(e, "menu-item17", "menu-items17")}>
                    <i className="fa fa-columns" /> <span>Pages</span>{" "}
                    <span className="menu-arrow" />
                  </Link>
                  <ul style={{ display: "none" }} className="menu-items17">
                    {/* Solo mostrar login si no está autenticado */}
                    {!isAuthenticated && (
                      <li>
                        <Link to="/login"> Login </Link>
                      </li>
                    )}

                    {/* Cambio de contraseña para todos */}
                    <li>
                      <Link className={props?.activeClassName === 'changepassword' ? 'active' : ''} to="/changepassword"> Change Password </Link>
                    </li>

                    {/* Perfil para todos */}
                    <li>
                      <Link className={props?.activeClassName === 'profile' ? 'active' : ''} to="/profile"> Profile </Link>
                    </li>
                  </ul>
                </li>


              </ul>

            </div>
          </div>
        </Scrollbars>
      </div>
    </>
  )
}
export default Sidebar