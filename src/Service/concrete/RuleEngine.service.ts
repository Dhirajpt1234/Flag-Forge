import { RuleEngine } from '../../RuleEngine/Core/RuleEngine.js';
import type { EvaluationContext } from '../../RuleEngine/Types/EvaluationContext.type.js';
import type { RuleResult } from '../../RuleEngine/Types/RuleResult.type.js';
import { RuleType } from '../../RuleEngine/Types/RuleType.enum.js';
import RuleDefinitionRepository from '../../Repository/concrete/RuleDefinition.repository.js';
import type { RuleDefinitionData } from '../../Repository/IRuleDefinition.repository.js';
import logger from '../../Utils/logger.util.js';

export class RuleEngineService {
  private ruleEngineCache = new Map<string, RuleEngine>();
  private ruleDefinitionRepository: RuleDefinitionRepository;

  constructor() {
    this.ruleDefinitionRepository = new RuleDefinitionRepository();
  }

  /**
   * Evaluate a feature flag for a given context
   */
  async evaluateFlag(flagKey: string, context: EvaluationContext): Promise<boolean> {
    logger.info('Evaluating feature flag', { flagKey, userId: context.userId });
    
    try {
      const ruleEngine = await this.getRuleEngine(flagKey);
      const result = ruleEngine.evaluate(context);
      
      logger.info('Feature flag evaluation completed', { 
        flagKey, 
        userId: context.userId, 
        result 
      });
      
      return result;
    } catch (error) {
      logger.error('Error evaluating feature flag', { 
        flagKey, 
        userId: context.userId, 
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
    logger.info('Evaluating feature flag with details', { flagKey, userId: context.userId });
    
    try {
      const ruleEngine = await this.getRuleEngine(flagKey);
      const result = ruleEngine.evaluateWithDetails(context);
      
      logger.info('Feature flag evaluation completed', { 
        flagKey, 
        userId: context.userId, 
        result: result.enabled,
        ruleType: result.ruleType,
        reason: result.reason
      });
      
      return result;
    } catch (error) {
      logger.error('Error evaluating feature flag', { 
        flagKey, 
        userId: context.userId, 
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
   * Get or create a rule engine for a specific flag
   */
  private async getRuleEngine(flagKey: string): Promise<RuleEngine> {
    // Check cache first
    if (this.ruleEngineCache.has(flagKey)) {
      return this.ruleEngineCache.get(flagKey)!;
    }

    // Create new rule engine
    const ruleEngine = new RuleEngine();
    
    // Load rule definitions from database
    const ruleDefinitions = await this.loadRuleDefinitions(flagKey);
    
    // Build rule chain
    ruleEngine.buildRuleChain(ruleDefinitions);
    
    // Cache the rule engine
    this.ruleEngineCache.set(flagKey, ruleEngine);
    
    return ruleEngine;
  }

  /**
   * Load rule definitions for a flag from the database
   */
  private async loadRuleDefinitions(flagKey: string): Promise<any[]> {
    // First, find the feature flag by key to get its ID
    const prisma = require('@prisma/client').PrismaClient;
    const prismaClient = new prisma();
    
    try {
      const featureFlag = await prismaClient.featureFlag.findFirst({
        where: { key: flagKey }
      });

      if (!featureFlag) {
        logger.warn('Feature flag not found', { flagKey });
        return [];
      }

      // Load rule definitions
      const ruleDefinitions = await this.ruleDefinitionRepository.findByFlagId(featureFlag.id);
      
      logger.info('Loaded rule definitions', { 
        flagKey, 
        count: ruleDefinitions.length 
      });

      return ruleDefinitions.map(def => ({
        ruleType: def.ruleType,
        priority: def.priority,
        config: def.config
      }));
    } finally {
      await prismaClient.$disconnect();
    }
  }

  /**
   * Clear the rule engine cache for a specific flag
   */
  clearCache(flagKey?: string): void {
    if (flagKey) {
      this.ruleEngineCache.delete(flagKey);
      logger.info('Cleared rule engine cache', { flagKey });
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
