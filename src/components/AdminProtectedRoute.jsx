import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useBudget } from '../context/BudgetContext';
import { Loader } from 'lucide-react';

const AdminProtectedRoute = () => {
    const { state } = useBudget();
    const { session, profile, isLoading } = state;

    if (isLoading) {
        return <div className="w-screen h-screen flex items-center justify-center bg-gray-900"><Loader className="w-12 h-12 text-blue-500 animate-spin" /></div>;
    }

    if (!session) {
        return <Navigate to="/admin/login" replace />;
    }

    if (!profile) {
        return <div className="w-screen h-screen flex items-center justify-center bg-gray-900"><Loader className="w-12 h-12 text-blue-500 animate-spin" /></div>;
    }

    if (profile.role !== 'superadmin') {
        return <Navigate to="/app/dashboard" replace />;
    }

    return <Outlet />;
};

export default AdminProtectedRoute;
