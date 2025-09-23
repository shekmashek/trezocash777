import React, { useMemo, useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/formatting';
import { HandCoins, TrendingDown, Briefcase, Plus, Trash2, Folder } from 'lucide-react';
import EmptyState from './EmptyState';
import AddCategoryModal from './AddCategoryModal';
import { deleteEntry } from '../context/actions';

const BudgetStateView = () => {
    const { state, dispatch } = useBudget();
    const { allEntries, activeProjectId, projects, categories, settings, consolidatedViews } = state;
    
    const [addCategoryModalState, setAddCategoryModalState] = useState({ isOpen: false, type: '', mainCategoryId: '', mainCategoryName: '' });

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
        // Single project view
        const project = projects.find(p => p.id === activeProjectId);
        return {
            budgetEntries: project ? (allEntries[project.id] || []).map(entry => ({ ...entry, projectId: activeProjectId })) : [],
            isConsolidated: false,
        };
    }, [activeProjectId, projects, allEntries, consolidatedViews]);

    const handleAddEntry = (categoryName, mainCategoryType) => {
        dispatch({ type: 'OPEN_BUDGET_MODAL', payload: { category: categoryName, type: mainCategoryType } });
    };

    const handleOpenAddSubCategory = (type, mainCat) => {
        setAddCategoryModalState({ isOpen: true, type, mainCategoryId: mainCat.id, mainCategoryName: mainCat.name });
    };

    const handleSaveNewCategory = (subCategoryName) => {
        dispatch({ type: 'ADD_SUB_CATEGORY', payload: { type: addCategoryModalState.type, mainCategoryId: addCategoryModalState.mainCategoryId, subCategoryName } });
        setAddCategoryModalState({ isOpen: false, type: '', mainCategoryId: '', mainCategoryName: '' });
    };

    const handleDeleteEntry = (entry) => {
        dispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: 'Supprimer cette entrée ?',
                message: 'Cette action est irréversible et supprimera l\'entrée budgétaire.',
                onConfirm: () => deleteEntry(dispatch, { entryId: entry.id, entryProjectId: entry.projectId }),
            }
        });
    };

    const renderSection = (type) => {
        const isRevenue = type === 'revenu';
        const title = isRevenue ? 'Revenus' : 'Dépenses';
        const Icon = isRevenue ? HandCoins : TrendingDown;
        const mainCategories = isRevenue ? categories.revenue : categories.expense;

        const sectionEntries = budgetEntries.filter(e => e.type === type);
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
                            <th className="py-3 px-4 w-[18%]">Sous-catégorie</th>
                            <th className="py-3 px-4 w-[18%]">Nom</th>
                            <th className="py-3 px-4 w-[18%]">Tiers</th>
                            <th className="py-3 px-4 w-[12%]">Fréquence</th>
                            <th className="py-3 px-4 w-[10%]">Début</th>
                            <th className="py-3 px-4 w-[10%]">Fin</th>
                            <th className="py-3 px-4 text-right w-[10%]">Montant</th>
                            <th className="py-3 px-4 text-right w-12">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mainCategories.map(mainCat => {
                            const entriesForMainCat = sectionEntries.filter(entry => 
                                mainCat.subCategories.some(sc => sc.name === entry.category)
                            );
                            if (entriesForMainCat.length === 0) return null;

                            const mainCatTotal = entriesForMainCat.reduce((sum, e) => sum + e.amount, 0);
                            const percentage = totalAmount > 0 ? (mainCatTotal / totalAmount) * 100 : 0;

                            return (
                                <React.Fragment key={mainCat.id}>
                                    <tr className="bg-gray-100 font-semibold">
                                        <td className="py-3 px-4" colSpan="6">
                                            <div className="flex items-center gap-2">
                                                <Folder className="w-4 h-4 text-gray-600" />
                                                {mainCat.name}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {formatCurrency(mainCatTotal, settings)}
                                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">{percentage.toFixed(1)}%</span>
                                        </td>
                                        <td className="py-3 px-4"></td>
                                    </tr>
                                    {entriesForMainCat.map(entry => (
                                        <tr key={entry.id} className="border-b hover:bg-gray-50 group">
                                            <td className="py-3 px-4 text-blue-600 font-medium">{entry.category}</td>
                                            <td className="py-3 px-4 text-gray-600">{entry.description || '-'}</td>
                                            <td className="py-3 px-4 text-gray-600">{entry.supplier}</td>
                                            <td className="py-3 px-4 text-gray-600">{entry.frequency}</td>
                                            <td className="py-3 px-4 text-gray-600">{entry.startDate ? new Date(entry.startDate).toLocaleDateString('fr-FR') : (entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : '-')}</td>
                                            <td className="py-3 px-4 text-gray-600">{entry.endDate ? new Date(entry.endDate).toLocaleDateString('fr-FR') : 'Indéterminée'}</td>
                                            <td className="py-3 px-4 text-right font-medium text-gray-700">{formatCurrency(entry.amount, settings)}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button onClick={() => handleDeleteEntry(entry)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700">
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-b">
                                        <td colSpan="8" className="py-2 px-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span>Ajouter :</span>
                                                {mainCat.subCategories.slice(0,3).map(sc => (
                                                    <button key={sc.id} onClick={() => handleAddEntry(sc.name, type)} className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full hover:bg-gray-300">
                                                        <Plus size={12} /> {sc.name}
                                                    </button>
                                                ))}
                                                <button onClick={() => handleOpenAddSubCategory(type, mainCat)} className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded-full hover:bg-gray-300">
                                                    <Plus size={12} /> Nouvelle sous-catégorie
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                        <tr className="border-b">
                            <td colSpan="8" className="py-4 px-4 text-center">
                                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mx-auto">
                                    <Plus size={16} /> Ajouter une catégorie
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

    if (!budgetEntries || budgetEntries.length === 0) {
        return <EmptyState icon={Briefcase} title="Aucune entrée budgétaire" message="Commencez par ajouter des revenus et des dépenses pour voir l'état des lieux de votre budget." />;
    }

    return (
        <div>
            {renderSection('revenu')}
            {renderSection('depense')}
            <AddCategoryModal 
                isOpen={addCategoryModalState.isOpen}
                onClose={() => setAddCategoryModalState({ isOpen: false, type: '', mainCategoryId: '', mainCategoryName: '' })}
                onSave={handleSaveNewCategory}
                mainCategoryName={addCategoryModalState.mainCategoryName}
            />
        </div>
    );
};

export default BudgetStateView;
