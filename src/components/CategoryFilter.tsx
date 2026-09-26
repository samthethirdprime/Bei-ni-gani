import React from 'react';
import { 
  ShoppingBag, 
  Utensils, 
  Hammer, 
  Tv, 
  Home, 
  Shirt, 
  Armchair, 
  Car, 
  Wrench, 
  Sparkles,
  Layers
} from 'lucide-react';
import { CategoryKey } from '../types';

interface CategoryFilterProps {
  selectedCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
}

interface CategoryOption {
  key: CategoryKey;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'all', label: 'All Items', icon: <Layers className="w-4 h-4" /> },
  { key: 'groceries', label: 'Groceries & Food', icon: <Utensils className="w-4 h-4" /> },
  { key: 'hardware', label: 'Building & Hardware', icon: <Hammer className="w-4 h-4" /> },
  { key: 'electronics', label: 'Electronics', icon: <Tv className="w-4 h-4" /> },
  { key: 'housing', label: 'Housing & Rent', icon: <Home className="w-4 h-4" /> },
  { key: 'clothing', label: 'Clothing', icon: <Shirt className="w-4 h-4" /> },
  { key: 'furniture', label: 'Furniture', icon: <Armchair className="w-4 h-4" /> },
  { key: 'transport', label: 'Transport', icon: <Car className="w-4 h-4" /> },
  { key: 'services', label: 'Fundis & Services', icon: <Wrench className="w-4 h-4" /> },
  { key: 'beauty', label: 'Beauty & Kinyozi', icon: <Sparkles className="w-4 h-4" /> }
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max px-0.5">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                isSelected
                  ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-neutral-900/60 hover:bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <span className={isSelected ? 'text-neutral-950' : 'text-emerald-400'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
