import type { EvaluationContext } from '../RuleEngine/Types/EvaluationContext.type';
import type { RuleResult } from '../RuleEngine/Types/RuleResult.type';
import type { Environment } from './IRuleService';

export default interface IEvaluationService {
  evaluateFlag(flagKey: string, environment: Environment, userId: string, attributes?: Record<string, string>): Promise<boolean>;
  evaluateFlagWithDetails(flagKey: string, environment: Environment, userId: string, attributes?: Record<string, string>): Promise<RuleResult>;
  clearCache(flagKey?: string): void;
}
