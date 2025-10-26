// src/plugins/audit-log/server/bootstrap.js
'use strict';

const _ = require('lodash');

module.exports = async ({ strapi }) => {
  // load plugin config (fallback defaults)
  const config = strapi.config.get('plugin.audit-log', {
    enabled: true,
    excludeContentTypes: ['plugin::users-permissions.user', 'plugin::audit-log.audit-log'],
  });

  if (!config.enabled) {
    strapi.log.info('audit-log plugin disabled by config');
    return;
  }

  // Helper: whether to ignore contentType
  const shouldIgnore = (uid) => {
    if (!uid) return true;
    if (!config.excludeContentTypes) return false;
    return config.excludeContentTypes.includes(uid);
  };

  // iterate all content types and subscribe lifecycles
  const contentTypes = Object.keys(strapi.contentTypes);

  contentTypes.forEach((uid) => {
    if (shouldIgnore(uid)) {
      return;
    }

    // subscribe to lifecycle for that model
    try {
      strapi.db.lifecycles.subscribe({
        models: [uid],
        afterCreate: async (event) => {
          // event contains result, params, model
          await strapi.plugin('audit-log').service('audit-log').createLog({
            action: 'create',
            contentType: uid,
            record: event.result,
            params: event.params,
            model: event.model,
            ctx: event?.params?.context // may or may not exist; we'll try to extract user if present
          });
        },
        afterUpdate: async (event) => {
          await strapi.plugin('audit-log').service('audit-log').createLog({
            action: 'update',
            contentType: uid,
            record: event.result,
            params: event.params,
            previous: event.state?.before ?? null, // some versions provide state; fallback
            model: event.model,
            ctx: event?.params?.context
          });
        },
        afterDelete: async (event) => {
          await strapi.plugin('audit-log').service('audit-log').createLog({
            action: 'delete',
            contentType: uid,
            record: event.result,
            params: event.params,
            model: event.model,
            ctx: event?.params?.context
          });
        }
      });
      strapi.log.info(`audit-log: subscribed lifecycles for ${uid}`);
    } catch (err) {
      strapi.log.error(`audit-log: failed to subscribe lifecycle for ${uid}: ${err.message}`);
    }
  });
};
