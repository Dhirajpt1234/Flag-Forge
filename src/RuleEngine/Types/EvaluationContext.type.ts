import environment from '../../Enums/environment';

export interface EvaluationContext {
  flagKey: string;
  userId: string;
  environment: typeof environment[keyof typeof environment];
  attributes: Map<string, string>;
}
