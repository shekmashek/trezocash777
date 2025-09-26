import React, { useState } from 'react';
import { Hash, Settings, BarChart, FileText } from 'lucide-react';
import VatSettingsView from '../components/VatSettingsView';
import VatDeclarationsView from '../components/VatDeclarationsView';
import VatDashboardView from '../components/VatDashboardView';

const VatManagementPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Tableau de Bord', icon: BarChart },
        { id: 'declarations', label: 'Déclarations', icon: FileText },
        { id: 'settings', label: 'Paramètres', icon: Settings },
    ];

    return (
        <div className="container mx-auto p-6 max-w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Hash className="w-8 h-8 text-cyan-600" />
                    Gestion de la TVA
                </h1>
                <p className="text-gray-600 mt-2">Pilotez vos déclarations de TVA, de la collecte au paiement.</p>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {activeTab === 'dashboard' && <VatDashboardView />}
                {activeTab === 'declarations' && <VatDeclarationsView />}
                {activeTab === 'settings' && <VatSettingsView />}
            </div>
        </div>
    );
};

export default VatManagementPage;
