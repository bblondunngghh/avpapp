import { FaUtensils, FaWineGlassAlt, FaFish, FaDrumstickBite } from "react-icons/fa";

interface RestaurantIconProps {
  locationId: number;
  size?: number;
  className?: string;
}

export default function RestaurantIcon({ locationId, size = 16, className = "" }: RestaurantIconProps) {
  // Choose icon and colors based on location ID
  let Icon = FaUtensils;
  let bgColorClass = "bg-blue-100";
  let textColorClass = "text-blue-600";
  
  if (locationId === 1) { // Capital Grille
    Icon = FaWineGlassAlt;
    bgColorClass = "bg-blue-100";
    textColorClass = "text-blue-600";
  } else if (locationId === 2) { // Bob's
    Icon = FaDrumstickBite;
    bgColorClass = "bg-red-100";
    textColorClass = "text-red-600";
  } else if (locationId === 3) { // Truluck's
    Icon = FaFish;
    bgColorClass = "bg-teal-100";
    textColorClass = "text-teal-600";
  } else if (locationId === 4) { // BOA
    Icon = FaDrumstickBite; // Different icon appearance but same type
    bgColorClass = "bg-violet-100";
    textColorClass = "text-violet-600";
  }
  
  return (
    <span className={`inline-flex items-center justify-center rounded-full ${bgColorClass} p-1 ${className}`}>
      <Icon style={{ width: size, height: size }} className={textColorClass} />
    </span>
  );
}