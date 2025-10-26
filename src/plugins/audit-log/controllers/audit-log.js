// src/plugins/audit-log/server/controllers/audit-log.js
'use strict';

module.exports = {
  async find(ctx) {
    // parse query params for filters/pagination
    const { contentType, userId, action, startDate, endDate, page = 1, pageSize = 25, sort } = ctx.query;

    const filters = {};
    if (contentType) filters.contentType = contentType;
    if (userId) filters.user = userId;
    if (action) filters.action = action;
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) filters.timestamp.$gte = new Date(startDate);
      if (endDate) filters.timestamp.$lte = new Date(endDate);
    }

    const sortBy = sort ? [sort] : ['timestamp:desc'];

    const result = await strapi.plugin('audit-log').service('audit-log').findLogs({
      filters,
      sort: sortBy,
      page: Number(page),
      pageSize: Number(pageSize)
    });

    ctx.body = result;
  },
};
