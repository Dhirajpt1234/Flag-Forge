import type { IRuleDefinitionRepository } from '../IRuleDefinition.repository.js';
import type { RuleDefinitionData } from '../IRuleDefinition.repository.js';
import { DatabaseClient } from '../../Database/db.client.js';

export default class RuleDefinitionRepository implements IRuleDefinitionRepository {
  constructor() {} 

  async update(id: string, updates: Partial<RuleDefinitionData>): Promise<RuleDefinitionData> {
    const prisma = DatabaseClient.getPrismaInstance().getPrismaClient();
    
    // Build update data object with only defined fields
    const updateData: any = {};
    
    if (updates.ruleType !== undefined) {
      updateData.ruleType = updates.ruleType;
    }
    
    if (updates.priority !== undefined) {
      updateData.priority = updates.priority;
    }
    
    if (updates.config !== undefined) {
      updateData.config = updates.config;
    }
    
    const result = await prisma.ruleDefinition.update({
      where: { id },
      data: updateData
    });

    return this.mapToRuleDefinitionData(result);
  }

  async findByFlagIdAndEnvironment(flagId: string, environment: string): Promise<RuleDefinitionData[]> {
    const prisma = DatabaseClient.getPrismaInstance().getPrismaClient();
    const result = await prisma.ruleDefinition.findMany({
      where: { 
        flagId,
        environment
      },
      orderBy: { priority: 'asc' }
    });

    return result.map(this.mapToRuleDefinitionData);
  }

  async findByFlagId(flagId: string): Promise<RuleDefinitionData[]> {
    const prisma = DatabaseClient.getPrismaInstance().getPrismaClient();
    const result = await prisma.ruleDefinition.findMany({
      where: { flagId },
      orderBy: { priority: 'asc' }
    });

    return result.map(this.mapToRuleDefinitionData);
  }

  async create(ruleDefinition: Omit<RuleDefinitionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<RuleDefinitionData> {
    const prisma = DatabaseClient.getPrismaInstance().getPrismaClient();
    const result = await prisma.ruleDefinition.create({
      data: {
        flagId: ruleDefinition.flagId,
        environment: ruleDefinition.environment,
        ruleType: ruleDefinition.ruleType,
        priority: ruleDefinition.priority,
        config: ruleDefinition.config
      }
    });

    return this.mapToRuleDefinitionData(result);
  }

  // async update(id: string, updates: Partial<RuleDefinitionData>): Promise<RuleDefinitionData> {
  //   const prisma = DatabaseClient.getPrismaInstance().getPrismaClient();
  //   const result = await prisma.ruleDefinition.update({
  //     where: { id },
  //     data: {
  //       ruleType: updates.ruleType,
  //       priority: updates.priority,
  //       config: updates.config
  //     }
  //   });

  //   return this.mapToRuleDefinitionData(result);
  // }

  async delete(id: string): Promise<void> {
    const prisma = DatabaseClient.getPrismaInstance().getPrismaClient();
    await prisma.ruleDefinition.delete({
      where: { id }
    });
  }

  async deleteByFlagId(flagId: string): Promise<void> {
    const prisma = DatabaseClient.getPrismaInstance().getPrismaClient();
    await prisma.ruleDefinition.deleteMany({
      where: { flagId }
    });
  }

  async deleteByFlagIdAndEnvironment(flagId: string, environment: string): Promise<void> {
    const prisma = DatabaseClient.getPrismaInstance().getPrismaClient();
    await prisma.ruleDefinition.deleteMany({
      where: { 
        flagId,
        environment
      }
    });
  }

  private mapToRuleDefinitionData(prismaRule: any): RuleDefinitionData {
    return {
      id: prismaRule.id,
      flagId: prismaRule.flagId,
      environment: prismaRule.environment,
      ruleType: prismaRule.ruleType,
      priority: prismaRule.priority,
      config: prismaRule.config,
      createdAt: prismaRule.createdAt,
      updatedAt: prismaRule.updatedAt
    };
  }
}
