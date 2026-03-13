import { Router } from 'express';
import type { default as IEvaluationService } from '../Service/IEvaluationService';
import type { default as EvaluationController } from '../Controller/Evaluation.controller';

export const createEvaluationRoutes = (
  service: IEvaluationService,
  controller: EvaluationController
): Router => {
  const router = Router();

  // POST /:flagKey/evaluate - Evaluate a feature flag and return boolean result
  // Requires query param: environment
  // Requires body: userId, optional attributes object
  router.post('/:flagKey/evaluate', controller.evaluateFlag.bind(controller));

  // POST /:flagKey/evaluate/details - Evaluate a feature flag and return detailed result
  // Requires query param: environment
  // Requires body: userId, optional attributes object
  router.post('/:flagKey/evaluate/details', controller.evaluateFlagWithDetails.bind(controller));

  return router;
};

export default createEvaluationRoutes;
