import React, { useMemo } from 'react';
import { X, User, TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { formatCurrency, formatPaymentTerms } from '../utils/formatting';

const TierDetailDrawer = ({ isOpen, onClose, context }) => {
    const { dataState } = useData();
    const { uiState } = useUI();
    const { tiers, allEntries, allActuals, settings, consolidatedViews } = dataState;
    const { activeProjectId } = uiState;

    const { tier, associatedEntries, kpis } = useMemo(() => {
        if (!context) return { tier: null, associatedEntries: [], kpis: {} };

        const { tierName, tierType } = context;
        const foundTier = tiers.find(t => t.name === tierName && t.type === tierType);

        let relevantEntries = [];
        let relevantActuals = [];
        const isConsolidated = activeProjectId === 'consolidated' || activeProjectId.startsWith('consolidated_view_');
        
        if (isConsolidated) {
            relevantEntries = Object.values(allEntries).flat();
            relevantActuals = Object.values(allActuals).flat();
        } else {
            relevantEntries = allEntries[activeProjectId] || [];
            relevantActuals = allActuals[activeProjectId] || [];
        }

        const entries = relevantEntries.filter(e => e.supplier === tierName && (e.type === 'revenu' ? 'client' : 'fournisseur') === tierType);
        const actuals = relevantActuals.filter(a => a.thirdParty === tierName && (a.type === 'receivable' ? 'client' : 'fournisseur') === tierType);

        const totalBudgeted = entries.reduce((sum, e) => sum + e.amount, 0);
        const totalRealized = actuals.reduce((sum, a) => sum + (a.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0), 0);
        const totalDue = actuals.reduce((sum, a) => sum + a.amount, 0);
        const remaining = totalDue - totalRealized;

        return {
            tier: foundTier,
            associatedEntries: entries.sort((a, b) => new Date(b.startDate || b.date) - new Date(a.startDate || a.date)),
            kpis: {
                totalBudgeted,
                totalRealized,
                remaining
            }
        };
    }, [context, tiers, allEntries, allActuals, activeProjectId, consolidatedViews]);

    if (!isOpen || !context) return null;

    const Icon = context.tierType === 'client' ? TrendingUp : TrendingDown;
    const color = context.tierType === 'client' ? 'text-green-600' : 'text-red-600';

    return (
        <>
            <div className={`fixed inset-0 bg-black z-40 transition-opacity ${isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className={`fixed top-0 right-0 bottom-0 w-full max-w-lg bg-gray-50 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between p-4 border-b bg-white">
                        <div className="flex items-center gap-3">
                            <User className="w-6 h-6 text-gray-500" />
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">{context.tierName}</h2>
                                <p className={`text-sm font-medium ${color}`}>{context.tierType === 'client' ? 'Client' : 'Fournisseur'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto">
                        <div className="bg-white p-4 rounded-lg border mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3">Synthèse Financière</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Total Budgété</p>
                                    <p className="font-bold text-lg text-gray-800">{formatCurrency(kpis.totalBudgeted, settings)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Total Réalisé</p>
                                    <p className="font-bold text-lg text-blue-600">{formatCurrency(kpis.totalRealized, settings)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-gray-500">Solde Restant Dû</p>
                                    <p className={`font-bold text-lg ${kpis.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(kpis.remaining, settings)}</p>
                                </div>
                            </div>
                            {tier?.payment_terms && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-sm font-medium text-gray-600">Conditions de paiement</p>
                                    <p className="text-sm text-gray-800">{formatPaymentTerms(tier.payment_terms)}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-md font-semibold text-gray-700 mb-3">Écritures Budgétaires Associées</h3>
                            {associatedEntries.length > 0 ? (
                                <ul className="space-y-2">
                                    {associatedEntries.map(entry => (
                                        <li key={entry.id} className="p-3 bg-white rounded-lg border">
                                            <p className="font-medium text-sm text-gray-800">{entry.category}</p>
                                            <p className="text-xs text-gray-500">{entry.description || 'Pas de description'}</p>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="text-xs text-gray-500">{entry.frequency}</span>
                                                <span className={`font-semibold ${entry.type === 'revenu' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(entry.amount, settings)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-4">Aucune écriture budgétaire pour ce tiers.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TierDetailDrawer;
