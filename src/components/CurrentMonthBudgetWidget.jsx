import React from 'react';
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { useCurrentMonthBudgetStatus } from '../utils/selectors.jsx';

const ProgressBar = ({ value, total, colorClass }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
        </div>
    );
};

const CurrentMonthBudgetWidget = () => {
    const { dataState } = useData();
    const { uiState } = useUI();
    const { settings } = dataState;

    const {
        totalBudgetedIncome,
        totalBudgetedExpense,
        totalActualIncome,
        totalActualExpense,
    } = useCurrentMonthBudgetStatus(dataState, uiState);

    const remainingExpenseBudget = totalBudgetedExpense - totalActualExpense;
    const netActual = totalActualIncome - totalActualExpense;
    const netBudgeted = totalBudgetedIncome - totalBudgetedExpense;

    const monthName = new Date().toLocaleString('fr-FR', { month: 'long' });

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                Budget de {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
            </h2>
            <div className="space-y-6">
                {/* Income section */}
                <div>
                    <div className="flex justify-between items-baseline mb-2">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Entrées</h3>
                        <div className="text-sm">
                            <span className="font-bold text-green-600">{formatCurrency(totalActualIncome, settings)}</span>
                            <span className="text-gray-500"> / {formatCurrency(totalBudgetedIncome, settings)}</span>
                        </div>
                    </div>
                    <ProgressBar value={totalActualIncome} total={totalBudgetedIncome} colorClass="bg-green-500" />
                </div>

                {/* Expense section */}
                <div>
                    <div className="flex justify-between items-baseline mb-2">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500" /> Sorties</h3>
                        <div className="text-sm">
                            <span className="font-bold text-red-600">{formatCurrency(totalActualExpense, settings)}</span>
                            <span className="text-gray-500"> / {formatCurrency(totalBudgetedExpense, settings)}</span>
                        </div>
                    </div>
                    <ProgressBar value={totalActualExpense} total={totalBudgetedExpense} colorClass="bg-red-500" />
                    <p className="text-xs text-right mt-1 text-gray-500">
                        Reste à dépenser: <span className="font-medium text-gray-700">{formatCurrency(remainingExpenseBudget, settings)}</span>
                    </p>
                </div>
                
                {/* Summary section */}
                <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-600">Solde du mois (réel)</span>
                        <span className={`text-lg font-bold ${netActual >= 0 ? 'text-gray-800' : 'text-red-700'}`}>
                            {formatCurrency(netActual, settings)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Solde prévisionnel</span>
                        <span>{formatCurrency(netBudgeted, settings)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurrentMonthBudgetWidget;
