import environment from '../Enums/environment.js';

export default interface UpdateFeatureFlagDTO {
  key?: string;
  description?: string;
  environment?: typeof environment[keyof typeof environment];
  enabled?: boolean;
}