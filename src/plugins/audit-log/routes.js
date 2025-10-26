// src/plugins/audit-log/server/routes.js
module.exports = [
    {
      method: 'GET',
      path: '/audit-logs',
      handler: 'audit-log.find',
      config: {
        policies: ['plugin::audit-log.hasReadPermission'],
        // if you want it to be public: true/false etc
      }
    }
  ];
  