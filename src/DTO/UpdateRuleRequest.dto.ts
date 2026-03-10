import { RuleType } from '../RuleEngine/Types/RuleType.enum.js';

export default interface UpdateRuleRequest {
  ruleType?: RuleType;
  priority?: number;
  config?: any;
}
