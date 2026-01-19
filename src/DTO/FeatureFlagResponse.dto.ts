import environment from '../Enums/environment.js';

export default interface FeatureFlagResponseDTO {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}