import { useMemo, useCallback } from 'react';
import { expandVatEntries, generateVatPaymentEntries, getEntryAmountForPeriod, getActualAmountForPeriod, getTodayInTimezone } from './budgetCalculations';
import { formatCurrency } from './formatting';

export const useActiveProjectData = (dataState, uiState) => {
    const { allEntries = {}, allActuals = {}, allCashAccounts = {}, projects = [], consolidatedViews = [], settings } = dataState;
    const { activeProjectId } = uiState;

    return useMemo(() => {
        if (!settings) {
            return { budgetEntries: [], actualTransactions: [], cashAccounts: [], activeProject: null, isConsolidated: false, isCustomConsolidated: false };
        }

        const isConsolidated = activeProjectId === 'consolidated';
        const isCustomConsolidated = activeProjectId?.startsWith('consolidated_view_');

        let budgetEntries = [];
        let actualTransactions = [];
        let cashAccounts = [];
        let activeProject = null;

        if (isConsolidated) {
            budgetEntries = Object.values(allEntries).flat();
            actualTransactions = Object.values(allActuals).flat();
            cashAccounts = Object.values(allCashAccounts).flat();
            activeProject = { 
                id: 'consolidated', 
                name: 'Projet consolidé', 
                currency: settings.currency,
                display_unit: settings.displayUnit,
                decimal_places: settings.decimalPlaces
            };
        } else if (isCustomConsolidated) {
            const viewId = activeProjectId.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (view && view.project_ids) {
                budgetEntries = view.project_ids.flatMap(id => allEntries[id] || []);
                actualTransactions = view.project_ids.flatMap(id => allActuals[id] || []);
                cashAccounts = view.project_ids.flatMap(id => allCashAccounts[id] || []);
            }
            activeProject = { 
                id: activeProjectId, 
                name: view?.name || 'Vue Inconnue', 
                currency: settings.currency,
                display_unit: settings.displayUnit,
                decimal_places: settings.decimalPlaces
            };
        } else {
            activeProject = projects.find(p => p.id === activeProjectId);
            if (activeProject) {
                budgetEntries = allEntries[activeProjectId] || [];
                actualTransactions = allActuals[activeProjectId] || [];
                cashAccounts = allCashAccounts[activeProjectId] || [];
            }
        }

        return { budgetEntries, actualTransactions, cashAccounts, activeProject, isConsolidated, isCustomConsolidated };
    }, [activeProjectId, allEntries, allActuals, allCashAccounts, projects, consolidatedViews, settings]);
};

export const useProcessedEntries = (budgetEntries, categories, vatRegimes, activeProjectId, periods, isConsolidated, isCustomConsolidated) => {
    return useMemo(() => {
        const expanded = expandVatEntries(budgetEntries, categories);
        const vatRegime = vatRegimes[activeProjectId];

        if (isConsolidated || isCustomConsolidated || !vatRegime || !periods) {
            return expanded;
        }

        const dynamicVatEntries = periods.flatMap(period => generateVatPaymentEntries(expanded, period, vatRegime));
        
        return [...expanded, ...dynamicVatEntries];
    }, [budgetEntries, categories, vatRegimes, activeProjectId, periods, isConsolidated, isCustomConsolidated]);
};

export const useGroupedData = (processedEntries, categories, isRowVisibleInPeriods) => {
    return useMemo(() => {
        const groupByType = (type) => {
            const catType = type === 'entree' ? 'revenue' : 'expense';
            if (!categories || !categories[catType]) return [];
            
            const entriesForType = processedEntries.filter(e => e.type === (type === 'entree' ? 'revenu' : 'depense'));

            return categories[catType].map(mainCat => {
                if (!mainCat.subCategories) return null;

                const entriesForMainCat = entriesForType.filter(entry => {
                    const isInCategory = mainCat.subCategories.some(sc => sc && sc.name === entry.category);
                    const isVatEntry = (entry.is_vat_child || entry.is_vat_payment) && mainCat.name === 'IMPÔTS & CONTRIBUTIONS';
                    return isInCategory || isVatEntry;
                });
                
                if (entriesForMainCat.length === 0) return null;
                
                if (!isRowVisibleInPeriods) {
                    return { ...mainCat, entries: entriesForMainCat };
                }

                const visibleEntries = entriesForMainCat.filter(isRowVisibleInPeriods);
                if (visibleEntries.length === 0) return null;
                
                return { ...mainCat, entries: visibleEntries };

            }).filter(Boolean);
        };
        return { entree: groupByType('entree'), sortie: groupByType('sortie') };
    }, [processedEntries, categories, isRowVisibleInPeriods]);
};

export function calculatePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries) {
    if (!periods || periods.length === 0 || !settings) return [];
    
    const today = getTodayInTimezone(settings.timezoneOffset);
    let todayIndex = periods.findIndex(p => today >= p.startDate && today < p.endDate);
    if (todayIndex === -1) {
        if (periods.length > 0 && today < periods[0].startDate) todayIndex = -1;
        else if (periods.length > 0 && today >= periods[periods.length - 1].endDate) todayIndex = periods.length - 1;
    }
    
    const firstPeriodStart = periods[0].startDate;
    const initialBalanceSum = cashAccounts.reduce((sum, acc) => sum + (parseFloat(acc.initialBalance) || 0), 0);
    
    const netFlowBeforeFirstPeriod = actualTransactions
      .flatMap(actual => actual.payments || [])
      .filter(p => new Date(p.paymentDate) < firstPeriodStart)
      .reduce((sum, p) => {
        const actual = actualTransactions.find(a => (a.payments || []).some(payment => payment.id === p.id));
        if (!actual) return sum;
        return actual.type === 'receivable' ? sum + p.paidAmount : sum - p.paidAmount;
      }, 0);
    
    const startingBalance = initialBalanceSum + netFlowBeforeFirstPeriod;

    const positions = [];
    let lastPeriodFinalPosition = startingBalance;
    
    for (let i = 0; i <= todayIndex; i++) {
        if (!periods[i]) continue;
        const period = periods[i];
        const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', allEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
        const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', allEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
        const netActual = revenueTotals.actual - expenseTotals.actual;
        const initialPosition = lastPeriodFinalPosition;
        const finalPosition = initialPosition + netActual;
        positions.push({ initial: initialPosition, final: finalPosition });
        lastPeriodFinalPosition = finalPosition;
    }
    
    if (todayIndex < periods.length - 1) {
        const unpaidStatuses = ['pending', 'partially_paid', 'partially_received'];
        const impayes = actualTransactions.filter(a => new Date(a.date) < today && unpaidStatuses.includes(a.status));
        const netImpayes = impayes.reduce((sum, actual) => {
            const totalPaid = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
            const remaining = actual.amount - totalPaid;
            return actual.type === 'receivable' ? sum + remaining : sum - remaining;
        }, 0);
        lastPeriodFinalPosition += netImpayes;
        
        for (let i = todayIndex + 1; i < periods.length; i++) {
            if (!periods[i]) continue;
            const period = periods[i];
            const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', allEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
            const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', allEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
            const netPlanned = revenueTotals.budget - expenseTotals.budget;
            const initialPosition = lastPeriodFinalPosition;
            const finalPosition = initialPosition + netPlanned;
            positions.push({ initial: initialPosition, final: finalPosition });
            lastPeriodFinalPosition = finalPosition;
        }
    }
    return positions;
}

export const usePeriodPositions = (periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries) => {
    return useMemo(() => 
        calculatePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries), 
        [periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries]
    );
};

export const calculateMainCategoryTotals = (entries, period, actualTransactions) => {
    const budget = entries.reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, period.startDate, period.endDate), 0);
    const actual = entries.reduce((sum, entry) => sum + getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate), 0);
    return { budget, actual };
};

export const calculateOffBudgetTotalsForPeriod = (type, period, entries, actualTransactions) => {
    const offBudgetEntries = entries.filter(e => e.isOffBudget && e.type === type);
    const budget = offBudgetEntries.reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, period.startDate, period.endDate), 0);
    const actual = offBudgetEntries.reduce((sum, entry) => sum + getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate), 0);
    return { budget, actual };
};

export const calculateGeneralTotals = (mainCategories, period, type, allEntriesForCalc, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses) => {
    const totals = mainCategories.reduce((acc, mainCategory) => {
      const categoryTotals = calculateMainCategoryTotals(mainCategory.entries, period, actualTransactions);
      acc.budget += categoryTotals.budget;
      acc.actual += categoryTotals.actual;
      return acc;
    }, { budget: 0, actual: 0 });

    if (type === 'entree' && hasOffBudgetRevenues) {
        const offBudgetTotals = calculateOffBudgetTotalsForPeriod('revenu', period, allEntriesForCalc, actualTransactions);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    } else if (type === 'sortie' && hasOffBudgetExpenses) {
        const offBudgetTotals = calculateOffBudgetTotalsForPeriod('depense', period, allEntriesForCalc, actualTransactions);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    }
    return totals;
};

export const useCashflowChartData = (periods, budgetEntries, actualTransactions, cashAccounts, settings, categories, vatRegimes, activeProjectId, isConsolidated, isCustomConsolidated) => {
    const processedEntries = useProcessedEntries(budgetEntries, categories, vatRegimes, activeProjectId, periods, isConsolidated, isCustomConsolidated);
    
    const isRowVisibleInPeriods = useCallback((entry) => {
        if (!periods || periods.length === 0) return false;
        for (const period of periods) { 
          if (getEntryAmountForPeriod(entry, period.startDate, period.endDate) > 0 || getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate) > 0) return true; 
        } 
        return false;
    }, [periods, actualTransactions]);

    const groupedData = useGroupedData(processedEntries, categories, isRowVisibleInPeriods);
    
    const hasOffBudgetRevenues = useMemo(() => processedEntries.some(e => e.isOffBudget && e.type === 'revenu' && isRowVisibleInPeriods(e)), [processedEntries, isRowVisibleInPeriods]);
    const hasOffBudgetExpenses = useMemo(() => processedEntries.some(e => e.isOffBudget && e.type === 'depense' && isRowVisibleInPeriods(e)), [processedEntries, isRowVisibleInPeriods]);

    return useMemo(() => {
        if (!periods || periods.length === 0 || !settings) {
            return { labels: [], inflows: [], outflows: [], actualBalance: [], projectedBalance: [] };
        }

        const today = getTodayInTimezone(settings.timezoneOffset);
        let todayIndex = periods.findIndex(p => today >= p.startDate && today < p.endDate);
        if (todayIndex === -1) {
            if (periods.length > 0 && today < periods[0].startDate) todayIndex = -1;
            else if (periods.length > 0 && today >= periods[periods.length - 1].endDate) todayIndex = periods.length - 1;
        }

        const periodPositions = calculatePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, processedEntries);

        const periodFlows = periods.map((period, index) => {
            const isPastOrPresent = index <= todayIndex;
            
            const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', processedEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
            const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', processedEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);

            if (isPastOrPresent) {
                return { inflow: revenueTotals.actual, outflow: expenseTotals.actual };
            } else {
                return { inflow: revenueTotals.budget, outflow: expenseTotals.budget };
            }
        });

        const balanceData = periodPositions.map(p => p.final);
        const actualBalance = balanceData.map((val, i) => i <= todayIndex ? val : null);
        const projectedBalance = balanceData.map((val, i) => i >= todayIndex ? val : null);
        
        if (todayIndex >= 0 && todayIndex < balanceData.length) {
            projectedBalance[todayIndex] = actualBalance[todayIndex];
        }

        return {
            labels: periods.map(p => p.label),
            periods,
            inflows: periodFlows.map(f => ({ value: f.inflow })),
            outflows: periodFlows.map(f => ({ value: f.outflow })),
            actualBalance,
            projectedBalance,
        };
    }, [periods, cashAccounts, actualTransactions, settings, processedEntries, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses]);
};

export const useDashboardKpis = (dataState, uiState) => {
    const { actualTransactions } = useActiveProjectData(dataState, uiState);
    const accountBalances = useAccountBalances(dataState.allCashAccounts, dataState.allActuals, uiState.activeProjectId, uiState.activeProjectId === 'consolidated', uiState.activeProjectId?.startsWith('consolidated_view_'), dataState.consolidatedViews);
    const { settings } = dataState;

    return useMemo(() => {
        if (!settings) {
             return { totalActionableBalance: 0, totalOverduePayables: 0, totalOverdueReceivables: 0, overdueItems: [], totalSavings: 0, totalProvisions: 0 };
        }
        const today = getTodayInTimezone(settings.timezoneOffset);
        const overdueItems = actualTransactions
            .filter(actual => {
                const dueDate = new Date(actual.date);
                return ['pending', 'partially_paid', 'partially_received'].includes(actual.status) && dueDate < today;
            })
            .map(actual => {
                const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
                return { ...actual, remainingAmount: actual.amount - totalPaid };
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const totalOverduePayables = overdueItems.filter(i => i.type === 'payable').reduce((sum, i) => sum + i.remainingAmount, 0);
        const totalOverdueReceivables = overdueItems.filter(i => i.type === 'receivable').reduce((sum, i) => sum + i.remainingAmount, 0);

        const totalActionableBalance = accountBalances.filter(acc => ['bank', 'cash', 'mobileMoney'].includes(acc.mainCategoryId)).reduce((sum, acc) => sum + acc.actionableBalance, 0);
        const totalSavings = accountBalances.filter(acc => acc.mainCategoryId === 'savings').reduce((sum, acc) => sum + acc.actionableBalance, 0);
        const totalProvisions = accountBalances.filter(acc => acc.mainCategoryId === 'provisions').reduce((sum, acc) => sum + acc.actionableBalance, 0);

        return { totalActionableBalance, totalOverduePayables, totalOverdueReceivables, overdueItems, totalSavings, totalProvisions };
    }, [actualTransactions, settings, accountBalances]);
};

export const useCurrentMonthBudgetStatus = (dataState, uiState) => {
    const { budgetEntries, actualTransactions } = useActiveProjectData(dataState, uiState);
    const { categories, vatRegimes, settings } = dataState;
    const { activeProjectId } = uiState;
    const isConsolidated = activeProjectId === 'consolidated' || activeProjectId?.startsWith('consolidated_view_');

    const period = useMemo(() => {
        if (!settings) return null;
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { startDate: startOfMonth, endDate: endOfMonth };
    }, [settings]);

    const processedEntries = useProcessedEntries(budgetEntries, categories, vatRegimes, activeProjectId, [period], isConsolidated, isConsolidated);

    return useMemo(() => {
        if (!period) return { totalBudgetedIncome: 0, totalBudgetedExpense: 0, totalActualIncome: 0, totalActualExpense: 0 };
        const { startDate, endDate } = period;

        const totalBudgetedIncome = processedEntries
            .filter(e => e.type === 'revenu')
            .reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, startDate, endDate), 0);
        
        const totalBudgetedExpense = processedEntries
            .filter(e => e.type === 'depense')
            .reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, startDate, endDate), 0);
        
        const totalActualIncome = actualTransactions
            .filter(a => a.type === 'receivable')
            .flatMap(a => a.payments || [])
            .filter(p => {
                const pDate = new Date(p.paymentDate);
                return pDate >= startDate && pDate <= endDate;
            })
            .reduce((sum, p) => sum + p.paidAmount, 0);

        const totalActualExpense = actualTransactions
            .filter(a => a.type === 'payable')
            .flatMap(a => a.payments || [])
            .filter(p => {
                const pDate = new Date(p.paymentDate);
                return pDate >= startDate && pDate <= endDate;
            })
            .reduce((sum, p) => sum + p.paidAmount, 0);

        return {
            totalBudgetedIncome,
            totalBudgetedExpense,
            totalActualIncome,
            totalActualExpense,
        };
    }, [processedEntries, actualTransactions, period]);
};

export const useExpenseDistributionForMonth = (actualTransactions, categories, settings) => {
    return useMemo(() => {
        if (!settings) return [];
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const expensesThisMonth = actualTransactions.filter(actual => 
            actual.type === 'payable' && 
            (actual.payments || []).some(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
            })
        );

        const dataByMainCategory = {};
        const mainCategoryMap = new Map();
        if (categories && categories.expense) {
            categories.expense.forEach(mc => {
                if (mc && mc.subCategories) {
                    mc.subCategories.forEach(sc => {
                        mainCategoryMap.set(sc.name, mc.name);
                    });
                }
            });
        }

        expensesThisMonth.forEach(actual => {
            const mainCategoryName = mainCategoryMap.get(actual.category) || 'Autres';
            const paymentAmount = (actual.payments || []).reduce((sum, p) => {
                const paymentDate = new Date(p.paymentDate);
                return (paymentDate >= startOfMonth && paymentDate <= endOfMonth) ? sum + p.paidAmount : sum;
            }, 0);
            dataByMainCategory[mainCategoryName] = (dataByMainCategory[mainCategoryName] || 0) + paymentAmount;
        });

        return Object.entries(dataByMainCategory)
          .map(([name, value]) => ({ name, value }))
          .filter(item => item.value > 0)
          .sort((a, b) => b.value - a.value);
    }, [actualTransactions, categories.expense, settings]);
};

export const useScheduleData = (actualTransactions, settings) => {
    return useMemo(() => {
        if (!settings) return { transactionsByDate: new Map(), overdueTransactions: [] };
        const byDate = new Map();
        const overdue = [];
        const today = getTodayInTimezone(settings.timezoneOffset);

        (actualTransactions || []).forEach(actual => {
            const dueDate = new Date(actual.date);
            dueDate.setHours(0, 0, 0, 0);

            const isUnsettled = !['paid', 'received', 'written_off'].includes(actual.status);

            if (isUnsettled) {
                const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
                const remainingAmount = actual.amount - totalPaid;

                if (remainingAmount > 0.001) {
                    const transactionForDisplay = { ...actual, amount: remainingAmount };

                    const dateKey = dueDate.toISOString().split('T')[0];
                    if (!byDate.has(dateKey)) {
                        byDate.set(dateKey, []);
                    }
                    byDate.get(dateKey).push(transactionForDisplay);
                    
                    if (dueDate < today) {
                        overdue.push(transactionForDisplay);
                    }
                }
            }
        });
        
        overdue.sort((a, b) => new Date(a.date) - new Date(b.date));

        return { transactionsByDate: byDate, overdueTransactions: overdue };
    }, [actualTransactions, settings]);
};

export const useAccountBalances = (allCashAccounts = {}, allActuals = {}, activeProjectId, isConsolidated, isCustomConsolidated, consolidatedViews = []) => {
    return useMemo(() => {
        let accountsToProcess = [];
        if (isConsolidated) {
            accountsToProcess = Object.values(allCashAccounts).flat();
        } else if (isCustomConsolidated) {
            const viewId = activeProjectId.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (view && view.project_ids) {
                accountsToProcess = view.project_ids.flatMap(id => allCashAccounts[id] || []);
            }
        } else {
            accountsToProcess = allCashAccounts[activeProjectId] || [];
        }

        const allActualsFlat = Object.values(allActuals).flat();

        return accountsToProcess.map(account => {
            let currentBalance = parseFloat(account.initialBalance) || 0;
            const accountPayments = allActualsFlat
                .flatMap(actual => (actual.payments || []).filter(p => p.cashAccount === account.id).map(p => ({ ...p, type: actual.type })));
            
            for (const payment of accountPayments) {
                if (payment.type === 'receivable') {
                    currentBalance += payment.paidAmount;
                } else if (payment.type === 'payable') {
                    currentBalance -= payment.paidAmount;
                }
            }

            const blockedForProvision = allActualsFlat
                .filter(actual => actual.isProvision && actual.provisionDetails?.destinationAccountId === account.id && actual.status !== 'paid')
                .reduce((sum, actual) => {
                    const paidAmount = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
                    return sum + (actual.amount - paidAmount);
                }, 0);

            return {
                ...account,
                balance: currentBalance,
                blockedForProvision: blockedForProvision,
                actionableBalance: currentBalance - blockedForProvision,
            };
        });
    }, [allCashAccounts, allActuals, activeProjectId, isConsolidated, isCustomConsolidated, consolidatedViews]);
};

export const useHeaderMetrics = (dataState, uiState) => {
    const { allActuals = {}, loans = [], settings, projects = [], consolidatedViews = [] } = dataState;
    const { activeProjectId } = uiState;
    const { isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);
    const accountBalances = useAccountBalances(dataState.allCashAccounts, dataState.allActuals, activeProjectId, isConsolidated, isCustomConsolidated, consolidatedViews);

    return useMemo(() => {
        if (!settings) {
            const defaultFormattedCurrency = formatCurrency(0, {});
            return {
                actionableCash: defaultFormattedCurrency,
                savings: defaultFormattedCurrency,
                provisions: defaultFormattedCurrency,
                overduePayables: defaultFormattedCurrency,
                overdueReceivables: defaultFormattedCurrency,
                totalDebts: defaultFormattedCurrency,
                totalCredits: defaultFormattedCurrency,
            };
        }
        const today = getTodayInTimezone(settings.timezoneOffset);
        const unpaidStatuses = ['pending', 'partially_paid', 'partially_received'];

        let actualsToConsider = [];
        if (isConsolidated) {
            actualsToConsider = Object.values(allActuals).flat();
        } else if (isCustomConsolidated) {
            const viewId = activeProjectId.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (view && view.project_ids) {
                actualsToConsider = view.project_ids.flatMap(id => allActuals[id] || []);
            }
        } else {
            actualsToConsider = allActuals[activeProjectId] || [];
        }

        const overduePayables = actualsToConsider
            .filter(a => a.type === 'payable' && unpaidStatuses.includes(a.status) && new Date(a.date) < today)
            .reduce((sum, a) => sum + (a.amount - (a.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0)), 0);

        const overdueReceivables = actualsToConsider
            .filter(a => a.type === 'receivable' && unpaidStatuses.includes(a.status) && new Date(a.date) < today)
            .reduce((sum, a) => sum + (a.amount - (a.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0)), 0);
        
        const savings = accountBalances.filter(acc => acc.mainCategoryId === 'savings').reduce((sum, acc) => sum + acc.actionableBalance, 0);
        const provisions = accountBalances.filter(acc => acc.mainCategoryId === 'provisions').reduce((sum, acc) => sum + acc.actionableBalance, 0);
        
        const actionableCash = accountBalances.filter(acc => ['bank', 'cash', 'mobileMoney'].includes(acc.mainCategoryId)).reduce((sum, acc) => sum + acc.actionableBalance, 0);

        const totalDebts = loans.filter(l => l.type === 'borrowing').reduce((sum, l) => sum + l.principal, 0);
        const totalCredits = loans.filter(l => l.type === 'loan').reduce((sum, l) => sum + l.principal, 0);

        return {
            actionableCash: formatCurrency(actionableCash, settings),
            savings: formatCurrency(savings, settings),
            provisions: formatCurrency(provisions, settings),
            overduePayables: formatCurrency(overduePayables, settings),
            overdueReceivables: formatCurrency(overdueReceivables, settings),
            totalDebts: formatCurrency(totalDebts, settings),
            totalCredits: formatCurrency(totalCredits, settings),
        };
    }, [accountBalances, allActuals, loans, settings, activeProjectId, isConsolidated, isCustomConsolidated, consolidatedViews]);
};

export const useTrezoScore = (dataState, uiState) => {
    const { loans = [], categories } = dataState;
    const { budgetEntries, actualTransactions, cashAccounts } = useActiveProjectData(dataState, uiState);
    const accountBalances = useAccountBalances(dataState.allCashAccounts, dataState.allActuals, uiState.activeProjectId, uiState.activeProjectId === 'consolidated', uiState.activeProjectId?.startsWith('consolidated_view_'), dataState.consolidatedViews);

    return useMemo(() => {
        const today = new Date();
        const sixMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 6));

        const recentActuals = actualTransactions.filter(a => (a.payments || []).some(p => new Date(p.paymentDate) >= sixMonthsAgo));

        const monthlyMetrics = Array.from({ length: 6 }).map((_, i) => {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStart = new Date(monthDate);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

            const monthlyIncome = recentActuals
                .filter(a => a.type === 'receivable')
                .flatMap(a => a.payments || [])
                .filter(p => {
                    const pDate = new Date(p.paymentDate);
                    return pDate >= monthStart && pDate <= monthEnd;
                })
                .reduce((sum, p) => sum + p.paidAmount, 0);

            const monthlyCriticalExpenses = recentActuals
                .filter(a => {
                    if (!categories || !categories.expense) return false;
                    const mainCat = categories.expense.find(mc => mc.subCategories && mc.subCategories.some(sc => sc.name === a.category));
                    const subCat = mainCat?.subCategories.find(sc => sc.name === a.category);
                    return a.type === 'payable' && subCat?.criticality === 'critical';
                })
                .flatMap(a => a.payments || [])
                .filter(p => {
                    const pDate = new Date(p.paymentDate);
                    return pDate >= monthStart && pDate <= monthEnd;
                })
                .reduce((sum, p) => sum + p.paidAmount, 0);

            const monthlyTotalExpenses = recentActuals
                .filter(a => a.type === 'payable')
                .flatMap(a => a.payments || [])
                .filter(p => {
                    const pDate = new Date(p.paymentDate);
                    return pDate >= monthStart && pDate <= monthEnd;
                })
                .reduce((sum, p) => sum + p.paidAmount, 0);

            return { monthlyIncome, monthlyCriticalExpenses, monthlyTotalExpenses };
        });

        const avgMonthlyIncome = monthlyMetrics.reduce((sum, m) => sum + m.monthlyIncome, 0) / 6;
        const avgMonthlyCriticalExpenses = monthlyMetrics.reduce((sum, m) => sum + m.monthlyCriticalExpenses, 0) / 6;
        const avgMonthlyTotalExpenses = monthlyMetrics.reduce((sum, m) => sum + m.monthlyTotalExpenses, 0) / 6;

        // Pillar 1: Critical Expenses Coverage
        let coverageScore = 0;
        let coverageText = '';
        if (avgMonthlyCriticalExpenses > 0) {
            const margin = (avgMonthlyIncome - avgMonthlyCriticalExpenses) / avgMonthlyCriticalExpenses;
            coverageText = `Marge de ${ (margin * 100).toFixed(0) }%`;
            if (margin > 0.5) coverageScore = 30;
            else if (margin > 0.25) coverageScore = 24;
            else if (margin > 0) coverageScore = 18;
            else if (margin > -0.1) coverageScore = 12;
            else coverageScore = 6;
        } else if (avgMonthlyIncome > 0) {
            coverageScore = 30; // No critical expenses, excellent coverage
            coverageText = 'Aucune dépense critique';
        }

        // Pillar 2: Resource Stability (simplified)
        const incomeSources = new Set(recentActuals.filter(a => a.type === 'receivable').map(a => a.thirdParty));
        const recurringIncomeEntries = budgetEntries.filter(e => e.type === 'revenu' && e.frequency !== 'ponctuel' && e.frequency !== 'irregulier');
        let stabilityScore = 5;
        if (recurringIncomeEntries.length > 0) stabilityScore = 20;
        if (incomeSources.size > 2) stabilityScore = Math.min(25, stabilityScore + 5);
        if (incomeSources.size <= 1 && recurringIncomeEntries.length === 0) stabilityScore = 10;

        // Pillar 3: Expense Management
        let expenseMgmtScore = 4;
        let savingsRateText = '';
        if (avgMonthlyIncome > 0) {
            const savingsRate = (avgMonthlyIncome - avgMonthlyTotalExpenses) / avgMonthlyIncome;
            savingsRateText = `Taux d'épargne de ${(savingsRate * 100).toFixed(0)}%`;
            if (savingsRate > 0.2) expenseMgmtScore = 20;
            else if (savingsRate > 0.1) expenseMgmtScore = 16;
            else if (savingsRate > 0.05) expenseMgmtScore = 12;
            else if (savingsRate > 0) expenseMgmtScore = 8;
        }

        // Pillar 4: Emergency Savings
        const availableSavings = accountBalances.filter(acc => acc.mainCategoryId === 'savings').reduce((sum, acc) => sum + acc.actionableBalance, 0);
        let autonomyScore = 3;
        let autonomyText = '';
        if (avgMonthlyCriticalExpenses > 0) {
            const autonomyMonths = availableSavings / avgMonthlyCriticalExpenses;
            autonomyText = `Autonomie de ${autonomyMonths.toFixed(1)} mois`;
            if (autonomyMonths > 6) autonomyScore = 15;
            else if (autonomyMonths > 3) autonomyScore = 12;
            else if (autonomyMonths > 1) autonomyScore = 9;
            else if (autonomyMonths > 0.5) autonomyScore = 6;
        } else if (availableSavings > 0) {
            autonomyScore = 15; // No critical expenses, infinite autonomy
            autonomyText = 'Autonomie infinie';
        }

        // Pillar 5: Debt
        const monthlyLoanRepayments = loans.filter(l => l.type === 'borrowing').reduce((sum, l) => sum + l.monthlyPayment, 0);
        let debtScore = 10;
        if (avgMonthlyIncome > 0) {
            const debtRatio = monthlyLoanRepayments / avgMonthlyIncome;
            if (debtRatio > 0.6) debtScore = 2;
            else if (debtRatio > 0.45) debtScore = 4;
            else if (debtRatio > 0.3) debtScore = 6;
            else if (debtRatio > 0.15) debtScore = 8;
        }

        const totalScore = Math.round(coverageScore + stabilityScore + expenseMgmtScore + autonomyScore + debtScore);

        let evaluation, color, recommendations = [], strengths = [], weaknesses = [];
        if (totalScore >= 90) { 
            evaluation = 'Excellente'; 
            color = 'blue';
            recommendations.push("Votre situation est très saine. Pensez à investir votre épargne excédentaire."); 
        } else if (totalScore >= 70) { 
            evaluation = 'Bonne'; 
            color = 'green';
            recommendations.push("Votre gestion est solide. Surveillez la stabilité de vos revenus."); 
        } else if (totalScore >= 50) { 
            evaluation = 'Correcte'; 
            color = 'yellow';
            recommendations.push("Attention aux imprévus. Renforcez votre épargne de précaution."); 
        } else if (totalScore >= 30) { 
            evaluation = 'Fragile'; 
            color = 'orange';
            recommendations.push("Situation tendue. Concentrez-vous sur la réduction des dépenses non essentielles."); 
        } else { 
            evaluation = 'Critique'; 
            color = 'red';
            recommendations.push("Danger immédiat. Consultez un conseiller financier rapidement."); 
        }

        // Populate strengths and weaknesses
        if (coverageScore >= 24) strengths.push({ pillar: 'Couverture des Dépenses Critiques', text: `Dépenses critiques bien couvertes (${coverageText})` }); else weaknesses.push({ pillar: 'Couverture des Dépenses Critiques', text: `Marge de sécurité faible (${coverageText})` });
        if (stabilityScore >= 20) strengths.push({ pillar: 'Stabilité des Ressources', text: 'Revenus stables' }); else weaknesses.push({ pillar: 'Stabilité des Ressources', text: 'Revenus variables à surveiller' });
        if (expenseMgmtScore >= 16) strengths.push({ pillar: 'Maîtrise des Dépenses', text: `Taux d'épargne satisfaisant (${savingsRateText})` }); else weaknesses.push({ pillar: 'Maîtrise des Dépenses', text: `Épargne à améliorer (${savingsRateText})` });
        if (autonomyScore >= 12) strengths.push({ pillar: 'Épargne de Précaution', text: `Bonne épargne de précaution (${autonomyText})` }); else weaknesses.push({ pillar: 'Épargne de Précaution', text: `Épargne de précaution faible (${autonomyText})` });
        if (debtScore >= 8) strengths.push({ pillar: 'Endettement & Engagements', text: 'Endettement maîtrisé' }); else weaknesses.push({ pillar: 'Endettement & Engagements', text: 'Endettement à surveiller' });

        return { score: totalScore, evaluation, color, strengths, weaknesses, recommendations };

    }, [budgetEntries, actualTransactions, cashAccounts, categories, loans, accountBalances]);
};
