import { Router } from 'express';
import type { default as IRuleService } from '../Service/IRule.service';
import type { default as RuleController } from '../Controller/Rule.controller';
import { createAuthMiddleware } from '../Middleware/auth.middleware';
import { createOrgContextMiddleware } from '../Middleware/orgContext.middleware';

export const createRuleRoutes = (
  service: IRuleService,
  controller: RuleController
): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware();
  const orgContextMiddleware = createOrgContextMiddleware();

  // Apply auth and org context middleware to all routes
  router.use(authMiddleware);
  router.use(orgContextMiddleware);

  // POST /:flagKey/rules - Create a new rule for a feature flag
  // Requires query param: environment
  router.post('/:flagKey/rules', controller.createRule.bind(controller));

  // GET /:flagKey/rules - List all rules for a feature flag
  // Requires query param: environment
  router.get('/:flagKey/rules', controller.getRules.bind(controller));

  // GET /:flagKey/rules/:ruleId - Get a specific rule
  // Requires query param: environment
  router.get('/:flagKey/rules/:ruleId', controller.getRule.bind(controller));

  // PUT /:flagKey/rules/:ruleId - Update a rule
  // Requires query param: environment
  router.put('/:flagKey/rules/:ruleId', controller.updateRule.bind(controller));

  // DELETE /:flagKey/rules/:ruleId - Delete a rule
  // Requires query param: environment
  router.delete('/:flagKey/rules/:ruleId', controller.deleteRule.bind(controller));

  return router;
};

export default createRuleRoutes;
