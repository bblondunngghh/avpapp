# Version Management

## Manual Version Update:

Run this command before each deployment:
```bash
node scripts/update-version.js
```

## How it works:
- The script automatically increments the deployment count
- Semantic versioning pattern:
  - Deployments 1-10: v2.0.1 through v2.0.10
  - Deployments 11+: v2.1.1, v2.1.2, v2.1.3, etc.

## Current Version System:
- **Current**: Version 2.0.10 (Deployment #10)
- **Next**: Version 2.1.1 (Deployment #11)

## For each deployment:
1. Run: `node scripts/update-version.js`
2. Deploy through Replit's deployment system
3. Version will be updated automatically