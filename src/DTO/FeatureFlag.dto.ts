import type environment from "../Enums/environment.js";

export default interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  environment?: typeof environment[keyof typeof environment];
  enabled: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}