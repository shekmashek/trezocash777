import React from 'react';
import { Home, Briefcase, Plane, Heart, Coffee, HeartHandshake, Book, PiggyBank, Car, Building2, ShoppingBasket, Gift } from 'lucide-react';

const icons = [
  { name: 'Home', component: Home }, { name: 'Briefcase', component: Briefcase },
  { name: 'Plane', component: Plane }, { name: 'Heart', component: Heart },
  { name: 'Coffee', component: Coffee }, { name: 'HeartHandshake', component: HeartHandshake },
  { name: 'Book', component: Book }, { name: 'PiggyBank', component: PiggyBank },
  { name: 'Car', component: Car }, { name: 'Building2', component: Building2 },
  { name: 'ShoppingBasket', component: ShoppingBasket }, { name: 'Gift', component: Gift },
];

const colors = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

const colorClasses = {
  bg: { red: 'bg-red-500', orange: 'bg-orange-500', amber: 'bg-amber-500', yellow: 'bg-yellow-500', lime: 'bg-lime-500', green: 'bg-green-500', emerald: 'bg-emerald-500', teal: 'bg-teal-500', cyan: 'bg-cyan-500', sky: 'bg-sky-500', blue: 'bg-blue-500', indigo: 'bg-indigo-500', violet: 'bg-violet-500', purple: 'bg-purple-500', fuchsia: 'bg-fuchsia-500', pink: 'bg-pink-500', rose: 'bg-rose-500' },
  ring: { red: 'ring-red-500', orange: 'ring-orange-500', amber: 'ring-amber-500', yellow: 'ring-yellow-500', lime: 'ring-lime-500', green: 'ring-green-500', emerald: 'ring-emerald-500', teal: 'ring-teal-500', cyan: 'ring-cyan-500', sky: 'ring-sky-500', blue: 'ring-blue-500', indigo: 'ring-indigo-500', violet: 'ring-violet-500', purple: 'ring-purple-500', fuchsia: 'ring-fuchsia-500', pink: 'ring-pink-500', rose: 'ring-rose-500' }
};

const IconPicker = ({ value, onChange }) => {
  const { icon: selectedIconName, color: selectedColorName } = value || {};

  const handleIconSelect = (iconName) => {
    onChange({ ...value, icon: iconName });
  };

  const handleColorSelect = (colorName) => {
    onChange({ ...value, color: colorName });
  };

  return (
    <div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Icône</label>
        <div className="grid grid-cols-6 gap-2">
          {icons.map(({ name, component: IconComponent }) => (
            <button
              key={name}
              type="button"
              onClick={() => handleIconSelect(name)}
              className={`p-3 border rounded-lg flex items-center justify-center transition-colors ${selectedIconName === name ? `ring-2 ring-blue-500 bg-blue-50` : 'hover:bg-gray-100'}`}
            >
              <IconComponent className="w-6 h-6 text-gray-700" />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
        <div className="flex flex-wrap gap-2">
          {colors.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(color)}
              className={`w-8 h-8 rounded-full ${colorClasses.bg[color]} transition-transform transform hover:scale-110 ${selectedColorName === color ? `ring-2 ring-offset-2 ${colorClasses.ring[color]}` : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
