import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { LogOut } from 'lucide-react';
import TrezocashLogo from '../components/TrezocashLogo';

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <TrezocashLogo className="w-8 h-8" />
                        <span className="text-xl font-bold text-gray-800">Administration</span>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium">
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
