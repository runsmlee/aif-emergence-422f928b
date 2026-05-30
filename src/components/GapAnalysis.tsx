import { useMemo } from 'react';
import type { FieldFailure, ModelVariable, MissingVariableSuggestion } from '../types';
import { runGapAnalysis, hasMinimumDataForAnalysis } from '../utils/analysis';

interface GapAnalysisProps {
  failures: FieldFailure[];
  variables: ModelVariable[];
  onInspect: (suggestion: MissingVariableSuggestion) => void;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

function getConfidenceTier(score: number): string {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function GapAnalysis({ failures, variables, onInspect }: GapAnalysisProps) {
  const suggestions = useMemo(
    () => runGapAnalysis(failures, variables),
    [failures, variables],
  );

  const hasMinData = hasMinimumDataForAnalysis(failures, variables);

  // No variables defined
  if (variables.length === 0 && failures.length > 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="mt-4 text-sm font-semibold text-gray-700">Define model variables to enable analysis</h3>
        <p className="mt-1.5 text-sm text-gray-500 max-w-sm mx-auto">
          Add your system's known design variables so the gap analysis has a baseline to compare against.
        </p>
      </div>
    );
  }

  // Insufficient data
  if (!hasMinData) {
    const remaining = 3 - failures.length;
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h3 className="mt-4 text-sm font-semibold text-gray-700">Insufficient data for analysis</h3>
        <p className="mt-1.5 text-sm text-gray-500 max-w-sm mx-auto">
          Log at least {remaining} more failure{remaining !== 1 ? 's' : ''} to enable gap analysis.
        </p>
        <div className="mt-4 flex items-center justify-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-colors ${
                i < failures.length ? 'bg-primary-500' : 'bg-gray-200'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  // No missing variables found
  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
          <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mt-4 text-sm font-semibold text-emerald-800">No missing variables detected</h3>
        <p className="mt-1.5 text-sm text-emerald-600 max-w-sm mx-auto">
          All failure condition dimensions are covered by your known model variables. Your model appears complete.
        </p>
      </div>
    );
  }

  // Display suggestions
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-header">
          Missing Variables Detected
        </h3>
        <span className="badge bg-red-50 text-red-700 ring-1 ring-red-200">
          {suggestions.length} gap{suggestions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <ul className="space-y-3" aria-label="Missing variable suggestions">
        {suggestions.map((suggestion) => {
          const tier = getConfidenceTier(suggestion.confidenceScore);
          const colorClass = CONFIDENCE_COLORS[tier];
          return (
            <li
              key={suggestion.id}
              data-testid={suggestion.id}
              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {suggestion.suggestedName}
                    </h4>
                    <span className={`badge ${colorClass}`}>
                      {suggestion.confidenceScore}/100
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{suggestion.reasoning}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {suggestion.supportingFailureIds.length} failure{suggestion.supportingFailureIds.length !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-gray-500">
                      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.562 15.94a2.25 2.25 0 01-3.182 0l-1.32-1.32a2.25 2.25 0 011.32-3.182l.88-.88a2.25 2.25 0 013.182 0l.88.88M15.94 9.562a2.25 2.25 0 010 3.182l-.88.88a2.25 2.25 0 01-3.182 0l-.88-.88a2.25 2.25 0 010-3.182l.88-.88" />
                      </svg>
                      {suggestion.conditionValues.slice(0, 4).join(', ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onInspect(suggestion)}
                  className="btn shrink-0 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 min-h-[36px]"
                  aria-label="Inspect evidence"
                >
                  Inspect
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
