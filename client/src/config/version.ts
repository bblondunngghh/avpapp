// Update this number each time you deploy the application
export const APP_VERSION = "1.0.0";
export const DEPLOYMENT_COUNT = 1;

// Format: "v{DEPLOYMENT_COUNT}.0.0" or custom format
export const getVersionDisplay = () => `v${DEPLOYMENT_COUNT}.0.0`;