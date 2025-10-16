import React from "react";
// eslint-disable-next-line no-unused-vars

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/login";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Unauthorized from "./components/pages/Unauthorized";

// Componentes de protección de rutas
import {
  AdminRoute,
  DirectorRoute,
  TeacherRoute,
  AuxiliaryRoute,
  SecretaryRoute,
  AuthenticatedRoute,
  PublicRoute,
} from "./components/RoleBasedRoutes";

import AddStaff from "./components/staff/Add-Staff";

import Attendence from "./components/staff/Attendence";
import Leave from "./components/staff/Leave";

import HorizontalForm from "./components/Forms/HorizontalForm";
import BasicTable from "./components/Tables/BasicTable";
import DataTable from "./components/Tables/DataTable";
import UiKit from "./components/Ui_Elements/UiKit";
import Typography from "./components/Ui_Elements/Typography";
import EditProfile from "./pages/auth/login/EditProfile";
import Dashboard from "./pages/dashboard/dashboard";
import InstitutionList from "./pages/admin/institutions/institution";
import InstitutionAdd from "./pages/admin/institutions/institutionAdd";
import HeadquarterList from "./pages/admin/institutions/headquarter";
import HeadquarterAdd from "./pages/admin/institutions/headquarterAdd";
import InstitutionHeadquartersReport from "./pages/admin/institutions/institutionHeadquartersReportSimple";
//Admin Director Users
import AdminDirectorUserList from "./pages/admin/adminDirector/AdminDirectorUserList";
import AdminDirectorUserCreate from "./pages/admin/adminDirector/AdminDirectorUserCreate";
import AdminDirectorUserEdit from "./pages/admin/adminDirector/AdminDirectorUserEdit";
import AdminDirectorUserView from "./pages/admin/adminDirector/AdminDirectorUserView";
//Director Personal Users
import DirectorPersonalList from "./pages/admin/adminDirector/directorPersonal/DirectorPersonalList";
import DirectorPersonalCreate from "./pages/admin/adminDirector/directorPersonal/DirectorPersonalCreate";
import DirectorPersonalEdit from "./pages/admin/adminDirector/directorPersonal/DirectorPersonalEdit";
import DirectorPersonalView from "./pages/admin/adminDirector/directorPersonal/DirectorPersonalView";
//User Institution Management
import UserInstitutionList from "./pages/admin/adminDirector/userInstitution/UserInstitutionList";
import UserInstitutionCreate from "./pages/admin/adminDirector/userInstitution/UserInstitutionCreate";
import UserInstitutionEdit from "./pages/admin/adminDirector/userInstitution/UserInstitutionEdit";
import UserInstitutionView from "./pages/admin/adminDirector/userInstitution/UserInstitutionView";
//Courses - Academic Director
import CourseList from "./pages/secretary/academicDirector/course/CourseList";
import AddCourse from "./pages/secretary/academicDirector/course/AddCourse";
import EditCourse from "./pages/secretary/academicDirector/course/EditCourse";
// Period components - Secretary Academic Director
import PeriodList from "./pages/secretary/academicDirector/periods/PeriodList";
import AddPeriod from "./pages/secretary/academicDirector/periods/AddPeriod";
import EditPeriod from "./pages/secretary/academicDirector/periods/EditPeriod";

// Componentes de Estudiantes y Matrículas
import StudentList from "./pages/secretary/students/studentList";
import StudentForm from "./pages/secretary/students/studentForm";
import StudentEnrollments from "./pages/secretary/students/studentEnrollments";
import StudentBulkImport from "./pages/secretary/students/studentBulkImport";
import EnrollmentList from "./pages/secretary/enrollments/enrollmentList";
import EnrollmentForm from "./pages/secretary/enrollments/enrollmentForm";
import AuxiliaryAttendanceListPage from "./pages/auxiliary/attendance/AttendanceListPage";
import AuxiliaryJustificationManagementPage from "./pages/auxiliary/attendance/JustificationManagementPage";
import Fut from "./pages/secretary/fut";
// Grades and Notifications
import GradeList from "./pages/teacher/grades/gradeList";
import NotificationList from "./pages/teacher/grades/notificationList";
import EnrollmentAnalytics from "./pages/secretary/enrollments/enrollmentAnalytics";

// Classroom components - Secretary Academic Director
import ClassroomList from "./pages/secretary/academicDirector/classroom/ClassroomList";
import AddClassroom from "./pages/secretary/academicDirector/classroom/AddClassroom";
import EditClassroom from "./pages/secretary/academicDirector/classroom/EditClassroom";
// Teacher Assignment components - Secretary Academic Director
import TeacherAssignmentList from "./pages/secretary/academicDirector/teacherAssignment/TeacherAssignmentList";
import AddTeacherAssignment from "./pages/secretary/academicDirector/teacherAssignment/AddTeacherAssignment";
import EditTeacherAssignment from "./pages/secretary/academicDirector/teacherAssignment/EditTeacherAssignment";
import DirectorInstitutionView from "./pages/director/institutions/directorInstitutionView";
import DirectorHeadquarterList from "./pages/director/institutions/directorHeadquarter";
import DirectorHeadquarterAdd from "./pages/director/institutions/directorHeadquarterAdd";

//Accounts
const Approuter = () => {
  return (
    <>
      <BrowserRouter basename="/school">
        <Routes>
          {/* Rutas públicas */}

          <Route path="/" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rutas sin seguridad (accesibles sin autenticación) */}
          <Route path="/edit-profile" element={<EditProfile />} />
          {/* Staff */}
          <Route path="/addstaff" element={<AddStaff />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/attendence" element={<Attendence />} />
          {/* ui-elements */}
          <Route path="/ui-kit" element={<UiKit />} />
          <Route path="/typography" element={<Typography />} />
          {/* Forms */}
          <Route path="/horizontal-form" element={<HorizontalForm />} />
          {/* Tables */}
          <Route path="/basic-table" element={<BasicTable />} />
          <Route path="/data-table" element={<DataTable />} />

          {/* ============= RUTAS DE AUTENTICACIÓN ============= */}
          <Route
            path="/dashboard"
            element={
              <AuthenticatedRoute>
                <Dashboard />
              </AuthenticatedRoute>
            }
          />

          {/* ============= RUTAS DE ADMIN ============= */}
          <Route
            path="/admin/institution"
            element={
              <AdminRoute>
                <InstitutionList />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/institution/add"
            element={
              <AdminRoute>
                <InstitutionAdd />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/institution/edit/:id"
            element={
              <AdminRoute>
                <InstitutionAdd />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/institution/:institutionId/headquarters"
            element={
              <AdminRoute>
                <HeadquarterList />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/institution/:institutionId/headquarters/add"
            element={
              <AdminRoute>
                <HeadquarterAdd />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/institution/:institutionId/headquarters/edit/:id"
            element={
              <AdminRoute>
                <HeadquarterAdd />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/institution/reports"
            element={
              <AdminRoute>
                <InstitutionHeadquartersReport />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/admin-director/users"
            element={
              <AdminRoute>
                <AdminDirectorUserList />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/admin-director/users/create"
            element={
              <AdminRoute>
                <AdminDirectorUserCreate />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/admin-director/users/:keycloakId/view"
            element={
              <AdminRoute>
                <AdminDirectorUserView />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/admin-director/users/:keycloakId/edit"
            element={
              <AdminRoute>
                <AdminDirectorUserEdit />
              </AdminRoute>
            }
          />

          {/* ============= RUTAS DE DIRECTOR ============= */}

          <Route
            path="/director/institution"
            element={
              <DirectorRoute>
                <DirectorInstitutionView />
              </DirectorRoute>
            }
          />

          <Route
            path="/director/headquarters"
            element={
              <DirectorRoute>
                <DirectorHeadquarterList />
              </DirectorRoute>
            }
          />

          <Route
            path="/director/headquarters/add"
            element={
              <DirectorRoute>
                <DirectorHeadquarterAdd />
              </DirectorRoute>
            }
          />

          <Route
            path="/director/headquarters/edit/:id"
            element={
              <DirectorRoute>
                <DirectorHeadquarterAdd />
              </DirectorRoute>
            }
          />

          <Route
            path="/director/reports"
            element={
              <DirectorRoute>
                <BasicTable />
              </DirectorRoute>
            }
          />

          <Route
            path="/admin/admin-director/director-personal"
            element={
              <DirectorRoute>
                <DirectorPersonalList />
              </DirectorRoute>
            }
          />

          <Route
            path="/admin/admin-director/director-personal/create"
            element={
              <DirectorRoute>
                <DirectorPersonalCreate />
              </DirectorRoute>
            }
          />

          <Route
            path="/admin/admin-director/director-personal/:keycloakId/view"
            element={
              <DirectorRoute>
                <DirectorPersonalView />
              </DirectorRoute>
            }
          />

          <Route
            path="/admin/admin-director/director-personal/:keycloakId/edit"
            element={
              <DirectorRoute>
                <DirectorPersonalEdit />
              </DirectorRoute>
            }
          />

          <Route
            path="/admin-director/user-institution"
            element={
              <DirectorRoute>
                <UserInstitutionList />
              </DirectorRoute>
            }
          />

          <Route
            path="/admin-director/user-institution/create"
            element={
              <DirectorRoute>
                <UserInstitutionCreate />
              </DirectorRoute>
            }
          />

          <Route
            path="/admin-director/user-institution/view/:userId"
            element={
              <DirectorRoute>
                <UserInstitutionView />
              </DirectorRoute>
            }
          />

          <Route
            path="/admin-director/user-institution/edit/:userId"
            element={
              <DirectorRoute>
                <UserInstitutionEdit />
              </DirectorRoute>
            }
          />

          {/* ============= RUTAS DE TEACHER ============= */}
          <Route
            path="/teacher/leave"
            element={
              <TeacherRoute>
                <Leave />
              </TeacherRoute>
            }
          />

          {/* Rutas de Calificaciones */}
          <Route
            path="/teacher/grades"
            element={
              <TeacherRoute>
                <GradeList />
              </TeacherRoute>
            }
          />

          {/* Rutas de Notificaciones */}
          <Route
            path="/teacher/notifications"
            element={
              <TeacherRoute>
                <NotificationList />
              </TeacherRoute>
            }
          />

          {/* ============= RUTAS DE AUXILIARY ============= */}
          <Route
            path="/auxiliary/maintenance"
            element={
              <AuxiliaryRoute>
                <BasicTable />
              </AuxiliaryRoute>
            }
          />

          <Route
            path="/auxiliary/attendance"
            element={
              <AuxiliaryRoute>
                <AuxiliaryAttendanceListPage />
              </AuxiliaryRoute>
            }
          />

          <Route
            path="/auxiliary/justifications"
            element={
              <AuxiliaryRoute>
                <AuxiliaryJustificationManagementPage />
              </AuxiliaryRoute>
            }
          />

          {/* ============= RUTAS DE SECRETARY ============= */}
          <Route
            path="/secretary/forms"
            element={
              <SecretaryRoute>
                <HorizontalForm />
              </SecretaryRoute>
            }
          />

          <Route
            path="/fut"
            element={
              <SecretaryRoute>
                <Fut />
              </SecretaryRoute>
            }
          />

          {/* Rutas de Estudiantes */}
          <Route
            path="/secretary/students"
            element={
              <SecretaryRoute>
                <StudentList />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/students/add"
            element={
              <SecretaryRoute>
                <StudentForm />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/students/edit/:id"
            element={
              <SecretaryRoute>
                <StudentForm />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/students/:studentId/enrollments"
            element={
              <SecretaryRoute>
                <StudentEnrollments />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/students/bulk-import"
            element={
              <SecretaryRoute>
                <StudentBulkImport />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/enrollments"
            element={
              <SecretaryRoute>
                <EnrollmentList />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/enrollments/add"
            element={
              <SecretaryRoute>
                <EnrollmentForm />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/enrollments/edit/:id"
            element={
              <SecretaryRoute>
                <EnrollmentForm />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/enrollments/analytics"
            element={
              <SecretaryRoute>
                <EnrollmentAnalytics />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/courses"
            element={
              <SecretaryRoute>
                <CourseList />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/courses/add"
            element={
              <SecretaryRoute>
                <AddCourse />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/courses/edit/:id"
            element={
              <SecretaryRoute>
                <EditCourse />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/periods"
            element={
              <SecretaryRoute>
                <PeriodList />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/periods/add"
            element={
              <SecretaryRoute>
                <AddPeriod />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/periods/edit/:id"
            element={
              <SecretaryRoute>
                <EditPeriod />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/classrooms"
            element={
              <SecretaryRoute>
                <ClassroomList />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/classrooms/add"
            element={
              <SecretaryRoute>
                <AddClassroom />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/classrooms/edit/:id"
            element={
              <SecretaryRoute>
                <EditClassroom />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/teacher-assignments"
            element={
              <SecretaryRoute>
                <TeacherAssignmentList />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/teacher-assignments/add"
            element={
              <SecretaryRoute>
                <AddTeacherAssignment />
              </SecretaryRoute>
            }
          />

          <Route
            path="/secretary/teacher-assignments/edit/:id"
            element={
              <SecretaryRoute>
                <EditTeacherAssignment />
              </SecretaryRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      {/* <div className="sidebar-overlay"></div> */}
    </>
  );
};

export default Approuter;
