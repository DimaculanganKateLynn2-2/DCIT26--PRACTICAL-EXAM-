// Free, open-source Lucide React icons (ISC license).
// Icons are SVG components, not AI-generated images.
import {
  ArrowRight,
  Bot,
  ClipboardList,
  HeartPulse,
  MapPinned,
  PawPrint,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

const icons = {
  arrow: ArrowRight,
  bot: Bot,
  clipboard: ClipboardList,
  heart: HeartPulse,
  map: MapPinned,
  paw: PawPrint,
  shield: ShieldCheck,
  stethoscope: Stethoscope,
};

export default function VetCareIcon({ name, size = 22, className = '' }) {
  const Icon = icons[name] || PawPrint;
  return <Icon size={size} strokeWidth={1.8} className={className} aria-hidden="true" focusable="false" />;
}
