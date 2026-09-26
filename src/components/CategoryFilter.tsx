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
  Layers,
  Dumbbell,
  Footprints,
  Baby,
  Coffee,
  Heart
} from 'lucide-react';
import { CategoryKey } from '../types';

interface CategoryFilterProps {
  selectedCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
  categoryCounts?: Record<string, number>;
  dynamicCategories?: string[];
}

interface CategoryConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const DEFAULT_CATEGORY_CONFIGS: CategoryConfig[] = [
  { key: 'all', label: 'All Items', icon: <Layers className="w-4 h-4" /> },
  { key: 'groceries', label: 'Groceries & Food', icon: <Utensils className="w-4 h-4" /> },
  { key: 'clothing', label: 'Clothing & Fashion', icon: <Shirt className="w-4 h-4" /> },
  { key: 'footwear', label: 'Footwear & Shoes', icon: <Footprints className="w-4 h-4" /> },
  { key: 'household', label: 'Household & Gas', icon: <Home className="w-4 h-4" /> },
  { key: 'kitchen', label: 'Kitchen & Dining', icon: <Coffee className="w-4 h-4" /> },
  { key: 'personal_care', label: 'Personal Care & Beauty', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'fitness', label: 'Fitness & Sports', icon: <Dumbbell className="w-4 h-4" /> },
  { key: 'electronics', label: 'Electronics & Gadgets', icon: <Tv className="w-4 h-4" /> },
  { key: 'hardware', label: 'Building & Hardware', icon: <Hammer className="w-4 h-4" /> },
  { key: 'furniture', label: 'Furniture & Decor', icon: <Armchair className="w-4 h-4" /> },
  { key: 'automotive', label: 'Automotive & Spares', icon: <Car className="w-4 h-4" /> },
  { key: 'services', label: 'Fundis & Services', icon: <Wrench className="w-4 h-4" /> },
  { key: 'baby', label: 'Baby & Family', icon: <Baby className="w-4 h-4" /> },
  { key: 'housing', label: 'Housing & Rent', icon: <Home className="w-4 h-4" /> },
  { key: 'transport', label: 'Transport & Fares', icon: <Car className="w-4 h-4" /> }
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
  dynamicCategories = []
}) => {
  // Merge default categories with any dynamic categories present in the database
  const allCategories: CategoryConfig[] = [...DEFAULT_CATEGORY_CONFIGS];

  for (const dynCat of dynamicCategories) {
    const slug = dynCat.toLowerCase().trim();
    if (!allCategories.some(c => c.key === slug)) {
      const label = dynCat.charAt(0).toUpperCase() + dynCat.slice(1);
      allCategories.push({
        key: slug,
        label,
        icon: <ShoppingBag className="w-4 h-4" />
      });
    }
  }

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max px-0.5">
        {allCategories.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          const count = categoryCounts[cat.key];

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
              {typeof count === 'number' && count > 0 && cat.key !== 'all' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-neutral-950/20 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
