import React from 'react';
import { X, Globe } from 'lucide-react';
import TimezoneSettingsView from './TimezoneSettingsView';

const SettingsDrawerWrapper = ({ activeDrawer, onClose }) => {

  if (!activeDrawer) return null;

  const drawerConfig = {
    timezoneSettings: { title: 'Fuseau Horaire', icon: Globe, color: 'text-cyan-500', component: <TimezoneSettingsView /> },
  };

  const currentConfig = drawerConfig[activeDrawer];
  if (!currentConfig) return null;

  const Icon = currentConfig.icon;

  return (
    <>
      <div className="fixed inset-0 bg-black z-40 transition-opacity bg-opacity-60" onClick={onClose}></div>
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-4xl bg-gray-50 shadow-xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <h2 className={`text-lg font-semibold text-gray-800 flex items-center gap-3`}><Icon className={`w-6 h-6 ${currentConfig.color}`} />{currentConfig.title}</h2>
            <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-grow p-6 overflow-y-auto">{currentConfig.component}</div>
        </div>
      </div>
    </>
  );
};

export default SettingsDrawerWrapper;
