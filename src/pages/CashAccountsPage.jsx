import React from 'react';
import CashAccountsView from '../components/CashAccountsView';
import { Wallet } from 'lucide-react';

const CashAccountsPage = () => {
    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Wallet className="w-8 h-8 text-teal-600" />
                    Gestion des Comptes de Trésorerie
                </h1>
                <p className="text-gray-600 mt-2">Gérez vos comptes bancaires, caisses et autres sources de liquidités.</p>
            </div>
            <CashAccountsView />
        </div>
    );
};

export default CashAccountsPage;
