import { 
  FaUtensils, 
  FaWineBottle, 
  FaCocktail, 
  FaBuilding
} from "react-icons/fa";
import { 
  GiCow, 
  GiShrimp, 
  GiSteakKnife,
  GiRoastChicken 
} from "react-icons/gi";
import { BsFillBuildingsFill } from "react-icons/bs";

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
    Icon = GiSteakKnife;
    bgColorClass = "bg-blue-100";
    textColorClass = "text-blue-700";
  } else if (locationId === 2) { // Bob's
    Icon = GiCow;
    bgColorClass = "bg-red-100";
    textColorClass = "text-red-700";
  } else if (locationId === 3) { // Truluck's
    Icon = GiShrimp;
    bgColorClass = "bg-teal-100";
    textColorClass = "text-teal-700";
  } else if (locationId === 4) { // BOA
    Icon = GiRoastChicken;
    bgColorClass = "bg-amber-100";
    textColorClass = "text-amber-700";
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