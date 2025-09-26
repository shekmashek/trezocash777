import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import Avatar from './Avatar';
import { motion } from 'framer-motion';

const ProjectCollaborators = () => {
    const { dataState } = useData();
    const { activeProjectId, projects, collaborators, allProfiles, consolidatedViews } = dataState;

    const projectUsers = useMemo(() => {
        if (!activeProjectId || !allProfiles.length) return [];

        const usersMap = new Map();

        const addUser = (userId, role) => {
            if (!userId || usersMap.has(userId)) return;
            const profile = allProfiles.find(p => p.id === userId);
            if (profile) {
                usersMap.set(userId, { ...profile, role });
            }
        };

        if (activeProjectId.startsWith('consolidated_view_')) {
            const viewId = activeProjectId.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (!view) return [];

            view.project_ids.forEach(projectId => {
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    addUser(project.user_id, 'Propriétaire');
                }
                collaborators.forEach(c => {
                    if (c.projectIds && c.projectIds.includes(projectId)) {
                        addUser(c.user_id, c.role === 'editor' ? 'Éditeur' : 'Lecteur');
                    }
                });
            });

        } else if (activeProjectId === 'consolidated') {
            projects.forEach(project => {
                if (!project.isArchived) {
                    addUser(project.user_id, 'Propriétaire');
                }
            });
            collaborators.forEach(c => {
                addUser(c.user_id, c.role === 'editor' ? 'Éditeur' : 'Lecteur');
            });
        } else { // Single project
            const project = projects.find(p => p.id === activeProjectId);
            if (!project) return [];

            addUser(project.user_id, 'Propriétaire');

            collaborators.forEach(c => {
                if (c.projectIds && c.projectIds.includes(activeProjectId)) {
                    addUser(c.user_id, c.role === 'editor' ? 'Éditeur' : 'Lecteur');
                }
            });
        }

        return Array.from(usersMap.values());
    }, [activeProjectId, projects, collaborators, allProfiles, consolidatedViews]);

    if (projectUsers.length <= 1) {
        return null;
    }

    return (
        <div className="flex items-center -space-x-2">
            {projectUsers.map((user, index) => (
                <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Avatar name={user.full_name} role={user.role} />
                </motion.div>
            ))}
        </div>
    );
};

export default ProjectCollaborators;
