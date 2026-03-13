import type { Rule } from '../Interfaces/Rule.interface';
import type { EvaluationContext } from '../Types/EvaluationContext.type';
import type { RuleResult } from '../Types/RuleResult.type';
import { RuleFactoryImpl } from '../Factory/RuleFactoryImpl';

interface RuleDefinition {
  ruleType: string;
  priority: number;
  config: any;
}

export class RuleEngine {
  private firstRule: Rule | null = null;
  private ruleFactory: RuleFactoryImpl;

  constructor() {
    this.ruleFactory = new RuleFactoryImpl();
  }

  /**
   * Build the rule chain from rule definitions
   */
  buildRuleChain(ruleDefinitions: RuleDefinition[]): void {
    if (!ruleDefinitions || ruleDefinitions.length === 0) {
      throw new Error('At least one rule definition is required');
    }

    // Sort rules by priority (lower number = higher priority)
    const sortedRules = ruleDefinitions.sort((a, b) => a.priority - b.priority);

    // Create rule instances
    const ruleInstances: Rule[] = sortedRules.map(def => 
      this.ruleFactory.createRule(def.ruleType, def.config)
    );

    // Build the chain
    if (ruleInstances.length > 0) {
      this.firstRule = ruleInstances[0]!;
      for (let i = 0; i < ruleInstances.length - 1; i++) {
        ruleInstances[i]!.setNext(ruleInstances[i + 1]!);
      }
    }
  }

  /**
   * Evaluate the rule chain against the context
   */
  evaluate(context: EvaluationContext): boolean {
    if (!this.firstRule) {
      throw new Error('Rule chain not built. Call buildRuleChain() first.');
    }

    const result = this.firstRule.evaluate(context);
    return result.enabled;
  }

  /**
   * Evaluate the rule chain and return detailed result
   */
  evaluateWithDetails(context: EvaluationContext): RuleResult {
    if (!this.firstRule) {
      throw new Error('Rule chain not built. Call buildRuleChain() first.');
    }

    return this.firstRule.evaluate(context);
  }

  /**
   * Reset the rule engine
   */
  reset(): void {
    this.firstRule = null;
  }
}
