import { AbstractRule } from '../Abstract/AbstractRule.js';
import type { EvaluationContext } from '../Types/EvaluationContext.type.js';
import type { RuleResult } from '../Types/RuleResult.type.js';
import { RuleType } from '../Types/RuleType.enum.js';

interface UserAllowListConfig {
  userIds: string[];
}

export class UserAllowListRule extends AbstractRule {
  constructor(private config: UserAllowListConfig) {
    super();
  }

  protected check(context: EvaluationContext): RuleResult {
    const isAllowed = this.config.userIds.includes(context.userId);
    
    return {
      matched: isAllowed,
      enabled: isAllowed,
      ruleType: RuleType.USER_ALLOW_LIST,
      reason: isAllowed 
        ? `User ${context.userId} is in allow list`
        : `User ${context.userId} is not in allow list`
    };
  }

  protected getRuleType(): RuleType {
    return RuleType.USER_ALLOW_LIST;
  }
}
