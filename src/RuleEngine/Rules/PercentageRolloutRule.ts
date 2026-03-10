import { AbstractRule } from '../Abstract/AbstractRule.js';
import type { EvaluationContext } from '../Types/EvaluationContext.type.js';
import type { RuleResult } from '../Types/RuleResult.type.js';
import { RuleType } from '../Types/RuleType.enum.js';
import { createHash } from 'crypto';

interface PercentageRolloutConfig {
  percentage: number;
}

export class PercentageRolloutRule extends AbstractRule {
  constructor(private config: PercentageRolloutConfig) {
    super();
    
    // Validate percentage
    if (config.percentage < 0 || config.percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
  }

  protected check(context: EvaluationContext): RuleResult {
    // Create deterministic hash using userId and flagKey
    const hashInput = `${context.userId}:${context.flagKey}`;
    const hash = createHash('md5').update(hashInput).digest('hex');
    
    // Convert hash to number (0-99)
    const hashNumber = parseInt(hash.substring(0, 8), 16) % 100;
    
    const isEnabled = hashNumber < this.config.percentage;
    
    return {
      matched: true, // Always matches (either enabled or disabled)
      enabled: isEnabled,
      ruleType: RuleType.PERCENTAGE_ROLLOUT,
      reason: `Hash ${hashNumber} ${isEnabled ? '<' : '>='} ${this.config.percentage}% threshold`
    };
  }

  protected getRuleType(): RuleType {
    return RuleType.PERCENTAGE_ROLLOUT;
  }
}
