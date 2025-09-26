import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { supabase } from '../utils/supabase';
import { Save, User, Shield, CreditCard, FileText, HelpCircle, LogOut, Table, ArrowDownUp, HandCoins, PieChart, Layers, BookOpen, Cog, Users, FolderKanban, Wallet, Archive, Clock, FolderCog, Globe, Target, Calendar, Plus, FilePlus, Banknote, AreaChart, Receipt, Hash, LayoutDashboard, Trash2, Eye, LayoutTemplate, Lock, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import SubscriptionBadge from './SubscriptionBadge';
import ProjectCollaborators from './ProjectCollaborators';
import ProjectSwitcher from './ProjectSwitcher';

const SettingsLink = ({ item, onClick }) => {
  const Icon = item.icon;
  return (
    <li title={item.label}>
      <button 
        onClick={onClick} 
        disabled={item.disabled}
        className={`flex items-center w-full h-10 px-4 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${item.color}`} />
        <span className={`ml-4`}>
          {item.label}
        </span>
      </button>
    </li>
  );
};

const SubHeader = () => {
  const { dataState } = useData();
  const { uiState, uiDispatch } = useUI();
  const { profile, session } = dataState;
  const { isTourActive, tourHighlightId } = uiState;
  const navigate = useNavigate();
  const location = useLocation();

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsPopoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) setIsAvatarMenuOpen(false);
      if (settingsPopoverRef.current && !settingsPopoverRef.current.contains(event.target)) setIsSettingsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la déconnexion: ${error.message}`, type: 'error' } });
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsSettingsOpen(false);
    setIsAvatarMenuOpen(false);
  };

  const menuItems = [
    { title: 'Mon profil', icon: User, path: '/app/profil' },
    { title: 'Mot de passe et sécurité', icon: Shield, path: '/app/securite' },
    { title: 'Mon abonnement', icon: CreditCard, path: '/app/abonnement' },
    { title: 'Factures', icon: FileText, path: '/app/factures' },
    { title: 'Supprimer mon compte', icon: Trash2, path: '/app/delete-account', isDestructive: true },
    { title: 'Centre d\'aide', icon: HelpCircle, path: '/app/aide' },
  ];

  const advancedNavItems = [
    { id: 'journal-budget', label: 'Journal du Budget', icon: BookOpen, color: 'text-yellow-600', path: '/app/journal-budget' },
    { id: 'journal-paiements', label: 'Journal des Paiements', icon: Receipt, color: 'text-blue-600', path: '/app/journal-paiements' },
  ];

  const settingsItems = [
    { id: 'projectSettings', label: 'Paramètres du Projet', icon: FolderCog, color: 'text-blue-500' },
    { id: '/app/collaborateurs', label: 'Collaborateurs', icon: Users, color: 'text-purple-500' },
    { id: '/app/templates', label: 'Mes Modèles', icon: LayoutTemplate, color: 'text-indigo-500' },
    { id: '/app/provisions', label: 'Suivi des Provisions', icon: Lock, color: 'text-orange-500' },
    { id: '/app/display-settings', label: 'Affichage et Devise', icon: Eye, color: 'text-green-500' },
    { id: '/app/categories', label: 'Catégories', icon: FolderKanban, color: 'text-orange-500' },
    { id: '/app/tiers', label: 'Tiers', icon: Users, color: 'text-pink-500' },
    { id: '/app/comptes', label: 'Comptes', icon: Wallet, color: 'text-teal-500' },
    { id: 'timezoneSettings', label: 'Fuseau Horaire', icon: Globe, color: 'text-cyan-500' },
    { id: '/app/archives', label: 'Archives', icon: Archive, color: 'text-slate-500' },
  ];

  const handleSettingsItemClick = (itemId) => {
    if (itemId.startsWith('/app/')) {
        handleNavigate(itemId);
    } else {
      uiDispatch({ type: 'SET_ACTIVE_SETTINGS_DRAWER', payload: itemId });
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
  
  const isProjectSwitcherHighlighted = isTourActive && tourHighlightId === '#project-switcher';

  const subscriptionDetails = useMemo(() => {
    if (!profile) return null;
    const status = profile.subscriptionStatus;
    if (status === 'lifetime') return 'Statut : Accès à Vie';
    if (status === 'active') {
        return 'Statut : Abonnement Pro';
    }
    const trialEndDate = profile.trialEndsAt ? new Date(profile.trialEndsAt) :
                         session?.user?.created_at ? new Date(new Date(session.user.created_at).setDate(new Date(session.user.created_at).getDate() + 14)) : null;
    if (trialEndDate) {
        const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        if (daysLeft > 0) {
            return `Statut : Essai gratuit (${daysLeft} jours restants)`;
        }
    }
    return 'Statut : Essai terminé';
  }, [profile, session]);

  return (
    <>
      <div className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="py-2 flex w-full items-center justify-between">
            {/* Left Group */}
            <div className="flex items-center gap-4">
              <div id="project-switcher" className={`w-auto min-w-[10rem] max-w-xs rounded-lg transition-all ${isProjectSwitcherHighlighted ? 'relative z-[1000] ring-4 ring-blue-500 ring-offset-4 ring-offset-black/60' : ''}`}>
                <ProjectSwitcher />
              </div>
              <ProjectCollaborators />
            </div>

            {/* Center Group */}
            <nav className="flex items-center gap-1">
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                const isHighlighted = isTourActive && tourHighlightId === `#tour-step-${item.id}`;
                return (
                  <button
                    key={item.id}
                    id={`tour-step-${item.id}`}
                    onClick={() => handleNavigate(item.path)}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    } ${isHighlighted ? 'relative z-[1000] ring-4 ring-blue-500 ring-offset-4 ring-offset-black/60' : ''}`}
                    title={item.label}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Group */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
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
                          >
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
                                          <p className="text-sm font-semibold text-gray-800">{profile?.fullName || 'Utilisateur'}</p>
                                          <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubHeader;
