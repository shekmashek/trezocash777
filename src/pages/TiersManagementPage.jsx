import React from 'react';
import TiersManagementView from '../components/TiersManagementView';
import { Users } from 'lucide-react';

const TiersManagementPage = () => {
    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Users className="w-8 h-8 text-pink-600" />
                    Gestion des Tiers
                </h1>
                <p className="text-gray-600 mt-2">Gérez vos clients, fournisseurs et autres partenaires commerciaux.</p>
            </div>
            <TiersManagementView />
        </div>
    );
};

export default TiersManagementPage;
