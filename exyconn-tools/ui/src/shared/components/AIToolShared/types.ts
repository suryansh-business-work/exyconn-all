export interface AIToolFormValues {
  input: string;
  additionalContext?: string;
}

export interface AIGeneratorResult {
  content: string;
  timestamp: Date;
}
