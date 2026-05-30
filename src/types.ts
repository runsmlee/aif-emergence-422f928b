export interface ModelVariable {
  id: string;
  name: string;
  unit: string;
  minRange: number;
  maxRange: number;
  category: string;
}

export interface ConditionPair {
  key: string;
  value: string;
}

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface FieldFailure {
  id: string;
  component: string;
  conditions: ConditionPair[];
  symptoms: string;
  severity: Severity;
  timestamp: number;
}

export interface MissingVariableSuggestion {
  id: string;
  suggestedName: string;
  confidenceScore: number;
  supportingFailureIds: string[];
  conditionKey: string;
  conditionValues: string[];
  reasoning: string;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
