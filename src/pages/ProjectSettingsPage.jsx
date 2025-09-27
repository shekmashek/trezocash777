import React from 'react';
import ProjectSettingsView from '../components/ProjectSettingsView';
import { FolderCog } from 'lucide-react';

const ProjectSettingsPage = () => {
    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FolderCog className="w-8 h-8 text-blue-600" />
                    Paramètres du Projet
                </h1>
                <p className="text-gray-600 mt-2">Gérez les informations de base et les préférences d'affichage de votre projet.</p>
            </div>
            <ProjectSettingsView />
        </div>
    );
};

export default ProjectSettingsPage;
