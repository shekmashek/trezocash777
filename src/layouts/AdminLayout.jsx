import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { LogOut, LayoutDashboard, Users } from 'lucide-react';
import TrezocashLogo from '../components/TrezocashLogo';

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    const navLinkClasses = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 shadow-md sticky top-0 z-50 border-b border-gray-700">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <TrezocashLogo className="w-8 h-8" />
                        <span className="text-xl font-bold">Administration</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <NavLink to="/admin/dashboard" className={navLinkClasses}>
                            <LayoutDashboard size={18} />
                            Dashboard
                        </NavLink>
                        <NavLink to="/admin/users" className={navLinkClasses}>
                            <Users size={18} />
                            Gestion Utilisateurs
                        </NavLink>
                    </nav>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 font-medium">
                        <LogOut size={18} />
                        Déconnexion
                    </button>
                </div>
            </header>
            <main className="container mx-auto p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
