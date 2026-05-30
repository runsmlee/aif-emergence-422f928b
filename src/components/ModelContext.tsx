import type { FieldFailure, MissingVariableSuggestion } from '../types';

interface ModelContextProps {
  suggestion: MissingVariableSuggestion | null;
  failures: FieldFailure[];
  onClose: () => void;
}

export function ModelContext({ suggestion, failures, onClose }: ModelContextProps) {
  if (!suggestion) return null;

  const supportingFailures = failures.filter(
    (f) => suggestion.supportingFailureIds.includes(f.id),
  );

  return (
    <div className="rounded-xl border border-primary-200 bg-gradient-to-b from-primary-50/80 to-white p-5 shadow-sm" role="dialog" aria-label="Missing variable evidence">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Evidence for: <span className="text-primary-700">{suggestion.suggestedName}</span>
          </h3>
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{suggestion.reasoning}</p>
        </div>
        <button
          onClick={onClose}
          className="btn shrink-0 ml-3 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 min-h-[36px]"
          aria-label="Close evidence panel"
        >
          Close
        </button>
      </div>

      <div className="space-y-3">
        <h4 className="section-header">
          Supporting Failures ({supportingFailures.length})
        </h4>
        {supportingFailures.map((f) => (
          <div key={f.id} className="rounded-lg bg-white p-3 border border-gray-150 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-medium text-gray-900">{f.component}</span>
              <span className={`badge ${
                f.severity === 'critical' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' :
                f.severity === 'high' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' :
                f.severity === 'medium' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              }`}>
                {f.severity}
              </span>
            </div>
            <p className="text-sm text-gray-600">{f.symptoms}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {f.conditions.map((c, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono ${
                    c.key === suggestion.conditionKey
                      ? 'bg-primary-100 text-primary-800 ring-1 ring-primary-300 font-medium'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {c.key}: {c.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
