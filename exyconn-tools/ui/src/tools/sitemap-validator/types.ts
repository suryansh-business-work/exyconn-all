export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  url?: string;
}

export interface ValidationResult {
  isValid: boolean;
  urlCount: number;
  issues: ValidationIssue[];
  fileSize: number;
}
