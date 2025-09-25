import React, { useState } from 'react';
import { Table, ListChecks, Edit, Printer } from 'lucide-react';
import BudgetTracker from '../components/BudgetTracker';
import BudgetStateView from '../components/BudgetStateView';
import { useBudget } from '../context/BudgetContext';

const TrezoPage = () => {
    const { state, dispatch } = useBudget();
    const { activeTrezoView } = state;
    const [etatDesLieuxMode, setEtatDesLieuxMode] = useState('edition');
    const [tableauMode, setTableauMode] = useState('edition');

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
                <div className="flex items-center gap-4">
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

                    {activeTrezoView === 'tableau' && (
                        <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                            <button 
                                onClick={() => setTableauMode('edition')}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${tableauMode === 'edition' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                            >
                                <Edit size={16} />
                                Édition
                            </button>
                            <button 
                                onClick={() => setTableauMode('lecture')}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${tableauMode === 'lecture' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                            >
                                <Printer size={16} />
                                Lecture
                            </button>
                        </div>
                    )}

                    {activeTrezoView === 'etat-des-lieux' && (
                        <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                            <button 
                                onClick={() => setEtatDesLieuxMode('edition')}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${etatDesLieuxMode === 'edition' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                            >
                                <Edit size={16} />
                                Édition
                            </button>
                            <button 
                                onClick={() => setEtatDesLieuxMode('lecture')}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${etatDesLieuxMode === 'lecture' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                            >
                                <Printer size={16} />
                                Lecture
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {activeTrezoView === 'tableau' ? <BudgetTracker mode={tableauMode} /> : <BudgetStateView mode={etatDesLieuxMode} />}
        </div>
    );
};

export default TrezoPage;
