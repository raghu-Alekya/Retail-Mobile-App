# PCH API configuration

PCH is the default for merchant login and dashboard order counts in development, native, and production builds:
https://pch.alektasolutions.com/connector/api/v1

## Browser development

Run npm start or ionic serve to use PCH by default.

To explicitly choose a backend:

```powershell
npm run start:pch
npm run start:local
```

Stop the existing mobile dev server before switching. Local mode sends merchant login to port 3003 and order counts to port 3002. No local backend is needed in PCH mode.

For custom backend ports, set PCH_API_URL and PCH_ORDERS_API_URL before running ionic serve. These overrides take priority over the default. Both values must include the full API base path, such as http://localhost:3003/api/v1.

## Native and production builds

pchApiBaseUrl and pchOrdersApiBaseUrl in src/environments/environment.ts and environment.prod.ts default to PCH. Change these for native local testing; use a reachable LAN address for a physical phone. Browser startup scripts control the development proxy only.

These settings cover the migrated merchant login and dashboard status counts. Other legacy screen APIs are not migrated by this configuration.

Sales reports use the PCH reports-new/sales route. Local mode routes reports to localhost:3006 using PCH_REPORTS_API_URL; restart the dev server after proxy changes. Native report builds use pchReportsApiBaseUrl.

