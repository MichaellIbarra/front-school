import React from "react";
// eslint-disable-next-line no-unused-vars

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/pages/login";
import Unauthorized from "./components/pages/Unauthorized";

// Componentes de protección de rutas
import {
  AdminRoute,
  DirectorRoute,
  TeacherRoute,
  AuxiliaryRoute,
  SecretaryRoute,
  AuthenticatedRoute
} from "./components/RoleBasedRoutes";

import AddStaff from "./components/staff/Add-Staff";

import Attendence from "./components/staff/Attendence";
import Leave from "./components/staff/Leave";

import Add_Invoices from "./components/Invoice/Add_Invoices/Add_Invoices";

import HorizontalForm from "./components/Forms/HorizontalForm";
import BasicTable from "./components/Tables/BasicTable";
import DataTable from "./components/Tables/DataTable";
import UiKit from "./components/Ui_Elements/UiKit";
import Typography from "./components/Ui_Elements/Typography";
import Tab from "./components/Ui_Elements/Tab";
import ChangePassword from "./components/pages/login/ChangePassword";
import EditProfile from "./components/pages/login/EditProfile";
import Admin_Dashboard from "./components/Dashboard/Admin_Dashboard";
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
import EnrollmentList from "./pages/secretary/enrollments/enrollmentList";
import EnrollmentForm from "./pages/secretary/enrollments/enrollmentForm";
import AuxiliaryAttendanceListPage from "./pages/auxiliary/attendance/AttendanceListPage";
import AuxiliaryJustificationManagementPage from "./pages/auxiliary/attendance/JustificationManagementPage";

//Accounts
const Approuter = () => {
  return (
    <>
      <BrowserRouter basename="/school">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rutas sin seguridad (accesibles sin autenticación) */}
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/changepassword" element={<ChangePassword />} />
          {/* Staff */}
          <Route path="/addstaff" element={<AddStaff />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/attendence" element={<Attendence />} />
          {/* Invoice */}
          <Route path="/add-invoice" element={<Add_Invoices />} />
          {/* ui-elements */}
          <Route path="/ui-kit" element={<UiKit />} />
          <Route path="/typography" element={<Typography />} />
          <Route path="/tab" element={<Tab />} />
          {/* Forms */}
          <Route path="/horizontal-form" element={<HorizontalForm />} />
          {/* Tables */}
          <Route path="/basic-table" element={<BasicTable />} />
          <Route path="/data-table" element={<DataTable />} />

          {/* Rutas generales autenticadas */}
          <Route path="/dashboard" element={
            <AuthenticatedRoute>
              <Admin_Dashboard />
            </AuthenticatedRoute>
          } />

          {/* ============= RUTAS DE ADMIN ============= */}
          <Route path="/admin/institution" element={
            <AdminRoute>
              <InstitutionList />
            </AdminRoute>
          } />

          <Route path="/admin/institution/add" element={
            <AdminRoute>
              <InstitutionAdd />
            </AdminRoute>
          } />

          <Route path="/admin/institution/edit/:id" element={
            <AdminRoute>
              <InstitutionAdd />
            </AdminRoute>
          } />

          {/* Rutas de Sedes */}
          <Route path="/admin/institution/:institutionId/headquarters" element={
            <AdminRoute>
              <HeadquarterList />
            </AdminRoute>
          } />

          <Route path="/admin/institution/:institutionId/headquarters/add" element={
            <AdminRoute>
              <HeadquarterAdd />
            </AdminRoute>
          } />

          <Route path="/admin/institution/:institutionId/headquarters/edit/:id" element={
            <AdminRoute>
              <HeadquarterAdd />
            </AdminRoute>
          } />

          {/* Ruta de Reportes */}
          <Route path="/admin/institution/reports" element={
            <AdminRoute>
              <InstitutionHeadquartersReport />
            </AdminRoute>
          } />

                              {/* ============= RUTAS DE ADMIN DIRECTOR ============= */}
          {/* Admin Director Users Routes - Protegidas por AdminRoute */}
          <Route path="/admin/admin-director/users" element={
            <AdminRoute>
              <AdminDirectorUserList />
            </AdminRoute>
          } />
          <Route path="/admin/admin-director/users/create" element={
            <AdminRoute>
              <AdminDirectorUserCreate />
            </AdminRoute>
          } />
          <Route path="/admin/admin-director/users/:keycloakId/view" element={
            <AdminRoute>
              <AdminDirectorUserView />
            </AdminRoute>
          } />
          <Route path="/admin/admin-director/users/:keycloakId/edit" element={
            <AdminRoute>
              <AdminDirectorUserEdit />
            </AdminRoute>
          } />

          {/* ============= RUTAS DE DIRECTOR ============= */}
          <Route path="/director/reports" element={
            <DirectorRoute>
              <BasicTable />
            </DirectorRoute>
          } />

          {/* Director Personal Users Routes - Protegidas por DirectorRoute */}
          <Route path="/admin/admin-director/director-personal" element={
            <DirectorRoute>
              <DirectorPersonalList />
            </DirectorRoute>
          } />
          <Route path="/admin/admin-director/director-personal/create" element={
            <DirectorRoute>
              <DirectorPersonalCreate />
            </DirectorRoute>
          } />
          <Route path="/admin/admin-director/director-personal/:keycloakId/view" element={
            <DirectorRoute>
              <DirectorPersonalView />
            </DirectorRoute>
          } />
          <Route path="/admin/admin-director/director-personal/:keycloakId/edit" element={
            <DirectorRoute>
              <DirectorPersonalEdit />
            </DirectorRoute>
          } />

          {/* User Institution Management Routes - Protegidas por DirectorRoute */}
          <Route path="/admin-director/user-institution" element={
            <DirectorRoute>
              <UserInstitutionList />
            </DirectorRoute>
          } />
          <Route path="/admin-director/user-institution/create" element={
            <DirectorRoute>
              <UserInstitutionCreate />
            </DirectorRoute>
          } />
          <Route path="/admin-director/user-institution/view/:userId" element={
            <DirectorRoute>
              <UserInstitutionView />
            </DirectorRoute>
          } />
          <Route path="/admin-director/user-institution/edit/:userId" element={
            <DirectorRoute>
              <UserInstitutionEdit />
            </DirectorRoute>
          } />

          {/* ============= RUTAS DE TEACHER ============= */}
          <Route path="/teacher/leave" element={
            <TeacherRoute>
              <Leave />
            </TeacherRoute>
          } />

          {/* ============= RUTAS DE AUXILIARY ============= */}

          <Route path="/auxiliary/maintenance" element={
            <AuxiliaryRoute>
              <BasicTable />
            </AuxiliaryRoute>
          } />

          {/* Rutas de asistencias - Sin protección */}
          <Route path="/auxiliary/attendance" element={<AuxiliaryAttendanceListPage />} />
          <Route path="/auxiliary/justifications" element={<AuxiliaryJustificationManagementPage />} />

          {/* ============= RUTAS DE SECRETARY ============= */}
          <Route path="/secretary/forms" element={
            <SecretaryRoute>
              <HorizontalForm />
            </SecretaryRoute>
          } />

          {/* Rutas de Estudiantes */}
          <Route path="/secretary/students" element={
            <SecretaryRoute>
              <StudentList />
            </SecretaryRoute>
          } />
          <Route path="/secretary/students/add" element={
            <SecretaryRoute>
              <StudentForm />
            </SecretaryRoute>
          } />
          <Route path="/secretary/students/edit/:id" element={
            <SecretaryRoute>
              <StudentForm />
            </SecretaryRoute>
          } />
          <Route path="/secretary/students/:studentId/enrollments" element={
            <SecretaryRoute>
              <StudentEnrollments />
            </SecretaryRoute>
          } />
          {/* Rutas de Matrículas */}
          <Route path="/secretary/enrollments" element={
            <SecretaryRoute>
              <EnrollmentList />
            </SecretaryRoute>
          } />
          <Route path="/secretary/enrollments/add" element={
            <SecretaryRoute>
              <EnrollmentForm />
            </SecretaryRoute>
          } />
          <Route path="/secretary/enrollments/edit/:id" element={
            <SecretaryRoute>
              <EnrollmentForm />
            </SecretaryRoute>
          }/>
          {/* Course Routes - Secretary Academic Director */}
          <Route path="/secretary/courses" element={
            <SecretaryRoute>
              <CourseList />
            </SecretaryRoute>
          } />
          <Route path="/secretary/courses/add" element={
            <SecretaryRoute>
              <AddCourse />
            </SecretaryRoute>
          } />
          <Route path="/secretary/courses/edit/:id" element={
            <SecretaryRoute>
              <EditCourse />
            </SecretaryRoute>
          } />

          {/* Period Routes - Secretary Academic Director */}
          <Route path="/secretary/periods" element={
            <SecretaryRoute>
              <PeriodList />
            </SecretaryRoute>
          } />
          <Route path="/secretary/periods/add" element={
            <SecretaryRoute>
              <AddPeriod />
            </SecretaryRoute>
          } />
          <Route path="/secretary/periods/edit/:id" element={
            <SecretaryRoute>
              <EditPeriod />
            </SecretaryRoute>
          } />

        </Routes>
      </BrowserRouter>
      <div className="sidebar-overlay"></div>
    </>
  );
};

export default Approuter;
