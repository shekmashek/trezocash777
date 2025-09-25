import React, { useMemo, useState, useRef, useEffect } from 'react';
<<<<<<< HEAD
import { useAuth } from '../context/AuthContext';
import { Save, User, Shield, CreditCard, FileText, HelpCircle, LogOut, Table, ArrowDownUp, HandCoins, PieChart, Layers, BookOpen, Cog, Users, FolderKanban, Wallet, Archive, Clock, FolderCog, Globe, Target, Calendar, Plus, FilePlus, Banknote, Maximize, AreaChart, Receipt, Hash, LayoutDashboard, Trash2, Eye, LayoutTemplate } from 'lucide-react';
=======
import { useBudget } from '../context/BudgetContext';
import { supabase } from '../utils/supabase';
import { Save, User, Shield, CreditCard, FileText, HelpCircle, LogOut, Table, ArrowDownUp, HandCoins, PieChart, Layers, BookOpen, Cog, Users, FolderKanban, Wallet, Archive, Clock, FolderCog, Globe, Target, Calendar, Plus, FilePlus, Banknote, AreaChart, Receipt, Hash, LayoutDashboard, Trash2, Eye, LayoutTemplate, Lock, ListChecks } from 'lucide-react';
>>>>>>> 6aa97f03da2f3baafdf26877917b0fc397621040
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../utils/i18n';
import ProjectSwitcher from './ProjectSwitcher';
import FlagIcon from './FlagIcon';
import { useNavigate, useLocation } from 'react-router-dom';
import SubscriptionBadge from './SubscriptionBadge';
import ProjectCollaborators from './ProjectCollaborators';

const SettingsLink = ({ item, onClick }) => {
  const Icon = item.icon;
  return (
    <li title={item.label}>
      <button 
        onClick={onClick} 
        disabled={item.disabled}
        className={`flex items-center w-full h-10 px-4 rounded-lg text-sm font-medium transition-colors text-text-secondary hover:bg-secondary-100 hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${item.color}`} />
        <span className="ml-4">{item.label}</span>
      </button>
    </li>
  );
};

const SubHeader = ({ onOpenSettingsDrawer, onNewBudgetEntry, onNewScenario, isConsolidated }) => {
  const { user, logout } = useAuth();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLangPopoverOpen, setIsLangPopoverOpen] = useState(false);
  const langPopoverRef = useRef(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsPopoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langPopoverRef.current && !langPopoverRef.current.contains(event.target)) setIsLangPopoverOpen(false);
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) setIsAvatarMenuOpen(false);
      if (settingsPopoverRef.current && !settingsPopoverRef.current.contains(event.target)) setIsSettingsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLang) => {
    // Ici tu peux mettre un dispatcher global si tu en as, sinon stocker dans local state
    setIsLangPopoverOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsSettingsOpen(false);
    setIsAvatarMenuOpen(false);
  };

<<<<<<< HEAD
  const handleFocusClick = () => {
    const currentView = location.pathname.split('/')[2] || 'dashboard';
    let focusTarget;
    switch (currentView) {
        case 'analyse': focusTarget = 'expenseAnalysis'; break;
        case 'echeancier': focusTarget = 'schedule'; break;
        case 'flux': focusTarget = 'chart'; break;
        case 'scenarios': focusTarget = 'scenarios'; break;
        default: focusTarget = 'table'; break;
    }
    console.log('Focus sur:', focusTarget);
  };

=======
>>>>>>> 6aa97f03da2f3baafdf26877917b0fc397621040
  const menuItems = [
    { title: 'Mon profil', icon: User, path: '/app/profil' },
    { title: 'Mot de passe et sécurité', icon: Shield, path: '/app/securite' },
    { title: 'Mon abonnement', icon: CreditCard, path: '/app/abonnement' },
    { title: 'Factures', icon: FileText, path: '/app/factures' },
    { title: 'Supprimer mon compte', icon: Trash2, path: '/app/delete-account', isDestructive: true },
    { title: 'Centre d\'aide', icon: HelpCircle, path: '/app/aide' },
  ];

  const advancedNavItems = [
    { id: 'journal-budget', label: t('nav.budgetJournal'), icon: BookOpen, color: 'text-yellow-600', path: '/app/journal-budget' },
    { id: 'journal-paiements', label: t('nav.paymentJournal'), icon: Receipt, color: 'text-blue-600', path: '/app/journal-paiements' },
  ];

  const settingsItems = [
    { id: 'projectSettings', label: 'Paramètres du Projet', icon: FolderCog, color: 'text-blue-500' },
    { id: '/app/collaborateurs', label: 'Collaborateurs', icon: Users, color: 'text-purple-500' },
    { id: '/app/templates', label: 'Mes Modèles', icon: LayoutTemplate, color: 'text-indigo-500' },
    { id: '/app/provisions', label: 'Suivi des Provisions', icon: Lock, color: 'text-orange-500' },
    { id: '/app/display-settings', label: 'Affichage et Devise', icon: Eye, color: 'text-green-500' },
    { id: '/app/categories', label: t('advancedSettings.categories'), icon: FolderKanban, color: 'text-orange-500' },
    { id: '/app/tiers', label: t('advancedSettings.tiers'), icon: Users, color: 'text-pink-500' },
    { id: '/app/comptes', label: t('advancedSettings.accounts'), icon: Wallet, color: 'text-teal-500' },
    { id: 'timezoneSettings', label: 'Fuseau Horaire', icon: Globe, color: 'text-cyan-500' },
    { id: '/app/archives', label: t('advancedSettings.archives'), icon: Archive, color: 'text-slate-500' },
  ];

<<<<<<< HEAD
  const newMenuItems = [
    { label: 'Budget prévisionnel', icon: FilePlus, action: onNewBudgetEntry, disabled: isConsolidated },
    { label: 'Entrée reçue', icon: HandCoins, action: () => console.log('Encaisser entrée'), disabled: isConsolidated },
    { label: 'Sortie payée', icon: Banknote, action: () => console.log('Payer sortie'), disabled: isConsolidated },
    { label: 'Scénario', icon: Layers, action: onNewScenario, disabled: isConsolidated },
    { label: 'Compte de liquidité', icon: Wallet, action: () => navigate('/app/comptes'), disabled: isConsolidated }
  ];

=======
>>>>>>> 6aa97f03da2f3baafdf26877917b0fc397621040
  const handleSettingsItemClick = (itemId) => {
    if (itemId.startsWith('/app/')) {
        handleNavigate(itemId);
    } else if (typeof onOpenSettingsDrawer === 'function') {
      onOpenSettingsDrawer(itemId);
    }
    setIsSettingsOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/app/dashboard' },
    { id: 'budget', label: 'Budget', path: '/app/budget' },
    { id: 'trezo', label: 'Trezo', path: '/app/trezo' },
    { id: 'flux', label: 'Flux', path: '/app/flux' },
    { id: 'echeancier', label: 'Echeancier', path: '/app/echeancier' },
    { id: 'scenarios', label: 'Scénarios', path: '/app/scenarios' },
    { id: 'analyse', label: 'Analyse', path: '/app/analyse' },
  ];

  return (
    <div className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200">
      <div className="container mx-auto px-6">
        <div className="py-2 flex w-full items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <ProjectSwitcher />
            <ProjectCollaborators />
          </div>

          {/* Center */}
          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold ${location.pathname === item.path ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-4">
            {/* Nouveau */}
            <div className="relative" ref={newMenuRef}>
              <button onClick={() => setIsNewMenuOpen(p => !p)} className="flex items-center gap-2 px-3 h-9 rounded-md bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Nouveau
              </button>
              <AnimatePresence>
                {isNewMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20"
                  >
<<<<<<< HEAD
                    <ul className="p-2">
                      {newMenuItems.map(item => (
                        <li key={item.label}>
                          <button
                            onClick={() => { if (!item.disabled) { item.action(); setIsNewMenuOpen(false); } }}
                            disabled={item.disabled}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
=======
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Group */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative" ref={langPopoverRef}>
                        <button
                            onClick={() => setIsLangPopoverOpen(p => !p)}
                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Changer la langue"
                        >
                            <FlagIcon lang={lang} className="w-6 h-auto rounded-sm" />
                        </button>
                        <AnimatePresence>
                        {isLangPopoverOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border z-20 p-1"
                            >
                                <button onClick={() => handleLanguageChange('fr')} className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-gray-100 flex items-center gap-3">
                                    <FlagIcon lang="fr" className="w-5 h-auto rounded-sm" />
                                    Français
                                </button>
                                <button onClick={() => handleLanguageChange('en')} className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-gray-100 flex items-center gap-3">
                                    <FlagIcon lang="en" className="w-5 h-auto rounded-sm" />
                                    English
                                </button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                    <div className="relative" ref={settingsPopoverRef}>
                        <button
                            onClick={() => setIsSettingsOpen(p => !p)}
                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Paramètres avancés"
                        >
                            <Cog className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                            {isSettingsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20"
                                >
                                    <div className="p-2">
                                      <ul className="space-y-1">
                                        {advancedNavItems.map(item => (
                                          <SettingsLink 
                                            key={item.id} 
                                            item={item} 
                                            onClick={() => handleNavigate(item.path)} 
                                          />
                                        ))}
                                      </ul>
                                      <hr className="my-2" />
                                      <ul className="space-y-1">
                                        {settingsItems.map(item => (
                                          <SettingsLink 
                                            key={item.id} 
                                            item={item} 
                                            onClick={() => handleSettingsItemClick(item.id)} 
                                          />
                                        ))}
                                      </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-2">
                      <SubscriptionBadge />
                      <div className="relative" ref={avatarMenuRef}>
                          <button 
                              onClick={() => setIsAvatarMenuOpen(p => !p)}
                              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                              title="Profil utilisateur"
>>>>>>> 6aa97f03da2f3baafdf26877917b0fc397621040
                          >
                            <item.icon className="w-4 h-4 text-gray-500" />
                            <span>{item.label}</span>
                          </button>
<<<<<<< HEAD
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
=======
                          <AnimatePresence>
                              {isAvatarMenuOpen && (
                                  <motion.div
                                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20"
                                  >
                                      <div className="px-4 py-3 border-b">
                                          <p className="text-sm font-semibold text-gray-800">{state.profile?.fullName || 'Utilisateur'}</p>
                                          <p className="text-xs text-gray-500 truncate">{state.session?.user?.email}</p>
                                          {subscriptionDetails && <p className="text-xs font-semibold text-blue-600 mt-1">{subscriptionDetails}</p>}
                                      </div>
                                      <div className="p-1">
                                          {menuItems.map((item) => (
                                              <button 
                                                  key={item.title}
                                                  onClick={() => handleNavigate(item.path)}
                                                  className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md ${
                                                      item.isDestructive 
                                                      ? 'text-red-600 hover:bg-red-50' 
                                                      : 'text-gray-700 hover:bg-gray-100'
                                                  }`}
                                              >
                                                  <item.icon className="w-4 h-4" />
                                                  <span>{item.title}</span>
                                              </button>
                                          ))}
                                          <div className="h-px bg-gray-200 my-1 mx-1"></div>
                                          <button 
                                              onClick={handleLogout}
                                              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50"
                                          >
                                              <LogOut className="w-4 h-4" />
                                              <span>Se déconnecter</span>
                                          </button>
                                      </div>
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                    </div>
                </div>
>>>>>>> 6aa97f03da2f3baafdf26877917b0fc397621040
            </div>

            {/* Langue */}
            <div className="relative" ref={langPopoverRef}>
              <button onClick={() => setIsLangPopoverOpen(p => !p)} className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <FlagIcon lang={lang} className="w-6 h-auto rounded-sm" />
              </button>
            </div>

            {/* Avatar */}
            <div className="relative" ref={avatarMenuRef}>
              <button onClick={() => setIsAvatarMenuOpen(p => !p)} className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <User className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {isAvatarMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20"
                  >
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-semibold text-gray-800">{user?.fullName || 'Utilisateur'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      {menuItems.map(item => (
                        <button 
                          key={item.title}
                          onClick={() => handleNavigate(item.path)}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md ${item.isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </button>
                      ))}
                      <div className="h-px bg-gray-200 my-1 mx-1"></div>
                      <button onClick={logout} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50">
                        <LogOut className="w-4 h-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Focus */}
            <button onClick={handleFocusClick} className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubHeader;
