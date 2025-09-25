import React, { useState } from 'react';
import { ListChecks, Edit, Printer } from 'lucide-react';
import BudgetStateView from '../components/BudgetStateView';

const BudgetPage = () => {
    const [mode, setMode] = useState('edition');

    return (
        <div className="container mx-auto p-6 max-w-full">
            <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <ListChecks className="w-8 h-8 text-green-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Budget / État des Lieux</h1>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setMode('edition')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${mode === 'edition' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <Edit size={16} />
                        Édition
                    </button>
                    <button 
                        onClick={() => setMode('lecture')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${mode === 'lecture' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <Printer size={16} />
                        Lecture
                    </button>
                </div>
            </div>
            
            <BudgetStateView mode={mode} />
        </div>
    );
};

export default BudgetPage;
