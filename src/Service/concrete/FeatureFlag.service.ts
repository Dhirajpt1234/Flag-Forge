import type { default as IFeatureFlagService } from '../IFeatureFlag.service';
import type { default as CreateFeatureFlagDTO } from '../../DTO/CreateFeatureFlagRequest.dto';
import type { default as UpdateFeatureFlagDTO } from '../../DTO/UpdateFeatureFlagRequest.dto';
import type { default as FeatureFlagResponseDTO } from '../../DTO/FeatureFlagResponse.dto';
import type { default as IAuditService } from '../IAudit.service';
import type { default as IFeatureFlagRepository } from '../../Repository/IFeatureFlag.repository';
import environment from '../../Enums/environment';
import type FeatureFlag from '../../DTO/FeatureFlag.dto';
import { NotFoundError } from '../../Middleware/exceptionHandler.middleware';
import logger from '../../Utils/logger.util';

export default class FeatureFlagService implements IFeatureFlagService {
  constructor(
    private repository: IFeatureFlagRepository,
    // private auditService: IAuditService
  ) { }
  // This method will create flag for all the environments user have. 
  // Initially flags will be disabled for each environment.
  // currently we support 3 environments: development, staging, production : TODO later take envs from user. 

  async createFlag(createFeatureFlagDTO: CreateFeatureFlagDTO, organizationId: string): Promise<FeatureFlagResponseDTO> {
    logger.info('Creating feature flag in service layer', { key: createFeatureFlagDTO.key, name: createFeatureFlagDTO.name, organizationId });
    const existingFlag = await this.repository.findByKey(createFeatureFlagDTO.key, organizationId);
    if (existingFlag) {
      logger.warn('Feature flag already exists', { key: createFeatureFlagDTO.key, organizationId });
      throw new Error(`Feature flag with key '${createFeatureFlagDTO.key}' already exists`);
    }

    const environments = Object.values(environment);

    const flagPromises = environments.map(async (env) => {
      const newEnvSpecificFlag: FeatureFlag = {
        id: '',
        organizationId,
        key: createFeatureFlagDTO.key,
        name: createFeatureFlagDTO.name,
        description: createFeatureFlagDTO.description || '',
        environment: env,
        enabled: false,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return await this.repository.save(newEnvSpecificFlag, organizationId);
    });

    const savedFlags = await Promise.all(flagPromises);
    logger.info('Feature flags created for all environments', { key: createFeatureFlagDTO.key, environments, organizationId });

    const firstFlag = await this.repository.findByKey(createFeatureFlagDTO.key, organizationId);
    if (!firstFlag) {
      logger.error('Failed to retrieve created feature flag', { key: createFeatureFlagDTO.key, organizationId });
      throw new Error(`Failed to create feature flag with key '${createFeatureFlagDTO.key}'`);
    }

    logger.info('Feature flag creation completed successfully', { key: createFeatureFlagDTO.key, organizationId });
    return this.mapToResponseDTO(firstFlag);
  }

  // get the list of all flag for a specific environment.
  async listFlags(env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlagResponseDTO[]> {
    logger.info('Fetching feature flags from service', { environment: env, organizationId });
    const flags = await this.repository.findAll(env, organizationId);
    const result = flags.map(flag => this.mapToResponseDTO(flag));
    logger.info('Feature flags retrieved successfully', { environment: env, organizationId, count: result.length });
    return result;
  }

  async getFlag(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlagResponseDTO> {
    logger.info('Fetching single feature flag from service', { key, environment: env, organizationId });
    const flag = await this.repository.findByKeyAndEnvironment(key, env, organizationId);
    if (!flag) {
      logger.error('Feature flag not found', { key, environment: env, organizationId });
      throw new Error(`Feature flag with key '${key}' not found in ${env} environment`);
    }
    logger.info('Feature flag retrieved successfully', { key, environment: env, organizationId });
    return this.mapToResponseDTO(flag);
  }



  async updateFlag(key: string, dto: UpdateFeatureFlagDTO, organizationId: string): Promise<FeatureFlagResponseDTO> {
    logger.info('Updating feature flag in service', { key, updates: dto, organizationId });
    const existingFlag = await this.repository.findByKey(key, organizationId);
    if (!existingFlag) {
      logger.error('Feature flag not found for update', { key, organizationId });
      throw new NotFoundError(`Feature flag with key '${key}' not found`);
    }

    const updatedFlag: FeatureFlag = {
      ...existingFlag,
      description: dto.description ?? existingFlag.description,
      name: dto.name ?? existingFlag.name,
    };

    const savedFlag = await this.repository.update(updatedFlag, organizationId);
    logger.info('Feature flag updated successfully in service', { key, organizationId });
    return this.mapToResponseDTO(savedFlag);
  }

  // soft delete flag for all environments
  async deleteFlag(key: string, organizationId: string): Promise<void> {
    logger.info('Deleting feature flag in service', { key, organizationId });
    const existingFlag = await this.repository.findByKey(key, organizationId);
    if (!existingFlag) {
      logger.error('Feature flag not found for deletion', { key, organizationId });
      throw new Error(`Feature flag with key '${key}' not found`);
    }

    await this.repository.delete(key, organizationId);
    logger.info('Feature flag deleted successfully in service', { key, organizationId });
  }

  async enableFlag(key: string, env: (typeof environment)[keyof typeof environment], organizationId: string): Promise<FeatureFlag> {
    logger.info('Enabling feature flag in service', { key, environment: env, organizationId });
    const existingFlag = await this.repository.findByKeyAndEnvironment(key, env, organizationId);
    if (!existingFlag) {
      logger.error('Feature flag not found for enable', { key, environment: env, organizationId });
      throw new Error(`Feature flag with key '${key}' not found in ${env} environment`);
    }
    const result = this.repository.enableFlagForEnvironment(key, env, organizationId);
    logger.info('Feature flag enabled successfully in service', { key, environment: env, organizationId });
    return result;
  }

  async disableFlag(key: string, env: (typeof environment)[keyof typeof environment], organizationId: string): Promise<FeatureFlag> {
    logger.info('Disabling feature flag in service', { key, environment: env, organizationId });
    const existingFlag = await this.repository.findByKeyAndEnvironment(key, env, organizationId);
    if (!existingFlag) {
      logger.error('Feature flag not found for disable', { key, environment: env, organizationId });
      throw new Error(`Feature flag with key '${key}' not found in ${env} environment`);
    }
    const result = this.repository.disableFlagForEnvironment(key, env, organizationId);
    logger.info('Feature flag disabled successfully in service', { key, environment: env, organizationId });
    return result;
  }


  private mapToResponseDTO(flag: FeatureFlag): FeatureFlagResponseDTO {
    return {
      key: flag.key,
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt
    };
  }
}
