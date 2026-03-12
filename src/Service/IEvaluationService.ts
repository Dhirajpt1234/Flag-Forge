import type { EvaluationContext } from '../RuleEngine/Types/EvaluationContext.type.js';
import type { RuleResult } from '../RuleEngine/Types/RuleResult.type.js';
import type { Environment } from './IRuleService.js';

export default interface IEvaluationService {
  evaluateFlag(flagKey: string, environment: Environment, userId: string, attributes?: Record<string, string>): Promise<boolean>;
  evaluateFlagWithDetails(flagKey: string, environment: Environment, userId: string, attributes?: Record<string, string>): Promise<RuleResult>;
  clearCache(flagKey?: string): void;
}
