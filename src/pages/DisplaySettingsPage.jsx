import React from 'react';
import SettingsView from '../components/SettingsView';
import { Globe } from 'lucide-react';

const DisplaySettingsPage = () => {
    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Globe className="w-8 h-8 text-blue-600" />
                    Affichage et Devise
                </h1>
                <p className="text-gray-600 mt-2">Gérez les paramètres d'affichage globaux de l'application.</p>
            </div>
            <SettingsView />
        </div>
    );
};

export default DisplaySettingsPage;
