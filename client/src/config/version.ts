// Update this number each time you deploy the application
export const APP_VERSION = "2.0.8";
export const DEPLOYMENT_COUNT = 8;

// Format: "v2.0.{DEPLOYMENT_COUNT}" starting from 2.0.7
export const getVersionDisplay = () => `v2.0.${DEPLOYMENT_COUNT}`;