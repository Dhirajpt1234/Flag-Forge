import type { default as CreateFeatureFlagDTO } from '../DTO/CreateFeatureFlagRequest.dto';
import type { default as UpdateFeatureFlagDTO } from '../DTO/UpdateFeatureFlagRequest.dto';
import type { default as FeatureFlagResponseDTO } from '../DTO/FeatureFlagResponse.dto';
import environment from '../Enums/environment';
import type FeatureFlag from '../DTO/FeatureFlag.dto';

export default interface IFeatureFlagService {
  createFlag(dto: CreateFeatureFlagDTO, organizationId: string): Promise<FeatureFlagResponseDTO>;
  getFlag(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlagResponseDTO>;
  listFlags(env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlagResponseDTO[]>;
  updateFlag(key: string, dto: UpdateFeatureFlagDTO, organizationId: string): Promise<FeatureFlagResponseDTO>;
  deleteFlag(key: string, organizationId: string): Promise<void>;
  enableFlag(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag>;
  disableFlag(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag>;
}