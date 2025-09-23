import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Save, Plus, FolderPlus, TrendingUp, TrendingDown } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';

const AddCategoryFlowModal = ({ isOpen, onClose }) => {
    const { state, dispatch } = useBudget();
    const { categories } = state;

    const [type, setType] = useState('expense');
    const [mainCategorySelection, setMainCategorySelection] = useState('');
    const [newMainCategoryName, setNewMainCategoryName] = useState('');
    const [newSubCategoryName, setNewSubCategoryName] = useState('');

    const availableMainCategories = useMemo(() => {
        return type === 'expense' ? categories.expense : categories.revenue;
    }, [type, categories]);

    const resetForm = () => {
        setType('expense');
        setMainCategorySelection('');
        setNewMainCategoryName('');
        setNewSubCategoryName('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!newSubCategoryName.trim()) {
            dispatch({ type: 'ADD_TOAST', payload: { message: "Le nom de la sous-catégorie est obligatoire.", type: 'error' } });
            return;
        }

        let mainCatId;
        let mainCatName;

        if (mainCategorySelection === 'new') {
            if (!newMainCategoryName.trim()) {
                dispatch({ type: 'ADD_TOAST', payload: { message: "Le nom de la nouvelle catégorie principale est obligatoire.", type: 'error' } });
                return;
            }
            mainCatId = uuidv4();
            mainCatName = newMainCategoryName.trim();
            const newMainCategory = {
                id: mainCatId,
                name: mainCatName,
                isFixed: false,
                subCategories: [],
            };
            const categoryType = type === 'expense' ? 'expense' : 'revenue';
            dispatch({ type: 'ADD_MAIN_CATEGORY', payload: { type: categoryType, newMainCategory } });
        } else {
            mainCatId = mainCategorySelection;
            mainCatName = availableMainCategories.find(mc => mc.id === mainCatId)?.name;
        }

        if (!mainCatId) {
            dispatch({ type: 'ADD_TOAST', payload: { message: "Veuillez sélectionner ou créer une catégorie principale.", type: 'error' } });
            return;
        }

        const categoryType = type === 'expense' ? 'expense' : 'revenue';
        dispatch({
            type: 'ADD_SUB_CATEGORY',
            payload: {
                type: categoryType,
                mainCategoryId: mainCatId,
                subCategoryName: newSubCategoryName.trim(),
            }
        });
        
        dispatch({ type: 'ADD_TOAST', payload: { message: `Sous-catégorie "${newSubCategoryName}" ajoutée à "${mainCatName}".`, type: 'success' } });
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-blue-600" />
                        Ajouter une Catégorie
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center"><input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={(e) => setType(e.target.value)} className="mr-2" /><TrendingDown className="w-4 h-4 mr-1 text-red-600" /> Dépense</label>
                            <label className="flex items-center"><input type="radio" name="type" value="revenue" checked={type === 'revenue'} onChange={(e) => setType(e.target.value)} className="mr-2" /><TrendingUp className="w-4 h-4 mr-1 text-green-600" /> Revenu</label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie Principale</label>
                        <select
                            value={mainCategorySelection}
                            onChange={(e) => setMainCategorySelection(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        >
                            <option value="">Sélectionner une catégorie existante</option>
                            {availableMainCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                            <option value="new">--- Créer une nouvelle catégorie principale ---</option>
                        </select>
                    </div>

                    {mainCategorySelection === 'new' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la nouvelle catégorie principale</label>
                            <input
                                type="text"
                                value={newMainCategoryName}
                                onChange={(e) => setNewMainCategoryName(e.target.value)}
                                placeholder="Ex: Investissements Personnels"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </motion.div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la nouvelle sous-catégorie *</label>
                        <input
                            type="text"
                            value={newSubCategoryName}
                            onChange={(e) => setNewSubCategoryName(e.target.value)}
                            placeholder="Ex: Actions, Immobilier..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                            Annuler
                        </button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                            <Save className="w-4 h-4" /> Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCategoryFlowModal;
