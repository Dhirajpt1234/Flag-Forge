import type { default as CreateRuleRequest } from '../DTO/CreateRuleRequest.dto';
import type { default as UpdateRuleRequest } from '../DTO/UpdateRuleRequest.dto';
import type { default as RuleResponse } from '../DTO/RuleResponse.dto';

export type Environment = 'local' | 'staging' | 'production';

export default interface IRuleService {
  getRule(ruleId: string): Promise<RuleResponse>;
  getRules(flagKey: string, environment: Environment): Promise<RuleResponse[]>;

  createRule(flagKey: string, environment: Environment, ruleData: CreateRuleRequest): Promise<RuleResponse>;
  updateRule(ruleId: string, updates: UpdateRuleRequest): Promise<RuleResponse>;
  deleteRule(ruleId: string): Promise<void>;
  deleteRulesByFlag(flagKey: string, environment: Environment): Promise<void>;
}
