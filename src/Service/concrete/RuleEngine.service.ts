import { RuleEngine } from '../../RuleEngine/Core/RuleEngine';
import type { EvaluationContext } from '../../RuleEngine/Types/EvaluationContext.type';
import type { RuleResult } from '../../RuleEngine/Types/RuleResult.type';
import { RuleType } from '../../RuleEngine/Types/RuleType.enum';
import RuleDefinitionRepository from '../../Repository/concrete/RuleDefinition.repository';
import type { RuleDefinitionData } from '../../Repository/IRuleDefinition.repository';
import type { default as IFeatureFlagRepository } from '../../Repository/IFeatureFlag.repository';
import logger from '../../Utils/logger.util';

export class RuleEngineService {
  private ruleEngineCache = new Map<string, RuleEngine>();
  private ruleDefinitionRepository: RuleDefinitionRepository;
  private featureFlagRepository: IFeatureFlagRepository;

  constructor(featureFlagRepository?: IFeatureFlagRepository) {
    this.ruleDefinitionRepository = new RuleDefinitionRepository();
    this.featureFlagRepository = featureFlagRepository!;
  }

  /**
   * Evaluate a feature flag for a given context
   */
  async evaluateFlag(flagKey: string, context: EvaluationContext): Promise<boolean> {
    logger.info('Evaluating feature flag', { flagKey, environment: context.environment });
    
    try {
      const ruleEngine = await this.getRuleEngine(flagKey, context.environment);
      const result = ruleEngine.evaluate(context);
      
      logger.info('Feature flag evaluation completed', { 
        flagKey, 
        environment: context.environment,
        result 
      });
      
      return result;
    } catch (error) {
      logger.error('Error evaluating feature flag', { 
        flagKey, 
        environment: context.environment,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Default to disabled if there's an error
      return false;
    }
  }

  /**
   * Evaluate a feature flag and return detailed result
   */
  async evaluateFlagWithDetails(flagKey: string, context: EvaluationContext): Promise<RuleResult> {
    logger.info('Evaluating feature flag with details', { flagKey, environment: context.environment });
    
    try {
      const ruleEngine = await this.getRuleEngine(flagKey, context.environment);
      const result = ruleEngine.evaluateWithDetails(context);
      
      logger.info('Feature flag evaluation completed', { 
        flagKey, 
        environment: context.environment,
        result: result.enabled,
        ruleType: result.ruleType,
        reason: result.reason
      });
      
      return result;
    } catch (error) {
      logger.error('Error evaluating feature flag', { 
        flagKey, 
        environment: context.environment,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return default disabled result if there's an error
      return {
        matched: false,
        enabled: false,
        ruleType: RuleType.DEFAULT,
        reason: 'Error during evaluation: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Get or create a rule engine for a specific flag and environment
   */
  private async getRuleEngine(flagKey: string, environment: string): Promise<RuleEngine> {
    // Create cache key that includes environment
    const cacheKey = `${flagKey}:${environment}`;
    
    // Check cache first
    if (this.ruleEngineCache.has(cacheKey)) {
      return this.ruleEngineCache.get(cacheKey)!;
    }

    // Create new rule engine
    const ruleEngine = new RuleEngine();
    
    // Load rule definitions from database for specific environment
    const ruleDefinitions = await this.loadRuleDefinitions(flagKey, environment);
    
    // Build rule chain
    ruleEngine.buildRuleChain(ruleDefinitions);
    
    // Cache the rule engine
    this.ruleEngineCache.set(cacheKey, ruleEngine);
    
    return ruleEngine;
  }

  /**
   * Load rule definitions for a flag and environment from the database
   */
  private async loadRuleDefinitions(flagKey: string, environment: string): Promise<any[]> {
    try {
      // Find the feature flag by key and environment to get its ID
      const featureFlag = await this.featureFlagRepository.findByKeyAndEnvironment(flagKey, environment as any);

      if (!featureFlag) {
        logger.warn('Feature flag not found', { flagKey, environment });
        return [];
      }

      // Load rule definitions for specific environment
      const ruleDefinitions = await this.ruleDefinitionRepository.findByFlagIdAndEnvironment(featureFlag.id, environment);
      
      logger.info('Loaded rule definitions', { 
        flagKey, 
        environment,
        count: ruleDefinitions.length 
      });

      return ruleDefinitions.map(def => ({
        ruleType: def.ruleType,
        priority: def.priority,
        config: def.config
      }));
    } catch (error) {
      logger.error('Error loading rule definitions', { 
        flagKey, 
        environment,
        error: error instanceof Error ? error : 'Unknown error'
      });
      
      return [];
    }
  }

  /**
   * Clear the rule engine cache for a specific flag
   */
  clearCache(flagKey?: string): void {
    if (flagKey) {
      // Clear all cache entries for this flag across all environments
      const keysToDelete: string[] = [];
      for (const key of this.ruleEngineCache.keys()) {
        if (key.startsWith(`${flagKey}:`)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.ruleEngineCache.delete(key));
      logger.info('Cleared rule engine cache', { flagKey, clearedKeys: keysToDelete.length });
    } else {
      this.ruleEngineCache.clear();
      logger.info('Cleared all rule engine cache');
    }
  }

  /**
   * Create rule definitions for a feature flag
   */
  async createRuleDefinitions(flagId: string, ruleDefinitions: Omit<RuleDefinitionData, 'id' | 'createdAt' | 'updatedAt' | 'flagId'>[]): Promise<RuleDefinitionData[]> {
    const results: RuleDefinitionData[] = [];
    
    for (const ruleDef of ruleDefinitions) {
      const result = await this.ruleDefinitionRepository.create({
        ...ruleDef,
        flagId
      });
      results.push(result);
    }
    
    // Clear cache for this flag
    this.clearCache();
    
    logger.info('Created rule definitions', { 
      flagId, 
      count: results.length 
    });
    
    return results;
  }
}
