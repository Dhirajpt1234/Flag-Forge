import type FeatureFlag from '../DTO/FeatureFlag.dto.js';
import environment from '../Enums/environment.js';


export default interface IFeatureFlagRepository {
  save(flag: FeatureFlag): Promise<FeatureFlag>;

  findAll(env: typeof environment[keyof typeof environment]): Promise<FeatureFlag[]>;

  findByKeyAndEnvironment(key: string, env: typeof environment[keyof typeof environment]): Promise<FeatureFlag | null>;

  delete(key: string): Promise<void>;

  findByKey(key: string): Promise<FeatureFlag | null>;
  update(flag: FeatureFlag): Promise<FeatureFlag>;
}