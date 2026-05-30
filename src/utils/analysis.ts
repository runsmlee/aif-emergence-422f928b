import type { FieldFailure, ModelVariable, MissingVariableSuggestion, ConditionPair } from '../types';

/**
 * Gap Analysis Engine
 *
 * Algorithm:
 * 1. Extract all unique condition dimensions (keys) from logged failures
 * 2. Build a set of "known dimensions" from model variable names (normalized)
 * 3. For each condition dimension NOT covered by any known variable:
 *    a. Collect all failures that include that condition
 *    b. Score confidence based on: failure count, severity weights, symptom clustering
 * 4. Sort by confidence score descending
 * 5. Return suggested missing variables
 */

const SEVERITY_WEIGHTS: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function normalizeDimensionName(name: string): string {
  return name.toLowerCase().trim().replace(/[_\s-]+/g, ' ');
}

function isDimensionKnown(conditionKey: string, variables: ModelVariable[]): boolean {
  const normalizedCondition = normalizeDimensionName(conditionKey);
  return variables.some((v) => {
    const normalizedName = normalizeDimensionName(v.name);
    const normalizedCategory = normalizeDimensionName(v.category);
    return (
      normalizedName === normalizedCondition ||
      normalizedName.includes(normalizedCondition) ||
      normalizedCondition.includes(normalizedName) ||
      normalizedCategory === normalizedCondition ||
      normalizedCategory.includes(normalizedCondition)
    );
  });
}

function clusterFailuresBySymptom(failures: FieldFailure[]): Map<string, FieldFailure[]> {
  const clusters = new Map<string, FieldFailure[]>();
  for (const failure of failures) {
    const normalizedSymptom = failure.symptoms.toLowerCase().trim();
    const existing = clusters.get(normalizedSymptom) ?? [];
    existing.push(failure);
    clusters.set(normalizedSymptom, existing);
  }
  return clusters;
}

function computeConfidenceScore(
  failures: FieldFailure[],
  totalFailures: number,
  uniqueSymptomClusters: number,
): number {
  if (totalFailures === 0) return 0;

  // Base score: proportion of failures that mention this dimension (0-40)
  const coverageRatio = failures.length / totalFailures;
  const coverageScore = coverageRatio * 40;

  // Severity score: weighted average severity (0-30)
  const severitySum = failures.reduce((sum, f) => sum + (SEVERITY_WEIGHTS[f.severity] ?? 1), 0);
  const maxPossibleSeverity = failures.length * 4; // all critical
  const severityScore = (severitySum / maxPossibleSeverity) * 30;

  // Diversity score: unique symptom clusters / total clusters (0-30)
  const totalClusters = Math.max(uniqueSymptomClusters, 1);
  const symptomSet = new Set(failures.map((f) => f.symptoms.toLowerCase().trim()));
  const diversityScore = (symptomSet.size / totalClusters) * 30;

  const rawScore = coverageScore + severityScore + diversityScore;
  return Math.min(100, Math.round(rawScore));
}

export function runGapAnalysis(
  failures: FieldFailure[],
  variables: ModelVariable[],
): MissingVariableSuggestion[] {
  if (failures.length === 0 || variables.length === 0) {
    return [];
  }

  // Step 1: Extract all unique condition dimensions from failures
  const conditionDimensionMap = new Map<string, { failures: FieldFailure[]; values: Set<string> }>();

  for (const failure of failures) {
    for (const condition of failure.conditions) {
      const normalizedKey = condition.key.trim();
      if (!normalizedKey) continue;

      const existing = conditionDimensionMap.get(normalizedKey);
      if (existing) {
        existing.failures.push(failure);
        existing.values.add(condition.value.trim());
      } else {
        conditionDimensionMap.set(normalizedKey, {
          failures: [failure],
          values: new Set([condition.value.trim()]),
        });
      }
    }
  }

  // Step 2: Filter out dimensions already covered by known variables
  const unknownDimensions = new Map<string, { failures: FieldFailure[]; values: Set<string> }>();
  for (const [dimension, data] of conditionDimensionMap) {
    if (!isDimensionKnown(dimension, variables)) {
      unknownDimensions.set(dimension, data);
    }
  }

  if (unknownDimensions.size === 0) {
    return [];
  }

  // Step 3: Compute confidence scores
  const symptomClusters = clusterFailuresBySymptom(failures);
  const uniqueSymptomClusters = symptomClusters.size;

  const suggestions: MissingVariableSuggestion[] = [];

  for (const [dimension, data] of unknownDimensions) {
    const confidence = computeConfidenceScore(data.failures, failures.length, uniqueSymptomClusters);

    const supportingFailureIds = [...new Set(data.failures.map((f) => f.id))];
    const conditionValues = [...data.values];

    // Build reasoning
    const failureCount = data.failures.length;
    const avgSeverity =
      data.failures.reduce((sum, f) => sum + (SEVERITY_WEIGHTS[f.severity] ?? 1), 0) / failureCount;
    const severityLabel = avgSeverity >= 3 ? 'high-severity' : avgSeverity >= 2 ? 'medium-severity' : 'low-severity';

    const reasoning = `"${dimension}" appears in ${failureCount} of ${failures.length} field failures (${severityLabel} cluster) but no known model variable covers this dimension. Observed values: ${conditionValues.slice(0, 5).join(', ')}.`;

    suggestions.push({
      id: `suggestion-${dimension.replace(/\s+/g, '-').toLowerCase()}`,
      suggestedName: dimension,
      confidenceScore: confidence,
      supportingFailureIds,
      conditionKey: dimension,
      conditionValues,
      reasoning,
    });
  }

  // Sort by confidence descending
  suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);

  return suggestions;
}

export function hasMinimumDataForAnalysis(failures: FieldFailure[], variables: ModelVariable[]): boolean {
  return failures.length >= 3 && variables.length >= 1;
}

export function meetsAcceptanceCriteria(failures: FieldFailure[], variables: ModelVariable[]): boolean {
  return failures.length >= 5 && variables.length >= 3;
}
