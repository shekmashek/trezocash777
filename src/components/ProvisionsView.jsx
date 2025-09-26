import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Lock, TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import EmptyState from './EmptyState';

const ProvisionsView = () => {
    const { dataState } = useData();
    const { allEntries, allActuals, settings } = dataState;

    const provisionData = useMemo(() => {
        const provisionEntries = Object.values(allEntries).flat().filter(e => e.isProvision);

        const dataByTiers = provisionEntries.reduce((acc, entry) => {
            const actualsForEntry = Object.values(allActuals).flat().filter(a => a.budgetId === entry.id);
            
            const provisionPayments = actualsForEntry
                .filter(a => a.isProvision)
                .flatMap(a => a.payments || []);
            
            const finalPayments = actualsForEntry
                .filter(a => a.isFinalProvisionPayment)
                .flatMap(a => a.payments || []);

            const totalProvisioned = provisionPayments.reduce((sum, p) => sum + p.paidAmount, 0);
            const totalPaidOut = finalPayments.reduce((sum, p) => sum + p.paidAmount, 0);
            const netBalance = totalProvisioned - totalPaidOut;

            if (!acc[entry.supplier]) {
                acc[entry.supplier] = [];
            }

            acc[entry.supplier].push({
                entry,
                totalProvisioned,
                totalPaidOut,
                netBalance,
            });

            return acc;
        }, {});

        const summary = {
            totalProvisioned: 0,
            totalPaidOut: 0,
            netBalance: 0,
        };

        Object.values(dataByTiers).flat().forEach(item => {
            summary.totalProvisioned += item.totalProvisioned;
            summary.totalPaidOut += item.totalPaidOut;
            summary.netBalance += item.netBalance;
        });

        return { dataByTiers, summary };

    }, [allEntries, allActuals]);

    const { dataByTiers, summary } = provisionData;

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Lock className="w-8 h-8 text-indigo-600" />
                    État des Provisions
                </h1>
                <p className="text-gray-600 mt-2">Suivez le solde de vos fonds mis de côté pour vos grosses dépenses futures.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-100 p-2 rounded-full"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                        <p className="text-sm text-gray-500">Total Provisionné</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalProvisioned, settings)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-red-100 p-2 rounded-full"><TrendingDown className="w-5 h-5 text-red-600" /></div>
                        <p className="text-sm text-gray-500">Total Payé aux Tiers</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalPaidOut, settings)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 p-2 rounded-full"><Lock className="w-5 h-5 text-blue-600" /></div>
                        <p className="text-sm text-gray-500">Solde Net des Provisions</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(summary.netBalance, settings)}</p>
                </div>
            </div>

            {Object.keys(dataByTiers).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(dataByTiers).map(([tier, provisions]) => (
                        <div key={tier} className="bg-white p-6 rounded-lg shadow-sm border">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">{tier}</h2>
                            <div className="space-y-4">
                                {provisions.map(({ entry, totalProvisioned, totalPaidOut, netBalance }) => (
                                    <div key={entry.id} className="p-4 border rounded-lg bg-gray-50/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-700">{entry.description || entry.category}</p>
                                                <p className="text-sm text-gray-500">
                                                    Objectif: {formatCurrency(entry.amount, settings)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-blue-700">{formatCurrency(netBalance, settings)}</p>
                                                <p className="text-xs text-gray-500">Solde Actuel</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-center text-sm">
                                            <div>
                                                <p className="text-xs text-gray-500">Provisionné</p>
                                                <p className="font-semibold text-green-600">{formatCurrency(totalProvisioned, settings)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Payé</p>
                                                <p className="font-semibold text-red-600">{formatCurrency(totalPaidOut, settings)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Statut</p>
                                                <p className={`font-semibold flex items-center justify-center gap-1 ${netBalance >= entry.amount ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {netBalance >= entry.amount ? <CheckCircle size={14}/> : <Clock size={14}/>}
                                                    {netBalance >= entry.amount ? 'Complet' : 'En cours'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={Lock}
                    title="Aucun fonds provisionné"
                    message="Commencez par créer une dépense avec l'option 'Fonds à provisionner' pour suivre votre épargne ici."
                />
            )}
        </div>
    );
};

export default ProvisionsView;
