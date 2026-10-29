// PCH_API_URL can point to any local port or the deployed PCH API base.
// Restart ionic serve after changing the target.
const apiBase = new URL(process.env.PCH_API_URL || 'https://pch.alektasolutions.com/connector/api/v1');
if (!['http:', 'https:'].includes(apiBase.protocol)) throw new Error('PCH_API_URL must use HTTP or HTTPS');
const apiPath = apiBase.pathname.replace(/\/+$/, '');
const ordersBase = new URL(process.env.PCH_ORDERS_API_URL || apiBase.href);
if (!['http:', 'https:'].includes(ordersBase.protocol)) throw new Error('PCH_ORDERS_API_URL must use HTTP or HTTPS');
const reportsBase = new URL(process.env.PCH_REPORTS_API_URL || apiBase.href);
if (!['http:', 'https:'].includes(reportsBase.protocol)) throw new Error('PCH_REPORTS_API_URL must use HTTP or HTTPS');
module.exports = {
  '/pch-api/reports-new': {
    target: reportsBase.origin,
    secure: reportsBase.protocol === 'https:',
    changeOrigin: true,
    pathRewrite: { '^/pch-api/reports-new': reportsBase.pathname.replace(/\/+$/, '') + '/reports-new' }
  },
  '/pch-orders-api': {
    target: ordersBase.origin,
    secure: ordersBase.protocol === 'https:',
    changeOrigin: true,
    pathRewrite: { '^/pch-orders-api': ordersBase.pathname.replace(/\/+$/, '') }
  },
  '/pch-api': {
    target: apiBase.origin,
    secure: apiBase.protocol === 'https:',
    changeOrigin: true,
    pathRewrite: { '^/pch-api': apiPath }
  }
};
