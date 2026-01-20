import { Router } from 'express';
import type { default as IFeatureFlagService } from '../Service/IFeatureFlag.service.js';
import type { default as FeatureFlagController } from '../Controller/FeatureFlag.controller.js';

export const createFeatureFlagRoutes = (
  service: IFeatureFlagService,
  controller: FeatureFlagController
): Router => {
  const router = Router();

  // POST /flags - Create a new feature flag
  router.post('/flags', controller.createFlag.bind(controller));

  // GET /flags - List all feature flags for an environment
  // Requires query param: environment
  router.get('/flags', controller.listFlags.bind(controller));

  // GET /flags/:key - Get a specific feature flag
  // Requires query param: environment
  router.get('/flags/:key', controller.getFlagByEnvironment.bind(controller));

  // DELETE /flags/:key - Delete a feature flag
  router.delete('/flags/:key', controller.deleteFlag?.bind(controller));

  // PUT /flags/:key - Update a feature flag name and desc.
  router.put('/flags/:key', controller.updateFlag?.bind(controller));

  // PUT /flags/:key/enable - Enable a feature flag for an environment
  router.put('/flags/:key/enable', controller.enableFlagForEnvironment?.bind(controller));

  // PUT /flags/:key/disable - Disable a feature flag for an environment
  router.put('/flags/:key/disable', controller.disableFlagForEnvironment?.bind(controller));

  return router;
};

export default createFeatureFlagRoutes;
