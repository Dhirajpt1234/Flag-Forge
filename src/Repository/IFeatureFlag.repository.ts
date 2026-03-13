import type FeatureFlag from '../DTO/FeatureFlag.dto';
import environment from '../Enums/environment';


export default interface IFeatureFlagRepository {
  save(flag: FeatureFlag): Promise<FeatureFlag>;

  findAll(env: typeof environment[keyof typeof environment]): Promise<FeatureFlag[]>;

  findByKey(key: string): Promise<FeatureFlag | null>;

  findByKeyAndEnvironment(key: string, env: typeof environment[keyof typeof environment]): Promise<FeatureFlag | null>;

  delete(key: string): Promise<void>;

  update(flag: FeatureFlag): Promise<FeatureFlag>;

  enableFlagForEnvironment(key : string , env : typeof environment[keyof typeof environment]) : Promise<FeatureFlag>;

  disableFlagForEnvironment(key : string , env : typeof environment[keyof typeof environment]) : Promise<FeatureFlag>;
}