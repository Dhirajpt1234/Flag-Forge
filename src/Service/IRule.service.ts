import type { default as CreateRuleRequest } from '../DTO/CreateRuleRequest.dto';
import type { default as UpdateRuleRequest } from '../DTO/UpdateRuleRequest.dto';
import type { default as RuleResponse } from '../DTO/RuleResponse.dto';

export type Environment = 'local' | 'staging' | 'production';

export default interface IRuleService {
  getRule(ruleId: string, organizationId: string): Promise<RuleResponse>;
  getRules(flagKey: string, environment: Environment, organizationId: string): Promise<RuleResponse[]>;

  createRule(flagKey: string, environment: Environment, ruleData: CreateRuleRequest, organizationId: string): Promise<RuleResponse>;
  updateRule(ruleId: string, updates: UpdateRuleRequest, organizationId: string): Promise<RuleResponse>;
  deleteRule(ruleId: string, organizationId: string): Promise<void>;
  deleteRulesByFlag(flagKey: string, environment: Environment, organizationId: string): Promise<void>;
}
