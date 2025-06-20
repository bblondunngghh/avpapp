// Update this number each time you deploy the application
export const DEPLOYMENT_COUNT = 8;

// Semantic versioning with automatic rollover
// After v2.0.10, versions become v2.1.1, v2.1.2, etc.
export const getVersionDisplay = () => {
  if (DEPLOYMENT_COUNT <= 10) {
    // For deployments 1-10: v2.0.1 through v2.0.10
    return `v2.0.${DEPLOYMENT_COUNT}`;
  } else {
    // For deployments 11+: v2.1.1, v2.1.2, v2.1.3, etc.
    const minorPatch = DEPLOYMENT_COUNT - 10;
    return `v2.1.${minorPatch}`;
  }
};

export const APP_VERSION = getVersionDisplay();