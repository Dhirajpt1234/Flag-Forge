import environment from '../Enums/environment';

export default interface UpdateFeatureFlagDTO {
  key?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
}