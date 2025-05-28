import { GiMeat, GiSteak, GiWineGlass } from "react-icons/gi";
import { FaFish } from "react-icons/fa";

interface LocationIconProps {
  locationId: number;
  size?: number;
  className?: string;
}

export function getLocationIconDetails(locationId: number) {
  let Icon = GiSteak;
  let bgColorClass = "bg-zinc-100";
  let textColorClass = "text-zinc-800";
  
  if (locationId === 1) { // Capital Grille - Steakhouse
    Icon = GiSteak;
    bgColorClass = "bg-red-100";
    textColorClass = "text-red-800";
  } else if (locationId === 2) { // Bob's Steak - Steakhouse
    Icon = GiMeat;
    bgColorClass = "bg-orange-100";
    textColorClass = "text-orange-800";
  } else if (locationId === 3) { // Truluck's - Seafood
    Icon = FaFish;
    bgColorClass = "bg-blue-100";
    textColorClass = "text-blue-800";
  } else if (locationId === 4) { // BOA - Steakhouse & Wine Bar
    Icon = GiWineGlass;
    bgColorClass = "bg-purple-100";
    textColorClass = "text-purple-800";
  }
  
  return { Icon, bgColorClass, textColorClass };
}

export default function LocationIcon({ locationId, size = 16, className = "" }: LocationIconProps) {
  const { Icon, bgColorClass, textColorClass } = getLocationIconDetails(locationId);
  
  return (
    <span className={`inline-flex items-center justify-center rounded-full ${bgColorClass} p-1 ${className}`}>
      <Icon className={`${textColorClass}`} style={{ width: size, height: size }} />
    </span>
  );
}