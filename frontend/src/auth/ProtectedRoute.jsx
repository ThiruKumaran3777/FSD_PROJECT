import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-black tracking-wide">Loading workspace…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

