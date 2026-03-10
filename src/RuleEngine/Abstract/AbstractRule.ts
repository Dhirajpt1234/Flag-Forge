import type { Rule } from '../Interfaces/Rule.interface.js';
import type { EvaluationContext } from '../Types/EvaluationContext.type.js';
import type { RuleResult } from '../Types/RuleResult.type.js';
import { RuleType } from '../Types/RuleType.enum.js';

export abstract class AbstractRule implements Rule {
  protected nextRule: Rule | null = null;

  setNext(rule: Rule): void {
    this.nextRule = rule;
  }

  evaluate(context: EvaluationContext): RuleResult {
    const result = this.check(context);
    
    if (result.matched) {
      return result;
    }

    if (this.nextRule) {
      return this.nextRule.evaluate(context);
    }

    // If no next rule and no match, return default not matched
    return {
      matched: false,
      enabled: false,
      ruleType: this.getRuleType(),
      reason: 'No rule matched and no fallback rule available'
    };
  }

  protected abstract check(context: EvaluationContext): RuleResult;
  protected abstract getRuleType(): RuleType;
}