import type { Request, Response } from 'express';
import type { default as IRuleService } from '../Service/IRuleService';
import type { default as CreateRuleRequest } from '../DTO/CreateRuleRequest.dto';
import type { default as UpdateRuleRequest } from '../DTO/UpdateRuleRequest.dto';
import type { Environment } from '../Service/IRuleService';
import { ValidationError, asyncHandler } from '../Middleware/exceptionHandler.middleware';
import logger from '../Utils/logger.util';
import { sendSuccessResponse, sendErrorResponse } from '../Utils/ApiResponse.util';

export default class RuleController {
  constructor(private ruleService: IRuleService) { }

  createRule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flagKey } = req.params;
    const { environment } = req.query;
    const ruleData: CreateRuleRequest = req.body;

    logger.info('Creating new rule', { flagKey, environment, ruleType: ruleData.ruleType });

    // Validate required parameters
    if (!flagKey) {
      throw new ValidationError('Flag key is required');
    }

    const envStr: string = Array.isArray(environment) ? (environment[0] as string) : (environment as string);
    if (!envStr) {
      throw new ValidationError('Environment query parameter is required');
    }

    if (!ruleData.ruleType) {
      throw new ValidationError('Rule type is required');
    }

    const result = await this.ruleService.createRule(flagKey as string, envStr as Environment, ruleData);

    logger.info('Rule created successfully', { flagKey, environment: envStr, ruleId: result.id });
    res.status(201).json(sendSuccessResponse('Rule created successfully', 201, result));
  });

  getRules = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flagKey } = req.params;
    const { environment } = req.query;

    logger.info('Fetching rules for feature flag', { flagKey, environment });

    // Validate required parameters
    if (!flagKey) {
      throw new ValidationError('Flag key is required');
    }

    const envStr: string = Array.isArray(environment) ? (environment[0] as string) : (environment as string);
    if (!envStr) {
      throw new ValidationError('Environment query parameter is required');
    }

    const result = await this.ruleService.getRules(flagKey as string, envStr as Environment);

    logger.info('Rules retrieved successfully', { flagKey, environment: envStr, count: result.length });
    res.json(sendSuccessResponse(`Retrieved ${result.length} rules`, 200, result, result.length));
  });

  getRule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flagKey, ruleId } = req.params;
    const { environment } = req.query;

    logger.info('Fetching specific rule', { flagKey, ruleId, environment });

    // Validate required parameters
    if (!flagKey) {
      throw new ValidationError('Flag key is required');
    }

    if (!ruleId) {
      throw new ValidationError('Rule ID is required');
    }

    const envStr: string = Array.isArray(environment) ? (environment[0] as string) : (environment as string);
    if (!envStr) {
      throw new ValidationError('Environment query parameter is required');
    }

    const result = await this.ruleService.getRule(ruleId as string);

    logger.info('Rule retrieved successfully', { flagKey, ruleId, environment: envStr });
    res.json(sendSuccessResponse('Rule retrieved successfully', 200, result));
  });

  updateRule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flagKey, ruleId } = req.params;
    const { environment } = req.query;
    const updates: UpdateRuleRequest = req.body;

    logger.info('Updating rule', { flagKey, ruleId, environment, updates });

    // Validate required parameters
    if (!flagKey) {
      throw new ValidationError('Flag key is required');
    }

    if (!ruleId) {
      throw new ValidationError('Rule ID is required');
    }

    const envStr: string = Array.isArray(environment) ? (environment[0] as string) : (environment as string);
    if (!envStr) {
      throw new ValidationError('Environment query parameter is required');
    }

    if (!updates.ruleType && !updates.priority && !updates.config) {
      throw new ValidationError('At least one field must be provided for update');
    }

    const result = await this.ruleService.updateRule(ruleId as string, updates);

    logger.info('Rule updated successfully', { flagKey, ruleId, environment: envStr });
    res.json(sendSuccessResponse('Rule updated successfully', 200, result));
  });

  deleteRule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { flagKey, ruleId } = req.params;
    const { environment } = req.query;

    logger.info('Deleting rule', { flagKey, ruleId, environment });

    // Validate required parameters
    if (!flagKey) {
      throw new ValidationError('Flag key is required');
    }

    if (!ruleId) {
      throw new ValidationError('Rule ID is required');
    }

    const envStr: string = Array.isArray(environment) ? (environment[0] as string) : (environment as string);
    if (!envStr) {
      throw new ValidationError('Environment query parameter is required');
    }

    await this.ruleService.deleteRule(ruleId as string);

    logger.info('Rule deleted successfully', { flagKey, ruleId, environment: envStr });
    res.status(204).send();
  });
}
