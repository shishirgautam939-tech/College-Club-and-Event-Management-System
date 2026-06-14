import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import LandingPage from "../pages/LandingPage";
import Unauthorized from "../pages/Unauthorized";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";
import Users from "../pages/admin/Users";
import Students from "../pages/admin/Students";
import Faculty from "../pages/admin/Faculty";
import CreateUser from "../pages/admin/CreateUser";
import EditUser from "../pages/admin/EditUser";
import Clubs from "../pages/admin/Clubs";
import CreateClub from "../pages/admin/CreateClub";
import AdminEvents from "../pages/admin/AdminEvents";
import EventAttendance from "../pages/admin/EventAttendance";
import ProposeEvent from "../pages/student/ProposeEvent";
import EventDiscovery from "../pages/student/EventDiscovery";
import MyEvents from "../pages/student/MyEvents";
import ScanAttendance from "../pages/student/ScanAttendance";
import MyCertificates from "../pages/student/MyCertificates";
import FacultyEvents from "../pages/faculty/FacultyEvents";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Public routes ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ── Admin routes (with AdminLayout) ── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/students" element={<Students />} />
        <Route path="/admin/faculty" element={<Faculty />} />
        <Route path="/admin/users/create" element={<CreateUser />} />
        <Route path="/admin/users/:id/edit" element={<EditUser />} />
        <Route path="/admin/clubs" element={<Clubs />} />
        <Route path="/admin/clubs/create" element={<CreateClub />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/events/:eventId/attendance" element={<EventAttendance />} />
      </Route>

      {/* ── Main app routes (with MainLayout) ── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["Student", "Faculty", "Admin"]}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<EventDiscovery />} />
        <Route path="/my-events" element={
          <ProtectedRoute allowedRoles={["Student"]}>
            <MyEvents />
          </ProtectedRoute>
        } />
        <Route path="/scan-attendance" element={
          <ProtectedRoute allowedRoles={["Student"]}>
            <ScanAttendance />
          </ProtectedRoute>
        } />
        <Route path="/my-certificates" element={
          <ProtectedRoute allowedRoles={["Student"]}>
            <MyCertificates />
          </ProtectedRoute>
        } />
        <Route path="/events/propose" element={
          <ProtectedRoute allowedRoles={["Student"]}>
            <ProposeEvent />
          </ProtectedRoute>
        } />
        <Route path="/faculty" element={
          <ProtectedRoute allowedRoles={["Faculty", "Admin"]}>
            <FacultyEvents />
          </ProtectedRoute>
        } />
        <Route path="/faculty/events/:eventId/attendance" element={
          <ProtectedRoute allowedRoles={["Faculty", "Admin"]}>
            <EventAttendance />
          </ProtectedRoute>
        } />
      </Route>

      {/* ── Redirects ── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
