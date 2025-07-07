/**
 * Migration script to hash sensitive employee PII data
 * This script backs up existing data and migrates to hashed format
 */

import { storage } from '../server/storage.js';
import { SecurityService } from '../server/security.js';
import fs from 'fs';
import path from 'path';

async function migrateEmployeeSecurity() {
  console.log('🔒 Starting employee security migration...');
  
  try {
    // 1. Backup existing employee data
    console.log('📦 Creating backup of existing employee data...');
    const allEmployees = await storage.getAllEmployees();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      totalEmployees: allEmployees.length,
      employees: allEmployees.map(emp => ({
        id: emp.id,
        key: emp.key,
        fullName: emp.fullName,
        originalSSN: emp.ssn,
        originalFullSSN: emp.fullSsn,
        originalDriversLicense: emp.driversLicenseNumber,
        originalDateOfBirth: emp.dateOfBirth,
        isActive: emp.isActive,
        isShiftLeader: emp.isShiftLeader,
        hireDate: emp.hireDate
      }))
    };
    
    // Save backup file
    const backupPath = path.join(process.cwd(), 'backups', `employee-backup-${Date.now()}.json`);
    
    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saved to: ${backupPath}`);
    
    // 2. Migrate each employee's sensitive data
    console.log('🔄 Migrating employee sensitive data...');
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const employee of allEmployees) {
      try {
        console.log(`Processing employee: ${employee.fullName} (ID: ${employee.id})`);
        
        // Check if data needs migration (not already hashed)
        const needsMigration = (
          (employee.fullSsn && !isAlreadyHashed(employee.fullSsn)) ||
          (employee.driversLicenseNumber && !isAlreadyHashed(employee.driversLicenseNumber)) ||
          (employee.dateOfBirth && !isAlreadyHashed(employee.dateOfBirth))
        );
        
        if (!needsMigration) {
          console.log(`  ⏭️  Skipping ${employee.fullName} - already secure`);
          skippedCount++;
          continue;
        }
        
        // Prepare secure data
        const updateData = {};
        
        // Hash full SSN if present
        if (employee.fullSsn && !isAlreadyHashed(employee.fullSsn)) {
          updateData.fullSsn = await SecurityService.hashSSN(employee.fullSsn);
          // Generate display SSN (last 4 digits)
          updateData.ssn = SecurityService.getDisplaySSN(employee.fullSsn);
          console.log(`  🔐 Hashed fullSSN for ${employee.fullName}`);
        }
        
        // Hash driver's license if present
        if (employee.driversLicenseNumber && !isAlreadyHashed(employee.driversLicenseNumber)) {
          updateData.driversLicenseNumber = await SecurityService.hashDriversLicense(employee.driversLicenseNumber);
          console.log(`  🔐 Hashed driver's license for ${employee.fullName}`);
        }
        
        // Hash date of birth if present (and not already a Date object)
        if (employee.dateOfBirth && typeof employee.dateOfBirth === 'string' && !isAlreadyHashed(employee.dateOfBirth)) {
          updateData.dateOfBirth = await SecurityService.hashDateOfBirth(employee.dateOfBirth);
          console.log(`  🔐 Hashed date of birth for ${employee.fullName}`);
        }
        
        // Update the employee record
        if (Object.keys(updateData).length > 0) {
          await storage.updateEmployee(employee.id, updateData);
          console.log(`  ✅ Updated ${employee.fullName} with secure data`);
          migratedCount++;
        }
        
      } catch (error) {
        console.error(`  ❌ Error migrating ${employee.fullName}:`, error);
      }
    }
    
    console.log('🎉 Migration complete!');
    console.log(`📊 Results:`);
    console.log(`  - Total employees: ${allEmployees.length}`);
    console.log(`  - Successfully migrated: ${migratedCount}`);
    console.log(`  - Skipped (already secure): ${skippedCount}`);
    console.log(`  - Backup location: ${backupPath}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Check if a string is already a bcrypt hash
 */
function isAlreadyHashed(data) {
  if (typeof data !== 'string') return false;
  // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$ and are 60 characters long
  return /^\$2[abxy]\$\d{2}\$.{53}$/.test(data);
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateEmployeeSecurity()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateEmployeeSecurity };