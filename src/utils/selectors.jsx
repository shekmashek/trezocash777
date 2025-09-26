import { useMemo } from 'react';
import { expandVatEntries, generateVatPaymentEntries, getEntryAmountForPeriod, getActualAmountForPeriod, getTodayInTimezone } from './budgetCalculations';

export const useActiveProjectData = (dataState, uiState) => {
    const { allEntries, allActuals, allCashAccounts, projects, consolidatedViews } = dataState;
    const { activeProjectId } = uiState;

    return useMemo(() => {
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
            activeProject = { id: 'consolidated', name: 'Projet consolidé', currency: dataState.settings.currency };
        } else if (isCustomConsolidated) {
            const viewId = activeProjectId.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (view && view.project_ids) {
                budgetEntries = view.project_ids.flatMap(id => allEntries[id] || []);
                actualTransactions = view.project_ids.flatMap(id => allActuals[id] || []);
                cashAccounts = view.project_ids.flatMap(id => allCashAccounts[id] || []);
            }
            activeProject = { id: activeProjectId, name: view?.name || 'Vue Inconnue', currency: dataState.settings.currency };
        } else {
            activeProject = projects.find(p => p.id === activeProjectId);
            if (activeProject) {
                budgetEntries = allEntries[activeProjectId] || [];
                actualTransactions = allActuals[activeProjectId] || [];
                cashAccounts = allCashAccounts[activeProjectId] || [];
            }
        }

        return { budgetEntries, actualTransactions, cashAccounts, activeProject, isConsolidated, isCustomConsolidated };
    }, [activeProjectId, allEntries, allActuals, allCashAccounts, projects, consolidatedViews, dataState.settings.currency]);
};

export const useProcessedEntries = (budgetEntries, categories, vatRegimes, activeProjectId, periods, isConsolidated, isCustomConsolidated) => {
    return useMemo(() => {
        const expanded = expandVatEntries(budgetEntries, categories);
        const vatRegime = vatRegimes[activeProjectId];

        if (isConsolidated || isCustomConsolidated || !vatRegime) {
            return expanded;
        }

        const dynamicVatEntries = periods.flatMap(period => generateVatPaymentEntries(expanded, period, vatRegime));
        
        return [...expanded, ...dynamicVatEntries];
    }, [budgetEntries, categories, vatRegimes, activeProjectId, periods, isConsolidated, isCustomConsolidated]);
};

export const useGroupedData = (processedEntries, categories, isRowVisibleInPeriods) => {
    return useMemo(() => {
        const entriesToGroup = processedEntries.filter(e => !e.isOffBudget);
        const groupByType = (type) => {
            const catType = type === 'entree' ? 'revenue' : 'expense';
            if (!categories || !categories[catType]) return [];
            
            return categories[catType].map(mainCat => {
                const entriesForMainCat = entriesToGroup.filter(entry => {
                    const isInCategory = mainCat.subCategories.some(sc => sc.name === entry.category);
                    const isVatEntry = (entry.is_vat_child || entry.is_vat_payment) && mainCat.name === 'Impôts et Taxes';
                    return (isInCategory || isVatEntry) && isRowVisibleInPeriods(entry);
                });
                return entriesForMainCat.length > 0 ? { ...mainCat, entries: entriesForMainCat } : null;
            }).filter(Boolean);
        };
        return { entree: groupByType('entree'), sortie: groupByType('sortie') };
    }, [processedEntries, categories, isRowVisibleInPeriods]);
};

export const calculatePeriodPositions = (periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries) => {
    if (periods.length === 0) return [];
    
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

    const calculateOffBudgetTotalsForPeriod = (type, period, entries) => {
        const offBudgetEntries = entries.filter(e => e.isOffBudget && e.type === type);
        const budget = offBudgetEntries.reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, period.startDate, period.endDate), 0);
        return { budget };
    };

    const calculateMainCategoryTotals = (entries, period) => {
        const budget = entries.reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, period.startDate, period.endDate), 0);
        return { budget };
    };

    const calculateGeneralTotals = (mainCategories, period, type, allEntriesForCalc) => {
        const totals = mainCategories.reduce((acc, mainCategory) => {
          const categoryTotals = calculateMainCategoryTotals(mainCategory.entries, period);
          acc.budget += categoryTotals.budget;
          return acc;
        }, { budget: 0 });
        if (type === 'entree' && hasOffBudgetRevenues) {
            totals.budget += calculateOffBudgetTotalsForPeriod('revenu', period, allEntriesForCalc).budget;
        } else if (type === 'sortie' && hasOffBudgetExpenses) {
            totals.budget += calculateOffBudgetTotalsForPeriod('depense', period, allEntriesForCalc).budget;
        }
        return totals;
    };

    const positions = [];
    let lastPeriodFinalPosition = startingBalance;
    
    for (let i = 0; i <= todayIndex; i++) {
        if (!periods[i]) continue;
        const period = periods[i];
        const netActual = actualTransactions.reduce((sum, actual) => {
            const paymentInPeriod = (actual.payments || []).filter(p => new Date(p.paymentDate) >= period.startDate && new Date(p.paymentDate) < period.endDate).reduce((pSum, p) => pSum + p.paidAmount, 0);
            return actual.type === 'receivable' ? sum + paymentInPeriod : sum - paymentInPeriod;
        }, 0);
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
            const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', allEntries);
            const expenseTotals = calculateGeneralTotals(groupedData.sortie || [], period, 'sortie', allEntries);
            const netPlanned = revenueTotals.budget - expenseTotals.budget;
            const initialPosition = lastPeriodFinalPosition;
            const finalPosition = initialPosition + netPlanned;
            positions.push({ initial: initialPosition, final: finalPosition });
            lastPeriodFinalPosition = finalPosition;
        }
    }
    return positions;
};

export const usePeriodPositions = (periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries) => {
    return useMemo(() => 
        calculatePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries), 
        [periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries]
    );
};
