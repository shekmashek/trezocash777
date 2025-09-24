import React from 'react';
import { Table, ListChecks } from 'lucide-react';
import BudgetTracker from '../components/BudgetTracker';
import BudgetStateView from '../components/BudgetStateView';
import { useBudget } from '../context/BudgetContext';

const TrezoPage = () => {
    const { state, dispatch } = useBudget();
    const { activeTrezoView } = state;

    const setActiveView = (view) => {
        dispatch({ type: 'SET_ACTIVE_TREZO_VIEW', payload: view });
    };

    return (
        <div className="container mx-auto p-6 max-w-full">
            <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Table className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Trezo</h1>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveView('tableau')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${activeTrezoView === 'tableau' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <Table size={16} />
                        Tableau
                    </button>
                    <button 
                        onClick={() => setActiveView('etat-des-lieux')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${activeTrezoView === 'etat-des-lieux' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <ListChecks size={16} />
                        État des lieux
                    </button>
                </div>
            </div>
            
            {activeTrezoView === 'tableau' ? <BudgetTracker /> : <BudgetStateView />}
        </div>
    );
};

export default TrezoPage;
