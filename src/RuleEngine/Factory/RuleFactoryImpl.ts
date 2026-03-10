import type { RuleFactory } from '../Interfaces/RuleFactory.interface.js';
import type { Rule } from '../Interfaces/Rule.interface.js';
import { RuleType } from '../Types/RuleType.enum.js';
import { UserAllowListRule } from '../Rules/UserAllowListRule.js';
import { AttributeMatchRule } from '../Rules/AttributeMatchRule.js';
import { PercentageRolloutRule } from '../Rules/PercentageRolloutRule.js';
import { DefaultRule } from '../Rules/DefaultRule.js';

export class RuleFactoryImpl implements RuleFactory {
  createRule(ruleType: string, config: any): Rule {
    switch (ruleType) {
      case RuleType.USER_ALLOW_LIST:
        if (!config.userIds || !Array.isArray(config.userIds)) {
          throw new Error('USER_ALLOW_LIST rule requires userIds array in config');
        }
        return new UserAllowListRule(config);

      case RuleType.ATTRIBUTE_MATCH:
        if (!config.requiredAttributes || typeof config.requiredAttributes !== 'object') {
          throw new Error('ATTRIBUTE_MATCH rule requires requiredAttributes object in config');
        }
        return new AttributeMatchRule(config);

      case RuleType.PERCENTAGE_ROLLOUT:
        if (typeof config.percentage !== 'number' || config.percentage < 0 || config.percentage > 100) {
          throw new Error('PERCENTAGE_ROLLOUT rule requires valid percentage (0-100) in config');
        }
        return new PercentageRolloutRule(config);

      default:
        // Handle default rule case
        if (config.defaultState !== undefined) {
          return new DefaultRule(config);
        }
        throw new Error(`Unsupported rule type: ${ruleType}`);
    }
  }
}
