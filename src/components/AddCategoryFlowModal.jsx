import React, { useState, useMemo } from 'react';
import { X, Save, FolderPlus, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { saveMainCategory } from '../context/actions';

const AddCategoryFlowModal = ({ isOpen, onClose, type, onCategorySelected }) => {
    const { dataState, dataDispatch } = useData();
    const { uiState } = useUI();
    const { categories, allEntries, session } = dataState;
    const { activeProjectId } = uiState;

    const [newMainCategoryName, setNewMainCategoryName] = useState('');

    const unusedMainCategories = useMemo(() => {
        if (!type) return [];
        const projectEntries = allEntries[activeProjectId] || [];
        const usedSubCategoryNames = new Set(projectEntries.map(e => e.category));
        
        return categories[type === 'revenu' ? 'revenue' : 'expense'].filter(mainCat => 
            !mainCat.subCategories.some(subCat => usedSubCategoryNames.has(subCat.name))
        );
    }, [type, categories, allEntries, activeProjectId]);

    const handleCreateAndSelect = async (e) => {
        e.preventDefault();
        if (!newMainCategoryName.trim()) return;
        const newCategory = await saveMainCategory({dataDispatch, uiDispatch}, { type: type === 'revenu' ? 'revenue' : 'expense', name: newMainCategoryName.trim(), user: session.user });
        if (newCategory) {
            onCategorySelected(newCategory.id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-blue-600" />
                        Ajouter une écriture
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Choisir une catégorie existante non utilisée</h3>
                        {unusedMainCategories.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {unusedMainCategories.map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => onCategorySelected(cat.id)}
                                        className="p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300"
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Toutes vos catégories sont déjà utilisées dans ce projet.</p>
                        )}
                    </div>
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-2 text-sm text-gray-500">OU</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Créer une nouvelle catégorie principale</h3>
                        <form onSubmit={handleCreateAndSelect} className="flex gap-2">
                            <input
                                type="text"
                                value={newMainCategoryName}
                                onChange={(e) => setNewMainCategoryName(e.target.value)}
                                placeholder="Ex: Investissements Personnels"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm">
                                <Plus className="w-4 h-4" /> Créer et Sélectionner
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryFlowModal;
