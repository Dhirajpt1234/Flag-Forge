import type { Request, Response } from 'express';
import type { default as IEvaluationService } from '../Service/IEvaluationService';
import type { Environment } from '../Service/IRuleService';
import type { RuleResult } from '../RuleEngine/Types/RuleResult.type';
import { ValidationError, asyncHandler } from '../Middleware/exceptionHandler.middleware';
import logger from '../Utils/logger.util';
import { sendSuccessResponse, sendErrorResponse } from '../Utils/ApiResponse.util';
import environment from '../Enums/environment';

export default class EvaluationController {
  constructor(private evaluationService: IEvaluationService) { }

  evaluateFlag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flagKey } = req.params;
    const { environment: env } = req.query;
    const { userId, attributes } = req.body;
    logger.info('Evaluating feature flag', { flagKey, environment: env, userId });

    // Validate required parameters
    if (!flagKey) {
      throw new ValidationError('Flag key is required');
    }

    const flagKeyStr: string = Array.isArray(flagKey) ? (flagKey[0] as string) : (flagKey as string);
    if (!flagKeyStr || flagKeyStr.trim() === '') {
      throw new ValidationError('Flag key cannot be empty');
    }

    const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string);
    if (!envStr) {
      throw new ValidationError('Environment query parameter is required');
    }

    if (!Object.values(environment).includes(envStr as any)) {
      throw new ValidationError('Invalid environment');
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new ValidationError('User ID is required in request body');
    }

    // Parse attributes from request body
    let attributesObj: Record<string, string> = {};
    if (attributes) {
      if (typeof attributes === 'object') {
        attributesObj = attributes as Record<string, string>;
      } else {
        throw new ValidationError('Attributes must be a valid JSON object');
      }
    }

    const result = await this.evaluationService.evaluateFlag(
      flagKeyStr, 
      envStr as Environment, 
      userId, 
      Object.keys(attributesObj).length > 0 ? attributesObj : undefined
    );

    logger.info('Feature flag evaluation completed', { 
      flagKey: flagKeyStr, 
      environment: envStr, 
      userId: userId, 
      result 
    });

    res.json(sendSuccessResponse('Feature flag evaluated successfully', 200, { enabled: result }));
  });

  evaluateFlagWithDetails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flagKey } = req.params;
    const { environment: env } = req.query;
    const { userId, attributes } = req.body;

    logger.info('Evaluating feature flag with details', { flagKey, environment: env, userId });

    // Validate required parameters
    if (!flagKey) {
      throw new ValidationError('Flag key is required');
    }

    const flagKeyStr: string = Array.isArray(flagKey) ? (flagKey[0] as string) : (flagKey as string);
    if (!flagKeyStr || flagKeyStr.trim() === '') {
      throw new ValidationError('Flag key cannot be empty');
    }

    const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string);
    if (!envStr) {
      throw new ValidationError('Environment query parameter is required');
    }

    if (!Object.values(environment).includes(envStr as any)) {
      throw new ValidationError('Invalid environment');
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new ValidationError('User ID is required in request body');
    }

    // Parse attributes from request body
    let attributesObj: Record<string, string> = {};
    if (attributes) {
      if (typeof attributes === 'object') {
        attributesObj = attributes as Record<string, string>;
      } else {
        throw new ValidationError('Attributes must be a valid JSON object');
      }
    }

    const result = await this.evaluationService.evaluateFlagWithDetails(
      flagKeyStr, 
      envStr as Environment, 
      userId, 
      Object.keys(attributesObj).length > 0 ? attributesObj : undefined
    );

    logger.info('Feature flag evaluation completed', { 
      flagKey: flagKeyStr, 
      environment: envStr, 
      userId: userId, 
      result: result.enabled,
      ruleType: result.ruleType,
      reason: result.reason
    });

    res.json(sendSuccessResponse('Feature flag evaluated successfully', 200, result));
  });
}
