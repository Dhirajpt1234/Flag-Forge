import environment from '../Enums/environment.js';

export default interface UpdateFeatureFlagDTO {
  key?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
}