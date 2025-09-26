import React, { useState, useEffect } from 'react';
import { X, Save, LayoutTemplate } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { saveTemplate } from '../context/actions';
import IconPicker from './IconPicker';

const SaveTemplateModal = ({ isOpen, onClose, editingTemplate }) => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const { session, categories, allCashAccounts, tiers, allEntries, allActuals } = dataState;
    const { activeProjectId } = uiState;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [icon, setIcon] = useState({ icon: 'Briefcase', color: 'blue' });
    const [purpose, setPurpose] = useState('professional');

    useEffect(() => {
        if (isOpen) {
            if (editingTemplate) {
                setName(editingTemplate.name);
                setDescription(editingTemplate.description);
                setIsPublic(editingTemplate.isPublic);
                setIcon({ icon: editingTemplate.icon || 'Briefcase', color: editingTemplate.color || 'blue' });
                setPurpose(editingTemplate.purpose || 'professional');
            } else {
                setName('');
                setDescription('');
                setIsPublic(false);
                setIcon({ icon: 'Briefcase', color: 'blue' });
                setPurpose('professional');
            }
        }
    }, [isOpen, editingTemplate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom du modèle est obligatoire.", type: 'error' } });
            return;
        }

        const projectTiers = (tiers || []).filter(t => {
            const entries = allEntries[activeProjectId] || [];
            const actuals = allActuals[activeProjectId] || [];
            return entries.some(e => e.supplier === t.name) || actuals.some(a => a.thirdParty === t.name);
        }).map(({ name, type }) => ({ name, type }));

        const projectStructure = {
            categories,
            cashAccounts: (allCashAccounts[activeProjectId] || []).map(({ name, mainCategoryId }) => ({ name, mainCategoryId, initialBalance: 0 })),
            tiers: projectTiers,
        };
        
        const templateData = { name, description, is_public: isPublic, icon: icon.icon, color: icon.color, purpose };

        saveTemplate({dataDispatch, uiDispatch}, { templateData, editingTemplate, projectStructure, user: session.user });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-indigo-600" />
                        {editingTemplate ? 'Modifier le modèle' : 'Créer un nouveau modèle'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du modèle *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows="3" />
                    </div>
                    <IconPicker value={icon} onChange={setIcon} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Objectif du modèle</label>
                        <div className="flex gap-4">
                            <label className="flex items-center"><input type="radio" name="purpose" value="personal" checked={purpose === 'personal'} onChange={(e) => setPurpose(e.target.value)} className="mr-2" /> Personnel</label>
                            <label className="flex items-center"><input type="radio" name="purpose" value="professional" checked={purpose === 'professional'} onChange={(e) => setPurpose(e.target.value)} className="mr-2" /> Professionnel</label>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="isPublic" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">Rendre ce modèle public pour la communauté</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Annuler</button>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                            <Save className="w-4 h-4" /> {editingTemplate ? 'Enregistrer' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaveTemplateModal;
