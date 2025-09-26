import React from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { LayoutTemplate, Plus, Edit, Trash2, Globe, Lock } from 'lucide-react';
import { deleteTemplate } from '../context/actions';
import EmptyState from '../components/EmptyState';
import TemplateIcon from '../components/TemplateIcon';

const MyTemplatesPage = () => {
    const { dataState, dataDispatch } = useData();
    const { uiDispatch, uiState } = useUI();
    const { session, templates } = dataState;
    const { activeProjectId } = uiState;

    const userTemplates = templates.filter(t => t.userId === session.user.id);

    const handleCreateFromCurrent = () => {
        if (activeProjectId === 'consolidated' || activeProjectId.startsWith('consolidated_view_')) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: "Vous ne pouvez pas créer de modèle à partir d'une vue consolidée.", type: 'error' } });
            return;
        }
        uiDispatch({ type: 'OPEN_SAVE_TEMPLATE_MODAL', payload: null });
    };

    const handleEdit = (template) => {
        uiDispatch({ type: 'OPEN_SAVE_TEMPLATE_MODAL', payload: template });
    };

    const handleDelete = (templateId) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: 'Supprimer ce modèle ?',
                message: 'Cette action est irréversible. Le modèle sera supprimé pour tous les utilisateurs.',
                onConfirm: () => deleteTemplate({dataDispatch, uiDispatch}, templateId),
            }
        });
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <LayoutTemplate className="w-8 h-8 text-indigo-600" />
                        Mes Modèles
                    </h1>
                    <p className="text-gray-600 mt-2">Créez, gérez et partagez vos propres modèles de projet.</p>
                </div>
                <button onClick={handleCreateFromCurrent} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Créer à partir du projet actuel
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                {userTemplates.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {userTemplates.map(template => (
                            <li key={template.id} className="py-4 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-lg">
                                        <TemplateIcon icon={template.icon} color={template.color} className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{template.name}</p>
                                        <p className="text-sm text-gray-500">{template.description}</p>
                                        <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${template.isPublic ? 'text-green-600' : 'text-gray-500'}`}>
                                            {template.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                            {template.isPublic ? 'Public' : 'Privé'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(template)} className="p-2 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(template.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={LayoutTemplate}
                        title="Aucun modèle personnel"
                        message="Créez votre premier modèle à partir d'un de vos projets pour le réutiliser ou le partager."
                        actionText="Créer un modèle"
                        onActionClick={handleCreateFromCurrent}
                    />
                )}
            </div>
        </div>
    );
};

export default MyTemplatesPage;
