import { Cat, Dog } from 'lucide-react';

// Original open-source Lucide SVG artwork, not AI-generated imagery.
export default function PetSpeciesIcon({ species, size = 30, className = '' }) {
  const Icon = species === 'Cat' ? Cat : Dog;
  return <Icon size={size} strokeWidth={1.7} className={className} aria-hidden="true" focusable="false" />;
}
