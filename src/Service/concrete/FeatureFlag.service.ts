import type { default as IFeatureFlagService } from '../IFeatureFlag.service.js';
import type { default as CreateFeatureFlagDTO } from '../../DTO/CreateFeatureFlagRequest.dto.js';
import type { default as UpdateFeatureFlagDTO } from '../../DTO/UpdateFeatureFlagRequest.dto.js';
import type { default as FeatureFlagResponseDTO } from '../../DTO/FeatureFlagResponse.dto.js';
import type { default as IAuditService } from '../IAudit.service.js';
import type { default as IFeatureFlagRepository } from '../../Repository/IFeatureFlag.repository.js';
import environment from '../../Enums/environment.js';
import type FeatureFlag from '../../DTO/FeatureFlag.dto.js';

export default class FeatureFlagService implements IFeatureFlagService {
  constructor(
    private repository: IFeatureFlagRepository,
    // private auditService: IAuditService
  ) { }

  // This method will create flag for all the environments user have. 
  // Initially flags will be disabled for each environment.
  // currently we support 3 environments: development, staging, production : TODO later take envs from user. 

  async createFlag(createFeatureFlagDTO: CreateFeatureFlagDTO): Promise<FeatureFlagResponseDTO> {
    const existingFlag = await this.repository.findByKey(createFeatureFlagDTO.key);
    if (existingFlag) {
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

    // Return the first created flag (or you could return all created flags)
    const firstFlag = await this.repository.findByKey(createFeatureFlagDTO.key);
    if (!firstFlag) {
      throw new Error(`Failed to create feature flag with key '${createFeatureFlagDTO.key}'`);
    }

    return this.mapToResponseDTO(firstFlag);
  }

  // get the list of all flag for a specific environment.
  async listFlags(env: typeof environment[keyof typeof environment]): Promise<FeatureFlagResponseDTO[]> {
    const flags = await this.repository.findAll(env);
    return flags.map(flag => this.mapToResponseDTO(flag));
  }

  async getFlag(key: string, env: typeof environment[keyof typeof environment]): Promise<FeatureFlagResponseDTO> {
    const flag = await this.repository.findByKeyAndEnvironment(key, env);
    if (!flag) {
      throw new Error(`Feature flag with key '${key}' not found in ${env} environment`);
    }
    return this.mapToResponseDTO(flag);
  }



  async updateFlag(key: string, env: typeof environment[keyof typeof environment], dto: UpdateFeatureFlagDTO): Promise<FeatureFlagResponseDTO> {
    const existingFlag = await this.repository.findByKey(key);
    if (!existingFlag) {
      throw new Error(`Feature flag with key '${key}' not found in ${env} environment`);
    }

    const updatedFlag: FeatureFlag = {
      ...existingFlag,
      description: dto.description ?? existingFlag.description,
      enabled: dto.enabled ?? existingFlag.enabled
    };

    const savedFlag = await this.repository.update(updatedFlag);
    // await this.auditService.log('UPDATE', 'FeatureFlag', existingFlag, savedFlag);

    return this.mapToResponseDTO(savedFlag);
  }

  // soft delete flag for all environments
  async deleteFlag(key: string): Promise<void> {
    const existingFlag = await this.repository.findByKey(key);
    if (!existingFlag) {
      throw new Error(`Feature flag with key '${key}' not found`);
    }

    // soft delete for the all the user specific environments

    await this.repository.delete(key);
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
