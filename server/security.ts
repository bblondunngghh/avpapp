import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // Higher rounds for better security

export class SecurityService {
  
  /**
   * Hash sensitive PII data with salt
   */
  static async hashSensitiveData(data: string): Promise<string> {
    if (!data || data.trim() === '') {
      return '';
    }
    
    // Remove any spaces or formatting from the data before hashing
    const cleanData = data.replace(/\s+/g, '').replace(/[-()]/g, '');
    return await bcrypt.hash(cleanData, SALT_ROUNDS);
  }

  /**
   * Verify if plain text matches the hashed data
   */
  static async verifySensitiveData(plainText: string, hashedData: string): Promise<boolean> {
    if (!plainText || !hashedData) {
      return false;
    }
    
    // Clean the input data the same way we did when hashing
    const cleanData = plainText.replace(/\s+/g, '').replace(/[-()]/g, '');
    return await bcrypt.compare(cleanData, hashedData);
  }

  /**
   * Hash SSN (Social Security Number)
   */
  static async hashSSN(ssn: string): Promise<string> {
    return this.hashSensitiveData(ssn);
  }

  /**
   * Hash Driver's License Number
   */
  static async hashDriversLicense(licenseNumber: string): Promise<string> {
    return this.hashSensitiveData(licenseNumber);
  }

  /**
   * Hash Date of Birth
   */
  static async hashDateOfBirth(dob: string): Promise<string> {
    return this.hashSensitiveData(dob);
  }

  /**
   * Verify SSN against hashed version
   */
  static async verifySSN(plainSSN: string, hashedSSN: string): Promise<boolean> {
    return this.verifySensitiveData(plainSSN, hashedSSN);
  }

  /**
   * Verify Driver's License against hashed version
   */
  static async verifyDriversLicense(plainLicense: string, hashedLicense: string): Promise<boolean> {
    return this.verifySensitiveData(plainLicense, hashedLicense);
  }

  /**
   * Verify Date of Birth against hashed version
   */
  static async verifyDateOfBirth(plainDOB: string, hashedDOB: string): Promise<boolean> {
    return this.verifySensitiveData(plainDOB, hashedDOB);
  }

  /**
   * Get last 4 digits of SSN for display purposes (without revealing full SSN)
   */
  static getDisplaySSN(fullSSN: string): string {
    if (!fullSSN || fullSSN.length < 4) {
      return '';
    }
    
    // Clean the SSN and get last 4 digits
    const cleanSSN = fullSSN.replace(/\s+/g, '').replace(/[-]/g, '');
    if (cleanSSN.length >= 4) {
      return cleanSSN.slice(-4);
    }
    
    return cleanSSN;
  }

  /**
   * Sanitize employee data for safe storage
   */
  static async sanitizeEmployeeData(employeeData: any): Promise<any> {
    const sanitized = { ...employeeData };

    // Hash sensitive fields if they exist and are not already hashed
    if (sanitized.fullSsn && !this.isAlreadyHashed(sanitized.fullSsn)) {
      sanitized.fullSsn = await this.hashSSN(sanitized.fullSsn);
      // Generate display SSN from original before hashing
      sanitized.ssn = this.getDisplaySSN(employeeData.fullSsn);
    }

    if (sanitized.driversLicenseNumber && !this.isAlreadyHashed(sanitized.driversLicenseNumber)) {
      sanitized.driversLicenseNumber = await this.hashDriversLicense(sanitized.driversLicenseNumber);
    }

    if (sanitized.dateOfBirth && !this.isAlreadyHashed(sanitized.dateOfBirth)) {
      sanitized.dateOfBirth = await this.hashDateOfBirth(sanitized.dateOfBirth);
    }

    return sanitized;
  }

  /**
   * Check if a string is already a bcrypt hash
   */
  private static isAlreadyHashed(data: string): boolean {
    // Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$ and are 60 characters long
    return /^\$2[abxy]\$\d{2}\$.{53}$/.test(data);
  }

  /**
   * Prepare employee data for email notifications (with original values for accounting)
   */
  static async prepareEmployeeForEmail(employeeData: any, originalData?: any): Promise<{
    name: string;
    dateOfBirth: string;
    driverLicense: string;
    socialSecurityNumber: string;
  }> {
    return {
      name: employeeData.fullName,
      dateOfBirth: originalData?.dateOfBirth || '[Encrypted]',
      driverLicense: originalData?.driversLicenseNumber || '[Encrypted]', 
      socialSecurityNumber: originalData?.fullSsn || '[Encrypted]'
    };
  }
}