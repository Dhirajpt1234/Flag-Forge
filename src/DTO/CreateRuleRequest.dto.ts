import { RuleType } from '../RuleEngine/Types/RuleType.enum';

export default interface CreateRuleRequest {
  ruleType: RuleType;
  priority?: number; // Optional - will auto-assign if not provided
  config: RuleConfig;
}

export interface RuleConfig {
  // USER_ALLOW_LIST config
  userIds?: string[];
  
  // ATTRIBUTE_MATCH config
  requiredAttributes?: Record<string, string>;
  
  // PERCENTAGE_ROLLOUT config
  percentage?: number;
  
  // DEFAULT config
  defaultState?: boolean;
}
