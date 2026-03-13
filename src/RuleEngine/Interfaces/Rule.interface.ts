import type { EvaluationContext } from '../Types/EvaluationContext.type';
import type { RuleResult } from '../Types/RuleResult.type';

export interface Rule {
  evaluate(context: EvaluationContext): RuleResult;
  setNext(rule: Rule): void;
}
