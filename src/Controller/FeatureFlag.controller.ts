import type { Request, Response } from 'express';
import type { default as IFeatureFlagService } from '../Service/IFeatureFlag.service.js';
import type { default as CreateFeatureFlagDTO } from '../DTO/CreateFeatureFlagRequest.dto.js';
import type { default as UpdateFeatureFlagDTO } from '../DTO/UpdateFeatureFlagRequest.dto.js';
import environment from '../Enums/environment.js';
import { ValidationError } from '../Middleware/exceptionHandler.middleware.js';

export default class FeatureFlagController {
  constructor(private featureFlagService: IFeatureFlagService) { }

  async createFlag(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateFeatureFlagDTO = req.body;

      // Validate required fields
      if (!dto.key || !dto.name) {
        throw new ValidationError('Key and name are required fields');
      }

      if (dto.key.trim() === '' || dto.name.trim() === '') {
        throw new ValidationError('Key and name cannot be empty');
      }

      const result = await this.featureFlagService.createFlag(dto);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Error creating flag' });
    }
  }

  async listFlags(req: Request, res: Response): Promise<void> {
    try {
      // get the list of all flag for a users any environment.
      const result = await this.featureFlagService.listFlags(environment.LOCAL);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async getFlagByEnvironment(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const keyStr: string = Array.isArray(key) ? (key[0] as string) : (key as string);
      const { environment: env } = req.query;

      if (!keyStr || !env) {
        res.status(400).json({ error: 'Key and environment are required' });
        return;
      }

      const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string) || environment.LOCAL;
      if (!Object.values(environment).includes(envStr as any)) {
        res.status(400).json({ error: 'Invalid environment' });
        return;
      }

      const result = await this.featureFlagService.getFlag(keyStr, envStr as typeof environment[keyof typeof environment]);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }

  async updateFlag(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params as { key: string }
      const dto: UpdateFeatureFlagDTO = req.body;

      if (!key) {
        res.status(400).json({ error: 'Key is required' });
        return;
      }

      const result = await this.featureFlagService.updateFlag(key, dto);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }

  async deleteFlag(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params as { key: string };

      if (!key) {
        res.status(400).json({ error: 'Key is required' });
        return;
      }

      await this.featureFlagService.deleteFlag(key);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }

  async enableFlagForEnvironment(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const keyStr: string = Array.isArray(key) ? (key[0] as string) : (key as string);

      const { environment: env } = req.query as { environment: string };
      const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string) || environment.LOCAL;

      if (!keyStr || !envStr) {
        throw new Error("Key and Environment are required.")
      }


      const result = await this.featureFlagService.enableFlag(keyStr, envStr as typeof environment[keyof typeof environment]);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }

  async disableFlagForEnvironment(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const keyStr: string = Array.isArray(key) ? (key[0] as string) : (key as string);

      const { environment: env } = req.query as { environment: string };
      const envStr: string = Array.isArray(env) ? (env[0] as string) : (env as string) || environment.LOCAL;


      if (!keyStr  || !envStr) {
        throw new Error("Key and Environment are required.")
      }

      const result = await this.featureFlagService.disableFlag(keyStr, envStr as typeof environment[keyof typeof environment]);

      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : 'Flag not found' });
    }
  }
}
