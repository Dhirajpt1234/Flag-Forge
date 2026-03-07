import type { default as IAuditService } from '../IAudit.service.js';

export default class AuditService implements IAuditService {
  async log(action: string, entity: string, oldValue: any, newValue: any): Promise<void> {
    console.log(`[AUDIT] ${action} ${entity}:`, {
      timestamp: new Date().toISOString(),
      oldValue,
      newValue
    });
  }
}
