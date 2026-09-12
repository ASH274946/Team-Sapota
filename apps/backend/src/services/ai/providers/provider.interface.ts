export interface AIProvider {
  generate(prompt: string, options?: any, signal?: AbortSignal): Promise<any>;
  stream(prompt: string, options?: any): AsyncIterable<any>;
  countTokens(text: string): Promise<number>;
  supportsVision(): boolean;
  supportsJSON(): boolean;
  supportsStructuredOutput(): boolean;
  supportsFunctionCalling(): boolean;
  isConfigured?(): boolean;
  healthCheck(): Promise<boolean>;
}
