import environment from '../Enums/environment.js';

export interface EvaluateFlagRequest {
  flagKey: string;
  environment: typeof environment[keyof typeof environment];
  userId: string;
  attributes?: Record<string, string>;
}
