import type { default as IFeatureFlagService } from '../IFeatureFlag.service.js';
import type { default as CreateFeatureFlagDTO } from '../../DTO/CreateFeatureFlagRequest.dto.js';
import type { default as UpdateFeatureFlagDTO } from '../../DTO/UpdateFeatureFlagRequest.dto.js';
import type { default as FeatureFlagResponseDTO } from '../../DTO/FeatureFlagResponse.dto.js';
import type { default as IAuditService } from '../IAudit.service.js';
import type { default as IFeatureFlagRepository } from '../../Repository/IFeatureFlag.repository.js';
import environment from '../../Enums/environment.js';
import type FeatureFlag from '../../DTO/FeatureFlag.dto.js';
import { NotFoundError } from '../../Middleware/exceptionHandler.middleware.js';
import logger from '../../Utils/logger.util.js';

export default class FeatureFlagService implements IFeatureFlagService {
  constructor(
    private repository: IFeatureFlagRepository,
    // private auditService: IAuditService
  ) { }
  // This method will create flag for all the environments user have. 
  // Initially flags will be disabled for each environment.
  // currently we support 3 environments: development, staging, production : TODO later take envs from user. 

  async createFlag(createFeatureFlagDTO: CreateFeatureFlagDTO): Promise<FeatureFlagResponseDTO> {
    logger.info('Creating feature flag in service layer', { key: createFeatureFlagDTO.key, name: createFeatureFlagDTO.name });
    const existingFlag = await this.repository.findByKey(createFeatureFlagDTO.key);
    if (existingFlag) {
      logger.warn('Feature flag already exists', { key: createFeatureFlagDTO.key });
      throw new Error(`Feature flag with key '${createFeatureFlagDTO.key}' already exists`);
    }

    // TODO: get all the environments from user 
    const environments = Object.values(environment);

    // iterate over all user environments and create a flag for each
    const flagPromises = environments.map(async (env) => {
      const newEnvSpecificFlag: FeatureFlag = {
        key: createFeatureFlagDTO.key,
        name: createFeatureFlagDTO.name,
        description: createFeatureFlagDTO.description || '',
        environment: env,
        enabled: false,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return await this.repository.save(newEnvSpecificFlag);
    });

    // Execute all saves concurrently
    const savedFlags = await Promise.all(flagPromises);
    logger.info('Feature flags created for all environments', { key: createFeatureFlagDTO.key, environments });

    // Return the first created flag (or you could return all created flags)
    const firstFlag = await this.repository.findByKey(createFeatureFlagDTO.key);
    if (!firstFlag) {
      logger.error('Failed to retrieve created feature flag', { key: createFeatureFlagDTO.key });
      throw new Error(`Failed to create feature flag with key '${createFeatureFlagDTO.key}'`);
    }

    logger.info('Feature flag creation completed successfully', { key: createFeatureFlagDTO.key });
    return this.mapToResponseDTO(firstFlag);
  }

  // get the list of all flag for a specific environment.
  async listFlags(env: typeof environment[keyof typeof environment]): Promise<FeatureFlagResponseDTO[]> {
    logger.info('Fetching feature flags from service', { environment: env });
    const flags = await this.repository.findAll(env);
    const result = flags.map(flag => this.mapToResponseDTO(flag));
    logger.info('Feature flags retrieved successfully', { environment: env, count: result.length });
    return result;
  }

  async getFlag(key: string, env: typeof environment[keyof typeof environment]): Promise<FeatureFlagResponseDTO> {
    logger.info('Fetching single feature flag from service', { key, environment: env });
    const flag = await this.repository.findByKeyAndEnvironment(key, env);
    if (!flag) {
      logger.error('Feature flag not found', { key, environment: env });
      throw new Error(`Feature flag with key '${key}' not found in ${env} environment`);
    }
    logger.info('Feature flag retrieved successfully', { key, environment: env });
    return this.mapToResponseDTO(flag);
  }



  async updateFlag(key: string, dto: UpdateFeatureFlagDTO): Promise<FeatureFlagResponseDTO> {
    logger.info('Updating feature flag in service', { key, updates: dto });
    const existingFlag = await this.repository.findByKey(key);
    if (!existingFlag) {
      logger.error('Feature flag not found for update', { key });
      throw new NotFoundError(`Feature flag with key '${key}' not found`);
    }

    const updatedFlag: FeatureFlag = {
      ...existingFlag,
      description: dto.description ?? existingFlag.description,
      name: dto.name ?? existingFlag.name,
    };

    const savedFlag = await this.repository.update(updatedFlag);
    // await this.auditService.log('UPDATE', 'FeatureFlag', existingFlag, savedFlag);
    logger.info('Feature flag updated successfully in service', { key });
    return this.mapToResponseDTO(savedFlag);
  }

  // soft delete flag for all environments
  async deleteFlag(key: string): Promise<void> {
    logger.info('Deleting feature flag in service', { key });
    const existingFlag = await this.repository.findByKey(key);
    if (!existingFlag) {
      logger.error('Feature flag not found for deletion', { key });
      throw new Error(`Feature flag with key '${key}' not found`);
    }

    // soft delete for the all the user specific environments
    await this.repository.delete(key);
    logger.info('Feature flag deleted successfully in service', { key });
  }

  async enableFlag(key: string, env: (typeof environment)[keyof typeof environment]): Promise<FeatureFlag> {
    logger.info('Enabling feature flag in service', { key, environment: env });
    const existingFlag = await this.repository.findByKeyAndEnvironment(key, env);
    if (!existingFlag) {
      logger.error('Feature flag not found for enable', { key, environment: env });
      throw new Error(`Feature flag with key '${key}' not found in ${env} environment`);
    }
    const result = this.repository.enableFlagForEnvironment(key, env);
    logger.info('Feature flag enabled successfully in service', { key, environment: env });
    return result;
  }

  async disableFlag(key: string, env: (typeof environment)[keyof typeof environment]): Promise<FeatureFlag> {
    logger.info('Disabling feature flag in service', { key, environment: env });
    const existingFlag = await this.repository.findByKeyAndEnvironment(key, env);
    if (!existingFlag) {
      logger.error('Feature flag not found for disable', { key, environment: env });
      throw new Error(`Feature flag with key '${key}' not found in ${env} environment`);
    }
    const result = this.repository.disableFlagForEnvironment(key, env);
    logger.info('Feature flag disabled successfully in service', { key, environment: env });
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
