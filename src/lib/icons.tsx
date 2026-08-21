import {
  Waves, Dumbbell, Users, WashingMachine, ShieldCheck, Car, Flame,
  Laptop, Sun, PawPrint, MoveVertical, Umbrella, Sparkles, type LucideIcon,
} from "lucide-react";

const AMENITY_ICONS: Record<string, LucideIcon> = {
  "piscina": Waves,
  "gimnasio": Dumbbell,
  "sum": Users,
  "seguridad 24hs": ShieldCheck,
  "cochera": Car,
  "laundry": WashingMachine,
  "parrilla": Flame,
  "coworking": Laptop,
  "solarium": Sun,
  "pet friendly": PawPrint,
  "ascensor": MoveVertical,
  "terraza": Umbrella,
};

export function getAmenityIcon(name: string): LucideIcon {
  return AMENITY_ICONS[name.trim().toLowerCase()] ?? Sparkles;
}
