import type { Rule } from './Rule.interface.js';

export interface RuleFactory {
  createRule(ruleType: string, config: any): Rule;
}
