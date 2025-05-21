import { BsBuilding } from "react-icons/bs";

interface RestaurantIconProps {
  locationId: number;
  size?: number;
  className?: string;
}

export default function RestaurantIcon({ locationId, size = 16, className = "" }: RestaurantIconProps) {
  // Use a consistent professional look for all locations
  const bgColorClass = "bg-slate-100";
  const textColorClass = "text-slate-700";
  
  // A simple professional icon for all locations
  return (
    <span className={`inline-flex items-center justify-center rounded-full ${bgColorClass} p-1 ${className}`}>
      <BsBuilding style={{ width: size, height: size }} className={textColorClass} />
    </span>
  );
}