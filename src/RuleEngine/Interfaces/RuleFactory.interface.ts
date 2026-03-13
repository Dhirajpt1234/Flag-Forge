import type { Rule } from './Rule.interface';

export interface RuleFactory {
  createRule(ruleType: string, config: any): Rule;
}
