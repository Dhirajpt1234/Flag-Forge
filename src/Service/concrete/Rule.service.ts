import type { default as IRuleService } from '../IRuleService.js';
import type { default as CreateRuleRequest } from '../../DTO/CreateRuleRequest.dto.js';
import type { default as UpdateRuleRequest } from '../../DTO/UpdateRuleRequest.dto.js';
import type { default as RuleResponse } from '../../DTO/RuleResponse.dto.js';
import type { Environment } from '../IRuleService.js';
import type { RuleDefinitionData } from '../../Repository/IRuleDefinition.repository.js';
import type { default as IFeatureFlagRepository } from '../../Repository/IFeatureFlag.repository.js';
import RuleDefinitionRepository from '../../Repository/concrete/RuleDefinition.repository.js';
import { RuleValidator } from '../../Utils/ruleValidation.util.js';
import { NotFoundError, ValidationError } from '../../Middleware/exceptionHandler.middleware.js';
import logger from '../../Utils/logger.util.js';
import environment from '../../Enums/environment.js';
import EvaluationService from './Evaluation.service.js';

export default class RuleService implements IRuleService {
  private ruleDefinitionRepository: RuleDefinitionRepository;
  private featureFlagRepository: IFeatureFlagRepository;
  private evaluationService?: EvaluationService;

  constructor(featureFlagRepository?: IFeatureFlagRepository, evaluationService?: EvaluationService) {
    this.ruleDefinitionRepository = new RuleDefinitionRepository();
    this.featureFlagRepository = featureFlagRepository!;
    if (evaluationService) {
      this.evaluationService = evaluationService;
    }
  }

  async createRule(flagKey: string, environment: Environment, ruleData: CreateRuleRequest): Promise<RuleResponse> {
    logger.info('Creating rule', { flagKey, environment, ruleType: ruleData.ruleType });

    // 1. Validate feature flag exists for given environment
    await this.validateFeatureFlagExists(flagKey, environment);

    // 2. Get flag ID
    const flagId = await this.getFlagId(flagKey, environment);

    // 3. Validate rule configuration
    RuleValidator.validateRuleConfig(ruleData.ruleType, ruleData.config);

    // 4. Determine priority (auto-assign if not provided)
    const nextAvailablePriority = await this.getNextAvailablePriority(flagId, environment);
    let priority = ruleData.priority ?? nextAvailablePriority;
    
    // Normalize priority if it's too high (prevents large gaps)
    if (ruleData.priority && ruleData.priority > nextAvailablePriority) {
      priority = nextAvailablePriority;
      logger.info('Priority normalized to prevent gaps', { 
        requestedPriority: ruleData.priority, 
        normalizedPriority: priority 
      });
    }

    // 5. If priority is specified (and not normalized), shift existing rules to make space
    if (ruleData.priority && ruleData.priority <= nextAvailablePriority) {
      await this.shiftRulesToMakeSpace(flagId, environment, priority);
    }

    // 6. Validate priority
    RuleValidator.validatePriority(priority);

    // 7. Create rule
    const ruleDefinition = await this.ruleDefinitionRepository.create({
      flagId,
      environment,
      ruleType: ruleData.ruleType,
      priority,
      config: ruleData.config
    });

    // TODO : add caching for quick retrieval of rules

    logger.info('Rule created successfully', { 
      ruleId: ruleDefinition.id, 
      flagKey, 
      environment, 
      ruleType: ruleData.ruleType,
      priority 
    });

    // Clear evaluation cache for this flag
    this.clearEvaluationCache(flagKey);

    return this.mapToRuleResponse(ruleDefinition);
  }

  async getRules(flagKey: string, environment: Environment): Promise<RuleResponse[]> {
    logger.info('Fetching rules', { flagKey, environment });

    const flagId = await this.getFlagId(flagKey, environment);
    const rules = await this.ruleDefinitionRepository.findByFlagIdAndEnvironment(flagId, environment);

    logger.info('Rules retrieved successfully', { flagKey, environment, count: rules.length });

    return rules.map(rule => this.mapToRuleResponse(rule));
  }

  async getRule(ruleId: string): Promise<RuleResponse> {
    logger.info('Fetching rule by ID', { ruleId });

    const rule = await this.ruleDefinitionRepository.findById(ruleId);
    
    if (!rule) {
      throw new NotFoundError(`Rule with ID ${ruleId} not found`);
    }
    
    return this.mapToRuleResponse(rule);
  }

  async updateRule(ruleId: string, updates: UpdateRuleRequest): Promise<RuleResponse> {
    logger.info('Updating rule', { ruleId, updates });

    // 1. Check if rule exists
    const existingRule = await this.ruleDefinitionRepository.findById(ruleId);
    if (!existingRule) {
      throw new NotFoundError(`Rule with ID ${ruleId} not found`);
    }

    // 2. Validate rule configuration if provided
    if (updates.ruleType && updates.config) {
      RuleValidator.validateRuleConfig(updates.ruleType, updates.config);
    }

    // 3. Validate priority if provided
    if (updates.priority !== undefined) {
      RuleValidator.validatePriority(updates.priority);
      
      // If priority is changing, handle priority shifting
      if (updates.priority !== existingRule.priority) {
        await this.handlePriorityChange(existingRule, updates.priority);
      }
    }

    // 4. Update the rule
    const updateData: Partial<RuleDefinitionData> = {};
    
    if (updates.ruleType !== undefined) {
      updateData.ruleType = updates.ruleType as string;
    }
    
    if (updates.priority !== undefined) {
      updateData.priority = updates.priority;
    }
    
    if (updates.config !== undefined) {
      updateData.config = updates.config;
    }
    
    const updatedRule = await this.ruleDefinitionRepository.update(ruleId, updateData);

    logger.info('Rule updated successfully', { 
      ruleId, 
      flagId: updatedRule.flagId,
      environment: updatedRule.environment,
      updates 
    });

    // Clear evaluation cache for this flag
    // Note: We need to get the flagKey, but we only have flagId here
    // For now, we'll clear all cache since we can't easily map flagId back to flagKey
    if (this.evaluationService) {
      this.evaluationService.clearCache();
      logger.info('Cleared all evaluation cache after rule update');
    }

    return this.mapToRuleResponse(updatedRule);
  }


  // TODO : check for soft delete or archieve delete.
  async deleteRule(ruleId: string): Promise<void> {
    logger.info('Deleting rule', { ruleId });

    // 1. Check if rule exists
    const existingRule = await this.ruleDefinitionRepository.findById(ruleId);
    if (!existingRule) {
      throw new NotFoundError(`Rule with ID ${ruleId} not found`);
    }

    // 2. Delete the rule
    await this.ruleDefinitionRepository.delete(ruleId);

    // 3. Shift down rules that had higher priority
    await this.shiftRulesDownAfterDeletion(
      existingRule.flagId, 
      existingRule.environment as Environment, 
      existingRule.priority
    );

    logger.info('Rule deleted successfully', { 
      ruleId, 
      flagId: existingRule.flagId,
      environment: existingRule.environment,
      deletedPriority: existingRule.priority 
    });

    // Clear evaluation cache for this flag
    // Note: We need to get the flagKey, but we only have flagId here
    // For now, we'll clear all cache since we can't easily map flagId back to flagKey
    if (this.evaluationService) {
      this.evaluationService.clearCache();
      logger.info('Cleared all evaluation cache after rule deletion');
    }
  }

  async deleteRulesByFlag(flagKey: string, environment: Environment): Promise<void> {
    logger.info('Deleting rules for flag', { flagKey, environment });

    const flagId = await this.getFlagId(flagKey, environment);
    await this.ruleDefinitionRepository.deleteByFlagIdAndEnvironment(flagId, environment);

    logger.info('Rules deleted successfully', { flagKey, environment });

    // Clear evaluation cache for this flag
    this.clearEvaluationCache(flagKey);
  }

  // Private helper methods

  private clearEvaluationCache(flagKey: string): void {
    if (this.evaluationService) {
      this.evaluationService.clearCache(flagKey);
      logger.info('Cleared evaluation cache for flag', { flagKey });
    }
  }

  private async handlePriorityChange(existingRule: RuleDefinitionData, newPriority: number): Promise<void> {
    logger.info('Handling priority change', { 
      ruleId: existingRule.id, 
      oldPriority: existingRule.priority, 
      newPriority 
    });

    if (newPriority < existingRule.priority) {
      // Moving rule to lower priority number - shift rules in between up
      await this.shiftRulesUpForPriorityChange(
        existingRule.flagId, 
        existingRule.environment as Environment, 
        newPriority, 
        existingRule.priority
      );
    } else {
      // Moving rule to higher priority number - shift rules in between down
      await this.shiftRulesDownForPriorityChange(
        existingRule.flagId, 
        existingRule.environment as Environment, 
        existingRule.priority, 
        newPriority
      );
    }
  }

  private async shiftRulesUpForPriorityChange(
    flagId: string, 
    environment: Environment, 
    startPriority: number, 
    endPriority: number
  ): Promise<void> {
    const existingRules = await this.ruleDefinitionRepository.findByFlagIdAndEnvironment(flagId, environment);
    
    // Find rules that need to be shifted up (those between startPriority and endPriority-1)
    const rulesToShift = existingRules.filter(rule => 
      rule.priority >= startPriority && rule.priority < endPriority
    );
    
    // Sort by priority descending to avoid conflicts
    rulesToShift.sort((a, b) => b.priority - a.priority);

    // Shift each rule by +1 priority
    for (const rule of rulesToShift) {
      await this.ruleDefinitionRepository.update(rule.id, {
        priority: rule.priority + 1
      });
    }
  }

  private async shiftRulesDownForPriorityChange(
    flagId: string, 
    environment: Environment, 
    startPriority: number, 
    endPriority: number
  ): Promise<void> {
    const existingRules = await this.ruleDefinitionRepository.findByFlagIdAndEnvironment(flagId, environment);
    
    // Find rules that need to be shifted down (those between startPriority+1 and endPriority)
    const rulesToShift = existingRules.filter(rule => 
      rule.priority > startPriority && rule.priority <= endPriority
    );
    
    // Sort by priority ascending to avoid conflicts
    rulesToShift.sort((a, b) => a.priority - b.priority);

    // Shift each rule by -1 priority
    for (const rule of rulesToShift) {
      await this.ruleDefinitionRepository.update(rule.id, {
        priority: rule.priority - 1
      });
    }
  }

  private async shiftRulesDownAfterDeletion(
    flagId: string, 
    environment: Environment, 
    deletedPriority: number
  ): Promise<void> {
    const existingRules = await this.ruleDefinitionRepository.findByFlagIdAndEnvironment(flagId, environment);
    
    // Find rules that have priority higher than the deleted rule
    const rulesToShift = existingRules.filter(rule => rule.priority > deletedPriority);
    
    // Sort by priority ascending to avoid conflicts
    rulesToShift.sort((a, b) => a.priority - b.priority);

    // Shift each rule by -1 priority
    for (const rule of rulesToShift) {
      await this.ruleDefinitionRepository.update(rule.id, {
        priority: rule.priority - 1
      });
    }
  }

  private async validateFeatureFlagExists(flagKey: string, environment: Environment): Promise<void> {
    const featureFlag = await this.featureFlagRepository.findByKeyAndEnvironment(flagKey, environment as any);
    
    if (!featureFlag) {
      throw new NotFoundError(`Feature flag '${flagKey}' not found in environment '${environment}'`);
    }
  }

  private async getFlagId(flagKey: string, environment: Environment): Promise<string> {
    const featureFlag = await this.featureFlagRepository.findByKeyAndEnvironment(flagKey, environment as any);
    
    if (!featureFlag) {
      throw new NotFoundError(`Feature flag '${flagKey}' not found in environment '${environment}'`);
    }

    return featureFlag.id;
  }

  private async shiftRulesToMakeSpace(flagId: string, environment: Environment, insertPriority: number): Promise<void> {
    logger.info('Shifting rules to make space for new rule', { flagId, environment, insertPriority });

    // Get all existing rules for this flag and environment, ordered by priority
    const existingRules = await this.ruleDefinitionRepository.findByFlagIdAndEnvironment(flagId, environment);
    
    // Filter rules that have priority >= insertPriority
    const rulesToShift = existingRules.filter(rule => rule.priority >= insertPriority);
    
    // Sort by priority descending to avoid conflicts when updating
    rulesToShift.sort((a, b) => b.priority - a.priority);

    // Shift each rule by +1 priority
    for (const rule of rulesToShift) {
      await this.ruleDefinitionRepository.update(rule.id, {
        priority: rule.priority + 1
      });
    }

    logger.info('Rules shifted successfully', { 
      flagId, 
      environment, 
      insertPriority, 
      shiftedCount: rulesToShift.length 
    });
  }

  private async getNextAvailablePriority(flagId: string, environment: Environment): Promise<number> {
    const existingRules = await this.ruleDefinitionRepository.findByFlagIdAndEnvironment(flagId, environment);

    if (existingRules.length === 0) {
      return 1; // First rule gets priority 1
    }

    // Find the highest priority and add 1
    const maxPriority = Math.max(...existingRules.map(rule => rule.priority));
    return maxPriority + 1;
  }

  private mapToRuleResponse(ruleDefinition: RuleDefinitionData): RuleResponse {
    return {
      id: ruleDefinition.id,
      flagId: ruleDefinition.flagId,
      environment: ruleDefinition.environment,
      ruleType: ruleDefinition.ruleType as any,
      priority: ruleDefinition.priority,
      config: ruleDefinition.config,
      createdAt: ruleDefinition.createdAt,
      updatedAt: ruleDefinition.updatedAt
    };
  }
}
