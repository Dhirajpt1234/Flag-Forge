import type { EvaluationContext } from '../Types/EvaluationContext.type.js';
import type { RuleResult } from '../Types/RuleResult.type.js';

export interface Rule {
  evaluate(context: EvaluationContext): RuleResult;
  setNext(rule: Rule): void;
}
