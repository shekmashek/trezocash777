import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { updateProjectSettings } from '../context/actions';

const ProjectSettingsView = () => {
  const { dataState, dataDispatch } = useData();
  const { uiState, uiDispatch } = useUI();
  const { projects, session } = dataState;
  const { activeProjectId } = uiState;

  const activeProject = projects.find(p => p.id === activeProjectId);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isEndDateIndefinite, setIsEndDateIndefinite] = useState(true);
  
  const [currency, setCurrency] = useState('€');
  const [customCurrency, setCustomCurrency] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [displayUnit, setDisplayUnit] = useState('standard');
  const [decimalPlaces, setDecimalPlaces] = useState(2);

  const predefinedCurrencies = ['€', '$', '£', 'Ar'];

  useEffect(() => {
    if (activeProject) {
      setName(activeProject.name);
      setStartDate(activeProject.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(activeProject.endDate || '');
      setIsEndDateIndefinite(!activeProject.endDate);

      const projectCurrency = activeProject.currency || '€';
      if (predefinedCurrencies.includes(projectCurrency)) {
        setCurrency(projectCurrency);
        setIsCustom(false);
      } else {
        setCurrency('custom');
        setCustomCurrency(projectCurrency);
        setIsCustom(true);
      }
      setDisplayUnit(activeProject.display_unit || 'standard');
      setDecimalPlaces(activeProject.decimal_places ?? 2);
    }
  }, [activeProject]);

  const handleSaveChanges = () => {
    if (!name.trim() || !startDate) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Le nom et la date de début sont requis.', type: 'error' } });
      return;
    }
    const finalCurrency = currency === 'custom' ? customCurrency.trim() : currency;
    if (!finalCurrency) {
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'La devise ne peut pas être vide.', type: 'error' } });
        return;
    }

    updateProjectSettings({dataDispatch, uiDispatch}, {
      projectId: activeProjectId,
      newSettings: {
        name,
        startDate,
        endDate: isEndDateIndefinite ? null : endDate,
        currency: finalCurrency,
        display_unit: displayUnit,
        decimal_places: decimalPlaces
      }
    });
  };
  
  const isConsolidated = activeProjectId === 'consolidated' || activeProjectId?.startsWith('consolidated_view_');

  if (isConsolidated) {
    return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
                <h4 className="font-bold">Vue Consolidée</h4>
                <p className="text-sm">Les paramètres de projet sont spécifiques à chaque projet. Veuillez sélectionner un projet pour les modifier.</p>
            </div>
        </div>
    );
  }

  if (!activeProject) return null;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Informations Générales</h3>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Projet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de Début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                disabled={isEndDateIndefinite}
                min={startDate}
              />
            </div>
          </div>
          <div className="flex items-center">
              <input
                  type="checkbox"
                  id="project-indefinite-date"
                  checked={isEndDateIndefinite}
                  onChange={(e) => {
                      setIsEndDateIndefinite(e.target.checked);
                      if (e.target.checked) setEndDate('');
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="project-indefinite-date" className="ml-2 block text-sm text-gray-900">
                  Durée indéterminée
              </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Affichage des Montants</h3>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Devise du projet</label>
            <div className="flex items-center gap-4">
              <select value={currency} onChange={(e) => { setCurrency(e.target.value); setIsCustom(e.target.value === 'custom'); }} className="w-full px-3 py-2 border rounded-lg">
                  {predefinedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="custom">Autre...</option>
              </select>
              {isCustom && (
                <input type="text" value={customCurrency} onChange={(e) => setCustomCurrency(e.target.value)} placeholder="Symbole" className="w-24 px-3 py-2 border rounded-lg" maxLength="5" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unité d'affichage</label>
            <select value={displayUnit} onChange={(e) => setDisplayUnit(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                <option value="standard">Standard</option>
                <option value="thousands">Milliers (K)</option>
                <option value="millions">Millions (M)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de décimales</label>
            <select value={decimalPlaces} onChange={(e) => setDecimalPlaces(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg">
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveChanges}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Enregistrer les Modifications
        </button>
      </div>
    </div>
  );
};

export default ProjectSettingsView;
