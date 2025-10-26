// src/plugins/audit-log/server/services/audit-log.js
'use strict';

const _ = require('lodash');

module.exports = ({ strapi }) => ({
  /**
   * Create an audit log entry
   * payload: { action, contentType, record, previous, ctx, params, model }
   */
  async createLog(payload) {
    try {
      const { action, contentType, record, previous, ctx } = payload;

      // pick record id
      const recordId = record?.id ?? record?._id ?? null;

      // user extraction: try popular places
      let user = null;
      // when request flows through REST API, ctx.state.user (users-permissions) or ctx.state? may contain user
      if (ctx && ctx.state && ctx.state.user) {
        user = ctx.state.user.id || ctx.state.user;
      } else if (payload.params && payload.params.user) {
        user = payload.params.user.id || payload.params.user;
      }

      // compute changed fields for update (naive diff)
      let changed = null;
      if (action === 'update') {
        // if previous is available compute shallow diff
        if (previous) {
          const diff = {};
          const newObj = record;
          Object.keys(newObj).forEach((k) => {
            // ignore system fields
            if (k === 'updatedAt' || k === 'createdAt') return;
            if (!_.isEqual(previous[k], newObj[k])) {
              diff[k] = { before: previous[k] ?? null, after: newObj[k] ?? null };
            }
          });
          changed = diff;
        } else {
          // fallback: store new payload only
          changed = { after: record };
        }
      } else {
        // for create/delete store full payload
        changed = { payload: record };
      }

      // meta: timestamp etc
      const meta = {
        timestamp: new Date().toISOString(),
      };

      if (ctx) {
        meta.requestPath = ctx.request?.url;
        meta.method = ctx.request?.method;
        meta.ip = ctx.request?.ip;
      }

      const entry = {
        contentType,
        recordId,
        action,
        user,
        changed,
        meta,
        timestamp: new Date(),
      };

      // Persist using entityService into plugin single type or content-type created under plugin namespace
      // model uid: plugin::audit-log.audit-log
      await strapi.entityService.create('plugin::audit-log.audit-log', {
        data: entry,
      });
    } catch (err) {
      // do not throw — auditing failure should not break primary flow
      strapi.log.error('audit-log: failed to create log: ' + err.message);
    }
  },

  /**
   * Query logs with filters/pagination
   * options: { filters, sort, page, pageSize }
   */
  async findLogs(options = {}) {
    const { filters = {}, sort = ['timestamp:desc'], page = 1, pageSize = 25 } = options;

    return await strapi.entityService.findPage('plugin::audit-log.audit-log', {
      filters,
      sort,
      page,
      pageSize,
    });
  }
});
