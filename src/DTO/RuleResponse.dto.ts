import { RuleType } from '../RuleEngine/Types/RuleType.enum';

export default interface RuleResponse {
  id: string;
  flagId: string;
  environment: string;
  ruleType: RuleType;
  priority: number;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}
