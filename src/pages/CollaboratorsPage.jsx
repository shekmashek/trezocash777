import React from 'react';
import UserManagementView from '../components/UserManagementView';
import { Users } from 'lucide-react';

const CollaboratorsPage = () => {
    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-600" />
                    Gestion des Collaborateurs
                </h1>
                <p className="text-gray-600 mt-2">Invitez des membres, gérez les permissions et suivez qui a accès à vos projets.</p>
            </div>
            <UserManagementView />
        </div>
    );
};

export default CollaboratorsPage;
