import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Mail, Trash2, Send, Edit, Eye, Shield, Folder, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { inviteCollaborator, revokeCollaborator } from '../context/actions';
import EmptyState from './EmptyState';

const UserManagementView = () => {
    const { state, dispatch } = useBudget();
    const { session, profile, projects, collaborators } = state;

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [inviteScope, setInviteScope] = useState('all');
    const [selectedProjects, setSelectedProjects] = useState(new Set());

    const ownedProjects = useMemo(() => {
        return projects.filter(p => !p.isArchived);
    }, [projects]);

    const activeCollaborators = useMemo(() => {
        return collaborators.filter(c => c.status === 'accepted');
    }, [collaborators]);

    const pendingInvites = useMemo(() => {
        return collaborators.filter(c => c.status === 'pending');
    }, [collaborators]);

    const handleProjectToggle = (projectId) => {
        const newSelection = new Set(selectedProjects);
        if (newSelection.has(projectId)) {
            newSelection.delete(projectId);
        } else {
            newSelection.add(projectId);
        }
        setSelectedProjects(newSelection);
    };

    const handleSelectAllProjects = () => {
        if (selectedProjects.size === ownedProjects.length) {
            setSelectedProjects(new Set());
        } else {
            setSelectedProjects(new Set(ownedProjects.map(p => p.id)));
        }
    };

    const handleInvite = (e) => {
        e.preventDefault();
        if (!inviteEmail.trim() || selectedProjects.size === 0) {
            dispatch({ type: 'ADD_TOAST', payload: { message: "Veuillez saisir un e-mail et sélectionner au moins un projet.", type: 'error' } });
            return;
        }
        inviteCollaborator(dispatch, {
            email: inviteEmail,
            role: inviteRole,
            permissionScope: inviteScope,
            projectIds: Array.from(selectedProjects),
            ownerId: session.user.id
        });
        setInviteEmail('');
        setInviteRole('viewer');
        setInviteScope('all');
        setSelectedProjects(new Set());
    };

    const handleRevoke = (collaboratorId) => {
        dispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: 'Révoquer l\'accès ?',
                message: 'Le collaborateur perdra l\'accès à tous les projets partagés. Cette action est irréversible.',
                onConfirm: () => revokeCollaborator(dispatch, collaboratorId),
            }
        });
    };

    const getProjectsByIds = (projectIds) => {
        if (!projectIds) return [];
        return projectIds.map(id => {
            const project = projects.find(p => p.id === id);
            return {
                id: id,
                name: project ? project.name : 'Projet Inconnu'
            };
        });
    };
    
    const scopeConfig = {
        all: { icon: ArrowRightLeft, text: 'Entrées & Sorties', color: 'text-gray-500' },
        income_only: { icon: TrendingUp, text: 'Entrées seulement', color: 'text-green-500' },
        expense_only: { icon: TrendingDown, text: 'Sorties seulement', color: 'text-red-500' },
    };

    const renderCollaboratorList = (list, title) => (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-bold text-lg text-gray-800 mb-4">{title}</h3>
            {list.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {list.map(collab => {
                        const projectsForCollab = getProjectsByIds(collab.projectIds);
                        const currentScope = scopeConfig[collab.permissionScope] || scopeConfig.all;
                        const ScopeIcon = currentScope.icon;
                        return (
                            <li key={collab.id} className="py-4 flex items-start justify-between group">
                                <div>
                                    <p className="font-medium text-gray-800">{collab.email}</p>
                                    <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                                        <span className="flex items-center gap-1.5">
                                            {collab.role === 'editor' ? <Edit className="w-3 h-3 text-orange-500" /> : <Eye className="w-3 h-3 text-blue-500" />}
                                            {collab.role === 'editor' ? 'Éditeur' : 'Lecteur'}
                                        </span>
                                        <span className={`flex items-center gap-1.5 ${currentScope.color}`}>
                                            <ScopeIcon className="w-3 h-3" />
                                            {currentScope.text}
                                        </span>
                                    </div>
                                    {projectsForCollab.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {projectsForCollab.map(proj => (
                                                <span key={proj.id} className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                                    <Folder className="w-3 h-3 text-gray-500" />
                                                    {proj.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => handleRevoke(collab.id)} className="p-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">{title === 'Collaborateurs Actifs' ? "Vous n'avez aucun collaborateur actif." : "Aucune invitation en attente."}</p>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    Inviter un nouveau collaborateur
                </h3>
                <form onSubmit={handleInvite} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail du collaborateur</label>
                            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="nom@exemple.com" className="w-full px-3 py-2 border rounded-lg text-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                <option value="viewer">Lecteur</option>
                                <option value="editor">Éditeur</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                        <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-2 border">
                            <label className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-200 flex-1 justify-center"><input type="radio" name="scope" value="all" checked={inviteScope === 'all'} onChange={(e) => setInviteScope(e.target.value)} className="mr-2" /> Entrées & Sorties</label>
                            <label className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-200 flex-1 justify-center"><input type="radio" name="scope" value="income_only" checked={inviteScope === 'income_only'} onChange={(e) => setInviteScope(e.target.value)} className="mr-2" /> Entrées seulement</label>
                            <label className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-200 flex-1 justify-center"><input type="radio" name="scope" value="expense_only" checked={inviteScope === 'expense_only'} onChange={(e) => setInviteScope(e.target.value)} className="mr-2" /> Sorties seulement</label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Projets à partager</label>
                        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50 space-y-2">
                            <div className="flex items-center p-2">
                                <input type="checkbox" id="select-all-projects" checked={selectedProjects.size === ownedProjects.length && ownedProjects.length > 0} onChange={handleSelectAllProjects} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="select-all-projects" className="ml-3 text-sm font-medium text-gray-900">Tous les projets</label>
                            </div>
                            <hr />
                            {ownedProjects.map(project => (
                                <div key={project.id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                                    <input type="checkbox" id={`project-${project.id}`} checked={selectedProjects.has(project.id)} onChange={() => handleProjectToggle(project.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <label htmlFor={`project-${project.id}`} className="ml-3 text-sm font-medium text-gray-700">{project.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2">
                            <Send className="w-4 h-4" /> Envoyer l'invitation
                        </button>
                    </div>
                </form>
            </div>

            {renderCollaboratorList(activeCollaborators, 'Collaborateurs Actifs')}
            {renderCollaboratorList(pendingInvites, 'Invitations en Attente')}
        </div>
    );
};

export default UserManagementView;
