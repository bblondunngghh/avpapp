import { FaUtensils, FaWineGlassAlt, FaFish } from "react-icons/fa";
import { GiMeat } from "react-icons/gi";

interface LocationIconProps {
  locationId: number;
  size?: number;
  className?: string;
}

export function getLocationIconDetails(locationId: number) {
  let Icon = FaUtensils;
  let bgColorClass = "bg-blue-100";
  let textColorClass = "text-blue-600";
  
  if (locationId === 1) { // Capital Grille
    Icon = FaWineGlassAlt;
    bgColorClass = "bg-blue-100";
    textColorClass = "text-blue-600";
  } else if (locationId === 2) { // Bob's
    Icon = GiMeat;
    bgColorClass = "bg-red-100";
    textColorClass = "text-red-600";
  } else if (locationId === 3) { // Truluck's
    Icon = FaFish;
    bgColorClass = "bg-teal-100";
    textColorClass = "text-teal-600";
  } else if (locationId === 4) { // BOA
    Icon = GiMeat;
    bgColorClass = "bg-violet-100";
    textColorClass = "text-violet-600";
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