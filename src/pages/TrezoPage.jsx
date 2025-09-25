import React, { useState } from 'react';
import { Table, TableProperties } from 'lucide-react';
import BudgetTracker from '../components/BudgetTracker';

const TrezoPage = () => {
    const [tableauMode, setTableauMode] = useState('lecture');

    return (
        <div className="container mx-auto p-6 max-w-full">
            <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Table className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tableau de Trésorerie</h1>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setTableauMode('lecture')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${tableauMode === 'lecture' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <Table size={16} />
                        Table
                    </button>
                    <button 
                        onClick={() => setTableauMode('edition')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${tableauMode === 'edition' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-300'}`}
                    >
                        <TableProperties size={16} />
                        TCD
                    </button>
                </div>
            </div>
            
            <BudgetTracker mode={tableauMode} />
        </div>
    );
};

export default TrezoPage;
