import express from 'express';
import dotenv from 'dotenv';
import DatabaseClient from './Database/db.client.js';
import routerLogger from './Middleware/routesLogger.middleware.js';
import { createFeatureFlagRoutes } from './Routes/featureFlag.routes.js';
import { createRuleRoutes } from './Routes/rule.routes.js';
import { createEvaluationRoutes } from './Routes/evaluation.routes.js';
import FeatureFlagService from './Service/concrete/FeatureFlag.service.js';
import FeatureFlagController from './Controller/FeatureFlag.controller.js';
import FeatureFlagRepository from './Repository/concrete/FeatureFlag.repository.js';
import RuleService from './Service/concrete/Rule.service.js';
import RuleController from './Controller/Rule.controller.js';
import EvaluationService from './Service/concrete/Evaluation.service.js';
import EvaluationController from './Controller/Evaluation.controller.js';
import AuditService from './Service/concrete/Audit.service.js';
import { exceptionHandler } from './Middleware/exceptionHandler.middleware.js';
import logger from './Utils/logger.util.js'

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(routerLogger);

//routes
const featureFlagRepository = new FeatureFlagRepository(process.env.DATABASE_URL || '');
const featureFlagService = new FeatureFlagService(featureFlagRepository);
const featureFlagController = new FeatureFlagController(featureFlagService);
const featureFlagRoutes = createFeatureFlagRoutes(featureFlagService, featureFlagController);
app.use('/api/feature-flags', featureFlagRoutes);

// Rule routes (nested under feature flags)
const evaluationService = new EvaluationService(featureFlagRepository);
const ruleService = new RuleService(featureFlagRepository, evaluationService);
const ruleController = new RuleController(ruleService);
const ruleRoutes = createRuleRoutes(ruleService, ruleController);
app.use('/api/feature-flags', ruleRoutes);

// Evaluation routes (nested under feature flags)
const evaluationController = new EvaluationController(evaluationService);
const evaluationRoutes = createEvaluationRoutes(evaluationService, evaluationController);
app.use('/api/feature-flags', evaluationRoutes);

// Global error handler (must be after all routes)
app.use(exceptionHandler);

// Start server
app.listen(PORT, async () => {
  logger.info(`Server is running on port ${PORT}`);
});