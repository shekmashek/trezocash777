import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Mail, Trash2, Send, Edit, Eye, Shield } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { inviteCollaborator, revokeCollaborator } from '../context/actions';
import EmptyState from './EmptyState';

const UserManagementView = () => {
    const { state, dispatch } = useBudget();
    const { session, profile, projects, collaborators } = state;

    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
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
            projectIds: Array.from(selectedProjects),
            ownerId: session.user.id
        });
        setInviteEmail('');
        setInviteRole('viewer');
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
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="nom@exemple.com"
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            >
                                <option value="viewer">Lecteur</option>
                                <option value="editor">Éditeur</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Projets à partager</label>
                        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50 space-y-2">
                            <div className="flex items-center p-2">
                                <input
                                    type="checkbox"
                                    id="select-all-projects"
                                    checked={selectedProjects.size === ownedProjects.length && ownedProjects.length > 0}
                                    onChange={handleSelectAllProjects}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="select-all-projects" className="ml-3 text-sm font-medium text-gray-900">
                                    Tous les projets
                                </label>
                            </div>
                            <hr />
                            {ownedProjects.map(project => (
                                <div key={project.id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                                    <input
                                        type="checkbox"
                                        id={`project-${project.id}`}
                                        checked={selectedProjects.has(project.id)}
                                        onChange={() => handleProjectToggle(project.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor={`project-${project.id}`} className="ml-3 text-sm font-medium text-gray-700">
                                        {project.name}
                                    </label>
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

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Collaborateurs Actifs</h3>
                {activeCollaborators.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {activeCollaborators.map(collab => (
                            <li key={collab.id} className="py-3 flex items-center justify-between group">
                                <div>
                                    <p className="font-medium text-gray-800">{collab.email}</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                        {collab.role === 'editor' ? <Edit className="w-3 h-3 text-orange-500" /> : <Eye className="w-3 h-3 text-blue-500" />}
                                        {collab.role === 'editor' ? 'Éditeur' : 'Lecteur'}
                                    </p>
                                </div>
                                <button onClick={() => handleRevoke(collab.id)} className="p-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Vous n'avez aucun collaborateur actif.</p>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Invitations en Attente</h3>
                {pendingInvites.length > 0 ? (
                     <ul className="divide-y divide-gray-200">
                        {pendingInvites.map(invite => (
                            <li key={invite.id} className="py-3 flex items-center justify-between group">
                                <div>
                                    <p className="font-medium text-gray-800">{invite.email}</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                        {invite.role === 'editor' ? <Edit className="w-3 h-3 text-orange-500" /> : <Eye className="w-3 h-3 text-blue-500" />}
                                        {invite.role === 'editor' ? 'Éditeur' : 'Lecteur'}
                                    </p>
                                </div>
                                <button onClick={() => handleRevoke(invite.id)} className="p-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Aucune invitation en attente.</p>
                )}
            </div>
        </div>
    );
};

export default UserManagementView;
