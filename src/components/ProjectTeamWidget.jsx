import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import Avatar from './Avatar';
import { Users, Settings } from 'lucide-react';

const ProjectTeamWidget = () => {
    const { dataState } = useData();
    const { uiState, uiDispatch } = useUI();
    const { activeProjectId } = uiState;
    const { projects, collaborators, allProfiles } = dataState;
    
    const isConsolidated = activeProjectId === 'consolidated';
    const isCustomConsolidated = activeProjectId?.startsWith('consolidated_view_');

    const projectTeam = useMemo(() => {
        if (!activeProjectId || isConsolidated || isCustomConsolidated || !allProfiles.length) return [];

        const team = new Map();
        const project = projects.find(p => p.id === activeProjectId);
        if (!project) return [];

        // Add owner
        const ownerProfile = allProfiles.find(p => p.id === project.user_id);
        if (ownerProfile) {
            team.set(ownerProfile.id, { ...ownerProfile, role: 'Propriétaire' });
        }

        // Add collaborators
        collaborators.forEach(c => {
            if (c.projectIds && c.projectIds.includes(activeProjectId)) {
                const collabProfile = allProfiles.find(p => p.id === c.user_id);
                if (collabProfile && !team.has(collabProfile.id)) {
                    team.set(collabProfile.id, { ...collabProfile, role: c.role === 'editor' ? 'Éditeur' : 'Lecteur' });
                }
            }
        });

        return Array.from(team.values());
    }, [activeProjectId, projects, collaborators, allProfiles, isConsolidated, isCustomConsolidated]);

    const handleManageTeam = () => {
        uiDispatch({ type: 'SET_ACTIVE_SETTINGS_DRAWER', payload: 'userManagement' });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border h-full flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Équipe du Projet
            </h2>
            
            {isConsolidated || isCustomConsolidated ? (
                <div className="flex-grow flex items-center justify-center text-center text-sm text-gray-500">
                    <p>La gestion de l'équipe se fait au niveau de chaque projet individuel.</p>
                </div>
            ) : projectTeam.length > 0 ? (
                <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {projectTeam.map(member => (
                        <div key={member.id} className="flex items-center gap-3">
                            <Avatar name={member.full_name} role={member.role} />
                            <div>
                                <p className="font-semibold text-sm text-gray-800">{member.full_name}</p>
                                <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="flex-grow flex items-center justify-center text-center text-sm text-gray-500">
                    <p>Vous êtes seul sur ce projet.</p>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
                <button 
                    onClick={handleManageTeam}
                    disabled={isConsolidated || isCustomConsolidated}
                    className="w-full text-sm font-medium text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    Gérer les collaborateurs
                </button>
            </div>
        </div>
    );
};

export default ProjectTeamWidget;
