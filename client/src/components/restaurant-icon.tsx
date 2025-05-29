import { GiKnifeFork, GiChefToque, GiFishCooked, GiWineGlass } from "react-icons/gi";

interface RestaurantIconProps {
  locationId: number;
  size?: number;
  className?: string;
}

export default function RestaurantIcon({ locationId, size = 16, className = "" }: RestaurantIconProps) {
  // Choose icon and colors based on location ID
  let Icon = GiKnifeFork;
  let bgColorClass = "bg-zinc-100";
  let textColorClass = "text-zinc-800";
  
  if (locationId === 1) { // Capital Grille - Steak focused
    Icon = GiKnifeFork;
    bgColorClass = "bg-zinc-100";
    textColorClass = "text-zinc-800";
  } else if (locationId === 2) { // Bob's Steak and Chop House - Steak focused
    Icon = GiChefToque;
    bgColorClass = "bg-zinc-100";
    textColorClass = "text-zinc-800";
  } else if (locationId === 3) { // Truluck's - Seafood focused
    Icon = GiFishCooked;
    bgColorClass = "bg-zinc-100";
    textColorClass = "text-zinc-800";
  } else if (locationId === 4) { // BOA Steakhouse - Wine focused
    Icon = GiWineGlass;
    bgColorClass = "bg-zinc-100";
    textColorClass = "text-zinc-800";
  }
  
  return (
    <span className={`inline-flex items-center justify-center rounded-full ${bgColorClass} p-1 ${className}`}>
      <Icon style={{ width: size, height: size }} className={textColorClass} />
    </span>
  );
}