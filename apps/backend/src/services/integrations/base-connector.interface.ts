export interface IntegrationConfig {
  clientId: string;
  clientSecret?: string;
  tenantId?: string;
  accessToken?: string;
  refreshToken?: string;
  scopes?: string[];
  webhookUrl?: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors?: string[];
  lastSyncTime: Date;
}

export abstract class BaseIntegrationConnector {
  protected config: IntegrationConfig;
  protected organizationId: string;

  constructor(organizationId: string, config: IntegrationConfig) {
    this.organizationId = organizationId;
    this.config = config;
  }

  /**
   * Initialize connection, validate tokens or credentials.
   */
  abstract connect(): Promise<boolean>;

  /**
   * Sync structural entities (Courses, Users, Departments).
   */
  abstract syncEntities(): Promise<SyncResult>;

  /**
   * Fetch a specific document (File, PDF, Doc) and route it to the RAG AI Pipeline.
   */
  abstract ingestDocumentToRAG(documentId: string): Promise<boolean>;

  /**
   * Handle incoming webhooks (e.g., Assignment Created in Canvas or File Uploaded in GDrive).
   */
  abstract handleWebhookPayload(payload: any): Promise<void>;

  /**
   * Disconnect and revoke tokens.
   */
  abstract disconnect(): Promise<void>;
}
