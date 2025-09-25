import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PieChart, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, ArrowLeft, Folder, User, ChevronDown } from 'lucide-react';
import { useBudget } from '../context/BudgetContext';
import { formatCurrency } from '../utils/formatting';
import ReactECharts from 'echarts-for-react';
import EmptyState from './EmptyState';
import { getTodayInTimezone, getEntryAmountForPeriod } from '../utils/budgetCalculations';
import { useTranslation } from '../utils/i18n';
import { motion, AnimatePresence } from 'framer-motion';

const ExpenseAnalysisView = ({ isFocusMode = false, rangeStart: rangeStartProp, rangeEnd: rangeEndProp, analysisType: analysisTypeProp, analysisMode: analysisModeProp, setAnalysisMode: setAnalysisModeProp }) => {
  const { state, dispatch } = useBudget();
  const { activeProjectId, projects, categories, allActuals, settings, allEntries, consolidatedViews } = state;
  const { t } = useTranslation();

  const [localTimeUnit, setLocalTimeUnit] = useState('month');
  const [localHorizonLength, setLocalHorizonLength] = useState(1);
  const [localPeriodOffset, setLocalPeriodOffset] = useState(0);
  const [localActiveQuickSelect, setLocalActiveQuickSelect] = useState('month');
  const [localAnalysisType, setLocalAnalysisType] = useState('expense');
  const [localAnalysisMode, setLocalAnalysisMode] = useState('category');
  
  const [drillDownState, setDrillDownState] = useState({
    level: 0, // 0: main, 1: sub-category, 2: supplier
    mainCategoryName: null,
    subCategoryName: null,
    dataType: null, // 'budget' or 'actual'
    color: null,
  });

  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef(null);
  const [isAnalysisTypeMenuOpen, setIsAnalysisTypeMenuOpen] = useState(false);
  const analysisTypeMenuRef = useRef(null);
  const [isAnalysisModeMenuOpen, setIsAnalysisModeMenuOpen] = useState(false);
  const analysisModeMenuRef = useRef(null);

  const analysisType = isFocusMode ? analysisTypeProp : localAnalysisType;
  const analysisMode = isFocusMode ? analysisModeProp : localAnalysisMode;
  const setAnalysisMode = isFocusMode ? setAnalysisModeProp : setLocalAnalysisMode;

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (periodMenuRef.current && !periodMenuRef.current.contains(event.target)) {
            setIsPeriodMenuOpen(false);
        }
        if (analysisTypeMenuRef.current && !analysisTypeMenuRef.current.contains(event.target)) {
            setIsAnalysisTypeMenuOpen(false);
        }
        if (analysisModeMenuRef.current && !analysisModeMenuRef.current.contains(event.target)) {
            setIsAnalysisModeMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (drillDownState.level > 0) {
        setDrillDownState({
            level: 0,
            mainCategoryName: null,
            subCategoryName: null,
            dataType: null,
            color: null,
        });
    }
  }, [analysisMode]);

  useEffect(() => {
    if (!rangeStartProp) {
        setLocalTimeUnit('month');
        setLocalHorizonLength(1);
        setLocalPeriodOffset(0);
        setLocalActiveQuickSelect('month');
    }
  }, [settings.timezoneOffset, rangeStartProp]);

  const isConsolidated = activeProjectId === 'consolidated';
  const isCustomConsolidated = String (activeProjectId)?.startsWith('consolidated_view_');

  const handlePeriodChange = (direction) => {
    setLocalPeriodOffset(prev => prev + direction);
    setLocalActiveQuickSelect(null);
  };

  const handleQuickPeriodSelect = (quickSelectType) => {
    let payload;
    switch (quickSelectType) {
      case 'month':
        payload = { timeUnit: 'month', periodOffset: 0 };
        break;
      case 'bimester':
        payload = { timeUnit: 'bimonthly', periodOffset: 0 };
        break;
      case 'quarter':
        payload = { timeUnit: 'quarterly', periodOffset: 0 };
        break;
      case 'semester':
        payload = { timeUnit: 'semiannually', periodOffset: 0 };
        break;
      case 'year':
        payload = { timeUnit: 'annually', periodOffset: 0 };
        break;
      default: return;
    }
    setLocalTimeUnit(payload.timeUnit);
    setLocalHorizonLength(1);
    setLocalPeriodOffset(payload.periodOffset);
    setLocalActiveQuickSelect(quickSelectType);
  };

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (rangeStartProp && rangeEndProp) {
        return { rangeStart: rangeStartProp, rangeEnd: rangeEndProp };
    }
    const today = getTodayInTimezone(settings.timezoneOffset);
    let baseDate;
    switch (localTimeUnit) {
        case 'month': baseDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
        case 'bimonthly': const bimonthStartMonth = Math.floor(today.getMonth() / 2) * 2; baseDate = new Date(today.getFullYear(), bimonthStartMonth, 1); break;
        case 'quarterly': const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3; baseDate = new Date(today.getFullYear(), quarterStartMonth, 1); break;
        case 'semiannually': const semiAnnualStartMonth = Math.floor(today.getMonth() / 6) * 6; baseDate = new Date(today.getFullYear(), semiAnnualStartMonth, 1); break;
        case 'annually': baseDate = new Date(today.getFullYear(), 0, 1); break;
        default: baseDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    const periodList = [];
    for (let i = 0; i < localHorizonLength; i++) {
        const periodIndex = i + localPeriodOffset;
        const periodStart = new Date(baseDate);
        switch (localTimeUnit) {
            case 'month': periodStart.setMonth(periodStart.getMonth() + periodIndex); break;
            case 'bimonthly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 2); break;
            case 'quarterly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 3); break;
            case 'semiannually': periodStart.setMonth(periodStart.getMonth() + periodIndex * 6); break;
            case 'annually': periodStart.setFullYear(periodStart.getFullYear() + periodIndex); break;
        }
        periodList.push(periodStart);
    }
    if (periodList.length === 0) return { rangeStart: null, rangeEnd: null };
    const firstPeriodStart = periodList[0];
    const lastPeriodStart = periodList[periodList.length - 1];
    const lastPeriodEnd = new Date(lastPeriodStart);
    switch (localTimeUnit) {
        case 'month': lastPeriodEnd.setMonth(lastPeriodEnd.getMonth() + 1); break;
        case 'bimonthly': lastPeriodEnd.setMonth(lastPeriodEnd.getMonth() + 2); break;
        case 'quarterly': lastPeriodEnd.setMonth(lastPeriodEnd.getMonth() + 3); break;
        case 'semiannually': lastPeriodEnd.setMonth(lastPeriodEnd.getMonth() + 6); break;
        case 'annually': lastPeriodEnd.setFullYear(lastPeriodEnd.getFullYear() + 1); break;
    }
    return { rangeStart: firstPeriodStart, rangeEnd: lastPeriodEnd };
  }, [rangeStartProp, rangeEndProp, localTimeUnit, localHorizonLength, localPeriodOffset, settings.timezoneOffset]);
  
  const analysisPeriodName = useMemo(() => {
    if (!rangeStart) return '';

    const year = rangeStart.getFullYear();
    const month = rangeStart.getMonth();

    switch (localTimeUnit) {
        case 'month':
            return rangeStart.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        case 'bimonthly':
            const startMonthB = rangeStart.toLocaleString('fr-FR', { month: 'short' });
            const endMonthB = new Date(year, month + 1, 1).toLocaleString('fr-FR', { month: 'short' });
            return `Bimestre ${startMonthB}-${endMonthB} ${year}`;
        case 'quarterly':
            const quarter = Math.floor(month / 3) + 1;
            return `Trimestre ${quarter} ${year}`;
        case 'semiannually':
            const semester = Math.floor(month / 6) + 1;
            return `Semestre ${semester} ${year}`;
        case 'annually':
            return `Année ${year}`;
        default:
            return '';
    }
  }, [rangeStart, localTimeUnit]);

  const projectActuals = useMemo(() => {
    if (!rangeStart || !rangeEnd) return [];
    
    let relevant;
    if (isConsolidated) {
        relevant = Object.values(allActuals).flat();
    } else if (isCustomConsolidated) {
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        if (!view || !view.project_ids) return [];
        relevant = view.project_ids.flatMap(projectId => allActuals[projectId] || []);
    } else {
        relevant = allActuals[activeProjectId] || [];
    }
    
    return relevant.filter(actual => 
        actual.type === (analysisType === 'expense' ? 'payable' : 'receivable') && 
        (actual.payments || []).some(p => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate >= rangeStart && paymentDate < rangeEnd;
        })
    );
  }, [isConsolidated, isCustomConsolidated, consolidatedViews, allActuals, activeProjectId, rangeStart, rangeEnd, analysisType]);

  const projectEntries = useMemo(() => {
    let relevant;
    if (isConsolidated) {
        relevant = Object.values(allEntries).flat();
    } else if (isCustomConsolidated) {
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        if (!view || !view.project_ids) return [];
        relevant = view.project_ids.flatMap(projectId => allEntries[projectId] || []);
    } else {
        relevant = allEntries[activeProjectId] || [];
    }
    return relevant.filter(e => e.type === (analysisType === 'expense' ? 'depense' : 'revenu'));
  }, [isConsolidated, isCustomConsolidated, consolidatedViews, allEntries, activeProjectId, analysisType]);

  const categoryAnalysisData = useMemo(() => {
    if (!rangeStart || !rangeEnd) {
        return { categories: [], budgetData: [], actualData: [], totalBudget: 0, totalActual: 0 };
    }

    const mainCategories = analysisType === 'expense' ? categories.expense : categories.revenue;
    
    const data = mainCategories.map(mainCat => {
        const budgetAmount = projectEntries
            .filter(entry => mainCat.subCategories.some(sc => sc.name === entry.category))
            .reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, rangeStart, rangeEnd), 0);

        const actualAmount = projectActuals
            .filter(actual => mainCat.subCategories.some(sc => sc.name === actual.category))
            .reduce((sum, actual) => {
                const paymentsInPeriod = (actual.payments || []).filter(p => {
                    const paymentDate = new Date(p.paymentDate);
                    return paymentDate >= rangeStart && paymentDate < rangeEnd;
                });
                return sum + paymentsInPeriod.reduce((pSum, p) => pSum + p.paidAmount, 0);
            }, 0);

        return { name: mainCat.name, budget: budgetAmount, actual: actualAmount };
    }).filter(item => item.budget > 0 || item.actual > 0);

    data.sort((a, b) => b.actual - a.actual);

    const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
    const totalActual = data.reduce((sum, item) => sum + item.actual, 0);

    return { 
        categories: data.map(item => item.name), 
        budgetData: data.map(item => item.budget), 
        actualData: data.map(item => item.actual), 
        totalBudget, 
        totalActual 
    };
  }, [categories.expense, categories.revenue, projectActuals, projectEntries, rangeStart, rangeEnd, analysisType]);

  const subCategoryDrillDownData = useMemo(() => {
    if (drillDownState.level < 1) {
        return { labels: [], data: [], total: 0 };
    }

    const mainCategories = analysisType === 'expense' ? categories.expense : categories.revenue;
    const mainCat = mainCategories.find(mc => mc.name === drillDownState.mainCategoryName);

    if (!mainCat || !mainCat.subCategories) {
        return { labels: [], data: [], total: 0 };
    }

    const subCategoryData = mainCat.subCategories.map(subCat => {
        let amount = 0;
        if (drillDownState.dataType === 'actual') {
            amount = projectActuals
                .filter(actual => actual.category === subCat.name)
                .reduce((sum, actual) => {
                    const paymentsInPeriod = (actual.payments || []).filter(p => {
                        const paymentDate = new Date(p.paymentDate);
                        return paymentDate >= rangeStart && paymentDate < rangeEnd;
                    });
                    return sum + paymentsInPeriod.reduce((pSum, p) => pSum + p.paidAmount, 0);
                }, 0);
        } else { // 'budget'
            amount = projectEntries
                .filter(entry => entry.category === subCat.name)
                .reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, rangeStart, rangeEnd), 0);
        }
        return { name: subCat.name, value: amount };
    }).filter(item => item.value > 0);
    
    subCategoryData.sort((a, b) => b.value - a.value);

    const total = subCategoryData.reduce((sum, item) => sum + item.value, 0);

    return {
        labels: subCategoryData.map(item => item.name),
        data: subCategoryData,
        total,
    };
  }, [drillDownState, categories, projectActuals, projectEntries, rangeStart, rangeEnd, analysisType]);

  const supplierDrillDownData = useMemo(() => {
    if (drillDownState.level !== 2) {
        return { labels: [], data: [], total: 0 };
    }

    const { subCategoryName, dataType } = drillDownState;
    const supplierData = new Map();

    if (dataType === 'actual') {
        projectActuals
            .filter(actual => actual.category === subCategoryName)
            .forEach(actual => {
                const paymentsInPeriod = (actual.payments || []).filter(p => {
                    const paymentDate = new Date(p.paymentDate);
                    return paymentDate >= rangeStart && paymentDate < rangeEnd;
                });
                const totalPaidInPeriod = paymentsInPeriod.reduce((pSum, p) => pSum + p.paidAmount, 0);

                if (totalPaidInPeriod > 0) {
                    const currentAmount = supplierData.get(actual.thirdParty) || 0;
                    supplierData.set(actual.thirdParty, currentAmount + totalPaidInPeriod);
                }
            });
    } else { // 'budget'
        projectEntries
            .filter(entry => entry.category === subCategoryName)
            .forEach(entry => {
                const amount = getEntryAmountForPeriod(entry, rangeStart, rangeEnd);
                if (amount > 0) {
                    const currentAmount = supplierData.get(entry.supplier) || 0;
                    supplierData.set(entry.supplier, currentAmount + amount);
                }
            });
    }

    const formattedData = Array.from(supplierData.entries())
        .map(([name, value]) => ({ name, value }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);

    const total = formattedData.reduce((sum, item) => sum + item.value, 0);

    return {
        labels: formattedData.map(item => item.name),
        data: formattedData,
        total,
    };
  }, [drillDownState, projectActuals, projectEntries, rangeStart, rangeEnd]);

  const projectAnalysisData = useMemo(() => {
    if ((!isConsolidated && !isCustomConsolidated) || !rangeStart || !rangeEnd) {
      return { projects: [], budgetData: [], actualData: [], totalBudget: 0, totalActual: 0 };
    }
  
    let projectsToAnalyze = [];
    if (isConsolidated) {
        projectsToAnalyze = projects.filter(p => !p.isArchived);
    } else { // isCustomConsolidated
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        if (!view || !view.project_ids) return { projects: [], budgetData: [], actualData: [], totalBudget: 0, totalActual: 0 };
        projectsToAnalyze = projects.filter(p => view.project_ids.includes(p.id) && !p.isArchived);
    }

    const projectData = projectsToAnalyze
      .map(project => {
        const projectEntries = allEntries[project.id] || [];
        const projectActuals = allActuals[project.id] || [];
  
        const budgetAmount = projectEntries
          .filter(e => e.type === (analysisType === 'expense' ? 'depense' : 'revenu'))
          .reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, rangeStart, rangeEnd), 0);
  
        const actualAmount = projectActuals
          .filter(actual => actual.type === (analysisType === 'expense' ? 'payable' : 'receivable'))
          .reduce((sum, actual) => {
            const paymentsInPeriod = (actual.payments || []).filter(p => {
              const paymentDate = new Date(p.paymentDate);
              return paymentDate >= rangeStart && paymentDate < rangeEnd;
            });
            return sum + paymentsInPeriod.reduce((pSum, p) => pSum + p.paidAmount, 0);
          }, 0);
  
        return { name: project.name, budget: budgetAmount, actual: actualAmount };
      })
      .filter(p => p.budget > 0 || p.actual > 0);

    projectData.sort((a, b) => b.actual - a.actual);
  
    const totalBudget = projectData.reduce((sum, p) => sum + p.budget, 0);
    const totalActual = projectData.reduce((sum, p) => sum + p.actual, 0);
  
    return {
      projects: projectData.map(p => p.name),
      budgetData: projectData.map(p => p.budget),
      actualData: projectData.map(p => p.actual),
      totalBudget,
      totalActual,
    };
  }, [projects, allEntries, allActuals, rangeStart, rangeEnd, analysisType, isConsolidated, isCustomConsolidated, consolidatedViews, activeProjectId]);

  const tierAnalysisData = useMemo(() => {
    if (!rangeStart || !rangeEnd) {
      return { tiers: [], budgetData: [], actualData: [], totalBudget: 0, totalActual: 0 };
    }
  
    const tierBudgetMap = new Map();
    const tierActualMap = new Map();
  
    projectEntries.forEach(entry => {
      const amount = getEntryAmountForPeriod(entry, rangeStart, rangeEnd);
      if (amount > 0) {
        tierBudgetMap.set(entry.supplier, (tierBudgetMap.get(entry.supplier) || 0) + amount);
      }
    });
  
    projectActuals.forEach(actual => {
      const actualAmount = (actual.payments || []).filter(p => {
        const paymentDate = new Date(p.paymentDate);
        return paymentDate >= rangeStart && paymentDate < rangeEnd;
      }).reduce((sum, p) => sum + p.paidAmount, 0);
  
      if (actualAmount > 0) {
        tierActualMap.set(actual.thirdParty, (tierActualMap.get(actual.thirdParty) || 0) + actualAmount);
      }
    });
  
    const allTiers = new Set([...tierBudgetMap.keys(), ...tierActualMap.keys()]);
    
    const tierData = Array.from(allTiers)
      .map(tier => ({
        name: tier,
        budget: tierBudgetMap.get(tier) || 0,
        actual: tierActualMap.get(tier) || 0,
      }))
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 10);
  
    const totalBudget = tierData.reduce((sum, p) => sum + p.budget, 0);
    const totalActual = tierData.reduce((sum, p) => sum + p.actual, 0);
  
    return {
      tiers: tierData.map(p => p.name),
      budgetData: tierData.map(p => p.budget),
      actualData: tierData.map(p => p.actual),
      totalBudget,
      totalActual,
    };
  }, [projectEntries, projectActuals, rangeStart, rangeEnd]);

  const handleBack = () => {
    if (drillDownState.level === 2) {
        setDrillDownState(prev => ({
            ...prev,
            level: 1,
            subCategoryName: null,
        }));
    } else if (drillDownState.level === 1) {
        setDrillDownState({
            level: 0,
            mainCategoryName: null,
            subCategoryName: null,
            dataType: null,
            color: null,
        });
    }
  };

  const onChartClick = (params) => {
    if (params.componentType !== 'series' || analysisMode !== 'category') return;

    if (drillDownState.level === 0) {
        setDrillDownState({
            level: 1,
            mainCategoryName: params.name,
            subCategoryName: null,
            dataType: params.seriesName.toLowerCase().startsWith('budget') ? 'budget' : 'actual',
            color: params.color,
        });
    } else if (drillDownState.level === 1) {
        setDrillDownState(prev => ({
            ...prev,
            level: 2,
            subCategoryName: params.name,
        }));
    }
  };

  const onEvents = {
      'click': onChartClick,
  };

  const getChartOptions = () => {
    const { categories, budgetData, actualData, totalBudget, totalActual } = categoryAnalysisData;
    
    const chartColors = analysisType === 'expense'
      ? { budget: '#fca5a5', actual: '#ef4444', budgetLabel: '#b91c1c', actualLabel: '#7f1d1d' }
      : { budget: '#6ee7b7', actual: '#10b981', budgetLabel: '#047857', actualLabel: '#065f46' };

    if (categories.length === 0) {
        return {
            title: { text: 'Aucune donnée à analyser', left: 'center', top: 'center' },
            series: []
        };
    }

    return {
        title: { text: 'Analyse par Catégorie', left: 'center', top: 0, textStyle: { fontSize: 16, fontWeight: '600', color: '#475569' } },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                let tooltip = `<strong>${params[0].name}</strong><br/>`;
                params.slice().reverse().forEach(param => {
                    const seriesName = param.seriesName;
                    const total = seriesName.startsWith('Budget') ? totalBudget : totalActual;
                    const percentage = total > 0 ? (param.value / total) * 100 : 0;
                    tooltip += `${param.marker} ${seriesName.split(':')[0]}: <strong>${formatCurrency(param.value, settings)}</strong> (${percentage.toFixed(1)}%)<br/>`;
                });
                return tooltip;
            }
        },
        legend: {
            data: [`Budget: ${formatCurrency(totalBudget, settings)}`, `Réel: ${formatCurrency(totalActual, settings)}`],
            top: 30,
            textStyle: {
                fontSize: 14,
                fontWeight: 'bold'
            }
        },
        grid: {
            left: '3%',
            right: '10%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            axisLabel: {
                formatter: (value) => formatCurrency(value, { ...settings, displayUnit: 'standard' })
            }
        },
        yAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
                interval: 0,
                rotate: 0
            }
        },
        series: [
            {
                name: `Budget: ${formatCurrency(totalBudget, settings)}`,
                type: 'bar',
                data: budgetData,
                itemStyle: { color: chartColors.budget, borderRadius: [0, 5, 5, 0] },
                emphasis: { focus: 'series' },
                label: {
                    show: true,
                    position: 'right',
                    formatter: (params) => {
                        if (params.value <= 0) return '';
                        const percentage = totalBudget > 0 ? (params.value / totalBudget) * 100 : 0;
                        return `${formatCurrency(params.value, settings)} (${percentage.toFixed(0)}%)`;
                    },
                    color: chartColors.budgetLabel
                }
            },
            {
                name: `Réel: ${formatCurrency(totalActual, settings)}`,
                type: 'bar',
                data: actualData,
                itemStyle: { color: chartColors.actual, borderRadius: [0, 5, 5, 0] },
                emphasis: { focus: 'series' },
                label: {
                    show: true,
                    position: 'right',
                    formatter: (params) => {
                        if (params.value <= 0) return '';
                        const percentage = totalActual > 0 ? (params.value / totalActual) * 100 : 0;
                        return `${formatCurrency(params.value, settings)} (${percentage.toFixed(0)}%)`;
                    },
                    color: chartColors.actualLabel
                }
            }
        ]
    };
  };

  const getSubCategoryDrillDownChartOptions = () => {
    const { data, total } = subCategoryDrillDownData;
    const barColor = drillDownState.color;
    const labelColorMap = {
        '#fca5a5': '#b91c1c', '#ef4444': '#7f1d1d',
        '#6ee7b7': '#047857', '#10b981': '#065f46'
    };
    const defaultLabelColor = analysisType === 'expense' ? '#7f1d1d' : '#065f46';
    const labelColor = labelColorMap[barColor] || defaultLabelColor;

    return {
        title: { text: `Détail de : ${drillDownState.mainCategoryName}`, left: 'center', top: 0, textStyle: { fontSize: 16, fontWeight: '600', color: '#475569' } },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const param = params[0];
                const percentage = total > 0 ? (param.value / total) * 100 : 0;
                return `<strong>${param.name}</strong><br/>${param.marker} ${param.seriesName}: <strong>${formatCurrency(param.value, settings)}</strong> (${percentage.toFixed(1)}%)`;
            }
        },
        grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', axisLabel: { formatter: (value) => formatCurrency(value, { ...settings, displayUnit: 'standard' }) } },
        yAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { interval: 0 } },
        series: [{
            name: drillDownState.dataType === 'actual' ? 'Réel' : 'Budget',
            type: 'bar',
            data: data.map(d => d.value),
            itemStyle: { color: barColor, borderRadius: [0, 5, 5, 0] },
            label: {
                show: true,
                position: 'right',
                formatter: (params) => {
                    if (params.value <= 0) return '';
                    const percentage = total > 0 ? (params.value / total) * 100 : 0;
                    return `${formatCurrency(params.value, settings)} (${percentage.toFixed(0)}%)`;
                },
                color: labelColor
            }
        }]
    };
  };

  const getSupplierDrillDownChartOptions = () => {
    const { data, total } = supplierDrillDownData;
    const barColor = drillDownState.color;
    const labelColorMap = {
        '#fca5a5': '#b91c1c', '#ef4444': '#7f1d1d',
        '#6ee7b7': '#047857', '#10b981': '#065f46'
    };
    const defaultLabelColor = analysisType === 'expense' ? '#7f1d1d' : '#065f46';
    const labelColor = labelColorMap[barColor] || defaultLabelColor;

    return {
        title: { text: `Détail de : ${drillDownState.subCategoryName}`, left: 'center', top: 0, textStyle: { fontSize: 16, fontWeight: '600', color: '#475569' } },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const param = params[0];
                const percentage = total > 0 ? (param.value / total) * 100 : 0;
                return `<strong>${param.name}</strong><br/>${param.marker} ${param.seriesName}: <strong>${formatCurrency(param.value, settings)}</strong> (${percentage.toFixed(1)}%)`;
            }
        },
        grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', axisLabel: { formatter: (value) => formatCurrency(value, { ...settings, displayUnit: 'standard' }) } },
        yAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { interval: 0 } },
        series: [{
            name: drillDownState.dataType === 'actual' ? 'Réel' : 'Budget',
            type: 'bar',
            data: data.map(d => d.value),
            itemStyle: { color: barColor, borderRadius: [0, 5, 5, 0] },
            label: {
                show: true,
                position: 'right',
                formatter: (params) => {
                    if (params.value <= 0) return '';
                    const percentage = total > 0 ? (params.value / total) * 100 : 0;
                    return `${formatCurrency(params.value, settings)} (${percentage.toFixed(0)}%)`;
                },
                color: labelColor
            }
        }]
    };
  };

  const getProjectChartOptions = () => {
    const { projects, budgetData, actualData } = projectAnalysisData;
    const chartColors = analysisType === 'expense'
      ? { budget: '#fca5a5', actual: '#ef4444', budgetLabel: '#b91c1c', actualLabel: '#7f1d1d' }
      : { budget: '#6ee7b7', actual: '#10b981', budgetLabel: '#047857', actualLabel: '#065f46' };

    if (projects.length === 0) return { title: { text: 'Aucune donnée de projet à analyser', left: 'center', top: 'center' }, series: [] };

    return {
        title: { text: 'Analyse par Projet', left: 'center', top: 0, textStyle: { fontSize: 16, fontWeight: '600', color: '#475569' } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Budget', 'Réel'], top: 30 },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: projects },
        series: [
            { name: 'Budget', type: 'bar', data: budgetData, itemStyle: { color: chartColors.budget, borderRadius: [0, 5, 5, 0] }, label: { show: true, position: 'right', color: chartColors.budgetLabel } },
            { name: 'Réel', type: 'bar', data: actualData, itemStyle: { color: chartColors.actual, borderRadius: [0, 5, 5, 0] }, label: { show: true, position: 'right', color: chartColors.actualLabel } }
        ]
    };
  };

  const getTierChartOptions = () => {
    const { tiers, budgetData, actualData } = tierAnalysisData;
    const chartColors = analysisType === 'expense'
      ? { budget: '#fca5a5', actual: '#ef4444', budgetLabel: '#b91c1c', actualLabel: '#7f1d1d' }
      : { budget: '#6ee7b7', actual: '#10b981', budgetLabel: '#047857', actualLabel: '#065f46' };

    if (tiers.length === 0) return { title: { text: 'Aucune donnée par tiers à analyser', left: 'center', top: 'center' }, series: [] };

    return {
        title: { text: 'Analyse par Tiers (Top 10)', left: 'center', top: 0, textStyle: { fontSize: 16, fontWeight: '600', color: '#475569' } },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Budget', 'Réel'], top: 30 },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: tiers },
        series: [
            { name: 'Budget', type: 'bar', data: budgetData, itemStyle: { color: chartColors.budget, borderRadius: [0, 5, 5, 0] }, label: { show: true, position: 'right', color: chartColors.budgetLabel } },
            { name: 'Réel', type: 'bar', data: actualData, itemStyle: { color: chartColors.actual, borderRadius: [0, 5, 5, 0] }, label: { show: true, position: 'right', color: chartColors.actualLabel } }
        ]
    };
  };

  const renderChart = () => {
    if (analysisMode === 'category') {
        if (drillDownState.level === 0) {
            return categoryAnalysisData.categories.length > 0 ? <ReactECharts option={getChartOptions()} style={{ height: `${Math.max(500, categoryAnalysisData.categories.length * 80)}px`, width: '100%' }} onEvents={onEvents} /> : <EmptyState icon={PieChart} title={`Aucune ${analysisType === 'expense' ? 'dépense' : 'entrée'} à analyser`} message="Il n'y a pas de données pour la période sélectionnée." />;
        } else if (drillDownState.level === 1) {
            return subCategoryDrillDownData.data.length > 0 ? <ReactECharts option={getSubCategoryDrillDownChartOptions()} style={{ height: `${Math.max(400, subCategoryDrillDownData.data.length * 60)}px`, width: '100%' }} onEvents={onEvents} /> : <EmptyState icon={PieChart} title="Aucun détail" message="Aucune donnée de sous-catégorie pour cette sélection." />;
        } else { // level 2
            return supplierDrillDownData.data.length > 0 ? <ReactECharts option={getSupplierDrillDownChartOptions()} style={{ height: `${Math.max(400, supplierDrillDownData.data.length * 60)}px`, width: '100%' }} /> : <EmptyState icon={PieChart} title="Aucun détail" message="Aucune donnée par fournisseur pour cette sélection." />;
        }
    } else if (analysisMode === 'project') {
        return projectAnalysisData.projects.length > 0 ? <ReactECharts option={getProjectChartOptions()} style={{ height: '500px', width: '100%' }} /> : <EmptyState icon={Folder} title="Aucune donnée par projet" message="Ce graphique est disponible en vue consolidée." />;
    } else { // tier
        return tierAnalysisData.tiers.length > 0 ? <ReactECharts option={getTierChartOptions()} style={{ height: '500px', width: '100%' }} /> : <EmptyState icon={User} title="Aucune donnée par tiers" message="Aucune transaction trouvée pour la période sélectionnée." />;
    }
  };
  
  const quickPeriodOptions = [
    { id: 'month', label: 'Mois' },
    { id: 'bimester', label: 'Bimestre' },
    { id: 'quarter', label: 'Trimestre' },
    { id: 'semester', label: 'Semestre' },
    { id: 'year', label: 'Année' },
  ];
  const selectedPeriodLabel = quickPeriodOptions.find(opt => opt.id === localActiveQuickSelect)?.label || 'Période';
  
  const analysisTypeOptions = [
    { id: 'expense', label: 'Sorties', icon: TrendingDown, color: 'text-red-600' },
    { id: 'revenue', label: 'Entrées', icon: TrendingUp, color: 'text-green-600' }
  ];
  const selectedAnalysisTypeOption = analysisTypeOptions.find(opt => opt.id === analysisType);
  const SelectedIcon = selectedAnalysisTypeOption.icon;

  const analysisModeOptions = [
    { id: 'category', label: 'Par catégorie' },
    ...(isConsolidated || isCustomConsolidated ? [{ id: 'project', label: 'Par projet' }] : []),
    { id: 'tier', label: 'Par tiers' },
  ];
  const selectedAnalysisModeOption = analysisModeOptions.find(opt => opt.id === analysisMode);

  return (
    <div className={isFocusMode ? "h-full flex flex-col" : "container mx-auto p-6 max-w-full"}>
      {!isFocusMode && (
        <div className="mb-8">
            <div className="flex items-center gap-4">
            <PieChart className={`w-8 h-8 ${analysisType === 'expense' ? 'text-red-600' : 'text-green-600'}`} />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                Analyse
                </h1>
            </div>
            </div>
        </div>
      )}

      {!isFocusMode && (
        <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                {!rangeStartProp && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handlePeriodChange(-1)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="Période précédente"><ChevronLeft size={18} /></button>
                            <span className="text-sm font-semibold text-gray-700 w-auto min-w-[9rem] text-center" title="Période sélectionnée">{analysisPeriodName}</span>
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
                                                        className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${localActiveQuickSelect === option.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
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
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <div className="relative" ref={analysisModeMenuRef}>
                        <button 
                            onClick={() => setIsAnalysisModeMenuOpen(p => !p)} 
                            className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors"
                        >
                            <span>{selectedAnalysisModeOption.label}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isAnalysisModeMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isAnalysisModeMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                                >
                                    <ul className="p-1">
                                        {analysisModeOptions.map(option => (
                                            <li key={option.id}>
                                                <button
                                                    onClick={() => {
                                                        setAnalysisMode(option.id);
                                                        setIsAnalysisModeMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${analysisMode === option.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
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
                    <div className="relative" ref={analysisTypeMenuRef}>
                        <button 
                            onClick={() => setIsAnalysisTypeMenuOpen(p => !p)} 
                            className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 font-semibold text-sm hover:bg-gray-300 transition-colors"
                        >
                            <SelectedIcon className={`w-4 h-4 ${selectedAnalysisTypeOption.color}`} />
                            <span>{selectedAnalysisTypeOption.label}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isAnalysisTypeMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isAnalysisTypeMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                                >
                                    <ul className="p-1">
                                        {analysisTypeOptions.map(option => {
                                            const Icon = option.icon;
                                            return (
                                                <li key={option.id}>
                                                    <button
                                                        onClick={() => {
                                                            setLocalAnalysisType(option.id);
                                                            setIsAnalysisTypeMenuOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${analysisType === option.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                                    >
                                                        <Icon className={`w-4 h-4 ${option.color}`} />
                                                        {option.label}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        {drillDownState.level > 0 && (
            <div className="mb-4">
                <button onClick={handleBack} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                </button>
            </div>
        )}
        {renderChart()}
      </div>
    </div>
  );
};

export default ExpenseAnalysisView;
