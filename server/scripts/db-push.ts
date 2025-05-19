import { db } from "../db";
import { 
  locations, 
  LOCATIONS
} from "@shared/schema";

async function main() {
  console.log("Pushing schema to database...");

  // Initialize the locations
  const defaultLocations = [
    { name: LOCATIONS.CAPITAL_GRILLE, active: true },
    { name: LOCATIONS.BOBS_STEAK, active: true },
    { name: LOCATIONS.TRULUCKS, active: true },
    { name: LOCATIONS.BOA_STEAKHOUSE, active: true },
  ];

  console.log("Adding default locations...");
  
  for (const location of defaultLocations) {
    try {
      const existing = await db.query.locations.findFirst({
        where: (locations, { eq }) => eq(locations.name, location.name)
      });
      
      if (!existing) {
        await db.insert(locations).values(location);
        console.log(`Added location: ${location.name}`);
      } else {
        console.log(`Location already exists: ${location.name}`);
      }
    } catch (error) {
      console.error(`Error adding location ${location.name}:`, error);
    }
  }

  console.log("Database initialization complete!");
}

main().catch(e => {
  console.error("Error during database initialization:", e);
  process.exit(1);
});