import type { Request, Response } from 'express';
import type { default as IFeatureFlagService } from '../Service/IFeatureFlag.service.js';
import type { default as CreateFeatureFlagDTO } from '../DTO/CreateFeatureFlagRequest.dto.js';
import type { default as UpdateFeatureFlagDTO } from '../DTO/UpdateFeatureFlagRequest.dto.js';
import environment from '../Enums/environment.js';
import { ValidationError, asyncHandler } from '../Middleware/exceptionHandler.middleware.js';
import logger from '../Utils/logger.util.js';
import { sendSuccessResponse, sendErrorResponse } from '../Utils/ApiResponse.util.js';

export default class FeatureFlagController {
  constructor(private featureFlagService: IFeatureFlagService) { }

  createFlag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    res.status(201).json(sendSuccessResponse('Feature flag created successfully', 201, result));
  });

  listFlags = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Fetching all feature flags');

    // get the list of all flag for a users any environment.
    const result = await this.featureFlagService.listFlags(environment.LOCAL);

    logger.info('Feature flags retrieved successfully', { count: result.length });
    res.json(sendSuccessResponse(`Retrieved ${result.length} feature flags`, 200, result, result.length));
  });

  getFlagByEnvironment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { key } = req.params;
    const keyStr: string = Array.isArray(key) ? (key[0] as string) : (key as string);

    const { environment: env } = req.query;
    const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string) || environment.LOCAL;

    logger.info('Fetching feature flag by environment', { key: keyStr, environment: env });

    if (!keyStr || !env) {
      throw new ValidationError('Key and environment are required');
    }

    if (!Object.values(environment).includes(envStr as any)) {
      throw new ValidationError('Invalid environment');
    }

    const result = await this.featureFlagService.getFlag(keyStr, envStr as typeof environment[keyof typeof environment]);

    logger.info('Feature flag retrieved successfully', { key: keyStr, environment: envStr });
    res.json(sendSuccessResponse('Feature flag retrieved successfully', 200, result));
  });

  updateFlag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { key } = req.params as { key: string }
    const dto: UpdateFeatureFlagDTO = req.body;

    logger.info('Updating feature flag', { key, updates: dto });

    if (!key) {
      throw new ValidationError('Key is required');
    }

    const result = await this.featureFlagService.updateFlag(key, dto);
    logger.info('Feature flag updated successfully', { key });
    res.json(sendSuccessResponse('Feature flag updated successfully', 200, result));
  });

  deleteFlag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { key } = req.params as { key: string };

    logger.info('Deleting feature flag', { key });

    if (!key) {
      throw new ValidationError('Key is required');
    }

    await this.featureFlagService.deleteFlag(key);
    logger.info('Feature flag deleted successfully', { key });
    res.status(204).send();
  });

  enableFlagForEnvironment = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const keyStr: string = Array.isArray(key) ? (key[0] as string) : (key as string);

    const { environment: env } = req.query as { environment: string };
    const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string) || environment.LOCAL;

    logger.info('Enabling feature flag for environment', { key: keyStr, environment: envStr });

    if (!keyStr || !envStr) {
      throw new ValidationError('Key and Environment are required');
    }

    const result = await this.featureFlagService.enableFlag(keyStr, envStr as typeof environment[keyof typeof environment]);

    logger.info('Feature flag enabled successfully', { key: keyStr, environment: envStr });
    res.json(sendSuccessResponse('Feature flag enabled successfully', 200, result));
  });

  disableFlagForEnvironment = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    const keyStr: string = Array.isArray(key) ? (key[0] as string) : (key as string);

    const { environment: env } = req.query as { environment: string };
    const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string) || environment.LOCAL;

    logger.info('Disabling feature flag for environment', { key: keyStr, environment: envStr });

    if (!keyStr || !envStr) {
      throw new ValidationError('Key and Environment are required');
    }

    const result = await this.featureFlagService.disableFlag(keyStr, envStr as typeof environment[keyof typeof environment]);

    logger.info('Feature flag disabled successfully', { key: keyStr, environment: envStr });
    res.json(sendSuccessResponse('Feature flag disabled successfully', 200, result));
  });
}
