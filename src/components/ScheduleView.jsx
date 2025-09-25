import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/formatting';
import { ChevronLeft, ChevronRight, AlertTriangle, Calendar, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { getTodayInTimezone } from '../utils/budgetCalculations';
import { motion, AnimatePresence } from 'framer-motion';

const DayCell = ({ day, transactions, isToday, isCurrentMonth, currencySettings, todayDate, viewMode, onTransactionClick }) => {
    const dayNumber = day.getDate();
    const maxVisibleItems = viewMode === 'week' ? transactions.length : 3;
    const visibleTransactions = transactions.slice(0, maxVisibleItems);
    const hiddenCount = transactions.length - maxVisibleItems;

    const totalPayable = useMemo(() => transactions.filter(tx => tx.type === 'payable').reduce((sum, tx) => sum + tx.amount, 0), [transactions]);
    const totalReceivable = useMemo(() => transactions.filter(tx => tx.type === 'receivable').reduce((sum, tx) => sum + tx.amount, 0), [transactions]);

    const getTransactionStyle = (tx) => {
        const dueDate = new Date(tx.date);
        dueDate.setHours(0, 0, 0, 0);
        
        const isPayable = tx.type === 'payable';
        const isSettled = ['paid', 'received'].includes(tx.status);

        if (isSettled) {
            return 'bg-gray-100 text-gray-500 line-through opacity-70 cursor-pointer hover:bg-gray-200';
        }
        
        if (dueDate < todayDate) { // Overdue
            return isPayable ? 'bg-red-100 text-red-800 cursor-pointer hover:bg-red-200' : 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200';
        }
        if (dueDate.getTime() === todayDate.getTime()) { // Due Today
            return isPayable ? 'bg-red-200 text-red-900 font-bold cursor-pointer hover:bg-red-300' : 'bg-green-200 text-green-900 font-bold cursor-pointer hover:bg-green-300';
        }
        // Upcoming
        return isPayable ? 'bg-red-50 text-red-700 cursor-pointer hover:bg-red-100' : 'bg-green-50 text-green-700 cursor-pointer hover:bg-green-100';
    };
    
    const cellHeightClass = viewMode === 'week' ? 'h-[calc(100vh-22rem)]' : 'h-48';

    return (
        <div className={`border-t border-r border-gray-200 p-1 flex flex-col ${cellHeightClass} ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-start">
                <div className="text-left flex-grow space-y-0.5 pr-1">
                    {totalReceivable > 0 && (
                        <div className="text-xs font-semibold text-green-600 truncate" title={`Entrées: ${formatCurrency(totalReceivable, currencySettings)}`}>
                            +{formatCurrency(totalReceivable, { ...currencySettings, decimalPlaces: 0, displayUnit: 'thousands' })}
                        </div>
                    )}
                    {totalPayable > 0 && (
                        <div className="text-xs font-semibold text-red-600 truncate" title={`Sorties: ${formatCurrency(totalPayable, currencySettings)}`}>
                            -{formatCurrency(totalPayable, { ...currencySettings, decimalPlaces: 0, displayUnit: 'thousands' })}
                        </div>
                    )}
                </div>
                <div className={`flex-shrink-0 text-sm font-medium ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>
                        {dayNumber}
                    </span>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto space-y-1 mt-1 pr-1 custom-scrollbar">
                {visibleTransactions.map(tx => (
                    <button 
                        key={tx.id} 
                        onClick={(e) => onTransactionClick(e, tx)}
                        className={`p-1.5 rounded-md text-xs w-full text-left transition-colors ${getTransactionStyle(tx)}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-semibold truncate flex-1" title={tx.thirdParty}>{tx.thirdParty}</span>
                            <span className="font-mono ml-2 whitespace-nowrap">{formatCurrency(tx.amount, currencySettings)}</span>
                        </div>
                    </button>
                ))}
                {hiddenCount > 0 && (
                    <div className="text-xs text-center text-gray-500 pt-1">
                        + {hiddenCount} de plus
                    </div>
                )}
            </div>
        </div>
    );
};

const ScheduleView = ({ isFocusMode = false, currentDate: propCurrentDate, viewMode: propViewMode }) => {
    const { state, dispatch } = useBudget();
    const { allActuals, settings, projects, activeProjectId, consolidatedViews } = state;

    const [localCurrentDate, setLocalCurrentDate] = useState(new Date());
    const [localViewMode, setLocalViewMode] = useState('month');

    const [isViewModeMenuOpen, setIsViewModeMenuOpen] = useState(false);
    const viewModeMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (viewModeMenuRef.current && !viewModeMenuRef.current.contains(event.target)) {
                setIsViewModeMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const currentDate = isFocusMode ? propCurrentDate : localCurrentDate;
    const viewMode = isFocusMode ? propViewMode : localViewMode;
    
    const isConsolidated = activeProjectId === 'consolidated';
    const isCustomConsolidated = String(activeProjectId)?.startsWith('consolidated_view_');

    const today = getTodayInTimezone(settings.timezoneOffset);

    const allRelevantActuals = useMemo(() => {
        if (isConsolidated) {
            return Object.values(allActuals).flat().map(actual => {
                const project = projects.find(p => p.id === actual.projectId);
                return { ...actual, projectName: project?.name || 'N/A' };
            });
        }
        if (isCustomConsolidated) {
            const viewId = activeProjectId.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (!view || !view.project_ids) return [];
            return view.project_ids.flatMap(projectId => 
                (allActuals[projectId] || []).map(actual => {
                    const project = projects.find(p => p.id === projectId);
                    return { ...actual, projectName: project?.name || 'N/A' };
                })
            );
        }
        // Single project view
        const project = projects.find(p => p.id === activeProjectId);
        return (allActuals[activeProjectId] || []).map(actual => ({ ...actual, projectName: project?.name || 'N/A' }));
    }, [activeProjectId, allActuals, projects, isConsolidated, isCustomConsolidated, consolidatedViews]);

    const { transactionsByDate, overdueTransactions } = useMemo(() => {
        const byDate = new Map();
        const overdue = [];

        allRelevantActuals.forEach(actual => {
            const dueDate = new Date(actual.date);
            dueDate.setHours(0, 0, 0, 0);

            const isUnsettled = !['paid', 'received'].includes(actual.status);

            if (isUnsettled && dueDate < today) {
                overdue.push(actual);
            }

            const dateKey = dueDate.toISOString().split('T')[0];
            if (!byDate.has(dateKey)) {
                byDate.set(dateKey, []);
            }
            byDate.get(dateKey).push(actual);
        });
        
        overdue.sort((a, b) => new Date(a.date) - new Date(b.date));

        return { transactionsByDate: byDate, overdueTransactions: overdue };
    }, [allRelevantActuals, today]);

    const calendarGrid = useMemo(() => {
        const grid = [];
        if (viewMode === 'month') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon
            const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
            const gridStartDate = new Date(firstDayOfMonth);
            gridStartDate.setDate(gridStartDate.getDate() - startOffset);
            for (let i = 0; i < 35; i++) { // 5 rows
                const day = new Date(gridStartDate);
                day.setDate(day.getDate() + i);
                grid.push(day);
            }
        } else { // week view
            const currentDayOfWeek = currentDate.getDay();
            const startOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
            const weekStartDate = new Date(currentDate);
            weekStartDate.setDate(weekStartDate.getDate() - startOffset);
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStartDate);
                day.setDate(day.getDate() + i);
                grid.push(day);
            }
        }
        return grid;
    }, [currentDate, viewMode]);

    const headerLabel = useMemo(() => {
        if (viewMode === 'month') {
            const label = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
            return label.charAt(0).toUpperCase() + label.slice(1);
        } else {
            if (calendarGrid.length === 0) return '';
            const startOfWeek = new Date(calendarGrid[0]);
            const endOfWeek = new Date(calendarGrid[6]);
            const startFormatted = startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            const endFormatted = endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            return `Semaine du ${startFormatted} au ${endFormatted}`;
        }
    }, [currentDate, viewMode, calendarGrid]);

    const goToPrevious = () => {
        setLocalCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (viewMode === 'month') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setDate(newDate.getDate() - 7);
            }
            return newDate;
        });
    };

    const goToNext = () => {
        setLocalCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (viewMode === 'month') {
                newDate.setMonth(newDate.getMonth() + 1);
            } else {
                newDate.setDate(newDate.getDate() + 7);
            }
            return newDate;
        });
    };
    
    const goToToday = () => {
        setLocalCurrentDate(new Date());
    };

    const handleTransactionClick = (e, tx) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({
            type: 'OPEN_TRANSACTION_ACTION_MENU',
            payload: {
                x: e.clientX,
                y: e.clientY,
                transaction: tx,
            }
        });
    };

    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    return (
        <div className={isFocusMode ? "h-full" : "container mx-auto p-6 max-w-full"}>
            <div className="flex flex-col lg:flex-row gap-8 h-full">
                <div className="flex-grow flex flex-col">
                    {!isFocusMode && (
                        <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-4">
                                <Calendar className="w-8 h-8 text-blue-600" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Échéancier</h1>
                                    <p className="text-base text-gray-500 font-medium">{headerLabel}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative" ref={viewModeMenuRef}>
                                    <button 
                                        onClick={() => setIsViewModeMenuOpen(p => !p)} 
                                        className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors"
                                    >
                                        <span>{viewMode === 'month' ? 'Mois' : 'Semaine'}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isViewModeMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isViewModeMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border z-20"
                                            >
                                                <ul className="p-1">
                                                    <li>
                                                        <button
                                                            onClick={() => { setLocalViewMode('month'); setIsViewModeMenuOpen(false); }}
                                                            className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${viewMode === 'month' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                                        >
                                                            Mois
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button
                                                            onClick={() => { setLocalViewMode('week'); setIsViewModeMenuOpen(false); }}
                                                            className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${viewMode === 'week' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                                        >
                                                            Semaine
                                                        </button>
                                                    </li>
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={goToToday} className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                        Aujourd'hui
                                    </button>
                                    <button onClick={goToPrevious} className="p-2 rounded-full hover:bg-gray-100">
                                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-100">
                                        <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-md border overflow-hidden flex flex-col flex-grow">
                        <div className="grid grid-cols-7 border-b">
                            {daysOfWeek.map(day => (
                                <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 flex-grow">
                            {calendarGrid.map((day, index) => {
                                const dateKey = day.toISOString().split('T')[0];
                                const isToday = dateKey === today.toISOString().split('T')[0];
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                return (
                                    <DayCell
                                        key={index}
                                        day={day}
                                        transactions={transactionsByDate.get(dateKey) || []}
                                        isToday={isToday}
                                        isCurrentMonth={isCurrentMonth}
                                        currencySettings={settings}
                                        todayDate={today}
                                        viewMode={viewMode}
                                        onTransactionClick={handleTransactionClick}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Échéances en Retard
                    </h2>
                    <div className="bg-white rounded-lg shadow-md border p-4 h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                        {overdueTransactions.length > 0 ? (
                            <ul className="space-y-2">
                                {overdueTransactions.map(tx => {
                                    const daysOverdue = Math.floor((today - new Date(tx.date)) / (1000 * 60 * 60 * 24));
                                    const isPayable = tx.type === 'payable';
                                    return (
                                        <li key={tx.id}>
                                            <button
                                                onClick={(e) => handleTransactionClick(e, tx)}
                                                className="w-full text-left p-2 rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${isPayable ? 'bg-red-100' : 'bg-green-100'}`}>
                                                            {isPayable ? <ArrowDown className="w-4 h-4 text-red-600" /> : <ArrowUp className="w-4 h-4 text-green-600" />}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-semibold truncate text-gray-800" title={tx.thirdParty}>
                                                                {tx.thirdParty}
                                                                {(isConsolidated || isCustomConsolidated) && tx.projectName && <span className="text-xs font-normal text-gray-500 ml-1">({tx.projectName})</span>}
                                                            </p>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                                                <span>{new Date(tx.date).toLocaleDateString('fr-FR')}</span>
                                                                <span className="text-gray-500">({daysOverdue}j en retard)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-base font-normal whitespace-nowrap pl-2 text-gray-600">{formatCurrency(tx.amount, settings)}</p>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>Aucune échéance en retard.</p>
                                <p className="text-sm mt-1">Félicitations !</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleView;
