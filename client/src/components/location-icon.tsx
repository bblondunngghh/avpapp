import { 
  FaBuilding,
  FaBuildingColumns
} from "react-icons/fa6";
import { 
  BsBuilding,
  BsBuildingFill
} from "react-icons/bs";

interface LocationIconProps {
  locationId: number;
  size?: number;
  className?: string;
}

export function getLocationIconDetails(locationId: number) {
  let Icon = BsBuilding;
  let bgColorClass = "bg-slate-100";
  let textColorClass = "text-slate-800";
  
  if (locationId === 1) { // Capital Grille
    Icon = FaBuildingColumns;
    bgColorClass = "bg-slate-100";
    textColorClass = "text-slate-800";
  } else if (locationId === 2) { // Bob's
    Icon = BsBuildingFill;
    bgColorClass = "bg-slate-100";
    textColorClass = "text-slate-800";
  } else if (locationId === 3) { // Truluck's
    Icon = FaBuilding;
    bgColorClass = "bg-slate-100";
    textColorClass = "text-slate-800";
  } else if (locationId === 4) { // BOA
    Icon = BsBuilding;
    bgColorClass = "bg-slate-100";
    textColorClass = "text-slate-800";
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