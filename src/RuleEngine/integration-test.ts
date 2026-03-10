import { RuleEngine } from './Core/RuleEngine.js';
import { RuleType } from './Types/RuleType.enum.js';
import type { EvaluationContext } from './Types/EvaluationContext.type.js';
import environment from '../Enums/environment.js';

// Test the complete rule engine integration
function testRuleEngineIntegration() {
  console.log('=== Rule Engine Integration Test ===\n');
  
  const ruleEngine = new RuleEngine();
  
  // Define comprehensive rule configurations
  const ruleDefinitions = [
    {
      ruleType: RuleType.USER_ALLOW_LIST,
      priority: 1,
      config: {
        userIds: ['admin', 'user123', 'beta-tester']
      }
    },
    {
      ruleType: RuleType.ATTRIBUTE_MATCH,
      priority: 2,
      config: {
        requiredAttributes: {
          country: 'US',
          plan: 'premium'
        }
      }
    },
    {
      ruleType: RuleType.PERCENTAGE_ROLLOUT,
      priority: 3,
      config: {
        percentage: 25
      }
    },
    {
      ruleType: RuleType.DEFAULT,
      priority: 4,
      config: {
        defaultState: false
      }
    }
  ];
  
  // Build the rule chain
  ruleEngine.buildRuleChain(ruleDefinitions);
  console.log('✅ Rule chain built successfully');
  console.log(`   - ${ruleDefinitions.length} rules configured`);
  console.log('   - Priority order: AllowList → AttributeMatch → PercentageRollout → Default\n');
  
  // Test cases with different scenarios
  const testCases: Array<{
    name: string;
    context: EvaluationContext;
    expectedRule: RuleType;
    expectedEnabled: boolean;
  }> = [
    {
      name: 'Admin user (should match allow list)',
      context: {
        flagKey: 'new-feature',
        userId: 'admin',
        environment: environment.PRODUCTION,
        attributes: new Map([
          ['country', 'CA'],
          ['plan', 'basic']
        ])
      },
      expectedRule: RuleType.USER_ALLOW_LIST,
      expectedEnabled: true
    },
    {
      name: 'Premium US user (should match attributes)',
      context: {
        flagKey: 'new-feature',
        userId: 'regular-user',
        environment: environment.PRODUCTION,
        attributes: new Map([
          ['country', 'US'],
          ['plan', 'premium']
        ])
      },
      expectedRule: RuleType.ATTRIBUTE_MATCH,
      expectedEnabled: true
    },
    {
      name: 'Basic user (should fall through to percentage)',
      context: {
        flagKey: 'new-feature',
        userId: 'basic-user',
        environment: environment.PRODUCTION,
        attributes: new Map([
          ['country', 'UK'],
          ['plan', 'basic']
        ])
      },
      expectedRule: RuleType.PERCENTAGE_ROLLOUT,
      expectedEnabled: true // Will depend on hash, but let's see
    },
    {
      name: 'Random user (should go to default)',
      context: {
        flagKey: 'new-feature',
        userId: 'random-user-999',
        environment: environment.PRODUCTION,
        attributes: new Map([
          ['country', 'FR'],
          ['plan', 'basic']
        ])
      },
      expectedRule: RuleType.DEFAULT,
      expectedEnabled: false
    }
  ];
  
  // Run tests
  console.log('🧪 Running test cases:\n');
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`   User ID: ${testCase.context.userId}`);
    console.log(`   Attributes: ${JSON.stringify(Object.fromEntries(testCase.context.attributes))}`);
    
    const result = ruleEngine.evaluateWithDetails(testCase.context);
    
    console.log(`   ✅ Result: ${result.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`   🎯 Matched Rule: ${result.ruleType}`);
    console.log(`   📝 Reason: ${result.reason}`);
    
    // Verify expectations
    const ruleMatched = result.ruleType === testCase.expectedRule;
    const enabledMatched = result.enabled === testCase.expectedEnabled;
    
    if (ruleMatched && enabledMatched) {
      console.log(`   ✅ Test PASSED`);
    } else {
      console.log(`   ❌ Test FAILED`);
      if (!ruleMatched) {
        console.log(`      Expected rule: ${testCase.expectedRule}, got: ${result.ruleType}`);
      }
      if (!enabledMatched) {
        console.log(`      Expected enabled: ${testCase.expectedEnabled}, got: ${result.enabled}`);
      }
    }
    
    console.log('');
  });
  
  // Test factory error handling
  console.log('🛡️  Testing factory error handling:\n');
  
  try {
    const invalidRuleEngine = new RuleEngine();
    invalidRuleEngine.buildRuleChain([
      {
        ruleType: 'INVALID_RULE',
        priority: 1,
        config: {}
      }
    ]);
    console.log('❌ Should have thrown error for invalid rule type');
  } catch (error) {
    console.log('✅ Correctly caught error for invalid rule type');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  console.log('\n=== Integration Test Complete ===');
}

// Run the test
testRuleEngineIntegration();
