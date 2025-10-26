// src/plugins/audit-log/server/register.js
'use strict';

module.exports = ({ strapi }) => {
  // register a permission action in the users-permissions plugin
  const action = {
    section: 'plugins',
    displayName: 'Read audit logs',
    uid: 'read',
    pluginName: 'audit-log',
  };

  // If users-permissions installed: add action
  try {
    const existing = strapi.admin.services.permission.actionProvider.get();
    // Register action if not present - admin API uses admin RBAC; for public/auth roles we'll register separately
    strapi.admin.services.permission.actionProvider.register(action);
  } catch (e) {
    // ignore if not running admin mode or permission API not accessible
    strapi.log.info('audit-log: could not register admin action (admin plugin not loaded?)');
  }
};
