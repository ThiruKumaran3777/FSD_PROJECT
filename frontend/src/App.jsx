import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import QuickFeedbackPage from './pages/QuickFeedbackPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/c/:courseCode/feedback" element={<QuickFeedbackPage />} />

            <Route
              path="/faculty"
              element={
                <ProtectedRoute allowedRoles={['Faculty', 'Admin']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
