export function createAuthMiddleware({ accessHeaders, sendAccessDenied }) {
  return {
    authorize(req, res, parsed) {
      const access = accessHeaders(parsed, req);
      if (access.allowed) return access;
      sendAccessDenied(req, res);
      return null;
    },
  };
}
