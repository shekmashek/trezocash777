import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useUI } from '../context/UIContext';

const HorizonAnalysisView = () => {
  const { uiState, uiDispatch } = useUI();
  const { timeUnit, horizonLength } = uiState;

  const handleTimeUnitChange = (value) => {
    uiDispatch({ type: 'SET_TIME_UNIT', payload: value });
  };

  const handleHorizonLengthChange = (value) => {
    uiDispatch({ type: 'SET_HORIZON_LENGTH', payload: Number(value) });
  };

  const timeUnitOptions = {
    day: 'Jour',
    week: 'Semaine',
    fortnightly: 'Quinzaine',
    month: 'Mois',
    bimonthly: 'Bimestre',
    quarterly: 'Trimestre',
    semiannually: 'Semestre',
    annually: 'Année',
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-500" />
          Unité d'analyse
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Choisissez l'échelle de temps pour regrouper vos données dans le tableau de trésorerie et les graphiques.
        </p>
        <select 
          value={timeUnit} 
          onChange={(e) => handleTimeUnitChange(e.target.value)} 
          className="w-full text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-2"
        >
          <option value="day">Jour</option>
          <option value="week">Semaine</option>
          <option value="fortnightly">Quinzaine</option>
          <option value="month">Mois</option>
          <option value="bimonthly">Bimestre</option>
          <option value="quarterly">Trimestre</option>
          <option value="semiannually">Semestre</option>
          <option value="annually">Année</option>
        </select>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" />
          Horizon
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Définissez le nombre de périodes à afficher simultanément.
        </p>
        <select 
          value={horizonLength} 
          onChange={(e) => handleHorizonLengthChange(e.target.value)} 
          className="w-full text-sm rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-2"
        >
          <option value={1}>1 {timeUnitOptions[timeUnit]}</option>
          <option value={2}>2 {timeUnitOptions[timeUnit]}</option>
          <option value={3}>3 {timeUnitOptions[timeUnit]}</option>
          <option value={4}>4 {timeUnitOptions[timeUnit]}</option>
          <option value={5}>5 {timeUnitOptions[timeUnit]}</option>
          <option value={6}>6 {timeUnitOptions[timeUnit]}</option>
          <option value={10}>10 {timeUnitOptions[timeUnit]}</option>
          <option value={12}>12 {timeUnitOptions[timeUnit]}</option>
        </select>
      </div>
    </div>
  );
};

export default HorizonAnalysisView;
