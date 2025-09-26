import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useUI } from '../context/UIContext';
import { Loader, UserX, UserCheck, Search, Folder, UserPlus } from 'lucide-react';

const AdminUsersPage = () => {
    const { uiDispatch } = useUI();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsersData = async () => {
            setLoading(true);
            const [usersRes, projectsRes, collaboratorsRes] = await Promise.all([
                supabase.from('profiles').select('id, full_name, email, subscription_status, is_blocked, created_at'),
                supabase.from('projects').select('id, user_id'),
                supabase.from('collaborators').select('id, owner_id')
            ]);

            if (usersRes.error || projectsRes.error || collaboratorsRes.error) {
                const error = usersRes.error || projectsRes.error || collaboratorsRes.error;
                uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
                setLoading(false);
                return;
            }

            const usersData = usersRes.data || [];
            const projectsData = projectsRes.data || [];
            const collaboratorsData = collaboratorsRes.data || [];

            const projectCounts = projectsData.reduce((acc, project) => {
                acc[project.user_id] = (acc[project.user_id] || 0) + 1;
                return acc;
            }, {});

            const collaboratorCounts = collaboratorsData.reduce((acc, collaborator) => {
                acc[collaborator.owner_id] = (acc[collaborator.owner_id] || 0) + 1;
                return acc;
            }, {});

            const augmentedUsers = usersData.map(user => ({
                ...user,
                projectCount: projectCounts[user.id] || 0,
                collaboratorCount: collaboratorCounts[user.id] || 0,
            }));

            setUsers(augmentedUsers);
            setLoading(false);
        };

        fetchUsersData();
    }, [uiDispatch]);

    const handleToggleBlock = (user) => {
        const isBlocked = user.is_blocked;
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `${isBlocked ? 'Débloquer' : 'Bloquer'} l'utilisateur ?`,
                message: `Êtes-vous sûr de vouloir ${isBlocked ? 'débloquer' : 'bloquer'} ${user.full_name} ?`,
                onConfirm: async () => {
                    const { data, error } = await supabase.from('profiles').update({ is_blocked: !isBlocked }).eq('id', user.id).select().single();
                    if (error) {
                        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
                    } else {
                        setUsers(users.map(u => u.id === user.id ? { ...u, is_blocked: data.is_blocked } : u));
                        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Utilisateur ${data.is_blocked ? 'bloqué' : 'débloqué'}.`, type: 'success' } });
                    }
                },
            }
        });
    };

    const handleSubscriptionChange = async (user, newStatus) => {
        const { data, error } = await supabase.from('profiles').update({ subscription_status: newStatus }).eq('id', user.id).select().single();
        if (error) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        } else {
            setUsers(users.map(u => u.id === user.id ? { ...u, subscription_status: data.subscription_status } : u));
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Abonnement mis à jour.', type: 'success' } });
        }
    };

    const filteredUsers = useMemo(() => users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

    const subscriptionOptions = ['trialing', 'active', 'lifetime', 'canceled', 'past_due'];

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader className="animate-spin w-8 h-8 text-white" /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-white">Gestion des Utilisateurs</h1>
            <div className="mb-4">
                <div className="relative max-w-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-gray-400" /></div>
                    <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher par nom ou e-mail..." className="block w-full rounded-md bg-gray-800 border-gray-600 text-white py-2 pl-10 pr-3 text-sm" />
                </div>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                <table className="w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-300">Utilisateur</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-300">Inscrit le</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-300">Projets</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-300">Collabs.</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-300">Abonnement</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={user.is_blocked ? 'bg-red-900/20' : 'hover:bg-gray-700/50'}>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-white">{user.full_name}</div>
                                    <div className="text-gray-400">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1 text-gray-300">
                                        <Folder size={14} />
                                        <span className="font-semibold">{user.projectCount}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1 text-gray-300">
                                        <UserPlus size={14} />
                                        <span className="font-semibold">{user.collaboratorCount}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={user.subscription_status || ''} 
                                        onChange={(e) => handleSubscriptionChange(user, e.target.value)} 
                                        className="text-xs p-1 border border-gray-600 bg-gray-800 text-white rounded-md"
                                    >
                                        {subscriptionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleToggleBlock(user)} className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 mx-auto ${user.is_blocked ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}>
                                        {user.is_blocked ? <UserCheck size={14} /> : <UserX size={14} />}
                                        {user.is_blocked ? 'Débloquer' : 'Bloquer'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsersPage;
