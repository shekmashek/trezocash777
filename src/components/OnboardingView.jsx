import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Loader, Search, Star, Users, LayoutTemplate, FilePlus } from 'lucide-react';
import TrezocashLogo from './TrezocashLogo';
import { initializeProject } from '../context/actions';
import { templates as officialTemplates } from '../utils/templates';
import TemplateIcon from './TemplateIcon';

const OnboardingProgress = ({ current, total }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < current ? 'bg-blue-500' : 'bg-gray-200'}`} />
    ))}
  </div>
);

const OnboardingView = () => {
  const { dataState, dataDispatch } = useData();
  const { uiDispatch } = useUI();
  const { projects, session, tiers, templates: userAndCommunityTemplates } = dataState;
  const hasExistingProjects = useMemo(() => projects.filter(p => !p.isArchived).length > 0, [projects]);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    projectName: '',
    projectStartDate: new Date().toISOString().split('T')[0],
    projectEndDate: '',
    isEndDateIndefinite: true,
    templateId: 'blank',
    startOption: 'blank',
  });

  const [activeTab, setActiveTab] = useState('official');
  const [searchTerm, setSearchTerm] = useState('');

  const steps = [
    { id: 'details', title: 'Détails de votre projet' },
    { id: 'template', title: 'Choisissez un modèle' },
    { id: 'start', title: 'Comment voulez-vous commencer ?' },
    { id: 'finish', title: 'Finalisation' },
  ];
  const currentStepInfo = steps[step];

  const handleNext = () => {
    if (step === 0 && !data.projectName.trim()) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom du projet est obligatoire.", type: 'error' } });
      return;
    }
    
    if (step === 1 && data.templateId === 'blank') {
      setData(prev => ({ ...prev, startOption: 'blank' }));
      setDirection(1);
      setStep(3); // Skip to 'finish' step
      return;
    }

    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 3 && data.templateId === 'blank') {
        setDirection(-1);
        setStep(1); // Go back to template selection
        return;
    }
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };
  
  const handleCancel = () => uiDispatch({ type: 'CANCEL_ONBOARDING' });

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await initializeProject({ dataDispatch, uiDispatch }, data, session.user, tiers, userAndCommunityTemplates);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const allOfficialTemplates = useMemo(() => {
    const blankTemplate = {
        id: 'blank',
        name: 'Projet Vierge',
        description: 'Commencez avec une structure de base sans aucune donnée pré-remplie.',
        icon: 'FilePlus',
        color: 'gray',
    };
    return [blankTemplate, ...officialTemplates.personal, ...officialTemplates.professional];
  }, []);

  const communityTemplates = useMemo(() => userAndCommunityTemplates.filter(t => t.isPublic), [userAndCommunityTemplates]);
  const myTemplates = useMemo(() => userAndCommunityTemplates.filter(t => t.userId === session.user.id), [userAndCommunityTemplates, session.user.id]);

  const filteredTemplates = useMemo(() => {
    let currentList = [];
    if (activeTab === 'official') currentList = allOfficialTemplates;
    else if (activeTab === 'community') currentList = communityTemplates;
    else currentList = myTemplates;

    if (!searchTerm) return currentList;
    return currentList.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeTab, searchTerm, allOfficialTemplates, communityTemplates, myTemplates]);

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 100 : -100, opacity: 0 }),
  };

  const renderStepContent = () => {
    switch (currentStepInfo.id) {
      case 'details':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentStepInfo.title}</h2>
            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">Nom du projet *</label>
                <input type="text" value={data.projectName} onChange={(e) => setData(prev => ({ ...prev, projectName: e.target.value }))} placeholder="Ex: Mon Budget 2025" className="w-full text-lg p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent" autoFocus required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">Date de début</label>
                    <input type="date" value={data.projectStartDate} onChange={(e) => setData(prev => ({ ...prev, projectStartDate: e.target.value }))} className="w-full text-lg p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">Date de fin</label>
                    <input type="date" value={data.projectEndDate} onChange={(e) => setData(prev => ({ ...prev, projectEndDate: e.target.value }))} className="w-full text-lg p-2 border-b-2 focus:border-blue-500 outline-none transition bg-transparent disabled:bg-gray-100" disabled={data.isEndDateIndefinite} min={data.projectStartDate} />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <input type="checkbox" id="indefinite-date" checked={data.isEndDateIndefinite} onChange={(e) => setData(prev => ({ ...prev, isEndDateIndefinite: e.target.checked, projectEndDate: e.target.checked ? '' : prev.projectEndDate }))} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="indefinite-date" className="ml-2 block text-sm text-gray-900">Durée indéterminée</label>
              </div>
            </div>
          </div>
        );
      case 'template':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentStepInfo.title}</h2>
            <p className="text-gray-600 mb-6">Commencez avec un projet vierge ou choisissez un modèle pour démarrer plus rapidement.</p>
            
            <div className="flex justify-center border-b mb-6">
              <button onClick={() => setActiveTab('official')} className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'official' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}><Star className="w-4 h-4"/>Modèles Officiels</button>
              <button onClick={() => setActiveTab('community')} className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'community' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}><Users className="w-4 h-4"/>Communauté</button>
              <button onClick={() => setActiveTab('my-templates')} className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${activeTab === 'my-templates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}><LayoutTemplate className="w-4 h-4"/>Mes Modèles</button>
            </div>

            <div className="relative max-w-md mx-auto mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Rechercher un modèle..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[300px] overflow-y-auto p-2">
              {filteredTemplates.map(template => {
                const isSelected = data.templateId === template.id;
                return (
                  <button key={template.id} onClick={() => setData(prev => ({...prev, templateId: template.id}))} className={`p-4 border-2 rounded-lg text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-400'}`}>
                    <TemplateIcon icon={template.icon} color={template.color} className="w-7 h-7 mb-2" />
                    <h4 className="font-semibold text-gray-800">{template.name}</h4>
                    <p className="text-xs text-gray-500">{template.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 'start':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Comment voulez-vous commencer ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button onClick={() => { setData(prev => ({...prev, startOption: 'populated'})); handleNext(); }} className="p-6 border rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all text-left">
                <h3 className="font-semibold text-lg">Avec des données d'exemple</h3>
                <p className="text-sm text-gray-600">Idéal pour démarrer vite avec des exemples concrets que vous pourrez modifier.</p>
              </button>
              <button onClick={() => { setData(prev => ({...prev, startOption: 'blank'})); handleNext(); }} className="p-6 border rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all text-left">
                <h3 className="font-semibold text-lg">Avec une structure vierge</h3>
                <p className="text-sm text-gray-600">Parfait si vous préférez tout configurer vous-même de A à Z.</p>
              </button>
            </div>
          </div>
        );
      case 'finish':
        return (
          <div className="text-center">
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tout est prêt !</h2>
            <p className="text-gray-600 mb-8">Votre projet est sur le point d'être créé. Prêt à prendre le contrôle ?</p>
            <button onClick={handleFinish} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-wait">
              {isLoading ? (<span className="flex items-center gap-2"><Loader className="animate-spin" /> Création en cours...</span>) : "Lancer l'application"}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4 antialiased">
      <div className="flex flex-col items-center mb-6">
        <TrezocashLogo className="w-24 h-24" />
        <h1 className="mt-4 text-5xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>Trezocash</h1>
      </div>
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl flex flex-col" style={{ minHeight: '600px' }}>
        <div className="p-8 border-b">
          <OnboardingProgress current={step + 1} total={steps.length} />
        </div>
        <div className="flex-grow flex flex-col items-center justify-center p-8">
          <div className="w-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full">
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <button onClick={handleBack} disabled={step === 0 || isLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>
          {hasExistingProjects && (
            <button onClick={handleCancel} disabled={isLoading} className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Annuler
            </button>
          )}
          {step < steps.length - 1 && (
            <button onClick={handleNext} disabled={isLoading || (step === 0 && !data.projectName.trim()) || (step === 1 && !data.templateId)} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:bg-gray-400">
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;
