import express from 'express';
import dotenv from 'dotenv';
import DatabaseClient from './Database/db.client.js';
import routerLogger from './Middleware/routesLogger.middleware.js';
import { createFeatureFlagRoutes } from './Routes/featureFlag.routes.js';
import FeatureFlagService from './Service/concrete/FeatureFlag.service.js';
import FeatureFlagController from './Controller/FeatureFlag.controller.js';
import FeatureFlagRepository from './Repository/concrete/FeatureFlag.repository.js';
import AuditService from './Service/concrete/Audit.service.js';

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

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
});