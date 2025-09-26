import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useData } from '../context/DataContext';
import TrezocashLogo from '../components/TrezocashLogo';
import { LogIn, Loader } from 'lucide-react';

const AdminLoginPage = () => {
    const { dataState } = useData();
    const { session, profile } = dataState;
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Si l'utilisateur est déjà connecté, on le redirige selon son rôle.
        if (session && profile) {
            if (profile.role === 'superadmin') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                // Si un utilisateur non-admin est connecté, il ne devrait pas être ici.
                // On le renvoie vers son tableau de bord normal.
                navigate('/app/dashboard', { replace: true });
            }
        }
    }, [session, profile, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError('Identifiants invalides ou problème de connexion.');
            setLoading(false);
        }
        // En cas de succès, l'écouteur onAuthStateChange dans DataContext se déclenchera,
        // mettra à jour l'état de la session et du profil.
        // Le useEffect de ce composant se chargera alors de la redirection.
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4 text-white">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-6">
                    <TrezocashLogo className="w-20 h-20" />
                    <h1 className="mt-4 text-3xl font-bold">Espace Superadministrateur</h1>
                </div>
                <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-gray-400">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-600 bg-gray-900 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="admin@exemple.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-400">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-600 bg-gray-900 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="********"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-gray-500"
                        >
                            {loading ? <Loader className="animate-spin" /> : <LogIn size={18} />}
                            <span>{loading ? 'Connexion...' : 'Se Connecter'}</span>
                        </button>
                    </form>
                    {error && <p className="mt-4 text-sm text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
