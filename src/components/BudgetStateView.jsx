import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { formatCurrency, formatPaymentTerms } from '../utils/formatting';
import { HandCoins, TrendingDown, Briefcase, Plus, Trash2, Folder, Search, Lock, Edit } from 'lucide-react';
import EmptyState from './EmptyState';
import AddCategoryFlowModal from './AddCategoryFlowModal';
import { deleteEntry } from '../context/actions';
import { expandVatEntries } from '../utils/budgetCalculations';

const criticalityConfig = {
    critical: { label: 'Critique', color: 'bg-red-500' },
    essential: { label: 'Essentiel', color: 'bg-yellow-500' },
    discretionary: { label: 'Discrétionnaire', color: 'bg-blue-500' },
};

const LectureView = ({ entries, settings, tiers, setMode, categories }) => {
    const sortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => {
            const dateA = a.startDate || a.date;
            const dateB = b.startDate || b.date;
            return new Date(dateA) - new Date(dateB);
        });
    }, [entries]);

    const renderSection = (type) => {
        const sectionEntries = sortedEntries.filter(e => e.type === type);
        const title = type === 'revenu' ? 'Budget des encaissements' : 'Budget des décaissements';
        const Icon = type === 'revenu' ? HandCoins : TrendingDown;

        return (
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                    <Icon className={`w-7 h-7 ${type === 'revenu' ? 'text-green-500' : 'text-red-500'}`} />
                    {title}
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs text-gray-500 uppercase">
                                <th className="py-3 px-4 w-[15%]">Sous-catégorie</th>
                                <th className="py-3 px-4 w-[15%]">Tiers</th>
                                <th className="py-3 px-4 w-[15%]">Délai de paiement</th>
                                <th className="py-3 px-4 w-[15%]">Description</th>
                                <th className="py-3 px-4 w-[15%]">Détails</th>
                                <th className="py-3 px-4 w-[5%]">Fréquence</th>
                                <th className="py-3 px-4 w-[10%]">Période</th>
                                <th className="py-3 px-4 text-right w-[10%]">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sectionEntries.length > 0 ? (
                                sectionEntries.map(entry => {
                                    const tier = tiers.find(t => t.name === entry.supplier && t.type === (entry.type === 'revenu' ? 'client' : 'fournisseur'));
                                    const subCat = (entry.type === 'depense') 
                                        ? categories.expense.flatMap(mc => mc.subCategories).find(sc => sc.name === entry.category) 
                                        : null;
                                    const criticality = subCat?.criticality;
                                    const critConfig = criticalityConfig[criticality];
                                    return (
                                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium">
                                                <div className="flex items-center gap-2">
                                                    {critConfig && <span className={`w-2 h-2 rounded-full ${critConfig.color}`} title={`Criticité: ${critConfig.label}`}></span>}
                                                    <span className={`${entry.type === 'revenu' ? 'text-green-700' : 'text-red-700'}`}>{entry.category}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{entry.supplier}</td>
                                            <td className="py-3 px-4 text-gray-500 text-xs">{formatPaymentTerms(tier?.payment_terms)}</td>
                                            <td className="py-3 px-4 text-gray-500 text-xs italic">{entry.description || '-'}</td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {entry.isProvision && (
                                                    <div className="flex items-center gap-2 text-xs text-indigo-700">
                                                        <Lock className="w-4 h-4" />
                                                        <span>
                                                            Provision en {entry.payments?.length || 0} fois de {formatCurrency((entry.payments && entry.payments.length > 0) ? entry.payments[0].amount : 0, settings)}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{entry.frequency}</td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {entry.frequency === 'ponctuel' 
                                                    ? new Date(entry.date).toLocaleDateString('fr-FR')
                                                    : `${entry.startDate ? new Date(entry.startDate).toLocaleDateString('fr-FR') : ''} - ${entry.endDate ? new Date(entry.endDate).toLocaleDateString('fr-FR') : '...'}`
                                                }
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-gray-700">
                                                {formatCurrency(entry.amount, settings)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="py-10">
                                        <EmptyState
                                            icon={Briefcase}
                                            title="Pas encore de budget"
                                            message="Cette section est vide. Commencez à construire votre budget."
                                            actionText="Ajouter un budget"
                                            onActionClick={() => setMode('edition')}
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            {renderSection('revenu')}
            {renderSection('depense')}
        </div>
    );
};

const BudgetStateView = ({ mode = 'lecture', setMode }) => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const { allEntries, projects, categories, settings, consolidatedViews, tiers } = dataState;
    const { activeProjectId } = uiState;
    
    const [isAddCategoryFlowModalOpen, setIsAddCategoryFlowModalOpen] = useState(false);
    const [addCategoryFlowType, setAddCategoryFlowType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { budgetEntries, isConsolidated } = useMemo(() => {
        const isConsolidatedView = activeProjectId === 'consolidated';
        const isCustomConsolidatedView = activeProjectId?.startsWith('consolidated_view_');

        if (isConsolidatedView) {
            return {
                budgetEntries: Object.entries(allEntries).flatMap(([projectId, entries]) => 
                    entries.map(entry => ({ ...entry, projectId }))
                ),
                isConsolidated: true,
            };
        }
        if (isCustomConsolidatedView) {
            const viewId = activeProjectId.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (!view || !view.project_ids) return { budgetEntries: [], isConsolidated: true };
            return {
                budgetEntries: view.project_ids.flatMap(projectId => 
                    (allEntries[projectId] || []).map(entry => ({ ...entry, projectId }))
                ),
                isConsolidated: true,
            };
        }
        const project = projects.find(p => p.id === activeProjectId);
        return {
            budgetEntries: project ? (allEntries[project.id] || []).map(entry => ({ ...entry, projectId: activeProjectId })) : [],
            isConsolidated: false,
        };
    }, [activeProjectId, projects, allEntries, consolidatedViews]);

    const expandedEntries = useMemo(() => {
        return expandVatEntries(budgetEntries, categories);
    }, [budgetEntries, categories]);

    const filteredBudgetEntries = useMemo(() => {
        if (!searchTerm) {
            return expandedEntries;
        }
        return expandedEntries.filter(entry => 
            entry.supplier.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expandedEntries, searchTerm]);

    const handleAddEntry = (categoryName, mainCategoryType, mainCategoryId) => {
        uiDispatch({ type: 'OPEN_BUDGET_MODAL', payload: { category: categoryName, type: mainCategoryType, mainCategoryId } });
    };

    const handleEditEntry = (entry) => {
        const originalEntryId = entry.is_vat_child ? entry.id.replace('_vat', '') : entry.id;
        const originalEntry = budgetEntries.find(e => e.id === originalEntryId);
        if (originalEntry) {
            uiDispatch({ type: 'OPEN_BUDGET_MODAL', payload: originalEntry });
        }
    };

    const handleDeleteEntry = (entry) => {
        const originalEntryId = entry.is_vat_child ? entry.id.replace('_vat', '') : entry.id;
        const originalEntry = budgetEntries.find(e => e.id === originalEntryId);
        if (originalEntry) {
            deleteEntry({dataDispatch, uiDispatch}, { entryId: originalEntry.id, entryProjectId: originalEntry.projectId });
        }
    };

    const handleCategorySelectedForNewEntry = (mainCategoryId) => {
        setIsAddCategoryFlowModalOpen(false);
        uiDispatch({ type: 'OPEN_BUDGET_MODAL', payload: { type: addCategoryFlowType, mainCategoryId } });
    };

    const renderSection = (type) => {
        const isRevenue = type === 'revenu';
        const title = isRevenue ? 'Budget des encaissements' : 'Budget des décaissements';
        const Icon = isRevenue ? HandCoins : TrendingDown;
        const mainCategories = isRevenue ? categories.revenue : categories.expense;

        const sectionEntries = filteredBudgetEntries.filter(e => e.type === type);
        const totalAmount = sectionEntries.reduce((sum, e) => sum + e.amount, 0);

        return (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <Icon className={`w-7 h-7 ${isRevenue ? 'text-green-500' : 'text-red-500'}`} />
                    {title}
                </h2>
                
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-xs text-gray-500 uppercase">
                            <th className="py-3 px-4 w-[15%]">Sous-catégorie</th>
                            <th className="py-3 px-4 w-[15%]">Description</th>
                            <th className="py-3 px-4 w-[15%]">Tiers</th>
                            <th className="py-3 px-4 w-[20%]">Détails</th>
                            <th className="py-3 px-4 w-[10%]">Fréquence</th>
                            <th className="py-3 px-4 w-[8%]">Début</th>
                            <th className="py-3 px-4 w-[8%]">Fin</th>
                            <th className="py-3 px-4 text-right w-[9%]">Montant</th>
                            <th className="py-3 px-4 text-right w-12">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mainCategories.map(mainCat => {
                            const entriesForMainCat = sectionEntries.filter(entry => 
                                mainCat.subCategories.some(sc => sc.name === entry.category) || (entry.is_vat_child && (entry.category === 'TVA collectée' || entry.category === 'TVA déductible') && mainCat.name === 'IMPÔTS & CONTRIBUTIONS')
                            );
                            if (entriesForMainCat.length === 0) return null;

                            const mainCatTotal = entriesForMainCat.reduce((sum, e) => sum + e.amount, 0);
                            const percentage = totalAmount > 0 ? (mainCatTotal / totalAmount) * 100 : 0;

                            return (
                                <React.Fragment key={mainCat.id}>
                                    <tr className="bg-gray-100 font-semibold">
                                        <td className="py-3 px-4" colSpan="8">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Folder className="w-4 h-4 text-gray-600" />
                                                    {mainCat.name}
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                                    {mainCat.subCategories.filter(sc => !sc.isFixed).map(sc => (
                                                        <button key={sc.id} onClick={(e) => { e.stopPropagation(); handleAddEntry(sc.name, type, mainCat.id); }} className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full hover:bg-gray-300 text-xs font-normal">
                                                            <Plus size={12} /> {sc.name}
                                                        </button>
                                                    ))}
                                                    <button onClick={(e) => { e.stopPropagation(); handleAddEntry(null, type, mainCat.id); }} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 font-semibold text-xs">
                                                        <Plus size={12} /> Nouvelle sous-catégorie
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {formatCurrency(mainCatTotal, settings)}
                                            {totalAmount > 0 && mainCatTotal > 0 && (
                                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">{percentage.toFixed(1)}%</span>
                                            )}
                                        </td>
                                    </tr>
                                    {entriesForMainCat.map(entry => {
                                        const subCat = mainCat.subCategories.find(sc => sc.name === entry.category);
                                        const criticality = subCat?.criticality;
                                        const critConfig = criticalityConfig[criticality];
                                        return (
                                            <tr key={entry.id} className={`border-b hover:bg-gray-50 group ${entry.is_vat_child ? 'bg-gray-50/50' : ''}`}>
                                                <td className="py-3 px-4 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {critConfig && entry.type === 'depense' && <span className={`w-2 h-2 rounded-full ${critConfig.color}`} title={`Criticité: ${critConfig.label}`}></span>}
                                                        <span className={`${entry.is_vat_child ? 'pl-8 text-slate-600' : 'text-gray-800'}`}>{entry.category}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500 text-xs italic">{entry.description || '-'}</td>
                                                <td className="py-3 px-4 text-gray-600">{entry.supplier}</td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {entry.isProvision && (
                                                        <div className="flex items-center gap-2 text-xs text-indigo-700">
                                                            <Lock className="w-4 h-4" />
                                                            <span>
                                                                Provision en {entry.payments?.length || 0} fois de {formatCurrency((entry.payments && entry.payments.length > 0) ? entry.payments[0].amount : 0, settings)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">{entry.frequency}</td>
                                                <td className="py-3 px-4 text-gray-600">{entry.startDate ? new Date(entry.startDate).toLocaleDateString('fr-FR') : (entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : '-')}</td>
                                                <td className="py-3 px-4 text-gray-600">{entry.endDate ? new Date(entry.endDate).toLocaleDateString('fr-FR') : 'Indéterminée'}</td>
                                                <td className="py-3 px-4 text-right font-medium text-gray-700">{formatCurrency(entry.amount, settings)}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditEntry(entry)} className="p-1 text-blue-500 hover:text-blue-700" title="Modifier">
                                                            <Edit size={14} />
                                                        </button>
                                                        <button onClick={() => handleDeleteEntry(entry)} className="p-1 text-red-500 hover:text-red-700" title="Supprimer">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                        <tr className="border-b">
                            <td colSpan="10" className="py-4 px-4 text-center">
                                <button onClick={() => { setAddCategoryFlowType(type); setIsAddCategoryFlowModalOpen(true); }} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mx-auto">
                                    <Plus size={16} /> Ajouter une écriture dans une autre catégorie
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    if (isConsolidated) {
        return <div className="text-center p-8 text-gray-500">L'état des lieux est disponible uniquement pour les projets individuels.</div>;
    }
    
    if (mode === 'lecture') {
        return <LectureView entries={filteredBudgetEntries} settings={settings} tiers={tiers} setMode={setMode} categories={categories} />;
    }

    return (
        <div>
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher par tiers..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                </div>
            </div>

            {searchTerm && filteredBudgetEntries.length === 0 ? (
                <EmptyState 
                    icon={Search} 
                    title="Aucun résultat" 
                    message={`Aucune entrée trouvée pour le tiers "${searchTerm}".`} 
                />
            ) : (
                <>
                    {renderSection('revenu')}
                    {renderSection('depense')}
                </>
            )}
            
            <AddCategoryFlowModal 
                isOpen={isAddCategoryFlowModalOpen}
                onClose={() => setIsAddCategoryFlowModalOpen(false)}
                type={addCategoryFlowType}
                onCategorySelected={handleCategorySelectedForNewEntry}
            />
        </div>
    );
};

export default BudgetStateView;
