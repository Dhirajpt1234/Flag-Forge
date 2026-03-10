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

export default class RuleService implements IRuleService {
  private ruleDefinitionRepository: RuleDefinitionRepository;
  private featureFlagRepository: IFeatureFlagRepository;

  constructor(featureFlagRepository?: IFeatureFlagRepository) {
    this.ruleDefinitionRepository = new RuleDefinitionRepository();
    this.featureFlagRepository = featureFlagRepository!;
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
    const priority = ruleData.priority ?? await this.getNextAvailablePriority(flagId, environment);

    // 5. If priority is specified, shift existing rules to make space
    if (ruleData.priority) {
      await this.shiftRulesToMakeSpace(flagId, environment, ruleData.priority);
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

    logger.info('Rule created successfully', { 
      ruleId: ruleDefinition.id, 
      flagKey, 
      environment, 
      ruleType: ruleData.ruleType,
      priority 
    });

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

    // For now, we'll need to find by ID across all flags
    // In a more optimized version, we might add a findById method to the repository
    const rules = await this.ruleDefinitionRepository.findByFlagId('dummy'); // This needs to be implemented properly
    
    // For now, throw an error as we need to implement findById in repository
    throw new Error('Method getRule needs repository implementation with findById');

    // const rule = rules.find(r => r.id === ruleId);
    // if (!rule) {
    //   throw new NotFoundError(`Rule with ID ${ruleId} not found`);
    // }
    
    // return this.mapToRuleResponse(rule);
  }

  async updateRule(ruleId: string, updates: UpdateRuleRequest): Promise<RuleResponse> {
    logger.info('Updating rule', { ruleId });

    // Implementation will be added in future phase
    throw new Error('Method updateRule not implemented yet');
  }

  async deleteRule(ruleId: string): Promise<void> {
    logger.info('Deleting rule', { ruleId });

    // Implementation will be added in future phase
    throw new Error('Method deleteRule not implemented yet');
  }

  async deleteRulesByFlag(flagKey: string, environment: Environment): Promise<void> {
    logger.info('Deleting rules for flag', { flagKey, environment });

    const flagId = await this.getFlagId(flagKey, environment);
    await this.ruleDefinitionRepository.deleteByFlagIdAndEnvironment(flagId, environment);

    logger.info('Rules deleted successfully', { flagKey, environment });
  }

  // Private helper methods

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
