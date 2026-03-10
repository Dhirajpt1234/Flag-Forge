import type { Rule } from '../Interfaces/Rule.interface.js';
import type { EvaluationContext } from '../Types/EvaluationContext.type.js';
import type { RuleResult } from '../Types/RuleResult.type.js';
import { RuleType } from '../Types/RuleType.enum.js';

interface DefaultRuleConfig {
  defaultState: boolean;
}

export class DefaultRule implements Rule {
  private nextRule: Rule | null = null;

  constructor(private config: DefaultRuleConfig) {
    // Validate default state
    if (typeof config.defaultState !== 'boolean') {
      throw new Error('Default state must be a boolean');
    }
  }

  setNext(rule: Rule): void {
    // Default rule should always be last in chain, so we don't set next
    this.nextRule = null;
  }

  evaluate(context: EvaluationContext): RuleResult {
    return {
      matched: true,
      enabled: this.config.defaultState,
      ruleType: RuleType.DEFAULT,
      reason: `Default rule applied: ${this.config.defaultState ? 'enabled' : 'disabled'}`
    };
  }
}
