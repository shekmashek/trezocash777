import React, { useState } from 'react';
import { Edit, Trash2, Plus, Save, X } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { v4 as uuidv4 } from 'uuid';

const CategoryManagementView = () => {
  const { state, dispatch } = useBudget();
  const { categories, allEntries, allActuals } = state;

  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [newSubCategory, setNewSubCategory] = useState({});
  const [editingMainCategory, setEditingMainCategory] = useState(null);
  const [newMainCategoryName, setNewMainCategoryName] = useState({ expense: '', revenue: '' });

  const handleStartEdit = (type, mainId, subId, name) => setEditingSubCategory({ type, mainId, subId, name });
  const handleCancelEdit = () => setEditingSubCategory(null);
  const handleSaveEdit = () => {
    if (editingSubCategory.name.trim()) {
      dispatch({ type: 'UPDATE_SUB_CATEGORY', payload: { type: editingSubCategory.type, mainCategoryId: editingSubCategory.mainId, subCategoryId: editingSubCategory.subId, newName: editingSubCategory.name.trim() } });
      handleCancelEdit();
    } else {
      dispatch({ type: 'ADD_TOAST', payload: { message: "Le nom ne peut pas être vide.", type: 'error' } });
    }
  };
  const handleAddSubCategory = (type, mainId) => {
    const name = newSubCategory[mainId]?.trim();
    if (name) {
      dispatch({ type: 'ADD_SUB_CATEGORY', payload: { type, mainCategoryId: mainId, subCategoryName: name } });
      setNewSubCategory(prev => ({ ...prev, [mainId]: '' }));
    } else {
      dispatch({ type: 'ADD_TOAST', payload: { message: "Veuillez entrer un nom pour la nouvelle sous-catégorie.", type: 'error' } });
    }
  };
  
  const isSubCategoryUsed = (subCategoryName) => {
    const entries = Object.values(allEntries).flat();
    const actuals = Object.values(allActuals).flat();
    return entries.some(e => e.category === subCategoryName) || actuals.some(a => a.category === subCategoryName);
  };

  const handleDeleteSubCategory = (type, mainId, subId) => {
    const mainCat = categories[type]?.find(mc => mc.id === mainId);
    const subCat = mainCat?.subCategories.find(sc => sc.id === subId);
    if (!subCat) return;

    if (isSubCategoryUsed(subCat.name)) {
      dispatch({ type: 'ADD_TOAST', payload: { message: `Suppression impossible: la catégorie "${subCat.name}" est utilisée.`, type: 'error' } });
      return;
    }

    dispatch({
      type: 'OPEN_CONFIRMATION_MODAL',
      payload: {
        title: `Supprimer "${subCat.name}" ?`,
        message: 'Cette action est irréversible.',
        onConfirm: () => dispatch({ type: 'DELETE_SUB_CATEGORY', payload: { type, mainId, subId } }),
      }
    });
  };

  const handleAddMainCategory = (type) => {
    const name = newMainCategoryName[type].trim();
    if (name) {
      const newMainCategory = {
        id: uuidv4(),
        name,
        isFixed: false,
        subCategories: []
      };
      dispatch({ type: 'ADD_MAIN_CATEGORY', payload: { type, newMainCategory } });
      setNewMainCategoryName(prev => ({ ...prev, [type]: '' }));
    } else {
      dispatch({ type: 'ADD_TOAST', payload: { message: "Le nom ne peut pas être vide.", type: 'error' } });
    }
  };

  const handleStartEditMain = (type, mainCat) => {
    setEditingMainCategory({ type, id: mainCat.id, name: mainCat.name });
  };

  const handleCancelEditMain = () => {
    setEditingMainCategory(null);
  };

  const handleSaveEditMain = () => {
    if (editingMainCategory.name.trim()) {
      dispatch({ 
        type: 'UPDATE_MAIN_CATEGORY', 
        payload: { 
          type: editingMainCategory.type, 
          mainCategoryId: editingMainCategory.id, 
          newName: editingMainCategory.name.trim()
        } 
      });
      handleCancelEditMain();
    } else {
      dispatch({ type: 'ADD_TOAST', payload: { message: "Le nom ne peut pas être vide.", type: 'error' } });
    }
  };

  const isMainCategoryUsed = (mainCat) => {
    return mainCat.subCategories.some(sc => isSubCategoryUsed(sc.name));
  };

  const handleDeleteMainCategory = (type, mainCat) => {
    if (mainCat.isFixed) {
      dispatch({ type: 'ADD_TOAST', payload: { message: "Impossible de supprimer une catégorie principale fixe.", type: 'error' } });
      return;
    }
    if (isMainCategoryUsed(mainCat)) {
      dispatch({ type: 'ADD_TOAST', payload: { message: `Suppression impossible: la catégorie "${mainCat.name}" contient des sous-catégories utilisées.`, type: 'error' } });
      return;
    }
    dispatch({
      type: 'OPEN_CONFIRMATION_MODAL',
      payload: {
        title: `Supprimer la catégorie "${mainCat.name}" ?`,
        message: 'Toutes ses sous-catégories (si existentes) seront également supprimées. Cette action est irréversible.',
        onConfirm: () => dispatch({ type: 'DELETE_MAIN_CATEGORY', payload: { type, mainCategoryId: mainCat.id } }),
      }
    });
  };

  const renderCategorySection = (type, title) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="space-y-4">
        {categories[type].map(mainCat => (
          <div key={mainCat.id} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center group mb-3 pb-3 border-b">
              {editingMainCategory?.id === mainCat.id ? (
                <input 
                  type="text" 
                  value={editingMainCategory.name} 
                  onChange={(e) => setEditingMainCategory(prev => ({ ...prev, name: e.target.value }))} 
                  className="font-bold text-lg text-gray-700 px-2 py-1 border rounded-md w-full" 
                  autoFocus 
                />
              ) : (
                <h3 className="font-bold text-lg text-gray-700">{mainCat.name}</h3>
              )}
              <div className="flex items-center gap-2 pl-4">
                {editingMainCategory?.id === mainCat.id ? (
                  <>
                    <button onClick={handleSaveEditMain} className="p-1 text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
                    <button onClick={handleCancelEditMain} className="p-1 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  !mainCat.isFixed && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleStartEditMain(type, mainCat)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteMainCategory(type, mainCat)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )
                )}
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {mainCat.subCategories.map(subCat => (
                <li key={subCat.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                  {editingSubCategory?.subId === subCat.id ? (<input type="text" value={editingSubCategory.name} onChange={(e) => setEditingSubCategory(prev => ({ ...prev, name: e.target.value }))} className="px-2 py-1 border rounded-md" autoFocus/>) : (<span className="text-gray-600">{subCat.name}</span>)}
                  <div className="flex items-center gap-2">
                    {editingSubCategory?.subId === subCat.id ? (<><button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button><button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button></>) : (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(type, mainCat.id, subCat.id, subCat.name)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteSubCategory(type, mainCat.id, subCat.id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed" title={isSubCategoryUsed(subCat.name) ? "Suppression impossible: catégorie utilisée" : "Supprimer"}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t">
              <div className="flex gap-2">
                <input type="text" value={newSubCategory[mainCat.id] || ''} onChange={(e) => setNewSubCategory(prev => ({ ...prev, [mainCat.id]: e.target.value }))} placeholder="Nouvelle sous-catégorie" className="flex-grow px-3 py-2 border rounded-lg text-sm" onKeyPress={(e) => e.key === 'Enter' && handleAddSubCategory(type, mainCat.id)} />
                <button onClick={() => handleAddSubCategory(type, mainCat.id)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"><Plus className="w-4 h-4" /> Ajouter</button>
              </div>
            </div>
          </div>
        ))}
        <div className="mt-6 pt-6 border-t border-dashed">
            <h3 className="font-semibold text-gray-700 mb-2">Ajouter une catégorie principale</h3>
            <div className="flex gap-2">
                <input type="text" value={newMainCategoryName[type]} onChange={(e) => setNewMainCategoryName(prev => ({...prev, [type]: e.target.value}))} placeholder={`Nouvelle catégorie de ${title.toLowerCase()}`} className="flex-grow px-3 py-2 border rounded-lg text-sm" onKeyPress={(e) => e.key === 'Enter' && handleAddMainCategory(type)} />
                <button onClick={() => handleAddMainCategory(type)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"><Plus className="w-4 h-4" /> Ajouter</button>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {renderCategorySection('expense', 'Catégories de Dépenses')}
      {renderCategorySection('revenue', 'Catégories de Revenus')}
    </>
  );
};

export default CategoryManagementView;
