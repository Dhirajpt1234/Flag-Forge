import type { Request, Response } from 'express';
import type { default as IFeatureFlagService } from '../Service/IFeatureFlag.service.js';
import type { default as CreateFeatureFlagDTO } from '../DTO/CreateFeatureFlagRequest.dto.js';
import type { default as UpdateFeatureFlagDTO } from '../DTO/UpdateFeatureFlagRequest.dto.js';
import environment from '../Enums/environment.js';
import { ValidationError } from '../Middleware/exceptionHandler.middleware.js';
import logger from '../Utils/logger.util.js';

export default class FeatureFlagController {
  constructor(private featureFlagService: IFeatureFlagService) { }

  async createFlag(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Creating new feature flag', { key: req.body.key, name: req.body.name });
      const dto: CreateFeatureFlagDTO = req.body;

      // Validate required fields
      if (!dto.key || !dto.name) {
        throw new ValidationError('Key and name are required fields');
      }

      if (dto.key.trim() === '' || dto.name.trim() === '') {
        throw new ValidationError('Key and name cannot be empty');
      }

      const result = await this.featureFlagService.createFlag(dto);
      logger.info('Feature flag created successfully', { key: dto.key });
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error creating feature flag', { error: error instanceof Error ? error.message : 'Unknown error', key: req.body.key });
      res.status(400).json({ error: error instanceof Error ? error.message : 'Error creating flag' });
    }
  }

  async listFlags(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Fetching all feature flags');
      // get the list of all flag for a users any environment.
      const result = await this.featureFlagService.listFlags(environment.LOCAL);
      logger.info('Feature flags retrieved successfully', { count: result.length });
      res.json(result);
    } catch (error) {
      logger.error('Error fetching feature flags', { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getFlagByEnvironment(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const keyStr: string = Array.isArray(key) ? (key[0] as string) : (key as string);
      const { environment: env } = req.query;

      logger.info('Fetching feature flag by environment', { key: keyStr, environment: env });

      if (!keyStr || !env) {
        res.status(400).json({ error: 'Key and environment are required' });
        return;
      }

      const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string) || environment.LOCAL;
      if (!Object.values(environment).includes(envStr as any)) {
        res.status(400).json({ error: 'Invalid environment' });
        return;
      }

      const result = await this.featureFlagService.getFlag(keyStr, envStr as typeof environment[keyof typeof environment]);
      logger.info('Feature flag retrieved successfully', { key: keyStr, environment: envStr });
      res.json(result);
    } catch (error) {
      logger.error('Error fetching feature flag', { error: error instanceof Error ? error.message : 'Flag not found', key: req.params.key, environment: req.query.environment });
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }

  async updateFlag(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params as { key: string }
      const dto: UpdateFeatureFlagDTO = req.body;

      logger.info('Updating feature flag', { key, updates: dto });

      if (!key) {
        res.status(400).json({ error: 'Key is required' });
        return;
      }

      const result = await this.featureFlagService.updateFlag(key, dto);
      logger.info('Feature flag updated successfully', { key });
      res.json(result);
    } catch (error) {
      logger.error('Error updating feature flag', { error: error instanceof Error ? error.message : 'Flag not found', key: req.params.key });
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }

  async deleteFlag(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params as { key: string };

      logger.info('Deleting feature flag', { key });

      if (!key) {
        res.status(400).json({ error: 'Key is required' });
        return;
      }

      await this.featureFlagService.deleteFlag(key);
      logger.info('Feature flag deleted successfully', { key });
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting feature flag', { error: error instanceof Error ? error.message : 'Flag not found', key: req.params.key });
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }

  async enableFlagForEnvironment(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const keyStr: string = Array.isArray(key) ? (key[0] as string) : (key as string);

      const { environment: env } = req.query as { environment: string };
      const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string) || environment.LOCAL;

      logger.info('Enabling feature flag for environment', { key: keyStr, environment: envStr });

      if (!keyStr || !envStr) {
        throw new Error("Key and Environment are required.")
      }


      const result = await this.featureFlagService.enableFlag(keyStr, envStr as typeof environment[keyof typeof environment]);
      logger.info('Feature flag enabled successfully', { key: keyStr, environment: envStr });
      res.json(result);
    } catch (error) {
      logger.error('Error enabling feature flag', { error: error instanceof Error ? error.message : 'Flag not found', key: req.params.key, environment: req.query.environment });
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }

  async disableFlagForEnvironment(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const keyStr: string = Array.isArray(key) ? (key[0] as string) : (key as string);

      const { environment: env } = req.query as { environment: string };
      const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string) || environment.LOCAL;

      logger.info('Disabling feature flag for environment', { key: keyStr, environment: envStr });


      if (!keyStr  || !envStr) {
        throw new Error("Key and Environment are required.")
      }

      const result = await this.featureFlagService.disableFlag(keyStr, envStr as typeof environment[keyof typeof environment]);
      logger.info('Feature flag disabled successfully', { key: keyStr, environment: envStr });

      res.json(result);
    } catch (error) {
      logger.error('Error disabling feature flag', { error: error instanceof Error ? error.message : 'Flag not found', key: req.params.key, environment: req.query.environment });
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }
}
