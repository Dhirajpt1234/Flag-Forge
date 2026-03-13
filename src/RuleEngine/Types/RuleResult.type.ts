import { RuleType } from './RuleType.enum';

export interface RuleResult {
  matched: boolean;
  enabled: boolean;
  ruleType: RuleType;
  reason: string;
}
