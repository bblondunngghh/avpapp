import { ImOffice } from "react-icons/im";
import { BiBuildingHouse } from "react-icons/bi";
import { MdBusinessCenter, MdCorporateFare } from "react-icons/md";
import { FaHotel } from "react-icons/fa";
import { TbBuildingSkyscraper } from "react-icons/tb";

interface LocationIconProps {
  locationId: number;
  size?: number;
  className?: string;
}

export function getLocationIconDetails(locationId: number) {
  let Icon = TbBuildingSkyscraper;
  let bgColorClass = "bg-zinc-100";
  let textColorClass = "text-zinc-800";
  
  if (locationId === 1) { // Capital Grille
    Icon = MdCorporateFare;
    bgColorClass = "bg-zinc-100";
    textColorClass = "text-zinc-800";
  } else if (locationId === 2) { // Bob's
    Icon = FaHotel;
    bgColorClass = "bg-zinc-100";
    textColorClass = "text-zinc-800";
  } else if (locationId === 3) { // Truluck's
    Icon = MdBusinessCenter;
    bgColorClass = "bg-zinc-100";
    textColorClass = "text-zinc-800";
  } else if (locationId === 4) { // BOA
    Icon = BiBuildingHouse;
    bgColorClass = "bg-zinc-100";
    textColorClass = "text-zinc-800";
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