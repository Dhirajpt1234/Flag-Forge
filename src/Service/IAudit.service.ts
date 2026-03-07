export default interface IAuditService {
  log(action: string, entity: string, oldValue: any, newValue: any): Promise<void>;
}
