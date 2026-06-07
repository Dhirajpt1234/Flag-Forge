import type { default as IFeatureFlagRepository } from '../IFeatureFlag.repository';
import environment from '../../Enums/environment';
import type FeatureFlag from '../../DTO/FeatureFlag.dto';
import DatabaseClient from '../../Database/db.client';

export default class FeatureFlagRepository implements IFeatureFlagRepository {
  private dbClient: DatabaseClient;

  constructor(databaseUrl: string) {
    this.dbClient = DatabaseClient.getInstance();
  }

  async save(flag: FeatureFlag, organizationId: string): Promise<FeatureFlag> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    const result = await dbClient.featureFlag.create({
      data: {
        organizationId,
        key: flag.key,
        name: flag.name,
        description: flag.description,
        environment: flag.environment || environment.LOCAL,
        enabled: flag.enabled,
        deleted: flag.deleted || false,
        createdAt: flag.createdAt,
        updatedAt: flag.updatedAt || new Date()
      }
    });

    return this.mapPrismaToFeatureFlag(result);
  }

  async findAll(env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag[]> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    const results = await dbClient.featureFlag.findMany({
      where: { environment: env, organizationId, deleted: false },
      orderBy: { createdAt: 'desc' }
    });

    return results.map((result: any) => this.mapPrismaToFeatureFlag(result));
  }

  async findByKeyAndEnvironment(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag | null> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    const result = await dbClient.featureFlag.findUnique({
      where: { organizationId_key_environment: { organizationId, key, environment: env } }
    });

    return result && !result.deleted ? this.mapPrismaToFeatureFlag(result) : null;
  }

  async findByKey(key: string, organizationId: string): Promise<FeatureFlag | null> {
    const db = DatabaseClient.getPrismaInstance();
    const prisma = db.getPrismaClient();
    const result = await prisma.featureFlag.findFirst({
      where: { key, organizationId }
    });

    return result ? this.mapPrismaToFeatureFlag(result) : null;
  }

  async delete(key: string, organizationId: string): Promise<void> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    await dbClient.featureFlag.updateMany({
      where: {
        key,
        organizationId
      },
      data: { deleted: true }
    });
  }

  async update(flag: FeatureFlag, organizationId: string): Promise<FeatureFlag> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    const result = await dbClient.featureFlag.updateMany({
      where: { key: flag.key, organizationId },
      data: {
        description: flag.description,
        name: flag.name,
        updatedAt: new Date()
      }
    });

    return this.mapPrismaToFeatureFlag(result);
  }

  async enableFlagForEnvironment(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    const result = await dbClient.featureFlag.update({
      where: { organizationId_key_environment: { organizationId, key, environment: env } },
      data: { enabled: true }
    });

    return this.mapPrismaToFeatureFlag(result);
  }

  async disableFlagForEnvironment(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    const result = await dbClient.featureFlag.update({
      where: { organizationId_key_environment: { organizationId, key, environment: env } },
      data: { enabled: false }
    });

    return this.mapPrismaToFeatureFlag(result);
  }

  private mapPrismaToFeatureFlag(prismaFlag: any): FeatureFlag {
    return {
      id: prismaFlag.id,
      organizationId: prismaFlag.organizationId,
      key: prismaFlag.key,
      name: prismaFlag.name,
      description: prismaFlag.description,
      environment: prismaFlag.environment as typeof environment[keyof typeof environment],
      enabled: prismaFlag.enabled,
      deleted: prismaFlag.deleted,
      createdAt: prismaFlag.createdAt,
      updatedAt: prismaFlag.updatedAt
    };
  }
}