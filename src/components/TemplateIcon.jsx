import React from 'react';
import { Home, Briefcase, Plane, Heart, Coffee, HeartHandshake, Book, PiggyBank, Car, Building2, ShoppingBasket, Gift } from 'lucide-react';

const iconMap = {
  Home, Briefcase, Plane, Heart, Coffee, HeartHandshake, Book, PiggyBank, Car, Building2, ShoppingBasket, Gift
};

const TemplateIcon = ({ icon, color, className }) => {
  const IconComponent = iconMap[icon] || Briefcase;
  const colorClass = color ? `text-${color}-500` : 'text-gray-500';

  return <IconComponent className={`${className} ${colorClass}`} />;
};

export default TemplateIcon;
