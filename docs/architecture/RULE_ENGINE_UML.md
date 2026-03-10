┌─────────────────────────────────────────────────────────────┐
│                    RULE ENGINE ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│ <<interface>>│
│     Rule     │
├──────────────┤
│ +evaluate()  │
│ +setNext()   │
└──────┬───────┘
       │
       │ implements
       │
┌──────▼───────────┐
│   AbstractRule   │◄─────────────┐
├──────────────────┤              │
│ #nextRule: Rule  │              │ extends
│ +evaluate()      │              │
│ #check()         │              │
│ #getRuleType()   │              │
└──────┬───────────┘              │
       │                          │
       ├──────────────────────────┼────────────────┐
       │                          │                │
┌──────▼──────────┐  ┌───────────▼──────┐  ┌─────▼─────────────┐
│UserAllowListRule│  │AttributeMatchRule│  │PercentageRollout  │
├─────────────────┤  ├──────────────────┤  ├───────────────────┤
│ -config         │  │ -config          │  │ -config           │
│ +check()        │  │ +check()         │  │ +check()          │
└─────────────────┘  └──────────────────┘  └───────────────────┘

┌──────────────┐
│ DefaultRule  │
├──────────────┤
│ -config      │
│ +evaluate()  │
└──────────────┘

┌──────────────────┐         ┌─────────────────┐
│  RuleFactoryImpl │────────>│  Rule (creates) │
├──────────────────┤         └─────────────────┘
│ +createRule()    │
└────────┬─────────┘
         │
         │ uses
         │
┌────────▼─────────┐
│   RuleEngine     │
├──────────────────┤
│ -firstRule: Rule │
│ -ruleFactory     │
│ +buildRuleChain()│
│ +evaluate()      │
└──────────────────┘

TYPES:
┌──────────────────┐  ┌─────────────┐  ┌──────────────┐
│EvaluationContext │  │ RuleResult  │  │  RuleType    │
├──────────────────┤  ├─────────────┤  ├──────────────┤
│ +flagKey         │  │ +matched    │  │ USER_ALLOW   │
│ +userId          │  │ +enabled    │  │ ATTRIBUTE    │
│ +environment     │  │ +ruleType   │  │ PERCENTAGE   │
│ +attributes      │  │ +reason     │  │ DEFAULT      │
└──────────────────┘  └─────────────┘  └──────────────┘