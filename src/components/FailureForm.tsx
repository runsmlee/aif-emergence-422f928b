import { useState, type FormEvent } from 'react';
import type { FieldFailure, ConditionPair, Severity } from '../types';
import { generateId } from '../types';

interface FailureFormProps {
  onAdd: (failure: FieldFailure) => void;
}

const SEVERITY_OPTIONS: Severity[] = ['low', 'medium', 'high', 'critical'];

const SEVERITY_COLORS: Record<Severity, string> = {
  low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  high: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  critical: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

export function FailureForm({ onAdd }: FailureFormProps) {
  const [component, setComponent] = useState('');
  const [conditions, setConditions] = useState<ConditionPair[]>([{ key: '', value: '' }]);
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [errors, setErrors] = useState<string[]>([]);

  const addConditionRow = () => {
    setConditions((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeConditionRow = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: 'key' | 'value', val: string) => {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: val } : c)),
    );
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!component.trim()) {
      errs.push('Component is required');
    }
    const filledConditions = conditions.filter((c) => c.key.trim() && c.value.trim());
    if (filledConditions.length === 0) {
      errs.push('At least one condition with both key and value is required');
    }
    if (!symptoms.trim()) {
      errs.push('Symptoms description is required');
    }
    return errs;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const filledConditions = conditions.filter((c) => c.key.trim() && c.value.trim());

    const failure: FieldFailure = {
      id: generateId(),
      component: component.trim(),
      conditions: filledConditions,
      symptoms: symptoms.trim(),
      severity,
      timestamp: Date.now(),
    };

    onAdd(failure);

    // Clear form
    setComponent('');
    setConditions([{ key: '', value: '' }]);
    setSymptoms('');
    setSeverity('medium');
    setErrors([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-label="Log field failure">
      {errors.length > 0 && (
        <div className="animate-fade-in rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
          <div className="flex items-start gap-2">
            <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              {errors.map((err, i) => (
                <p key={i} className="text-sm text-red-700">
                  {err}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="component" className="block text-sm font-medium text-gray-700 mb-1.5">
          Component
        </label>
        <input
          id="component"
          type="text"
          value={component}
          onChange={(e) => setComponent(e.target.value)}
          className="input"
          placeholder="e.g., Power Supply Unit"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-1.5">Conditions</legend>
        {conditions.map((condition, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center">
            <input
              type="text"
              value={condition.key}
              onChange={(e) => updateCondition(index, 'key', e.target.value)}
              className="input"
              placeholder="Condition name"
            />
            <input
              type="text"
              value={condition.value}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              className="input"
              placeholder="Condition value"
            />
            {conditions.length > 1 && (
              <button
                type="button"
                onClick={() => removeConditionRow(index)}
                className="flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                aria-label={`Remove condition ${index + 1}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addConditionRow}
          className="mt-1 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add condition
        </button>
      </fieldset>

      <div>
        <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1.5">
          Symptoms
        </label>
        <textarea
          id="symptoms"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={3}
          className="input resize-none"
          placeholder="Describe the observed symptoms..."
        />
      </div>

      <div>
        <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1.5">
          Severity
        </label>
        <select
          id="severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Severity)}
          className="select"
        >
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_COLORS[severity]}`}>
          {severity}
        </span>
      </div>

      <button
        type="submit"
        className="btn w-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-200 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-200 active:scale-[0.98] min-h-[44px]"
      >
        Log Failure
      </button>
    </form>
  );
}
