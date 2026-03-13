import { RuleType } from '../RuleEngine/Types/RuleType.enum';
import type { RuleConfig } from '../DTO/CreateRuleRequest.dto';
import { ValidationError } from '../Middleware/exceptionHandler.middleware';

export class RuleValidator {
  static validateRuleConfig(ruleType: RuleType, config: RuleConfig): void {
    switch (ruleType) {
      case RuleType.USER_ALLOW_LIST:
        this.validateUserAllowListConfig(config);
        break;
      
      case RuleType.ATTRIBUTE_MATCH:
        this.validateAttributeMatchConfig(config);
        break;
      
      case RuleType.PERCENTAGE_ROLLOUT:
        this.validatePercentageRolloutConfig(config);
        break;
      
      case RuleType.DEFAULT:
        this.validateDefaultConfig(config);
        break;
      
      default:
        throw new ValidationError(`Unsupported rule type: ${ruleType}`);
    }
  }

  private static validateUserAllowListConfig(config: RuleConfig): void {
    if (!config.userIds) {
      throw new ValidationError('USER_ALLOW_LIST rule requires userIds array');
    }

    if (!Array.isArray(config.userIds)) {
      throw new ValidationError('userIds must be an array');
    }

    if (config.userIds.length === 0) {
      throw new ValidationError('userIds array cannot be empty');
    }

    // Validate each user ID
    for (const userId of config.userIds) {
      if (typeof userId !== 'string' || userId.trim() === '') {
        throw new ValidationError('All userIds must be non-empty strings');
      }
    }
  }

  private static validateAttributeMatchConfig(config: RuleConfig): void {
    if (!config.requiredAttributes) {
      throw new ValidationError('ATTRIBUTE_MATCH rule requires requiredAttributes object');
    }

    if (typeof config.requiredAttributes !== 'object' || Array.isArray(config.requiredAttributes)) {
      throw new ValidationError('requiredAttributes must be an object');
    }

    const attributeKeys = Object.keys(config.requiredAttributes);
    if (attributeKeys.length === 0) {
      throw new ValidationError('requiredAttributes object cannot be empty');
    }

    // Validate each attribute
    for (const [key, value] of Object.entries(config.requiredAttributes)) {
      if (typeof key !== 'string' || key.trim() === '') {
        throw new ValidationError('All attribute keys must be non-empty strings');
      }

      if (typeof value !== 'string') {
        throw new ValidationError('All attribute values must be strings');
      }
    }
  }

  private static validatePercentageRolloutConfig(config: RuleConfig): void {
    if (config.percentage === undefined) {
      throw new ValidationError('PERCENTAGE_ROLLOUT rule requires percentage');
    }

    if (typeof config.percentage !== 'number') {
      throw new ValidationError('percentage must be a number');
    }

    if (config.percentage < 0 || config.percentage > 100) {
      throw new ValidationError('percentage must be between 0 and 100');
    }
  }

  private static validateDefaultConfig(config: RuleConfig): void {
    if (config.defaultState === undefined) {
      throw new ValidationError('DEFAULT rule requires defaultState');
    }

    if (typeof config.defaultState !== 'boolean') {
      throw new ValidationError('defaultState must be a boolean');
    }
  }

  static validatePriority(priority: number): void {
    if (typeof priority !== 'number') {
      throw new ValidationError('Priority must be a number');
    }

    if (!Number.isInteger(priority)) {
      throw new ValidationError('Priority must be an integer');
    }

    if (priority < 1) {
      throw new ValidationError('Priority must be a positive integer');
    }
  }
}
