import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { supabase } from '../utils/supabase';
import { Save, Plus, Trash2, AlertTriangle, Loader } from 'lucide-react';

const VatSettingsView = () => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const { vatRates, vatRegimes } = dataState;
    const { activeProjectId } = uiState;
    const isConsolidated = activeProjectId === 'consolidated' || activeProjectId.startsWith('consolidated_view_');

    const [rates, setRates] = useState([]);
    const [regime, setRegime] = useState({ collection_periodicity: 'monthly', payment_delay_months: 1, regime_type: 'reel_normal' });
    const [loading, setLoading] = useState(true);

    const projectRates = useMemo(() => vatRates[activeProjectId] || null, [vatRates, activeProjectId]);
    const projectRegime = useMemo(() => vatRegimes[activeProjectId] || null, [vatRegimes, activeProjectId]);

    useEffect(() => {
        if (isConsolidated || !activeProjectId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const ensureSettingsExist = async () => {
            let currentRates = projectRates;
            let currentRegime = projectRegime;

            if (!currentRates) {
                const { data: existingRates, error: ratesError } = await supabase
                    .from('vat_rates')
                    .select('*')
                    .eq('project_id', activeProjectId);

                if (ratesError) {
                    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur chargement taux TVA: ${ratesError.message}`, type: 'error' } });
                } else if (existingRates && existingRates.length > 0) {
                    currentRates = existingRates;
                } else {
                    const defaultRatesPayload = [
                        { project_id: activeProjectId, name: 'Taux normal', rate: 20, is_default: true },
                        { project_id: activeProjectId, name: 'Taux intermédiaire', rate: 10, is_default: false },
                        { project_id: activeProjectId, name: 'Taux réduit', rate: 5.5, is_default: false },
                        { project_id: activeProjectId, name: 'Taux super-réduit', rate: 2.1, is_default: false },
                        { project_id: activeProjectId, name: 'Taux zéro', rate: 0, is_default: false },
                    ];
                    const { data: newRates, error: insertError } = await supabase.from('vat_rates').upsert(defaultRatesPayload, { onConflict: 'project_id, name' }).select();
                    
                    if (insertError) {
                        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur création taux par défaut: ${insertError.message}`, type: 'error' } });
                    } else {
                        currentRates = newRates;
                        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Taux de TVA par défaut créés.', type: 'info' } });
                    }
                }
                dataDispatch({ type: 'SET_PROJECT_VAT_RATES', payload: { projectId: activeProjectId, rates: currentRates || [] } });
            }
            
            if (!currentRegime) {
                const { data: existingRegime, error: regimeError } = await supabase.from('vat_regimes').select('*').eq('project_id', activeProjectId).single();
                if (regimeError && regimeError.code !== 'PGRST116') { // PGRST116 = no rows found
                    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur chargement régime TVA: ${regimeError.message}`, type: 'error' } });
                } else if (existingRegime) {
                    currentRegime = existingRegime;
                } else {
                    // Create a default regime if none exists
                    const { data: newRegime, error: newRegimeError } = await supabase
                        .from('vat_regimes')
                        .insert({ project_id: activeProjectId, collection_periodicity: 'monthly', payment_delay_months: 1, regime_type: 'reel_normal' })
                        .select()
                        .single();
                    if (newRegimeError) {
                        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur création régime TVA: ${newRegimeError.message}`, type: 'error' } });
                    } else {
                        currentRegime = newRegime;
                    }
                }
                if (currentRegime) {
                    dataDispatch({ type: 'SET_PROJECT_VAT_REGIME', payload: { projectId: activeProjectId, regime: currentRegime } });
                }
            }

            setRates(currentRates || []);
            setRegime(currentRegime || { collection_periodicity: 'monthly', payment_delay_months: 1, regime_type: 'reel_normal' });
            setLoading(false);
        };

        ensureSettingsExist();

    }, [activeProjectId, isConsolidated, dataDispatch, uiDispatch, projectRates, projectRegime]);

    const handleRateChange = (index, field, value) => {
        const newRates = [...rates];
        newRates[index][field] = value;
        setRates(newRates);
    };

    const handleAddRate = () => {
        setRates([...rates, { id: `temp-${Date.now()}`, name: '', rate: '', is_default: rates.length === 0, project_id: activeProjectId }]);
    };

    const handleDeleteRate = async (index) => {
        const rateToDelete = rates[index];
        if (rateToDelete.id && !rateToDelete.id.toString().startsWith('temp-')) {
            const { error } = await supabase.from('vat_rates').delete().eq('id', rateToDelete.id);
            if (error) {
                uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
                return;
            }
        }
        const newRates = rates.filter((_, i) => i !== index);
        setRates(newRates);
        dataDispatch({ type: 'SET_PROJECT_VAT_RATES', payload: { projectId: activeProjectId, rates: newRates } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Taux supprimé.', type: 'success' } });
    };

    const handleSetDefault = (index) => {
        const newRates = rates.map((rate, i) => ({
            ...rate,
            is_default: i === index
        }));
        setRates(newRates);
    };

    const handleSaveSettings = async () => {
        setLoading(true);
        const { data: savedRegime, error: regimeError } = await supabase
            .from('vat_regimes')
            .upsert({ 
                project_id: activeProjectId, 
                collection_periodicity: regime.collection_periodicity, 
                payment_delay_months: regime.payment_delay_months, 
                regime_type: regime.regime_type || 'reel_normal' 
            }, { onConflict: 'project_id' })
            .select()
            .single();

        if (regimeError) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur régime: ${regimeError.message}`, type: 'error' } });
            setLoading(false);
            return;
        }
        dataDispatch({ type: 'SET_PROJECT_VAT_REGIME', payload: { projectId: activeProjectId, regime: savedRegime } });

        const ratesToUpsert = rates.map(rate => ({
            id: rate.id?.toString().startsWith('temp-') ? undefined : rate.id,
            project_id: activeProjectId,
            name: rate.name,
            rate: parseFloat(rate.rate),
            is_default: rate.is_default
        }));

        const { data: upsertedRates, error: ratesError } = await supabase.from('vat_rates').upsert(ratesToUpsert).select();

        if (ratesError) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur taux: ${ratesError.message}`, type: 'error' } });
        } else {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Paramètres TVA enregistrés.', type: 'success' } });
            dataDispatch({ type: 'SET_PROJECT_VAT_RATES', payload: { projectId: activeProjectId, rates: upsertedRates } });
            setRates(upsertedRates);
        }
        setLoading(false);
    };

    if (isConsolidated) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-bold">Vue Consolidée</h4>
                    <p className="text-sm">La gestion de la TVA se fait par projet. Veuillez sélectionner un projet spécifique.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader className="animate-spin w-8 h-8 text-blue-600" /></div>;
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Régime de TVA</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type de régime</label>
                        <select value={regime.regime_type || 'reel_normal'} onChange={e => setRegime({...regime, regime_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white">
                            <option value="reel_normal">Réel Normal</option>
                            <option value="reel_simplifie">Réel Simplifié</option>
                            <option value="franchise_en_base">Franchise en Base</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Périodicité de déclaration</label>
                        <select value={regime.collection_periodicity || 'monthly'} onChange={e => setRegime({...regime, collection_periodicity: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white">
                            <option value="monthly">Mensuelle</option>
                            <option value="quarterly">Trimestrielle</option>
                            <option value="annually">Annuelle</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Délai de paiement (en mois)</label>
                        <input type="number" value={regime.payment_delay_months || 1} onChange={e => setRegime({...regime, payment_delay_months: parseInt(e.target.value, 10)})} className="w-full px-3 py-2 border rounded-lg" min="0" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Taux de TVA</h3>
                <div className="space-y-3">
                    {rates.map((rate, index) => (
                        <div key={rate.id || `new-${index}`} className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-4">
                                <input type="text" placeholder="Nom (ex: Normal, Réduit)" value={rate.name || ''} onChange={e => handleRateChange(index, 'name', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div className="col-span-3">
                                <div className="relative">
                                    <input type="number" placeholder="Taux" value={rate.rate ?? ''} onChange={e => handleRateChange(index, 'rate', e.target.value)} className="w-full px-3 py-2 border rounded-lg" step="0.01" />
                                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-500">%</span>
                                </div>
                            </div>
                            <div className="col-span-4 flex items-center gap-2">
                                <input type="radio" name="default_rate" checked={rate.is_default} onChange={() => handleSetDefault(index)} className="h-4 w-4 text-blue-600 border-gray-300" />
                                <label className="text-sm text-gray-600">Taux par défaut</label>
                            </div>
                            <div className="col-span-1 text-right">
                                <button onClick={() => handleDeleteRate(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddRate} className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                    <Plus className="w-4 h-4" /> Ajouter un taux
                </button>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSaveSettings} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:bg-gray-400">
                    <Save className="w-4 h-4" /> Enregistrer les Paramètres
                </button>
            </div>
        </div>
    );
};

export default VatSettingsView;
