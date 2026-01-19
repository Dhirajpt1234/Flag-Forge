import type { default as IFeatureFlagRepository } from '../IFeatureFlag.repository.js';
import environment from '../../Enums/environment.js';
import type FeatureFlag from '../../DTO/FeatureFlag.dto.js';
import DatabaseClient from '../../Database/db.client.js';

export default class FeatureFlagRepository implements IFeatureFlagRepository {
  private dbClient: DatabaseClient;

  constructor(databaseUrl: string) {
    this.dbClient = DatabaseClient.getInstance();
  }

  async save(flag: FeatureFlag): Promise<FeatureFlag> {
    // get the singleton instance of the database client
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    const result = await dbClient.featureFlag.create({
      data: {
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

  async findAll(env: typeof environment[keyof typeof environment]): Promise<FeatureFlag[]> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    const results = await dbClient.featureFlag.findMany({
      where: { environment: env, deleted: false },
      orderBy: { createdAt: 'desc' }
    });

    console.log('results', results);

    return results.map((result: any) => this.mapPrismaToFeatureFlag(result));
  }

  async findByKeyAndEnvironment(key: string, env: typeof environment[keyof typeof environment]): Promise<FeatureFlag | null> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    // Use findUnique with the composite key, then filter by deleted status
    const result = await dbClient.featureFlag.findUnique({
      where: { key_environment: { key: key, environment: env } }
    });

    // Return only if not deleted
    return result && !result.deleted ? this.mapPrismaToFeatureFlag(result) : null;
  }



  async findByKey(key: string): Promise<FeatureFlag | null> {
    const db = DatabaseClient.getPrismaInstance();
    const prisma = db.getPrismaClient();
    const result = await prisma.featureFlag.findFirst({
      where: { key }
    });

    return result ? this.mapPrismaToFeatureFlag(result) : null;
  }

  async delete(key: string): Promise<void> {
    const db = DatabaseClient.getPrismaInstance();
    const dbClient = db.getPrismaClient();

    await dbClient.featureFlag.updateMany({
      where: {
        key: key,
      },
      data: { deleted: true }
    });
  }


  async update(flag: FeatureFlag): Promise<FeatureFlag> {
    const db = DatabaseClient.getPrismaInstance();
    const prisma = db.getPrismaClient();
    const result = await prisma.featureFlag.update({
      where: { key_environment: { key: flag.key, environment: (flag.environment || environment.LOCAL) as string } },
      data: {
        description: flag.description,
        enabled: flag.enabled,
        updatedAt: new Date()
      }
    });

    return this.mapPrismaToFeatureFlag(result);
  }

  private mapPrismaToFeatureFlag(prismaFlag: any): FeatureFlag {
    return {
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