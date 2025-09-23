import React from 'react';
import ArchiveManagementView from '../components/ArchiveManagementView';
import { Archive } from 'lucide-react';

const ArchivesPage = () => {
    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Archive className="w-8 h-8 text-slate-600" />
                    Gestion des Archives
                </h1>
                <p className="text-gray-600 mt-2">Consultez ou restaurez vos projets et scénarios archivés.</p>
            </div>
            <ArchiveManagementView />
        </div>
    );
};

export default ArchivesPage;
