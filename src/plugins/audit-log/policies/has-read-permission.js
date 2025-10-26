// src/plugins/audit-log/server/policies/has-read-permission.js
module.exports = async (ctx, next) => {
    // Only allow if plugin is enabled
    const config = strapi.config.get('plugin.audit-log', { enabled: true });
    if (!config.enabled) {
      return ctx.forbidden('Audit log is disabled');
    }
  
    // If no authenticated user: reject
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be authenticated');
    }
  
    // Check if user role has a custom permission field named read_audit_logs
    // NOTE: You should add a boolean custom field in the role metadata, or manage this in your own ACL.
    // Here we fetch user's role and check for a flag in role.options or permissions
    try {
      const role = await strapi.query('plugin::users-permissions.role').findOne({ where: { id: user.role }});
      // Assume we store in role?.role?.permissions?.myCustom? or role?.options?.read_audit_logs - adjust to your schema
      // For demonstration, check role.permissions?.read_audit_logs or role?.options?.read_audit_logs
      if (role && ((role?.permissions && role.permissions.read_audit_logs) || (role?.options && role.options.read_audit_logs))) {
        return await next();
      }
    } catch (e) {
      strapi.log.error('audit-log policy check failed: ' + e.message);
    }
  
    return ctx.forbidden('You do not have permission to read audit logs');
  };
  