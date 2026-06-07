import type FeatureFlag from '../DTO/FeatureFlag.dto';
import environment from '../Enums/environment';


export default interface IFeatureFlagRepository {
  save(flag: FeatureFlag, organizationId: string): Promise<FeatureFlag>;

  findAll(env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag[]>;

  findByKey(key: string, organizationId: string): Promise<FeatureFlag | null>;

  findByKeyAndEnvironment(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag | null>;

  delete(key: string, organizationId: string): Promise<void>;

  update(flag: FeatureFlag, organizationId: string): Promise<FeatureFlag>;

  enableFlagForEnvironment(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag>;

  disableFlagForEnvironment(key: string, env: typeof environment[keyof typeof environment], organizationId: string): Promise<FeatureFlag>;
}