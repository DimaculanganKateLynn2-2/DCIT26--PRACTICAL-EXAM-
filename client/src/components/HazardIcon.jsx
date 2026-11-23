import { Candy, Grape, Leaf, Pill, Flower2, SprayCan, AlertTriangle, Milk, Utensils } from 'lucide-react';

// Keep existing content records unchanged; render standard Lucide SVGs in place of emoji.
const iconsBySymbol = {
  '🍫': Candy, '🍬': Candy, '🍭': Candy, '🍇': Grape, '🧅': Utensils,
  '🧄': Utensils, '💊': Pill, '🌿': Leaf, '🌱': Leaf, '🌸': Flower2,
  '💐': Flower2, '🧼': SprayCan, '🧴': SprayCan, '🥛': Milk,
};

export default function HazardIcon({ symbol, size = 26, className = '' }) {
  const Icon = iconsBySymbol[symbol] || AlertTriangle;
  return <Icon size={size} strokeWidth={1.8} className={className} aria-hidden="true" focusable="false" />;
}
