import express from 'express';
import dotenv from 'dotenv';
import DatabaseClient from './Database/db.client';
import routerLogger from './Middleware/routesLogger.middleware';
import { createFeatureFlagRoutes } from './Routes/featureFlag.routes';
import { createRuleRoutes } from './Routes/rule.routes';
import { createEvaluationRoutes } from './Routes/evaluation.routes';
import FeatureFlagService from './Service/concrete/FeatureFlag.service';
import FeatureFlagController from './Controller/FeatureFlag.controller';
import FeatureFlagRepository from './Repository/concrete/FeatureFlag.repository';
import RuleService from './Service/concrete/Rule.service';
import RuleController from './Controller/Rule.controller';
import EvaluationService from './Service/concrete/Evaluation.service';
import EvaluationController from './Controller/Evaluation.controller';
import AuditService from './Service/concrete/Audit.service';
import { exceptionHandler } from './Middleware/exceptionHandler.middleware';
import logger from './Utils/logger.util'

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