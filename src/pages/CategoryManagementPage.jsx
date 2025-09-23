import React from 'react';
import CategoryManagementView from '../components/CategoryManagementView';
import { FolderKanban } from 'lucide-react';

const CategoryManagementPage = () => {
    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FolderKanban className="w-8 h-8 text-orange-600" />
                    Gestion des Catégories
                </h1>
                <p className="text-gray-600 mt-2">Gérez vos catégories de revenus et de dépenses.</p>
            </div>
            <CategoryManagementView />
        </div>
    );
};

export default CategoryManagementPage;
