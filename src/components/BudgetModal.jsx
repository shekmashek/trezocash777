import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, Building, Trash2, Edit, Clock, Repeat, AlertCircle, ListChecks, PlusCircle, Lock } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import AddCategoryModal from './AddCategoryModal';
import { useBudget } from '../context/BudgetContext';
import { motion, AnimatePresence } from 'framer-motion';
import { saveSubCategory } from '../context/actions';
import { supabase } from '../utils/supabase';

const BudgetModal = ({ isOpen, onClose, onSave, onDelete, editingData }) => {
  const { state, dispatch } = useBudget();
  const { categories, tiers, settings, allCashAccounts, activeProjectId, projects, session, vatRates } = state;
  const isConsolidated = activeProjectId === 'consolidated';

  const isContextualAdd = useMemo(() => editingData && !editingData.id && editingData.category, [editingData]);

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

  const userCashAccounts = useMemo(() => {
    if (isConsolidated) return [];
    return allCashAccounts[activeProjectId] || [];
  }, [allCashAccounts, activeProjectId, isConsolidated]);

  const projectVatRates = useMemo(() => {
    if (isConsolidated) return [];
    return (vatRates[activeProjectId] || []).sort((a, b) => b.is_default - a.is_default);
  }, [vatRates, activeProjectId, isConsolidated]);

  useEffect(() => {
    const ensureVatRates = async () => {
        if (isOpen && !isConsolidated && activeProjectId && (!vatRates[activeProjectId] || vatRates[activeProjectId].length === 0)) {
            const defaultRatesPayload = [
                { project_id: activeProjectId, name: 'Taux normal', rate: 20, is_default: true },
                { project_id: activeProjectId, name: 'Taux intermédiaire', rate: 10, is_default: false },
                { project_id: activeProjectId, name: 'Taux réduit', rate: 5.5, is_default: false },
                { project_id: activeProjectId, name: 'Taux super-réduit', rate: 2.1, is_default: false },
                { project_id: activeProjectId, name: 'Taux zéro', rate: 0, is_default: false },
            ];
            const { data: newRates, error: insertError } = await supabase
                .from('vat_rates')
                .insert(defaultRatesPayload)
                .select();

            if (insertError) {
                dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur création taux TVA par défaut: ${insertError.message}`, type: 'error' } });
            } else if (newRates) {
                dispatch({ type: 'SET_PROJECT_VAT_RATES', payload: { projectId: activeProjectId, rates: newRates } });
                dispatch({ type: 'ADD_TOAST', payload: { message: 'Taux de TVA par défaut créés pour ce projet.', type: 'info' } });
            }
        }
    };

    ensureVatRates();
  }, [isOpen, activeProjectId, isConsolidated, vatRates, dispatch]);

  const getInitialFormData = () => ({
    type: 'revenu',
    category: '',
    frequency: 'mensuel',
    amount: '',
    amount_type: 'ttc',
    vat_rate_id: null,
    date: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    supplier: '',
    description: '',
    isProvision: false,
    payments: [{ date: new Date().toISOString().split('T')[0], amount: '' }],
    numProvisions: '',
    provisionDetails: {
        finalPaymentDate: '',
        provisionAccountId: ''
    }
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState('');
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  const frequencyOptions = [
    { value: 'ponctuel', label: 'Ponctuel' },
    { value: 'journalier', label: 'Journalier' },
    { value: 'hebdomadaire', label: 'Hebdomadaire' },
    { value: 'mensuel', label: 'Mensuel' },
    { value: 'bimestriel', label: 'Bimestriel' },
    { value: 'trimestriel', label: 'Trimestriel' },
    { value: 'semestriel', label: 'Semestriel' },
    { value: 'annuel', label: 'Annuel' },
    { value: 'irregulier', label: 'Paiements Irréguliers' },
  ];
  
  const showProvisionButton = formData.type === 'depense' && ['ponctuel', 'bimestriel', 'trimestriel', 'semestriel', 'annuel'].includes(formData.frequency);
  const isAutoProvision = formData.isProvision && ['annuel', 'semestriel', 'trimestriel', 'bimestriel'].includes(formData.frequency);

  useEffect(() => {
    if (isOpen) {
      const defaultVatRateId = projectVatRates.find(r => r.is_default)?.id || null;
      if (editingData) {
        const mainCategoryType = editingData.type === 'revenu' ? 'revenue' : 'expense';
        const availableCategories = categories[mainCategoryType] || [];
        
        let mainCatIdToSet = '';
        if (editingData.mainCategoryId) {
            mainCatIdToSet = editingData.mainCategoryId;
        } else if (editingData.category) {
            const mainCat = availableCategories.find(mc => mc.subCategories.some(sc => sc.name === editingData.category));
            if (mainCat) {
                mainCatIdToSet = mainCat.id;
            }
        }
        setSelectedMainCategoryId(mainCatIdToSet);

        const provisionMap = { annuel: 12, semestriel: 6, trimestriel: 3, bimestriel: 2 };
        const num = provisionMap[editingData.frequency];

        setFormData({
          ...getInitialFormData(),
          ...editingData,
          amount: editingData.amount_type === 'ht' ? editingData.ht_amount : (editingData.ttc_amount || editingData.amount),
          amount_type: editingData.amount_type || 'ttc',
          vat_rate_id: editingData.vat_rate_id || defaultVatRateId,
          type: editingData.type || 'revenu',
          isProvision: editingData.isProvision || false,
          numProvisions: editingData.isProvision && num ? num : (editingData.numProvisions || ''),
          payments: editingData.payments && editingData.payments.length > 0
            ? editingData.payments.map(p => ({ date: p.date || '', amount: p.amount || '' }))
            : [{ date: new Date().toISOString().split('T')[0], amount: '' }],
        });
      } else {
        setFormData(prev => ({...getInitialFormData(), vat_rate_id: defaultVatRateId}));
        setSelectedMainCategoryId('');
      }
    }
  }, [isOpen, editingData, categories, projectVatRates]);

  useEffect(() => {
    if (formData.isProvision) {
        const provisionMap = { annuel: 12, semestriel: 6, trimestriel: 3, bimestriel: 2 };
        const num = provisionMap[formData.frequency];
        if (num) {
            setFormData(prev => ({ ...prev, numProvisions: num }));
        } else if (formData.frequency === 'ponctuel') {
            setFormData(prev => ({ ...prev, numProvisions: prev.numProvisions || '' }));
        }
    } else {
        setFormData(prev => ({ ...prev, numProvisions: '' }));
    }
  }, [formData.isProvision, formData.frequency]);
  
  const { htAmount, ttcAmount, vatAmount } = useMemo(() => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return { htAmount: 0, ttcAmount: 0, vatAmount: 0 };

    const rateInfo = projectVatRates.find(r => r.id === formData.vat_rate_id);
    const rate = rateInfo ? parseFloat(rateInfo.rate) / 100 : 0;

    if (formData.amount_type === 'ht') {
        const ht = amount;
        const ttc = ht * (1 + rate);
        const vat = ttc - ht;
        return { htAmount: ht, ttcAmount: ttc, vatAmount: vat };
    } else { // 'ttc'
        const ttc = amount;
        const ht = ttc / (1 + rate);
        const vat = ttc - ht;
        return { htAmount: ht, ttcAmount: ttc, vatAmount: vat };
    }
  }, [formData.amount, formData.amount_type, formData.vat_rate_id, projectVatRates]);

  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...formData.payments];
    newPayments[index][field] = value;
    setFormData(prev => ({ ...prev, payments: newPayments }));
  };

  const addPayment = () => setFormData(prev => ({ ...prev, payments: [...prev.payments, { date: new Date().toISOString().split('T')[0], amount: '' }] }));
  const removePayment = (index) => setFormData(prev => ({ ...prev, payments: formData.payments.filter((_, i) => i !== index) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category || !formData.supplier) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Veuillez remplir tous les champs obligatoires.', type: 'error' } });
      return;
    }
    let entryData = { 
        ...formData,
        ht_amount: htAmount,
        ttc_amount: ttcAmount,
        amount: ttcAmount, // Ensure cashflow uses TTC
    };

    if (entryData.frequency === 'irregulier' || entryData.isProvision) {
      const validPayments = entryData.payments.filter(p => p.date && p.amount);
      if (validPayments.length === 0 && entryData.frequency !== 'irregulier' && !entryData.isProvision) {
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Veuillez ajouter au moins un paiement.', type: 'error' } });
        return;
      }
      entryData.payments = validPayments;
      if (entryData.isProvision) {
        entryData.amount = parseFloat(formData.amount);
        entryData.ttc_amount = parseFloat(formData.amount);
        entryData.ht_amount = parseFloat(formData.amount);
      } else {
        entryData.amount = validPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        entryData.ttc_amount = entryData.amount;
        entryData.ht_amount = entryData.amount;
      }
    } else {
      if (!formData.amount) {
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Veuillez remplir le montant.', type: 'error' } });
        return;
      }
      entryData.payments = [];
    }
    if (formData.frequency === 'ponctuel' && !formData.date) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Veuillez sélectionner une date pour une transaction ponctuelle.', type: 'error' } });
      return;
    }
    if (formData.frequency !== 'ponctuel' && formData.frequency !== 'irregulier' && !formData.startDate) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Veuillez sélectionner une date de début pour une transaction récurrente.', type: 'error' } });
      return;
    }
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'La date de fin ne peut pas être antérieure à la date de début.', type: 'error' } });
      return;
    }
    if (formData.isProvision) {
        if (!formData.provisionDetails.finalPaymentDate || !formData.provisionDetails.provisionAccountId) {
            dispatch({ type: 'ADD_TOAST', payload: { message: "Pour une provision, veuillez spécifier la date du paiement final et le compte de provision.", type: 'error' } });
            return;
        }
    }
    onSave({ ...entryData, endDate: entryData.endDate || null, projectId: editingData?.projectId || activeProjectId });
  };

  const handleGenerateProvisions = () => {
    const total = parseFloat(formData.amount);
    const num = parseInt(formData.numProvisions, 10);
    if (!total || !num || total <= 0 || num <= 0) {
      dispatch({ type: 'ADD_TOAST', payload: { message: "Veuillez entrer un montant total et un nombre de provisions valides.", type: 'error' } });
      return;
    }
    const provisionAmount = total / num;
    const provisions = Array.from({ length: num }, (_, i) => ({
      date: new Date(new Date().setMonth(new Date().getMonth() + i)).toISOString().split('T')[0],
      amount: provisionAmount.toFixed(2)
    }));
    setFormData(prev => ({ ...prev, payments: provisions }));
  };

  const handleDeleteClick = () => {
    if (editingData) {
      dispatch({
        type: 'OPEN_CONFIRMATION_MODAL',
        payload: {
          title: 'Supprimer cette entrée ?',
          message: 'Cette action est irréversible.',
          onConfirm: () => onDelete(editingData.id),
        }
      });
    }
  };

  const getAvailableCategories = () => formData.type === 'revenu' ? categories.revenue : categories.expense;
  const getAvailableTiers = () => tiers.filter(t => t.type === (formData.type === 'revenu' ? 'client' : 'fournisseur'));
  const getFrequencyDescription = (frequency, amount) => {
    if (!amount) return '';
    const formattedAmount = formatCurrency(amount, settings);
    switch (frequency) {
      case 'journalier': return `${formattedAmount} chaque jour`;
      case 'hebdomadaire': return `${formattedAmount} par semaine`;
      case 'mensuel': return `${formattedAmount} chaque mois`;
      case 'bimestriel': return `${formattedAmount} tous les 2 mois`;
      case 'trimestriel': return `${formattedAmount} tous les 3 mois`;
      case 'semestriel': return `${formattedAmount} tous les 6 mois`;
      case 'annuel': return `${formattedAmount} chaque année`;
      case 'ponctuel': return `${formattedAmount} une seule fois`;
      default: return '';
    }
  };
  
  const handleSaveNewCategory = async (subCategoryName) => {
    const user = session.user;
    if (!user) {
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Utilisateur non authentifié.', type: 'error' } });
        return;
    }

    const typeForDB = formData.type === 'revenu' ? 'revenue' : 'expense';

    const newSubCategory = await saveSubCategory(dispatch, {
        type: typeForDB,
        mainCategoryId: selectedMainCategoryId,
        subCategoryName: subCategoryName,
        user: user
    });

    if (newSubCategory) {
        setFormData(prev => ({ ...prev, category: newSubCategory.name }));
        setIsAddCategoryModalOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{editingData && editingData.id ? "Modifier l'entrée prévisionnelle" : 'Nouvelle entrée budgétaire prévisionnelle'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {isContextualAdd ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">Ajout d'une nouvelle écriture pour :</p>
                <p className="font-semibold text-blue-800">{getAvailableCategories().find(mc => mc.id === selectedMainCategoryId)?.name} &gt; {formData.category}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center"><input type="radio" name="type" value="revenu" checked={formData.type === 'revenu'} onChange={(e) => { setFormData(prev => ({ ...prev, type: e.target.value, category: '', isProvision: false })); setSelectedMainCategoryId(''); }} className="mr-2" /><Building className="w-4 h-4 mr-1 text-green-600" /> Entrée</label>
                    <label className="flex items-center"><input type="radio" name="type" value="depense" checked={formData.type === 'depense'} onChange={(e) => { setFormData(prev => ({ ...prev, type: e.target.value, category: '' })); setSelectedMainCategoryId(''); }} className="mr-2" /><Calendar className="w-4 h-4 mr-1 text-red-600" /> Sortie</label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie Principale *</label>
                        <select 
                            value={selectedMainCategoryId} 
                            onChange={(e) => {
                                setSelectedMainCategoryId(e.target.value);
                                setFormData(prev => ({ ...prev, category: '' }));
                            }} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                            required
                        >
                            <option value="">Sélectionner</option>
                            {getAvailableCategories().map(mainCat => (
                                <option key={mainCat.id} value={mainCat.id}>{mainCat.name}</option>
                            ))}
                        </select>
                    </div>
                    {selectedMainCategoryId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sous-catégorie *</label>
                            <div className="flex gap-2">
                                <select 
                                    value={formData.category || ''} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                                    required 
                                >
                                    <option value="">Sélectionner</option>
                                    {getAvailableCategories().find(mc => mc.id === selectedMainCategoryId)?.subCategories.map(subCat => (
                                        <option key={subCat.id} value={subCat.name}>{subCat.name}</option>
                                    ))}
                                </select>
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddCategoryModalOpen(true)} 
                                    className="p-2 border rounded-lg bg-gray-100 hover:bg-gray-200"
                                    title="Ajouter une nouvelle sous-catégorie"
                                >
                                    <PlusCircle className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fréquence *</label>
              <select 
                value={formData.frequency} 
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {frequencyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {formData.frequency === 'ponctuel' && (<div><label className="block text-sm font-medium text-gray-700 mb-2">Date du paiement *</label><input type="date" value={formData.date || ''} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required min={activeProject?.startDate} /></div>)}
            {formData.frequency !== 'ponctuel' && formData.frequency !== 'irregulier' && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50"><div><label className="block text-sm font-medium text-gray-700 mb-2">Date de début *</label><input type="date" value={formData.startDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required min={activeProject?.startDate} /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Date de fin (optionnel)</label><input type="date" value={formData.endDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" min={formData.startDate || activeProject?.startDate} /></div></div>)}
            
            {formData.frequency === 'irregulier' && (<div className="space-y-4 p-4 border rounded-lg bg-gray-50"><h4 className="font-medium text-gray-800">Liste des paiements</h4>{formData.payments.map((payment, index) => (<div key={index} className="flex items-center gap-2"><input type="date" value={payment.date || ''} onChange={(e) => handlePaymentChange(index, 'date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required min={activeProject?.startDate} /><input type="number" value={payment.amount || ''} onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder={`Montant (${settings.currency})`} min="0" step="0.01" required />{formData.payments.length > 1 && (<button type="button" onClick={() => removePayment(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>)}</div>))}<button type="button" onClick={addPayment} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"><PlusCircle className="w-4 h-4" />Ajouter un paiement</button></div>)}
            
            <div><label htmlFor="tier-input" className="block text-sm font-medium text-gray-700 mb-2"><User className="w-4 h-4 inline mr-1" /> {formData.type === 'revenu' ? 'Client' : 'Fournisseur'} *</label><input id="tier-input" type="text" list="tiers-list" value={formData.supplier || ''} onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Saisir ou sélectionner..." required /><datalist id="tiers-list">{getAvailableTiers().map(tier => (<option key={tier.id} value={tier.name} />))}</datalist></div>
            
            {formData.frequency !== 'irregulier' && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant *</label>
                <div className="flex items-center gap-2">
                    <div className="flex-grow relative">
                        <input type="number" value={formData.amount || ''} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" step="0.01" min="0" required disabled={formData.isProvision} />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500">
                            {settings.currency}
                        </div>
                    </div>
                    <div className="flex items-center bg-gray-200 rounded-lg p-0.5">
                        <button type="button" onClick={() => setFormData(p => ({...p, amount_type: 'ht'}))} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${formData.amount_type === 'ht' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>
                            HT
                        </button>
                        <button type="button" onClick={() => setFormData(p => ({...p, amount_type: 'ttc'}))} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${formData.amount_type === 'ttc' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}>
                            TTC
                        </button>
                    </div>
                    {showProvisionButton && (
                        <button 
                        type="button" 
                        onClick={() => setFormData(p => ({ ...p, isProvision: !p.isProvision }))} 
                        className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 text-sm font-medium ${formData.isProvision ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} 
                        title="Provisionner cette dépense pour lisser son impact sur votre trésorerie."
                        >
                        <Lock className="w-4 h-4" />
                        Provision
                        </button>
                    )}
                </div>
                {formData.amount && !formData.isProvision && (<p className="mt-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg flex items-start gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><span><strong>Aperçu:</strong> {getFrequencyDescription(formData.frequency, ttcAmount)} {formData.frequency !== 'ponctuel' && ` du ${new Date(formData.startDate).toLocaleDateString('fr-FR')} ${formData.endDate ? `au ${new Date(formData.endDate).toLocaleDateString('fr-FR')}` : 'indéfiniment'}.`}</span></p>)}
              </div>
            )}

            <AnimatePresence>
                {formData.amount_type === 'ht' && projectVatRates.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Taux de TVA</label>
                                <select value={formData.vat_rate_id || ''} onChange={(e) => setFormData(prev => ({ ...prev, vat_rate_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                                    <option value="">Aucune TVA</option>
                                    {projectVatRates.map(rate => (
                                        <option key={rate.id} value={rate.id}>{rate.name} ({rate.rate}%)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-7">
                                <p className="text-sm text-gray-500">Montant TTC calculé:</p>
                                <p className="font-bold text-lg text-gray-800">{formatCurrency(ttcAmount, settings)}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
              {formData.isProvision && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="space-y-4 p-4 mt-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium text-gray-800">Détails de la provision</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date du paiement final *</label>
                        <input type="date" value={formData.provisionDetails.finalPaymentDate || ''} onChange={e => setFormData(prev => ({ ...prev, provisionDetails: { ...prev.provisionDetails, finalPaymentDate: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required min={activeProject?.startDate} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Compte de provision *</label>
                        <select value={formData.provisionDetails.provisionAccountId || ''} onChange={e => setFormData(prev => ({ ...prev, provisionDetails: { ...prev.provisionDetails, provisionAccountId: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                          <option value="">Sélectionner un compte</option>
                          {userCashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nb. de provisions mensuelles</label>
                        <input type="number" value={formData.numProvisions || ''} onChange={e => setFormData(prev => ({ ...prev, numProvisions: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="12" disabled={isAutoProvision} />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={handleGenerateProvisions} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm">Générer les versements</button>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t max-h-40 overflow-y-auto">
                      <h5 className="text-sm font-medium text-gray-600">Versements prévisionnels</h5>
                      {formData.payments.map((payment, index) => (<div key={index} className="flex items-center gap-2"><input type="date" value={payment.date || ''} onChange={(e) => handlePaymentChange(index, 'date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required min={activeProject?.startDate} /><input type="number" value={payment.amount || ''} onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder={`Montant (${settings.currency})`} min="0" step="0.01" required />{formData.payments.length > 1 && (<button type="button" onClick={() => removePayment(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>)}</div>))}
                      <button type="button" onClick={addPayment} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"><PlusCircle className="w-4 h-4" />Ajouter un versement</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label><textarea value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Détails supplémentaires..." /></div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div>{editingData && editingData.id && (<button type="button" onClick={handleDeleteClick} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"><Trash2 className="w-4 h-4" /> Supprimer</button>)}</div>
              <div className="flex gap-3"><button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Annuler</button><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"><Edit className="w-4 h-4" /> {editingData && editingData.id ? 'Modifier' : 'Enregistrer'}</button></div>
            </div>
          </form>
        </div>
      </div>
      {isAddCategoryModalOpen && (
        <AddCategoryModal 
            isOpen={isAddCategoryModalOpen} 
            onClose={() => setIsAddCategoryModalOpen(false)} 
            onSave={handleSaveNewCategory} 
            mainCategoryName={getAvailableCategories().find(mc => mc.id === selectedMainCategoryId)?.name || ''}
        />
      )}
    </>
  );
};

export default BudgetModal;
