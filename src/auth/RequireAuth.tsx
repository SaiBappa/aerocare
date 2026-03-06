import { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from './AuthContext';

interface RequireAuthProps {
    children: ReactElement;
    allowedRoles?: UserRole[];
}

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
    const { user, isLoading, hasRole } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/control/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !hasRole(allowedRoles)) {
        if (user.role === 'staff') {
            return <Navigate to="/staff" replace />;
        }
        if (user.role === 'stakeholder') {
            return <Navigate to="/stakeholder" replace />;
        }
        return <Navigate to="/control" replace />;
    }

    return children;
}
