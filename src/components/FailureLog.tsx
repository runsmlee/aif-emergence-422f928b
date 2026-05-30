import { useMemo, useState } from 'react';
import type { FieldFailure, Severity } from '../types';

interface FailureLogProps {
  failures: FieldFailure[];
}

const SEVERITY_BADGE: Record<Severity, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  critical: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

export function FailureLog({ failures }: FailureLogProps) {
  const [componentFilter, setComponentFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const sortedFailures = useMemo(() => {
    return [...failures].sort((a, b) => b.timestamp - a.timestamp);
  }, [failures]);

  const filteredFailures = useMemo(() => {
    return sortedFailures.filter((f) => {
      const matchesComponent = !componentFilter || f.component.toLowerCase().includes(componentFilter.toLowerCase());
      const matchesSeverity = !severityFilter || f.severity === severityFilter;
      return matchesComponent && matchesSeverity;
    });
  }, [sortedFailures, componentFilter, severityFilter]);

  const uniqueComponents = useMemo(() => {
    const components = new Set(failures.map((f) => f.component));
    return [...components].sort();
  }, [failures]);

  if (failures.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-gray-700">No failures logged yet</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
          Use the form to log your first field failure and start discovering missing variables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-header">
          Failure Log
        </h3>
        <span className="badge bg-gray-100 text-gray-600">
          {failures.length}
        </span>
      </div>

      <div className="flex gap-2">
        <select
          value={componentFilter}
          onChange={(e) => setComponentFilter(e.target.value)}
          className="select !py-1.5 text-xs"
          aria-label="Filter by component"
        >
          <option value="">All components</option>
          {uniqueComponents.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="select !py-1.5 text-xs"
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1" aria-label="Failure entries">
        {filteredFailures.map((f) => (
          <li key={f.id} className="group rounded-lg border border-gray-150 bg-white px-4 py-3 transition-all duration-150 hover:border-gray-300 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">{f.component}</span>
                  <span className={`badge ${SEVERITY_BADGE[f.severity]}`}>
                    {f.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{f.symptoms}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {f.conditions.map((c, i) => (
                    <span key={i} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                      <span className="text-gray-400 mr-1">{c.key}:</span>{c.value}
                    </span>
                  ))}
                </div>
              </div>
              <time className="text-xs text-gray-400 whitespace-nowrap mt-0.5" dateTime={new Date(f.timestamp).toISOString()}>
                {new Date(f.timestamp).toLocaleDateString()}
              </time>
            </div>
          </li>
        ))}
      </ul>

      {filteredFailures.length === 0 && (
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500">No failures match the current filters.</p>
        </div>
      )}
    </div>
  );
}
