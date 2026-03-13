import { RuleType } from '../RuleEngine/Types/RuleType.enum';

export default interface UpdateRuleRequest {
  ruleType?: RuleType;
  priority?: number;
  config?: any;
}
