import React, { useState } from 'react';
import { Edit, Trash2, Plus, Save, X, FolderKanban, Folder, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import EmptyState from './EmptyState';
import { saveMainCategory } from '../context/actions';

const CategoryManagementPage = () => {
  const { dataState, dataDispatch } = useData();
  const { uiDispatch } = useUI();
  const { categories, allEntries, allActuals, projects, session } = dataState;

  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [newSubCategory, setNewSubCategory] = useState({});
  const [editingMainCategory, setEditingMainCategory] = useState(null);
  const [newMainCategoryName, setNewMainCategoryName] = useState({ expense: '', revenue: '' });
  const [filterProject, setFilterProject] = useState('all');

  const handleStartEdit = (type, mainId, subId, name) => setEditingSubCategory({ type, mainId, subId, name });
  const handleCancelEdit = () => setEditingSubCategory(null);
  
  const handleSaveEdit = () => {
    if (editingSubCategory.name.trim()) {
      const mainCat = categories[editingSubCategory.type]?.find(mc => mc.id === editingSubCategory.mainId);
      const oldSubCat = mainCat?.subCategories.find(sc => sc.id === editingSubCategory.subId);
      
      dataDispatch({ 
        type: 'UPDATE_SUB_CATEGORY', 
        payload: { 
          type: editingSubCategory.type, 
          mainCategoryId: editingSubCategory.mainId, 
          subCategoryId: editingSubCategory.subId, 
          newName: editingSubCategory.name.trim(),
          oldName: oldSubCat?.name 
        } 
      });
      handleCancelEdit();
    } else {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom ne peut pas être vide.", type: 'error' } });
    }
  };

  const handleAddSubCategory = (type, mainId) => {
    const name = newSubCategory[mainId]?.trim();
    if (name) {
      dataDispatch({ type: 'ADD_SUB_CATEGORY', payload: { type, mainCategoryId: mainId, subCategoryName: name } });
      setNewSubCategory(prev => ({ ...prev, [mainId]: '' }));
    } else {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Veuillez entrer un nom pour la nouvelle sous-catégorie.", type: 'error' } });
    }
  };
  
  const getProjectsUsingSubCategory = (subCategoryName) => {
    const projectIds = new Set();
    const projectsToSearch = filterProject === 'all' ? projects.map(p => p.id) : [filterProject];

    projectsToSearch.forEach(projectId => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const entries = allEntries[projectId] || [];
      if (entries.some(e => e.category === subCategoryName)) {
        projectIds.add(projectId);
      }
      const actuals = allActuals[projectId] || [];
      if (actuals.some(a => a.category === subCategoryName)) {
        projectIds.add(projectId);
      }
    });

    return Array.from(projectIds).map(id => {
      const project = projects.find(p => p.id === id);
      return project ? project.name : null;
    }).filter(Boolean);
  };
  
  const isSubCategoryUsedAnywhere = (subCategoryName) => {
    const entries = Object.values(allEntries).flat();
    const actuals = Object.values(allActuals).flat();
    return entries.some(e => e.category === subCategoryName) || actuals.some(a => a.category === subCategoryName);
  };

  const handleDeleteSubCategory = (type, mainId, subId) => {
    const mainCat = categories[type]?.find(mc => mc.id === mainId);
    const subCat = mainCat?.subCategories.find(sc => sc.id === subId);
    if (!subCat) return;

    if (isSubCategoryUsedAnywhere(subCat.name)) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: `Suppression impossible: la catégorie "${subCat.name}" est utilisée.`, type: 'error' } });
      return;
    }

    uiDispatch({
      type: 'OPEN_CONFIRMATION_MODAL',
      payload: {
        title: `Supprimer "${subCat.name}" ?`,
        message: 'Cette action est irréversible.',
        onConfirm: () => dataDispatch({ type: 'DELETE_SUB_CATEGORY', payload: { type, mainId, subId } }),
      }
    });
  };

  const handleAddMainCategory = (type) => {
    const name = newMainCategoryName[type].trim();
    if (name) {
      saveMainCategory({dataDispatch, uiDispatch}, { type, name, user: session.user });
      setNewMainCategoryName(prev => ({ ...prev, [type]: '' }));
    } else {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom ne peut pas être vide.", type: 'error' } });
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
      dataDispatch({ 
        type: 'UPDATE_MAIN_CATEGORY', 
        payload: { 
          type: editingMainCategory.type, 
          mainCategoryId: editingMainCategory.id, 
          newName: editingMainCategory.name.trim()
        } 
      });
      handleCancelEditMain();
    } else {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom ne peut pas être vide.", type: 'error' } });
    }
  };

  const isMainCategoryUsed = (mainCat) => {
    return mainCat.subCategories.some(sc => isSubCategoryUsedAnywhere(sc.name));
  };

  const handleDeleteMainCategory = (type, mainCat) => {
    if (mainCat.isFixed) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Impossible de supprimer une catégorie principale fixe.", type: 'error' } });
      return;
    }
    if (isMainCategoryUsed(mainCat)) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: `Suppression impossible: la catégorie "${mainCat.name}" contient des sous-catégories utilisées.`, type: 'error' } });
      return;
    }
    uiDispatch({
      type: 'OPEN_CONFIRMATION_MODAL',
      payload: {
        title: `Supprimer la catégorie "${mainCat.name}" ?`,
        message: 'Toutes ses sous-catégories (si existentes) seront également supprimées. Cette action est irréversible.',
        onConfirm: () => dataDispatch({ type: 'DELETE_MAIN_CATEGORY', payload: { type, mainCategoryId: mainCat.id } }),
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
              {mainCat.subCategories.map(subCat => {
                const usedInProjects = getProjectsUsingSubCategory(subCat.name);
                const isUsed = usedInProjects.length > 0;
                const isUsedAnywhereCheck = isSubCategoryUsedAnywhere(subCat.name);
                return (
                  <li key={subCat.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {editingSubCategory?.subId === subCat.id ? (
                        <input type="text" value={editingSubCategory.name} onChange={(e) => setEditingSubCategory(prev => ({ ...prev, name: e.target.value }))} className="px-2 py-1 border rounded-md" autoFocus/>
                      ) : (
                        <span className="text-gray-600">{subCat.name}</span>
                      )}
                      {isUsed && (
                        <div className="flex items-center gap-2">
                            {usedInProjects.map(projectName => (
                                <span key={projectName} className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full border">
                                    <Folder className="w-3 h-3" />
                                    {projectName}
                                </span>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingSubCategory?.subId === subCat.id ? (
                        <>
                          <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
                          <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleStartEdit(type, mainCat.id, subCat.id, subCat.name)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteSubCategory(type, mainCat.id, subCat.id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed" title={isUsedAnywhereCheck ? "Suppression impossible: catégorie utilisée" : "Supprimer"} disabled={isUsedAnywhereCheck}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
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
    <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FolderKanban className="w-8 h-8 text-orange-600" />
                    Gestion des Catégories
                </h1>
                <p className="text-gray-600 mt-2">Gérez vos catégories de revenus et de dépenses.</p>
            </div>
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <label htmlFor="project-filter" className="text-sm font-medium text-gray-700">Filtrer par projet :</label>
                <select
                    id="project-filter"
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-white shadow-sm"
                >
                    <option value="all">Afficher toutes les utilisations</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
        </div>
        {renderCategorySection('expense', 'Catégories de Dépenses')}
        {renderCategorySection('revenue', 'Catégories de Revenus')}
    </div>
  );
};

export default CategoryManagementPage;
