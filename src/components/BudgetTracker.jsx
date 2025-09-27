import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Eye, Search, ChevronDown, Folder, TrendingUp, TrendingDown, Layers, ChevronLeft, ChevronRight, Filter, XCircle, Trash2, ArrowRightLeft, Calendar, Lock, MessageSquare, ChevronUp } from 'lucide-react';
import TransactionDetailDrawer from './TransactionDetailDrawer';
import ResizableTh from './ResizableTh';
import { getEntryAmountForPeriod, getActualAmountForPeriod, getTodayInTimezone, getStartOfWeek } from '../utils/budgetCalculations';
import { useActiveProjectData, useProcessedEntries, useGroupedData, usePeriodPositions, calculateGeneralTotals, calculateMainCategoryTotals } from '../utils/selectors.jsx';
import { formatCurrency } from '../utils/formatting';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';

const criticalityConfig = {
    critical: { label: 'Critique', color: 'bg-red-500' },
    essential: { label: 'Essentiel', color: 'bg-yellow-500' },
    discretionary: { label: 'Discrétionnaire', color: 'bg-blue-500' },
};

const LectureView = ({ entries, periods, settings, actuals, isConsolidated, projects, visibleColumns, CommentButton }) => {
    const sortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'revenu' ? -1 : 1;
            const catA = a.category.toLowerCase();
            const catB = b.category.toLowerCase();
            if (catA < catB) return -1;
            if (catA > catB) return 1;
            return a.supplier.toLowerCase().localeCompare(b.supplier.toLowerCase());
        });
    }, [entries]);

    const totalsByPeriod = useMemo(() => {
        return periods.map(period => {
            const totalBudget = sortedEntries.reduce((sum, entry) => {
                const amount = getEntryAmountForPeriod(entry, period.startDate, period.endDate);
                return sum + (entry.type === 'revenu' ? amount : -amount);
            }, 0);
            const totalActual = sortedEntries.reduce((sum, entry) => {
                const amount = getActualAmountForPeriod(entry, actuals, period.startDate, period.endDate);
                return sum + (entry.type === 'revenu' ? amount : -amount);
            }, 0);
            return { budget: totalBudget, actual: totalActual, reste: totalBudget - totalActual };
        });
    }, [sortedEntries, periods, actuals]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-xs text-gray-500 uppercase">
                        <th className="py-3 px-4">Écriture</th>
                        {isConsolidated && <th className="py-3 px-4">Projet</th>}
                        <th className="py-3 px-4">Tiers</th>
                        {periods.map(p => (
                            <th key={p.label} className="py-3 px-4 text-center">
                                <div className="font-semibold">{p.label}</div>
                                <div className="flex justify-around font-normal text-gray-400 mt-1">
                                    {visibleColumns.budget && <div className="w-1/3">Prév.</div>}
                                    {visibleColumns.actual && <div className="w-1/3">Réel</div>}
                                    {visibleColumns.reste && <div className="w-1/3">Reste</div>}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedEntries.map(entry => (
                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                            <td className={`py-2 px-4 font-medium ${entry.type === 'revenu' ? 'text-green-700' : 'text-red-700'}`}>{entry.category}</td>
                            {isConsolidated && <td className="py-2 px-4">{projects.find(p => p.id === entry.projectId)?.name || 'N/A'}</td>}
                            <td className="py-2 px-4 flex items-center gap-2">
                                {entry.supplier}
                                {entry.isProvision && <Lock className="w-3 h-3 text-indigo-500" title="Provision" />}
                            </td>
                            {periods.map(period => {
                                const budget = getEntryAmountForPeriod(entry, period.startDate, period.endDate);
                                const actual = getActualAmountForPeriod(entry, actuals, period.startDate, period.endDate);
                                const reste = budget - actual;
                                const isRevenue = entry.type === 'revenu';
                                const resteColor = reste === 0 ? 'text-gray-500' : isRevenue ? (reste <= 0 ? 'text-green-600' : 'text-red-600') : (reste >= 0 ? 'text-green-600' : 'text-red-600');
                                const columnIdBase = period.startDate.toISOString();
                                const currencySettings = { currency: entry.currency, displayUnit: entry.display_unit, decimalPlaces: entry.decimal_places };
                                return (
                                    <td key={period.label} className="py-2 px-4 text-center">
                                        <div className="flex justify-around">
                                            {visibleColumns.budget && <div className="w-1/3 text-gray-500 relative group/subcell">{formatCurrency(budget, currencySettings)}<CommentButton rowId={entry.id} columnId={`${columnIdBase}_budget`} rowName={entry.supplier} columnName={`${period.label} (Prév.)`} /></div>}
                                            {visibleColumns.actual && <div className="w-1/3 font-semibold relative group/subcell">{formatCurrency(actual, currencySettings)}<CommentButton rowId={entry.id} columnId={`${columnIdBase}_actual`} rowName={entry.supplier} columnName={`${period.label} (Réel)`} /></div>}
                                            {visibleColumns.reste && <div className={`w-1/3 ${resteColor} relative group/subcell`}>{formatCurrency(reste, currencySettings)}<CommentButton rowId={entry.id} columnId={`${columnIdBase}_reste`} rowName={entry.supplier} columnName={`${period.label} (Reste)`} /></div>}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan={isConsolidated ? 3 : 2} className="py-3 px-4">Flux de trésorerie net</td>
                        {totalsByPeriod.map((total, index) => {
                            const period = periods[index];
                            const columnIdBase = period.startDate.toISOString();
                            const rowId = 'net_flow';
                            return (
                                <td key={index} className="py-3 px-4 text-center">
                                    <div className="flex justify-around">
                                        {visibleColumns.budget && <div className={`w-1/3 text-xs ${total.budget >= 0 ? 'text-gray-600' : 'text-red-600'} relative group/subcell`}>{formatCurrency(total.budget, settings)}<CommentButton rowId={rowId} columnId={`${columnIdBase}_budget`} rowName="Flux de trésorerie net" columnName={`${period.label} (Prév.)`} /></div>}
                                        {visibleColumns.actual && <div className={`w-1/3 font-semibold ${total.actual >= 0 ? 'text-gray-800' : 'text-red-700'} relative group/subcell`}>{formatCurrency(total.actual, settings)}<CommentButton rowId={rowId} columnId={`${columnIdBase}_actual`} rowName="Flux de trésorerie net" columnName={`${period.label} (Réel)`} /></div>}
                                        {visibleColumns.reste && <div className={`w-1/3 text-xs ${total.reste >= 0 ? 'text-green-600' : 'text-red-600'} relative group/subcell`}>{formatCurrency(total.reste, settings)}<CommentButton rowId={rowId} columnId={`${columnIdBase}_reste`} rowName="Flux de trésorerie net" columnName={`${period.label} (Reste)`} /></div>}
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

const BudgetTracker = ({ mode = 'edition' }) => {
  const { dataState, dataDispatch } = useData();
  const { uiState, uiDispatch } = useUI();
  const { projects, categories, settings, allComments, vatRegimes } = dataState;
  const { activeProjectId, timeUnit, horizonLength, periodOffset, activeQuickSelect } = uiState;
  
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef(null);

  const { budgetEntries, actualTransactions, cashAccounts, activeProject, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);

  const CommentButton = ({ rowId, columnId, rowName, columnName }) => {
    const { dataState: budgetDataState } = useData();
    const { uiState: budgetUIState, uiDispatch: budgetUIDispatch } = useUI();
    const { allComments: budgetAllComments } = budgetDataState;
    const { activeProjectId: budgetActiveProjectId } = budgetUIState;

    const commentsForCell = useMemo(() => {
        const projectId = budgetActiveProjectId === 'consolidated' || budgetActiveProjectId.startsWith('consolidated_view_') ? null : budgetActiveProjectId;
        return (budgetAllComments[projectId] || []).filter(c => c.rowId === rowId && c.columnId === columnId);
    }, [budgetAllComments, budgetActiveProjectId, rowId, columnId]);

    const handleOpenCommentDrawer = (e) => {
        e.stopPropagation();
        budgetUIDispatch({ type: 'OPEN_COMMENT_DRAWER', payload: { rowId, columnId, rowName, columnName } });
    };

    const hasComments = commentsForCell.length > 0;

    return (
        <button 
            onClick={handleOpenCommentDrawer}
            className={`absolute top-1/2 -translate-y-1/2 right-0 p-0.5 hover:text-blue-600 transition-opacity z-10 ${hasComments ? 'opacity-100 text-blue-600' : 'opacity-0 text-gray-400 group-hover/subcell:opacity-100'}`}
            title="Commentaires"
        >
            <MessageSquare className="w-3 h-3" />
            {hasComments && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-white" style={{ fontSize: '0.6rem' }}>
                    {commentsForCell.length}
                </span>
            )}
        </button>
    );
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({ budget: true, actual: false, reste: false });
  const [drawerData, setDrawerData] = useState({ isOpen: false, transactions: [], title: '' });
  const [collapsedItems, setCollapsedItems] = useState({});
  const [isEntreesCollapsed, setIsEntreesCollapsed] = useState(false);
  const [isSortiesCollapsed, setIsSortiesCollapsed] = useState(false);
  const topScrollRef = useRef(null);
  const mainScrollRef = useRef(null);
  const toggleCollapse = (id) => setCollapsedItems(prev => ({ ...prev, [id]: !prev[id] }));
  const [columnWidths, setColumnWidths] = useState(() => { try { const savedWidths = localStorage.getItem('budgetAppColumnWidths'); if (savedWidths) return JSON.parse(savedWidths); } catch (error) { console.error("Failed to parse column widths from localStorage", error); } return { category: 192, supplier: 160, project: 192 }; });
  
  const [isTierSearchOpen, setIsTierSearchOpen] = useState(false);
  const [isProjectSearchOpen, setIsProjectSearchOpen] = useState(false);
  const tierSearchRef = useRef(null);
  const projectSearchRef = useRef(null);
  const today = getTodayInTimezone(settings.timezoneOffset);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (tierSearchRef.current && !tierSearchRef.current.contains(event.target)) {
            setIsTierSearchOpen(false);
          }
          if (projectSearchRef.current && !projectSearchRef.current.contains(event.target)) {
            setIsProjectSearchOpen(false);
          }
          if (periodMenuRef.current && !periodMenuRef.current.contains(event.target)) {
            setIsPeriodMenuOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, []);

  useEffect(() => localStorage.setItem('budgetAppColumnWidths', JSON.stringify(columnWidths)), [columnWidths]);
  useEffect(() => { const topEl = topScrollRef.current; const mainEl = mainScrollRef.current; if (!topEl || !mainEl) return; let isSyncing = false; const syncTopToMain = () => { if (!isSyncing) { isSyncing = true; mainEl.scrollLeft = topEl.scrollLeft; requestAnimationFrame(() => { isSyncing = false; }); } }; const syncMainToTop = () => { if (!isSyncing) { isSyncing = true; topEl.scrollLeft = mainEl.scrollLeft; requestAnimationFrame(() => { isSyncing = false; }); } }; topEl.addEventListener('scroll', syncTopToMain); mainEl.addEventListener('scroll', syncMainToTop); return () => { topEl.removeEventListener('scroll', syncTopToMain); mainEl.removeEventListener('scroll', syncMainToTop); }; }, []);
  const handleResize = (columnId, newWidth) => setColumnWidths(prev => ({ ...prev, [columnId]: Math.max(newWidth, 80) }));
  
  const currencySettings = {
    currency: activeProject?.currency,
    displayUnit: activeProject?.display_unit,
    decimalPlaces: activeProject?.decimal_places,
  };

  const handlePeriodChange = (direction) => {
    uiDispatch({ type: 'SET_PERIOD_OFFSET', payload: periodOffset + direction });
  };

  const handleQuickPeriodSelect = (quickSelectType) => {
    const today = getTodayInTimezone(settings.timezoneOffset);
    let payload;

    switch (quickSelectType) {
      case 'today':
        payload = { timeUnit: 'day', horizonLength: 1, periodOffset: 0, activeQuickSelect: 'today' };
        break;
      case 'week': {
        const dayOfWeek = today.getDay(); // Sunday=0, Monday=1, ...
        const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        payload = { timeUnit: 'day', horizonLength: 7, periodOffset: offsetToMonday, activeQuickSelect: 'week' };
        break;
      }
      case 'month': {
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const startOfWeekOfFirstDay = getStartOfWeek(firstDayOfMonth);
        const startOfWeekOfLastDay = getStartOfWeek(lastDayOfMonth);
        
        const horizon = Math.round((startOfWeekOfLastDay - startOfWeekOfFirstDay) / (1000 * 60 * 60 * 24 * 7)) + 1;
        
        const startOfCurrentWeek = getStartOfWeek(today);
        const offsetInTime = startOfWeekOfFirstDay - startOfCurrentWeek;
        const offsetInWeeks = Math.round(offsetInTime / (1000 * 60 * 60 * 24 * 7));

        payload = { timeUnit: 'week', horizonLength: horizon, periodOffset: offsetInWeeks, activeQuickSelect: 'month' };
        break;
      }
      case 'quarter': {
        const currentQuarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        const firstDayOfQuarter = new Date(today.getFullYear(), currentQuarterStartMonth, 1);
        const currentFortnightStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() <= 15 ? 1 : 16);
        const targetFortnightStart = new Date(firstDayOfQuarter.getFullYear(), firstDayOfQuarter.getMonth(), 1);
        const monthsDiff = (currentFortnightStart.getFullYear() - targetFortnightStart.getFullYear()) * 12 + (currentFortnightStart.getMonth() - targetFortnightStart.getMonth());
        let fortnightOffset = -monthsDiff * 2;
        if (currentFortnightStart.getDate() > 15) {
            fortnightOffset -= 1;
        }
        payload = { timeUnit: 'fortnightly', horizonLength: 6, periodOffset: fortnightOffset, activeQuickSelect: 'quarter' };
        break;
      }
      case 'year': {
        const currentMonth = today.getMonth(); // 0-11
        const offsetToJanuary = -currentMonth;
        payload = { timeUnit: 'month', horizonLength: 12, periodOffset: offsetToJanuary, activeQuickSelect: 'year' };
        break;
      }
      case 'short_term': {
        payload = { timeUnit: 'annually', horizonLength: 3, periodOffset: 0, activeQuickSelect: 'short_term' };
        break;
      }
      case 'medium_term': {
        payload = { timeUnit: 'annually', horizonLength: 5, periodOffset: 0, activeQuickSelect: 'medium_term' };
        break;
      }
      case 'long_term': {
        payload = { timeUnit: 'annually', horizonLength: 10, periodOffset: 0, activeQuickSelect: 'long_term' };
        break;
      }
      default:
        return;
    }
    uiDispatch({ type: 'SET_QUICK_PERIOD', payload });
  };

  const timeUnitLabels = {
    day: 'Jour',
    week: 'Semaine',
    fortnightly: 'Quinzaine',
    month: 'Mois',
    bimonthly: 'Bimestre',
    quarterly: 'Trimestre',
    semiannually: 'Semestre',
    annually: 'Année',
  };
  
  const periodLabel = useMemo(() => {
    if (periodOffset === 0) return 'Actuel';
    const label = timeUnitLabels[timeUnit] || 'Période';
    const plural = Math.abs(periodOffset) > 1 ? 's' : '';
    return `${periodOffset > 0 ? '+' : ''}${periodOffset} ${label}${plural}`;
  }, [periodOffset, timeUnit, timeUnitLabels]);

  const periods = useMemo(() => {
    const today = getTodayInTimezone(settings.timezoneOffset);
    let baseDate;
    switch (timeUnit) {
        case 'day': baseDate = new Date(today); baseDate.setHours(0,0,0,0); break;
        case 'week': baseDate = getStartOfWeek(today); break;
        case 'fortnightly': const day = today.getDate(); baseDate = new Date(today.getFullYear(), today.getMonth(), day <= 15 ? 1 : 16); break;
        case 'month': baseDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
        case 'bimonthly': const bimonthStartMonth = Math.floor(today.getMonth() / 2) * 2; baseDate = new Date(today.getFullYear(), bimonthStartMonth, 1); break;
        case 'quarterly': const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3; baseDate = new Date(today.getFullYear(), quarterStartMonth, 1); break;
        case 'semiannually': const semiAnnualStartMonth = Math.floor(today.getMonth() / 6) * 6; baseDate = new Date(today.getFullYear(), semiAnnualStartMonth, 1); break;
        case 'annually': baseDate = new Date(today.getFullYear(), 0, 1); break;
        default: baseDate = getStartOfWeek(today);
    }

    const periodList = [];
    for (let i = 0; i < horizonLength; i++) {
        const periodIndex = i + periodOffset;
        const periodStart = new Date(baseDate);
        switch (timeUnit) {
            case 'day': periodStart.setDate(periodStart.getDate() + periodIndex); break;
            case 'week': periodStart.setDate(periodStart.getDate() + periodIndex * 7); break;
            case 'fortnightly': {
                const d = new Date(baseDate);
                let numFortnights = periodIndex;
                let currentMonth = d.getMonth();
                let isFirstHalf = d.getDate() === 1;
                const monthsToAdd = Math.floor(((isFirstHalf ? 0 : 1) + numFortnights) / 2);
                d.setMonth(currentMonth + monthsToAdd);
                const newIsFirstHalf = (((isFirstHalf ? 0 : 1) + numFortnights) % 2 + 2) % 2 === 0;
                d.setDate(newIsFirstHalf ? 1 : 16);
                periodStart.setTime(d.getTime());
                break;
            }
            case 'month': periodStart.setMonth(periodStart.getMonth() + periodIndex); break;
            case 'bimonthly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 2); break;
            case 'quarterly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 3); break;
            case 'semiannually': periodStart.setMonth(periodStart.getMonth() + periodIndex * 6); break;
            case 'annually': periodStart.setFullYear(periodStart.getFullYear() + periodIndex); break;
        }
        periodList.push(periodStart);
    }

    return periodList.map((periodStart) => {
        const periodEnd = new Date(periodStart);
        switch (timeUnit) {
            case 'day': periodEnd.setDate(periodEnd.getDate() + 1); break;
            case 'week': periodEnd.setDate(periodEnd.getDate() + 7); break;
            case 'fortnightly': if (periodStart.getDate() === 1) { periodEnd.setDate(16); } else { periodEnd.setMonth(periodEnd.getMonth() + 1); periodEnd.setDate(1); } break;
            case 'month': periodEnd.setMonth(periodEnd.getMonth() + 1); break;
            case 'bimonthly': periodEnd.setMonth(periodEnd.getMonth() + 2); break;
            case 'quarterly': periodEnd.setMonth(periodEnd.getMonth() + 3); break;
            case 'semiannually': periodEnd.setMonth(periodEnd.getMonth() + 6); break;
            case 'annually': periodEnd.setFullYear(periodEnd.getFullYear() + 1); break;
        }
        const year = periodStart.toLocaleDateString('fr-FR', { year: '2-digit' });
        const monthsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        let label = '';
        switch (timeUnit) {
            case 'day':
                if (activeQuickSelect === 'week') {
                    const dayLabel = periodStart.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
                    label = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
                } else {
                    label = periodStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                }
                break;
            case 'week': label = `S ${periodStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`; break;
            case 'fortnightly': const fortnightNum = periodStart.getDate() === 1 ? '1' : '2'; label = `${fortnightNum}Q-${monthsShort[periodStart.getMonth()]}'${year}`; break;
            case 'month': label = `${periodStart.toLocaleString('fr-FR', { month: 'short' })} '${year}`; break;
            case 'bimonthly': const startMonthB = monthsShort[periodStart.getMonth()]; const endMonthB = monthsShort[(periodStart.getMonth() + 1) % 12]; label = `${startMonthB}-${endMonthB}`; break;
            case 'quarterly': const quarter = Math.floor(periodStart.getMonth() / 3) + 1; label = `T${quarter} '${year}`; break;
            case 'semiannually': const semester = Math.floor(periodStart.getMonth() / 6) + 1; label = `S${semester} '${year}`; break;
            case 'annually': label = String(periodStart.getFullYear()); break;
        }
        return { label, startDate: periodStart, endDate: periodEnd };
    });
  }, [timeUnit, horizonLength, periodOffset, activeQuickSelect, settings.timezoneOffset]);

  const filteredBudgetEntries = useMemo(() => {
    let entries = budgetEntries;
    if (searchTerm) {
        entries = entries.filter(entry => entry.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if ((isConsolidated || isCustomConsolidated) && projectSearchTerm) {
        entries = entries.filter(entry => {
            const project = projects.find(p => p.id === entry.projectId);
            return project && project.name.toLowerCase().includes(projectSearchTerm.toLowerCase());
        });
    }
    return entries;
  }, [budgetEntries, searchTerm, isConsolidated, isCustomConsolidated, projectSearchTerm, projects]);
  
  const isRowVisibleInPeriods = useCallback((entry) => {
    if (!periods || periods.length === 0) return false;
    for (const period of periods) { 
      if (getEntryAmountForPeriod(entry, period.startDate, period.endDate) > 0 || getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate) > 0) return true; 
    } 
    return false;
  }, [periods, actualTransactions]);

  const expandedAndVatEntries = useProcessedEntries(filteredBudgetEntries, categories, vatRegimes, activeProjectId, periods, isConsolidated, isCustomConsolidated);
  const hasOffBudgetRevenues = useMemo(() => expandedAndVatEntries.some(e => e.isOffBudget && e.type === 'revenu' && isRowVisibleInPeriods(e)), [expandedAndVatEntries, isRowVisibleInPeriods]);
  const hasOffBudgetExpenses = useMemo(() => expandedAndVatEntries.some(e => e.isOffBudget && e.type === 'depense' && isRowVisibleInPeriods(e)), [expandedAndVatEntries, isRowVisibleInPeriods]);
  const groupedData = useGroupedData(expandedAndVatEntries, categories, isRowVisibleInPeriods);
  const periodPositions = usePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, expandedAndVatEntries);
  
  const handleNewBudget = () => { if (!isConsolidated && !isCustomConsolidated) { uiDispatch({ type: 'OPEN_BUDGET_MODAL', payload: null }); } };
  const handleEditEntry = (entry) => { 
    if (entry.is_vat_payment) return; // Cannot edit automatic VAT payments
    const originalEntryId = entry.is_vat_child ? entry.id.replace('_vat', '') : entry.id;
    const originalEntry = budgetEntries.find(e => e.id === originalEntryId);
    if (originalEntry) {
        uiDispatch({ type: 'OPEN_BUDGET_MODAL', payload: originalEntry });
    }
  };
  const handleDeleteEntry = (entry) => {
    if (entry.is_vat_payment) return;
    const originalEntryId = entry.is_vat_child ? entry.id.replace('_vat', '') : entry.id;
    const originalEntry = budgetEntries.find(e => e.id === originalEntryId);
    if (!originalEntry) return;

    uiDispatch({
      type: 'OPEN_CONFIRMATION_MODAL',
      payload: {
        title: `Supprimer "${originalEntry.supplier}" ?`,
        message: "Cette action est irréversible et supprimera l'entrée budgétaire et ses prévisions.",
        onConfirm: () => dataDispatch({ type: 'DELETE_ENTRY', payload: { entryId: originalEntry.id, entryProjectId: originalEntry.projectId || activeProjectId } }),
      }
    });
  };
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const getFrequencyTitle = (entry) => { const freq = entry.frequency.charAt(0).toUpperCase() + entry.frequency.slice(1); if (entry.frequency === 'ponctuel') return `Ponctuel: ${formatDate(entry.date)}`; if (entry.frequency === 'irregulier') return `Irrégulier: ${entry.payments?.length || 0} paiements`; const period = `De ${formatDate(entry.startDate)} à ${entry.endDate ? formatDate(entry.endDate) : '...'}`; return `${freq} | ${period}`; };
  const getResteColor = (reste, isEntree) => reste === 0 ? 'text-text-secondary' : isEntree ? (reste <= 0 ? 'text-success-600' : 'text-danger-600') : (reste >= 0 ? 'text-success-600' : 'text-danger-600');
  
  const handleOpenPaymentDrawer = (entry, period) => {
    const entryActuals = actualTransactions.filter(actual => actual.budgetId === entry.id);

    uiDispatch({
        type: 'OPEN_INLINE_PAYMENT_DRAWER',
        payload: {
            actuals: entryActuals,
            entry: entry,
            period: period,
            periodLabel: period.label
        }
    });
  };
  
  const getPaymentsForCategoryAndPeriod = (subCategoryName, period) => {
    let relevantActuals;
    const type = subCategoryName === 'Entrées Hors Budget' ? 'revenu' : (subCategoryName === 'Sorties Hors Budget' ? 'depense' : null);
    if (type) {
        const offBudgetEntryIds = expandedAndVatEntries.filter(e => e.isOffBudget && e.type === type).map(e => e.id);
        relevantActuals = actualTransactions.filter(t => offBudgetEntryIds.includes(t.budgetId));
    } else {
        relevantActuals = actualTransactions.filter(t => {
            if (t.category !== subCategoryName || !t.budgetId) return false;
            const budgetEntry = expandedAndVatEntries.find(e => e.id === t.budgetId);
            return !budgetEntry || !budgetEntry.isOffBudget;
        });
    }
    return relevantActuals.flatMap(t => (t.payments || []).filter(p => new Date(p.paymentDate) >= period.startDate && new Date(p.paymentDate) < period.endDate).map(p => ({ ...p, thirdParty: t.thirdParty, type: t.type })));
  };

  const getPaymentsForMainCategoryAndPeriod = (mainCategory, period) => mainCategory.subCategories.flatMap(sc => getPaymentsForCategoryAndPeriod(sc.name, period));
  
  const handleActualClick = (context) => {
    const { period } = context;
    let payments = [];
    let title = '';
    if (context.entryId) {
      const entry = expandedAndVatEntries.find(e => e.id === context.entryId);
      payments = actualTransactions.filter(t => t.budgetId === context.entryId).flatMap(t => (t.payments || []).filter(p => new Date(p.paymentDate) >= period.startDate && new Date(p.paymentDate) < period.endDate).map(p => ({ ...p, thirdParty: t.thirdParty, type: t.type })));
      title = `Détails pour ${entry.supplier}`;
    } else if (context.mainCategory) {
        payments = getPaymentsForMainCategoryAndPeriod(context.mainCategory, period);
        title = `Détails pour ${context.mainCategory.name}`;
    } else if (context.category === 'Sorties Hors Budget' || context.category === 'Entrées Hors Budget') {
        payments = getPaymentsForCategoryAndPeriod(context.category, period);
        title = `Détails pour ${context.category}`;
    } else if (context.type) {
      if (context.type === 'entree') {
        payments = categories.revenue.flatMap(mc => getPaymentsForMainCategoryAndPeriod(mc, period));
        if (hasOffBudgetRevenues) payments.push(...getPaymentsForCategoryAndPeriod('Entrées Hors Budget', period));
        title = 'Détails des Entrées';
      } else if (context.type === 'sortie') {
        let expensePayments = categories.expense.flatMap(mc => getPaymentsForMainCategoryAndPeriod(mc, period));
        if (hasOffBudgetExpenses) expensePayments.push(...getPaymentsForCategoryAndPeriod('Sorties Hors Budget', period));
        payments = expensePayments;
        title = 'Détails des Sorties';
      } else if (context.type === 'net') {
        const revenuePayments = categories.revenue.flatMap(mc => getPaymentsForMainCategoryAndPeriod(mc, period));
        if (hasOffBudgetRevenues) revenuePayments.push(...getPaymentsForCategoryAndPeriod('Entrées Hors Budget', period));
        let expensePayments = categories.expense.flatMap(mc => getPaymentsForMainCategoryAndPeriod(mc, period));
        if (hasOffBudgetExpenses) expensePayments.push(...getPaymentsForCategoryAndPeriod('Sorties Hors Budget', period));
        payments = [...revenuePayments, ...expensePayments];
        title = 'Détails des Transactions';
      }
    }
    if (payments.length > 0) setDrawerData({ isOpen: true, transactions: payments, title: `${title} - ${period.label}` });
  };

  const handleCloseDrawer = () => setDrawerData({ isOpen: false, transactions: [], title: '' });
  
  const handleDrillDown = () => {
    const newCollapsedState = {};
    groupedData.entree.forEach(mainCat => newCollapsedState[mainCat.id] = false);
    groupedData.sortie.forEach(mainCat => newCollapsedState[mainCat.id] = false);
    setCollapsedItems(newCollapsedState);
    setIsEntreesCollapsed(false);
    setIsSortiesCollapsed(false);
  };

  const handleDrillUp = () => {
    const newCollapsedState = {};
    groupedData.entree.forEach(mainCat => newCollapsedState[mainCat.id] = true);
    groupedData.sortie.forEach(mainCat => newCollapsedState[mainCat.id] = true);
    setCollapsedItems(newCollapsedState);
  };
  
  const numVisibleCols = Object.values(visibleColumns).filter(v => v).length;
  const periodColumnWidth = numVisibleCols > 0 ? numVisibleCols * 90 : 50;
  const separatorWidth = 4;
  const fixedColsWidth = columnWidths.category + columnWidths.supplier + ((isConsolidated || isCustomConsolidated) ? columnWidths.project : 0);
  const totalTableWidth = fixedColsWidth + separatorWidth + (periods.length * (periodColumnWidth + separatorWidth));
  const supplierColLeft = columnWidths.category;
  const projectColLeft = supplierColLeft + columnWidths.supplier;
  const totalCols = ((isConsolidated || isCustomConsolidated) ? 3 : 2) + 1 + (periods.length * 2);
  
  const quickPeriodOptions = [
    { id: 'today', label: 'Jour' },
    { id: 'week', label: 'Semaine' },
    { id: 'month', label: 'Mois' },
    { id: 'quarter', label: 'Trimestre' },
    { id: 'year', label: 'Année' },
    { id: 'short_term', label: 'CT (3a)' },
    { id: 'medium_term', label: 'MT (5a)' },
    { id: 'long_term', label: 'LT (10a)' },
  ];

  const selectedPeriodLabel = quickPeriodOptions.find(opt => opt.id === activeQuickSelect)?.label || 'Période';
  
  const renderBudgetRows = (type) => {
    const isEntree = type === 'entree';
    const mainCategories = groupedData[type] || [];
    const isCollapsed = type === 'entree' ? isEntreesCollapsed : isSortiesCollapsed;
    const toggleMainCollapse = type === 'entree' ? () => setIsEntreesCollapsed(p => !p) : () => setIsSortiesCollapsed(p => !p);
    const Icon = type === 'entree' ? TrendingUp : TrendingDown;
    const colorClass = type === 'entree' ? 'text-success-600' : 'text-danger-600';

    const hasData = mainCategories.length > 0;
    if (!hasData) {
      return null;
    }

    return (
      <>
        {/* Total Row for Type */}
        <tr className="bg-gray-200 border-y-2 border-gray-300 cursor-pointer" onClick={toggleMainCollapse}>
          <td colSpan={(isConsolidated || isCustomConsolidated) ? 3 : 2} className="px-4 py-2 text-text-primary bg-gray-200 sticky left-0 z-10">
            <div className="flex items-center gap-2">
              <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
              <Icon className={`w-4 h-4 ${colorClass}`} />
              {isEntree ? 'TOTAL ENTRÉES' : 'TOTAL SORTIES'}
            </div>
          </td>
          <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
          {periods.map((period, periodIndex) => {
            const totals = calculateGeneralTotals(mainCategories, period, type, expandedAndVatEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
            const reste = totals.budget - totals.actual;
            const columnIdBase = period.startDate.toISOString();
            const rowId = `total_${type}`;
            return (
              <React.Fragment key={periodIndex}>
                <td className="px-2 py-2">
                  {numVisibleCols > 0 && (
                    <div className="flex gap-2 justify-around text-sm">
                        {visibleColumns.budget && <div className="relative group/subcell flex-1 text-center text-text-primary font-normal">
                            {formatCurrency(totals.budget, currencySettings)}
                            <CommentButton rowId={rowId} columnId={`${columnIdBase}_budget`} rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`} columnName={`${period.label} (Prév.)`} />
                        </div>}
                        {visibleColumns.actual && <div className="relative group/subcell flex-1 text-center">
                            <button onClick={(e) => { e.stopPropagation(); if (totals.actual !== 0) handleActualClick({ type, period }); }} disabled={totals.actual === 0} className="text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60 font-normal">
                                {formatCurrency(totals.actual, currencySettings)}
                            </button>
                            <CommentButton rowId={rowId} columnId={`${columnIdBase}_actual`} rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`} columnName={`${period.label} (Réel)`} />
                        </div>}
                        {visibleColumns.reste && <div className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(reste, isEntree)}`}>
                            {formatCurrency(reste, currencySettings)}
                            <CommentButton rowId={rowId} columnId={`${columnIdBase}_reste`} rowName={`Total ${isEntree ? 'Entrées' : 'Sorties'}`} columnName={`${period.label} (Reste)`} />
                        </div>}
                    </div>
                  )}
                </td>
                <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
              </React.Fragment>
            );
          })}
        </tr>

        {/* Rows for each Main Category and Entry */}
        {!isCollapsed && mainCategories.map(mainCategory => {
          const hasDataInView = mainCategory.entries.some(isRowVisibleInPeriods);
          if (!hasDataInView) return null;

          const isMainCollapsed = collapsedItems[mainCategory.id];
          return (
            <React.Fragment key={mainCategory.id}>
              <tr onClick={() => toggleCollapse(mainCategory.id)} className="bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200">
                <td colSpan={(isConsolidated || isCustomConsolidated) ? 3 : 2} className="px-4 py-2 sticky left-0 z-10 bg-gray-100">
                  <div className="flex items-center gap-2">
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMainCollapsed ? '-rotate-90' : ''}`} />
                    {mainCategory.name}
                  </div>
                </td>
                <td className="bg-surface"></td>
                {periods.map((period, periodIndex) => {
                  const totals = calculateMainCategoryTotals(mainCategory.entries, period, actualTransactions);
                  const reste = totals.budget - totals.actual;
                  const columnIdBase = period.startDate.toISOString();
                  const rowId = `main_cat_${mainCategory.id}`;
                  return (
                    <React.Fragment key={periodIndex}>
                      <td className="px-2 py-2">
                        {numVisibleCols > 0 && (
                          <div className="flex gap-2 justify-around text-xs">
                            {visibleColumns.budget && <div className="relative group/subcell flex-1 text-center font-normal">
                                {formatCurrency(totals.budget, currencySettings)}
                                <CommentButton rowId={rowId} columnId={`${columnIdBase}_budget`} rowName={mainCategory.name} columnName={`${period.label} (Prév.)`} />
                            </div>}
                            {visibleColumns.actual && <div className="relative group/subcell flex-1 text-center font-normal">
                                <button onClick={(e) => { e.stopPropagation(); if (totals.actual !== 0) handleActualClick({ mainCategory, period }); }} disabled={totals.actual === 0} className="hover:underline disabled:cursor-not-allowed disabled:opacity-60">
                                    {formatCurrency(totals.actual, currencySettings)}
                                </button>
                                <CommentButton rowId={rowId} columnId={`${columnIdBase}_actual`} rowName={mainCategory.name} columnName={`${period.label} (Réel)`} />
                            </div>}
                            {visibleColumns.reste && <div className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                {formatCurrency(reste, currencySettings)}
                                <CommentButton rowId={rowId} columnId={`${columnIdBase}_reste`} rowName={mainCategory.name} columnName={`${period.label} (Reste)`} />
                            </div>}
                          </div>
                        )}
                      </td>
                      <td className="bg-surface"></td>
                    </React.Fragment>
                  );
                })}
              </tr>
              {!isMainCollapsed && mainCategory.entries.filter(isRowVisibleInPeriods).map((entry) => {
                const project = (isConsolidated || isCustomConsolidated) ? projects.find(p => p.id === entry.projectId) : null;
                const subCat = mainCategory.subCategories.find(sc => sc.name === entry.category);
                const criticality = subCat?.criticality;
                const critConfig = criticalityConfig[criticality];
                return (
                  <tr key={entry.id} className={`border-b border-gray-100 hover:bg-gray-50 group ${entry.is_vat_child ? 'bg-gray-50/50' : (entry.is_vat_payment ? 'bg-blue-50/50' : '')}`}>
                    <td className={`px-4 py-1 font-normal text-gray-800 sticky left-0 bg-white group-hover:bg-gray-50 z-10 ${entry.is_vat_child ? 'pl-8' : ''}`}>
                      <div className="flex items-center gap-2">
                        {critConfig && <span className={`w-2 h-2 rounded-full ${critConfig.color}`} title={`Criticité: ${critConfig.label}`}></span>}
                        <span>{entry.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-1 text-gray-700 sticky bg-white group-hover:bg-gray-50 z-10" style={{ left: `${supplierColLeft}px` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate" title={getFrequencyTitle(entry)}>
                          {entry.isProvision && (
                            <div title={`Provision en ${entry.payments?.length || 0} fois de ${formatCurrency((entry.payments && entry.payments.length > 0) ? entry.payments[0].amount : 0, settings)}`}>
                                <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                            </div>
                          )}
                          <span className="truncate">{entry.supplier}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditEntry(entry)} className="p-1 text-blue-500 hover:text-blue-700"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteEntry(entry)} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </td>
                    {(isConsolidated || isCustomConsolidated) && <td className="px-4 py-1 text-gray-600 sticky bg-white group-hover:bg-gray-50 z-10" style={{ left: `${projectColLeft}px` }}><div className="flex items-center gap-2"><Folder className="w-4 h-4 text-blue-500" />{project?.name || 'N/A'}</div></td>}
                    <td className="bg-surface"></td>
                    {periods.map((period, periodIndex) => {
                      const budget = getEntryAmountForPeriod(entry, period.startDate, period.endDate);
                      const actual = getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate);
                      const reste = budget - actual;
                      const columnIdBase = period.startDate.toISOString();
                      return (
                        <React.Fragment key={periodIndex}>
                          <td className="px-2 py-1">
                            {numVisibleCols > 0 && (
                              <div className="flex gap-2 justify-around text-xs">
                                {visibleColumns.budget && <div className="relative group/subcell flex-1 text-center text-gray-500">
                                    {formatCurrency(budget, currencySettings)}
                                    <CommentButton rowId={entry.id} columnId={`${columnIdBase}_budget`} rowName={entry.supplier} columnName={`${period.label} (Prév.)`} />
                                </div>}
                                {visibleColumns.actual && <div className="relative group/subcell flex-1 text-center">
                                    <button onClick={() => handleOpenPaymentDrawer(entry, period)} disabled={actual === 0 && budget === 0} className="text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400">
                                        {formatCurrency(actual, currencySettings)}
                                    </button>
                                    <CommentButton rowId={entry.id} columnId={`${columnIdBase}_actual`} rowName={entry.supplier} columnName={`${period.label} (Réel)`} />
                                </div>}
                                {visibleColumns.reste && <div className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(reste, isEntree)}`}>
                                    {formatCurrency(reste, currencySettings)}
                                    <CommentButton rowId={entry.id} columnId={`${columnIdBase}_reste`} rowName={entry.supplier} columnName={`${period.label} (Reste)`} />
                                </div>}
                              </div>
                            )}
                          </td>
                          <td className="bg-surface"></td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </React.Fragment>
          );
        })}
      </>
    );
  };
  
  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => handlePeriodChange(-1)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="Période précédente"><ChevronLeft size={18} /></button>
                    <span className="text-sm font-semibold text-gray-700 w-24 text-center" title="Décalage par rapport à la période actuelle">{periodLabel}</span>
                    <button onClick={() => handlePeriodChange(1)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="Période suivante"><ChevronRight size={18} /></button>
                </div>
                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                <div className="relative" ref={periodMenuRef}>
                    <button 
                        onClick={() => setIsPeriodMenuOpen(p => !p)} 
                        className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors"
                    >
                        <span>{selectedPeriodLabel}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isPeriodMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {isPeriodMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                            >
                                <ul className="p-1">
                                    {quickPeriodOptions.map(option => (
                                        <li key={option.id}>
                                            <button
                                                onClick={() => {
                                                    handleQuickPeriodSelect(option.id);
                                                    setIsPeriodMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${activeQuickSelect === option.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                {option.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-text-secondary"/>
                    <div className="flex items-center bg-secondary-200 rounded-lg p-0.5">
                        <button onClick={() => setVisibleColumns(p => ({...p, budget: !p.budget}))} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${visibleColumns.budget ? 'bg-surface text-primary-600 shadow-sm' : 'bg-transparent text-text-secondary'}`}>
                            Prév.
                        </button>
                        <button onClick={() => setVisibleColumns(p => ({...p, actual: !p.actual}))} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${visibleColumns.actual ? 'bg-surface text-primary-600 shadow-sm' : 'bg-transparent text-text-secondary'}`}>
                            Réel
                        </button>
                        <button onClick={() => setVisibleColumns(p => ({...p, reste: !p.reste}))} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${visibleColumns.reste ? 'bg-surface text-primary-600 shadow-sm' : 'bg-transparent text-text-secondary'}`}>
                            Reste
                        </button>
                    </div>
                </div>
            </div>
            {mode === 'edition' && (
                <div className="flex items-center gap-4">
                    <button onClick={handleNewBudget} className="text-primary-600 hover:bg-primary-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:text-secondary-400 disabled:cursor-not-allowed" disabled={isConsolidated || isCustomConsolidated}><Plus className="w-5 h-5" /> Nouvelle Entrée</button>
                </div>
            )}
        </div>
      </div>
      
      {mode === 'lecture' ? (
        <LectureView 
            entries={expandedAndVatEntries} 
            periods={periods}
            settings={settings}
            actuals={actualTransactions}
            isConsolidated={isConsolidated || isCustomConsolidated}
            projects={projects}
            visibleColumns={visibleColumns}
            CommentButton={CommentButton}
        />
      ) : (
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
            <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden custom-scrollbar"><div style={{ width: `${totalTableWidth}px`, height: '1px' }}></div></div>
            <div ref={mainScrollRef} className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="sticky top-0 z-30">
                    <tr>
                        <ResizableTh id="category" width={columnWidths.category} onResize={handleResize} className="sticky left-0 z-40 bg-gray-100">
                            <div className="flex items-center justify-between w-full">
                                <span>Catégorie</span>
                                <div className="flex items-center">
                                    <button onClick={handleDrillUp} className="p-1 text-gray-500 hover:text-gray-800" title="Réduire tout"><ChevronUp size={16} /></button>
                                    <button onClick={handleDrillDown} className="p-1 text-gray-500 hover:text-gray-800" title="Développer tout"><ChevronDown size={16} /></button>
                                </div>
                            </div>
                        </ResizableTh>
                        <ResizableTh id="supplier" width={columnWidths.supplier} onResize={handleResize} className="sticky z-20 bg-gray-100" style={{ left: `${supplierColLeft}px` }}>
                            {isTierSearchOpen ? (
                                <div ref={tierSearchRef} className="flex items-center gap-1 w-full">
                                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="w-full px-2 py-1 border rounded-md text-sm bg-white" autoFocus onClick={(e) => e.stopPropagation()} />
                                    <button onClick={() => { setSearchTerm(''); }} className="p-1 text-gray-500 hover:text-gray-800" title="Effacer"><XCircle size={16} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between w-full">
                                    <span>Tiers</span>
                                    <button onClick={() => setIsTierSearchOpen(true)} className="p-1 text-gray-500 hover:text-gray-800" title="Rechercher par tiers"><Search size={14} /></button>
                                </div>
                            )}
                        </ResizableTh>
                        {(isConsolidated || isCustomConsolidated) && (
                            <ResizableTh id="project" width={columnWidths.project} onResize={handleResize} className="sticky z-20 bg-gray-100" style={{ left: `${projectColLeft}px` }}>
                                {isProjectSearchOpen ? (
                                    <div ref={projectSearchRef} className="flex items-center gap-1 w-full">
                                        <input type="text" value={projectSearchTerm} onChange={(e) => setProjectSearchTerm(e.target.value)} placeholder="Rechercher..." className="w-full px-2 py-1 border rounded-md text-sm bg-white" autoFocus onClick={(e) => e.stopPropagation()} />
                                        <button onClick={() => { setProjectSearchTerm(''); }} className="p-1 text-gray-500 hover:text-gray-800" title="Effacer">
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between w-full">
                                        <span>Projet</span>
                                        <button onClick={() => setIsProjectSearchOpen(true)} className="p-1 text-gray-500 hover:text-gray-800" title="Rechercher par projet">
                                            <Search size={14} />
                                        </button>
                                    </div>
                                )}
                            </ResizableTh>
                        )}
                        <th className="bg-surface border-b-2" style={{ width: `${separatorWidth}px` }}></th>
                        {periods.map((period, periodIndex) => {
                        const isPast = period.endDate <= today;
                        const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', expandedAndVatEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                        const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', expandedAndVatEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                        const netBudget = revenueTotals.budget - expenseTotals.budget;
                        const isNegativeFlow = netBudget < 0;
                        return (
                            <React.Fragment key={periodIndex}>
                            <th className={`px-2 py-2 text-center font-medium border-b-2 ${isPast ? 'bg-gray-50' : 'bg-surface'} ${isNegativeFlow && !isPast ? 'bg-red-50' : ''}`} style={{ minWidth: `${periodColumnWidth}px` }}>
                                <div className={`text-base mb-1 ${isNegativeFlow && !isPast ? 'text-red-700' : 'text-text-primary'}`}>{period.label}</div>
                                {numVisibleCols > 0 && (
                                <div className="flex gap-2 justify-around text-xs font-medium text-text-secondary">
                                    {visibleColumns.budget && <div className="flex-1">Prév.</div>}
                                    {visibleColumns.actual && <div className="flex-1">Réel</div>}
                                    {visibleColumns.reste && <div className="flex-1">Reste</div>}
                                </div>
                                )}
                            </th>
                            <th className="bg-surface border-b-2" style={{ width: `${separatorWidth}px` }}></th>
                            </React.Fragment>
                        );
                        })}
                    </tr>
                    </thead>
                    <tbody>
                    <tr className="bg-gray-200 text-gray-800"><td colSpan={(isConsolidated || isCustomConsolidated) ? 3 : 2} className="px-4 py-2 bg-gray-200 sticky left-0 z-10"><div className="flex items-center gap-2">Trésorerie début de période</div></td><td className="bg-surface"></td>{periods.map((_, periodIndex) => (<React.Fragment key={periodIndex}><td className="px-2 py-2 text-center font-normal" colSpan={1}>{formatCurrency(periodPositions[periodIndex]?.initial || 0, currencySettings)}</td><td className="bg-surface"></td></React.Fragment>))}</tr>
                    <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>
                    {renderBudgetRows('entree')}
                    <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>
                    {renderBudgetRows('sortie')}
                    <tr className="bg-surface"><td colSpan={totalCols} className="py-2"></td></tr>
                    <tr className="bg-gray-200 border-t-2 border-gray-300">
                        <td colSpan={(isConsolidated || isCustomConsolidated) ? 3 : 2} className="px-4 py-2 text-text-primary bg-gray-200 sticky left-0 z-10"><div className="flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" />Flux de trésorerie</div></td>
                        <td className="bg-surface" style={{ width: `${separatorWidth}px` }}></td>
                        {periods.map((period, periodIndex) => {
                            const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', expandedAndVatEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                            const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', expandedAndVatEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
                            const netBudget = revenueTotals.budget - expenseTotals.budget;
                            const netActual = revenueTotals.actual - expenseTotals.actual;
                            const netReste = netBudget - netActual;
                            const columnIdBase = period.startDate.toISOString();
                            const rowId = 'net_flow';
                            return (
                                <React.Fragment key={periodIndex}>
                                    <td className="px-2 py-2">
                                        {numVisibleCols > 0 && (
                                            <div className="flex gap-2 justify-around text-sm">
                                                {visibleColumns.budget && <div className={`relative group/subcell flex-1 text-center font-normal ${netBudget < 0 ? 'text-red-600' : 'text-text-primary'}`}>
                                                    {formatCurrency(netBudget, currencySettings)}
                                                    <CommentButton rowId={rowId} columnId={`${columnIdBase}_budget`} rowName="Flux de trésorerie" columnName={`${period.label} (Prév.)`} />
                                                </div>}
                                                {visibleColumns.actual && <div className="relative group/subcell flex-1 text-center font-normal">
                                                    <button onClick={() => netActual !== 0 && handleActualClick({ type: 'net', period })} disabled={netActual === 0} className="text-text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60">
                                                        {formatCurrency(netActual, currencySettings)}
                                                    </button>
                                                    <CommentButton rowId={rowId} columnId={`${columnIdBase}_actual`} rowName="Flux de trésorerie" columnName={`${period.label} (Réel)`} />
                                                </div>}
                                                {visibleColumns.reste && <div className={`relative group/subcell flex-1 text-center font-normal ${getResteColor(netReste, true)}`}>
                                                    {formatCurrency(netReste, currencySettings)}
                                                    <CommentButton rowId={rowId} columnId={`${columnIdBase}_reste`} rowName="Flux de trésorerie" columnName={`${period.label} (Reste)`} />
                                                </div>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="bg-surface"></td>
                                </React.Fragment>
                            );
                        })}
                    </tr>
                    <tr className="bg-gray-300 text-gray-900"><td colSpan={(isConsolidated || isCustomConsolidated) ? 3 : 2} className="px-4 py-2 bg-gray-300 sticky left-0 z-10"><div className="flex items-center gap-2">Trésorerie fin de période</div></td><td className="bg-surface"></td>{periods.map((_, periodIndex) => (<React.Fragment key={periodIndex}><td className="px-2 py-2 text-center font-normal" colSpan={1}>{formatCurrency(periodPositions[periodIndex]?.final || 0, currencySettings)}</td><td className="bg-surface"></td></React.Fragment>))}</tr>
                    </tbody>
                </table>
            </div>
        </div>
      )}
      <TransactionDetailDrawer isOpen={drawerData.isOpen} onClose={handleCloseDrawer} transactions={drawerData.transactions} title={drawerData.title} currency={activeProject?.currency} />
    </>
  );
};

export default BudgetTracker;
