import { createAuthRoutes } from "./auth.mjs";
import { createAttendanceRoutes } from "./attendance.mjs";
import { createBrandRoutes } from "./brands.mjs";
import { createCollectRoutes } from "./collect.mjs";
import { createMarksRoutes } from "./marks.mjs";
import { createPhotoRoutes } from "./photos.mjs";
import { createTelegramRoutes } from "./telegram.mjs";

export function createApiRouter(dependencies) {
  const publicRoutes = [createAuthRoutes(dependencies)];
  const protectedRoutes = [
    createCollectRoutes(dependencies),
    createMarksRoutes(dependencies),
    createBrandRoutes(dependencies),
    createAttendanceRoutes(dependencies),
    createTelegramRoutes(dependencies),
    createPhotoRoutes(dependencies),
  ];
  async function run(routes, context) {
    for (const route of routes) {
      if (await route(context)) return true;
    }
    return false;
  }
  return {
    handlePublic: (context) => run(publicRoutes, context),
    handleProtected: (context) => run(protectedRoutes, context),
  };
}
