import React, { useState } from 'react';
import { X, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface AddItemModalProps {
  initialName?: string;
  onClose: () => void;
  onAddProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'confirmsCount' | 'outdatesCount' | 'flaggedCount' | 'reportsCount'>) => Promise<void>;
}

const CATEGORY_OPTIONS = [
  { value: 'groceries', label: 'Groceries & Food' },
  { value: 'household', label: 'Household Items' },
  { value: 'hardware', label: 'Building & Hardware' },
  { value: 'electronics', label: 'Electronics & Gadgets' },
  { value: 'clothing', label: 'Clothing & Footwear' },
  { value: 'furniture', label: 'Furniture & Decor' },
  { value: 'automotive', label: 'Automotive & Spares' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'housing', label: 'Housing & Rent' },
  { value: 'transport', label: 'Transport & Fares' },
  { value: 'services', label: 'Fundis & Professional Services' }
];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  initialName = '',
  onClose,
  onAddProduct
}) => {
  const [name, setName] = useState(initialName);
  const [swahiliName, setSwahiliName] = useState('');
  const [category, setCategory] = useState('groceries');
  const [pricePaid, setPricePaid] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('1 piece');
  const [unit, setUnit] = useState('piece');
  const [county, setCounty] = useState('Nairobi');
  const [area, setArea] = useState('');
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pricePaid || Number(pricePaid) <= 0) return;

    setSubmitting(true);
    try {
      const priceNum = Number(pricePaid);
      // Auto-compute reasonable initial min/max range for community item
      const minEst = Math.round(priceNum * 0.9);
      const maxEst = Math.round(priceNum * 1.15);

      const aliases = [name.toLowerCase().trim()];
      if (swahiliName.trim()) {
        aliases.push(swahiliName.toLowerCase().trim());
      }

      await onAddProduct({
        name: name.trim(),
        swahiliName: swahiliName.trim() || undefined,
        aliases,
        category,
        sizeOrQuantity: quantity.trim() || 'Standard',
        unit: unit.trim() || 'piece',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
        typicalPrice: priceNum,
        minPrice: minEst,
        maxPrice: maxEst,
        priceType: 'COMMUNITY_REPORT',
        county,
        town: area.trim() || county,
        area: area.trim() || undefined,
        retailerOrSource: storeName.trim() || 'Community Contributor',
        dateCollected: 'Just Now',
        description: description.trim() || `Community added price report from ${county}.`,
        isCommunityAdded: true
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-lg font-black text-white font-['Space_Grotesk'] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Add Missing Item
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Add a product or service price to the Kenyan community database.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">Item Added Successfully!</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Your item is now live and searchable by anyone checking prices on Bei Gani!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Item Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                Item / Service Name*
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Avocado, Car wash pickup, Gas cylinder 13kg"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white font-semibold text-sm focus:outline-none"
              />
            </div>

            {/* Swahili / Local Alias */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Swahili Name or Local Alias (Optional)
              </label>
              <input
                type="text"
                value={swahiliName}
                onChange={(e) => setSwahiliName(e.target.value)}
                placeholder="e.g. Parachichi, Ovacado, Mtungi wa gas"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Category*
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1">
                  Price Paid (KSh)*
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-neutral-400 font-bold text-xs">
                    KSh
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={pricePaid}
                    onChange={(e) => setPricePaid(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl pl-11 pr-3 py-2 text-xs text-white font-bold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quantity / Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Quantity / Size
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 1 piece, 500g, per trip"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="piece, kg, month, liter"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Location (County & Area) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  County*
                </label>
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Kisumu">Kisumu</option>
                  <option value="Nakuru">Nakuru</option>
                  <option value="Kiambu">Kiambu</option>
                  <option value="Kajiado">Kajiado</option>
                  <option value="Machakos">Machakos</option>
                  <option value="Uasin Gishu">Uasin Gishu</option>
                  <option value="Other">Other County</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Area / Market / Estate
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Rongai, South B, Gikomba"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Store / Seller */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Store or Seller Name (Optional)
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Mama Mboga, Carrefour, Local Kiosk"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Context / Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Where you bought it, whether price varies by time of day, etc."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !name.trim() || !pricePaid}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                {submitting ? 'Adding Item...' : '+ Add Item to Catalog'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
