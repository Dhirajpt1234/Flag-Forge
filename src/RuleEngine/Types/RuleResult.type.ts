import { RuleType } from './RuleType.enum.js';

export interface RuleResult {
  matched: boolean;
  enabled: boolean;
  ruleType: RuleType;
  reason: string;
}
