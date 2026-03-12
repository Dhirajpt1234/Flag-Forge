import type { default as IEvaluationService } from '../IEvaluationService.js';
import type { EvaluationContext } from '../../RuleEngine/Types/EvaluationContext.type.js';
import type { RuleResult } from '../../RuleEngine/Types/RuleResult.type.js';
import type { Environment } from '../IRuleService.js';
import { RuleEngineService } from './RuleEngine.service.js';
import type { default as IFeatureFlagRepository } from '../../Repository/IFeatureFlag.repository.js';
import logger from '../../Utils/logger.util.js';
import environment from '../../Enums/environment.js';

export default class EvaluationService implements IEvaluationService {
  private ruleEngineService: RuleEngineService;
  private featureFlagRepository: IFeatureFlagRepository;

  constructor(featureFlagRepository: IFeatureFlagRepository) {
    this.featureFlagRepository = featureFlagRepository;
    this.ruleEngineService = new RuleEngineService(featureFlagRepository);
  }

  async evaluateFlag(
    flagKey: string, 
    environment: Environment, 
    userId: string, 
    attributes?: Record<string, string>
  ): Promise<boolean> {
    logger.info('Evaluating feature flag', { flagKey, environment, userId });

    try {
      const context = this.buildEvaluationContext(flagKey, environment, userId, attributes);
      const result = await this.ruleEngineService.evaluateFlag(flagKey, context);
      
      logger.info('Feature flag evaluation completed', { 
        flagKey, 
        environment, 
        userId, 
        result 
      });
      
      return result;
    } catch (error) {
      logger.error('Error evaluating feature flag', { 
        flagKey, 
        environment, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Default to disabled if there's an error
      return false;
    }
  }

  async evaluateFlagWithDetails(
    flagKey: string, 
    environment: Environment, 
    userId: string, 
    attributes?: Record<string, string>
  ): Promise<RuleResult> {
    logger.info('Evaluating feature flag with details', { flagKey, environment, userId });

    try {
      const context = this.buildEvaluationContext(flagKey, environment, userId, attributes);
      const result = await this.ruleEngineService.evaluateFlagWithDetails(flagKey, context);
      
      logger.info('Feature flag evaluation completed', { 
        flagKey, 
        environment, 
        userId, 
        result: result.enabled,
        ruleType: result.ruleType,
        reason: result.reason
      });
      
      return result;
    } catch (error) {
      logger.error('Error evaluating feature flag', { 
        flagKey, 
        environment, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return default disabled result if there's an error
      return {
        matched: false,
        enabled: false,
        ruleType: 'DEFAULT' as any,
        reason: 'Error during evaluation: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  clearCache(flagKey?: string): void {
    this.ruleEngineService.clearCache(flagKey);
  }

  private buildEvaluationContext(
    flagKey: string, 
    environment: Environment, 
    userId: string, 
    attributes?: Record<string, string>
  ): EvaluationContext {
    const attributesMap = new Map<string, string>();
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        attributesMap.set(key, value);
      });
    }

    return {
      flagKey,
      userId,
      environment,
      attributes: attributesMap
    };
  }
}
