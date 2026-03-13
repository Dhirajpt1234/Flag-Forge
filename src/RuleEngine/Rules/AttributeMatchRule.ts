import { AbstractRule } from '../Abstract/AbstractRule';
import type { EvaluationContext } from '../Types/EvaluationContext.type';
import type { RuleResult } from '../Types/RuleResult.type';
import { RuleType } from '../Types/RuleType.enum';

interface AttributeMatchConfig {
  requiredAttributes: Record<string, string>;
}

export class AttributeMatchRule extends AbstractRule {
  constructor(private config: AttributeMatchConfig) {
    super();
  }

  protected check(context: EvaluationContext): RuleResult {
    // Check all required attributes
    for (const [attributeKey, expectedValue] of Object.entries(this.config.requiredAttributes)) {
      const actualValue = context.attributes.get(attributeKey);
      
      if (actualValue !== expectedValue) {
        return {
          matched: false,
          enabled: false,
          ruleType: RuleType.ATTRIBUTE_MATCH,
          reason: `Attribute ${attributeKey}: expected '${expectedValue}', got '${actualValue || 'undefined'}'`
        };
      }
    }

    // All attributes matched
    const matchedAttributes = Object.keys(this.config.requiredAttributes).join(', ');
    return {
      matched: true,
      enabled: true,
      ruleType: RuleType.ATTRIBUTE_MATCH,
      reason: `All required attributes matched: ${matchedAttributes}`
    };
  }

  protected getRuleType(): RuleType {
    return RuleType.ATTRIBUTE_MATCH;
  }
}
