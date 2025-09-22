import React from 'react';
import { Crown, Edit, Eye } from 'lucide-react';

const Avatar = ({ name, role }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  const colors = [
    'bg-red-200 text-red-800', 'bg-orange-200 text-orange-800',
    'bg-amber-200 text-amber-800', 'bg-yellow-200 text-yellow-800',
    'bg-lime-200 text-lime-800', 'bg-green-200 text-green-800',
    'bg-emerald-200 text-emerald-800', 'bg-teal-200 text-teal-800',
    'bg-cyan-200 text-cyan-800', 'bg-sky-200 text-sky-800',
    'bg-blue-200 text-blue-800', 'bg-indigo-200 text-indigo-800',
    'bg-violet-200 text-violet-800', 'bg-purple-200 text-purple-800',
    'bg-fuchsia-200 text-fuchsia-800', 'bg-pink-200 text-pink-800',
    'bg-rose-200 text-rose-800'
  ];

  const colorClass = colors[Math.abs(hashCode(name || '')) % colors.length];

  const roleConfig = {
    Propriétaire: { icon: Crown, color: 'bg-amber-500', label: 'Propriétaire' },
    Éditeur: { icon: Edit, color: 'bg-blue-500', label: 'Éditeur' },
    Lecteur: { icon: Eye, color: 'bg-gray-500', label: 'Lecteur' },
  };

  const currentRole = roleConfig[role];
  const RoleIcon = currentRole?.icon;

  return (
    <div className="relative group">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white ${colorClass}`}>
        {getInitials(name)}
      </div>
      {currentRole && (
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ${currentRole.color}`}>
          <RoleIcon className="w-2 h-2 text-white" />
        </div>
      )}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {name} <span className="font-semibold">({currentRole?.label})</span>
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
      </div>
    </div>
  );
};

export default Avatar;
