import type { default as CreateFeatureFlagDTO } from '../DTO/CreateFeatureFlagRequest.dto.js';
import type { default as UpdateFeatureFlagDTO } from '../DTO/UpdateFeatureFlagRequest.dto.js';
import type { default as FeatureFlagResponseDTO } from '../DTO/FeatureFlagResponse.dto.js';
import environment from '../Enums/environment.js';
import type FeatureFlag from '../DTO/FeatureFlag.dto.js';

export default interface IFeatureFlagService {
  createFlag(dto: CreateFeatureFlagDTO): Promise<FeatureFlagResponseDTO>;
  getFlag(key: string, env: typeof environment[keyof typeof environment]): Promise<FeatureFlagResponseDTO>;
  listFlags(env: typeof environment[keyof typeof environment]): Promise<FeatureFlagResponseDTO[]>;
  updateFlag(key: string, dto: UpdateFeatureFlagDTO): Promise<FeatureFlagResponseDTO>;
  deleteFlag(key: string): Promise<void>;
  enableFlag(key: string, env: typeof environment[keyof typeof environment]): Promise<FeatureFlag>;
  disableFlag(key: string, env: typeof environment[keyof typeof environment]): Promise<FeatureFlag>;
}