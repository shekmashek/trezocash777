import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useBudget } from '../context/BudgetContext';
<<<<<<< HEAD
import { Loader, UserX, UserCheck, Shield, Star, Clock, Search, Users, BarChart } from 'lucide-react';
=======
import { Loader, UserX, UserCheck, Search, Users, BarChart, ShieldCheck, Clock, Folder, UserPlus } from 'lucide-react';
>>>>>>> origin/main
import ReactECharts from 'echarts-for-react';

const AdminDashboardPage = () => {
    const { dispatch } = useBudget();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

<<<<<<< HEAD
    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, subscription_status, is_blocked, created_at');

        if (error) {
            dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        } else {
            setUsers(data);
        }
=======
    const fetchAdminData = async () => {
        setLoading(true);

        const [usersRes, projectsRes, collaboratorsRes] = await Promise.all([
            supabase.from('profiles').select('id, full_name, email, subscription_status, is_blocked, created_at'),
            supabase.from('projects').select('id, user_id'),
            supabase.from('collaborators').select('id, owner_id')
        ]);

        if (usersRes.error || projectsRes.error || collaboratorsRes.error) {
            const error = usersRes.error || projectsRes.error || collaboratorsRes.error;
            dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
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
>>>>>>> origin/main
        setLoading(false);
    };

    useEffect(() => {
<<<<<<< HEAD
        fetchUsers();
=======
        fetchAdminData();
>>>>>>> origin/main
    }, [dispatch]);

    const kpiData = useMemo(() => {
        const totalUsers = users.length;
        const activeSubs = users.filter(u => u.subscription_status === 'active' || u.subscription_status === 'lifetime').length;
        const trialUsers = users.filter(u => u.subscription_status === 'trialing').length;
        const blockedUsers = users.filter(u => u.is_blocked).length;
        return { totalUsers, activeSubs, trialUsers, blockedUsers };
    }, [users]);
    
    const signupChartData = useMemo(() => {
        const last30Days = new Map();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last30Days.set(d.toISOString().split('T')[0], 0);
        }

        users.forEach(user => {
            const signupDate = new Date(user.created_at).toISOString().split('T')[0];
            if (last30Days.has(signupDate)) {
                last30Days.set(signupDate, last30Days.get(signupDate) + 1);
            }
        });

        return {
            labels: Array.from(last30Days.keys()).map(d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
            data: Array.from(last30Days.values()),
        };
    }, [users]);

    const getChartOptions = () => ({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: signupChartData.labels, axisTick: { alignWithLabel: true } },
        yAxis: { type: 'value' },
        series: [{
            name: 'Inscriptions',
            type: 'bar',
            data: signupChartData.data,
            itemStyle: { color: '#3b82f6' }
        }]
    });

    const handleToggleBlock = (user) => {
        const isBlocked = user.is_blocked;
        dispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `${isBlocked ? 'Débloquer' : 'Bloquer'} l'utilisateur ?`,
                message: `Êtes-vous sûr de vouloir ${isBlocked ? 'débloquer' : 'bloquer'} ${user.full_name} ?`,
                onConfirm: async () => {
                    const { data, error } = await supabase.from('profiles').update({ is_blocked: !isBlocked }).eq('id', user.id).select().single();
                    if (error) {
                        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
                    } else {
                        setUsers(users.map(u => u.id === user.id ? { ...u, is_blocked: data.is_blocked } : u));
                        dispatch({ type: 'ADD_TOAST', payload: { message: `Utilisateur ${data.is_blocked ? 'bloqué' : 'débloqué'}.`, type: 'success' } });
                    }
                },
            }
        });
    };

<<<<<<< HEAD
    const handleSubscriptionChange = async (userId, newStatus) => {
        const { data, error } = await supabase.from('profiles').update({ subscription_status: newStatus }).eq('id', userId).select().single();
        if (error) {
            dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, subscription_status: data.subscription_status } : u));
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Abonnement mis à jour.', type: 'success' } });
        }
=======
    const handleSubscriptionChange = (user, newStatus) => {
        dispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: 'Changer le statut de l\'abonnement ?',
                message: `Voulez-vous vraiment passer l'abonnement de ${user.full_name} à "${newStatus}" ?`,
                onConfirm: async () => {
                    const { data, error } = await supabase.from('profiles').update({ subscription_status: newStatus }).eq('id', user.id).select().single();
                    if (error) {
                        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
                    } else {
                        setUsers(users.map(u => u.id === user.id ? { ...u, subscription_status: data.subscription_status } : u));
                        dispatch({ type: 'ADD_TOAST', payload: { message: 'Abonnement mis à jour.', type: 'success' } });
                    }
                },
            }
        });
>>>>>>> origin/main
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const subscriptionOptions = ['trialing', 'active', 'lifetime', 'canceled', 'past_due'];

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader className="animate-spin w-8 h-8" /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Tableau de Bord Administrateur</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full"><Users className="w-6 h-6 text-blue-600" /></div>
                    <div><p className="text-sm text-gray-500">Utilisateurs</p><p className="text-2xl font-bold">{kpiData.totalUsers}</p></div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full"><ShieldCheck className="w-6 h-6 text-green-600" /></div>
                    <div><p className="text-sm text-gray-500">Abonnés Actifs</p><p className="text-2xl font-bold">{kpiData.activeSubs}</p></div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border flex items-center gap-4">
                    <div className="bg-yellow-100 p-3 rounded-full"><Clock className="w-6 h-6 text-yellow-600" /></div>
                    <div><p className="text-sm text-gray-500">En Essai</p><p className="text-2xl font-bold">{kpiData.trialUsers}</p></div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-full"><UserX className="w-6 h-6 text-red-600" /></div>
                    <div><p className="text-sm text-gray-500">Bloqués</p><p className="text-2xl font-bold">{kpiData.blockedUsers}</p></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><BarChart className="w-5 h-5 text-gray-700" /> Inscriptions des 30 derniers jours</h2>
                <div style={{ height: '300px' }}>
                    <ReactECharts option={getChartOptions()} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Liste des Utilisateurs</h2>
            <div className="mb-4">
                <div className="relative max-w-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-gray-400" /></div>
                    <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher par nom ou e-mail..." className="block w-full rounded-md border-gray-300 py-2 pl-10 pr-3 text-sm" />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-600">Utilisateur</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-600">Inscrit le</th>
<<<<<<< HEAD
=======
                            <th className="px-6 py-3 text-center font-medium text-gray-600">Projets</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-600">Collabs.</th>
>>>>>>> origin/main
                            <th className="px-6 py-3 text-left font-medium text-gray-600">Statut Abonnement</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={user.is_blocked ? 'bg-red-50' : ''}>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{user.full_name}</div>
                                    <div className="text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
<<<<<<< HEAD
                                <td className="px-6 py-4">
                                    <select value={user.subscription_status || ''} onChange={(e) => handleSubscriptionChange(user.id, e.target.value)} className="text-xs p-1 border rounded-md bg-white">
=======
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Folder size={14} className="text-gray-500" />
                                        <span className="font-semibold">{user.projectCount}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <UserPlus size={14} className="text-gray-500" />
                                        <span className="font-semibold">{user.collaboratorCount}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={user.subscription_status || ''} 
                                        onChange={(e) => handleSubscriptionChange(user, e.target.value)} 
                                        className="text-xs p-1 border rounded-md bg-white"
                                    >
>>>>>>> origin/main
                                        {subscriptionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleToggleBlock(user)} className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 mx-auto ${user.is_blocked ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
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

export default AdminDashboardPage;
