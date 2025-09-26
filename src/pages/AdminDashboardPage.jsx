import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useUI } from '../context/UIContext';
import { Loader, Users, BarChart, ShieldCheck, Clock, UserX } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

const AdminDashboardPage = () => {
    const { uiDispatch } = useUI();
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeSubs: 0,
        trialUsers: 0,
        blockedUsers: 0,
    });
    const [signupData, setSignupData] = useState({ labels: [], data: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            const { data: users, error } = await supabase
                .from('profiles')
                .select('subscription_status, is_blocked, created_at');

            if (error) {
                uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
                setLoading(false);
                return;
            }

            const totalUsers = users.length;
            const activeSubs = users.filter(u => u.subscription_status === 'active' || u.subscription_status === 'lifetime').length;
            const trialUsers = users.filter(u => u.subscription_status === 'trialing').length;
            const blockedUsers = users.filter(u => u.is_blocked).length;
            setStats({ totalUsers, activeSubs, trialUsers, blockedUsers });

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
            setSignupData({
                labels: Array.from(last30Days.keys()).map(d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
                data: Array.from(last30Days.values()),
            });

            setLoading(false);
        };

        fetchDashboardData();
    }, [uiDispatch]);

    const getChartOptions = () => ({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: signupData.labels, axisTick: { alignWithLabel: true } },
        yAxis: { type: 'value' },
        series: [{
            name: 'Inscriptions',
            type: 'bar',
            data: signupData.data,
            itemStyle: { color: '#3b82f6' }
        }]
    });

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader className="animate-spin w-8 h-8 text-white" /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-white">Tableau de Bord</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex items-center gap-4">
                    <div className="bg-blue-500/20 p-3 rounded-full"><Users className="w-6 h-6 text-blue-400" /></div>
                    <div><p className="text-sm text-gray-400">Utilisateurs</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex items-center gap-4">
                    <div className="bg-green-500/20 p-3 rounded-full"><ShieldCheck className="w-6 h-6 text-green-400" /></div>
                    <div><p className="text-sm text-gray-400">Abonnés Actifs</p><p className="text-2xl font-bold">{stats.activeSubs}</p></div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex items-center gap-4">
                    <div className="bg-yellow-500/20 p-3 rounded-full"><Clock className="w-6 h-6 text-yellow-400" /></div>
                    <div><p className="text-sm text-gray-400">En Essai</p><p className="text-2xl font-bold">{stats.trialUsers}</p></div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex items-center gap-4">
                    <div className="bg-red-500/20 p-3 rounded-full"><UserX className="w-6 h-6 text-red-400" /></div>
                    <div><p className="text-sm text-gray-400">Bloqués</p><p className="text-2xl font-bold">{stats.blockedUsers}</p></div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><BarChart className="w-5 h-5 text-gray-300" /> Inscriptions des 30 derniers jours</h2>
                <div style={{ height: '300px' }}>
                    <ReactECharts option={getChartOptions()} style={{ height: '100%', width: '100%' }} />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
