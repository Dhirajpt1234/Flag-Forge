import { RuleType } from '../RuleEngine/Types/RuleType.enum';

export interface RuleDefinitionData {
  id: string;
  flagId: string;
  environment: string;
  ruleType: RuleType | string;
  priority: number;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRuleDefinitionRepository {
  findById(id: string): Promise<RuleDefinitionData | null>;
  findByFlagIdAndEnvironment(flagId: string, environment: string): Promise<RuleDefinitionData[]>;
  findByFlagId(flagId: string): Promise<RuleDefinitionData[]>;
  create(ruleDefinition: Omit<RuleDefinitionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<RuleDefinitionData>;
  update(id: string, updates: Partial<RuleDefinitionData>): Promise<RuleDefinitionData>;
  delete(id: string): Promise<void>;
  deleteByFlagId(flagId: string): Promise<void>;
  deleteByFlagIdAndEnvironment(flagId: string, environment: string): Promise<void>;
}
