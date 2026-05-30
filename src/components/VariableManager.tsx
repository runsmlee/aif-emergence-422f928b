import { useState, type FormEvent } from 'react';
import type { ModelVariable } from '../types';
import { generateId } from '../types';

interface VariableManagerProps {
  variables: ModelVariable[];
  onAdd: (variable: ModelVariable) => void;
  onDelete: (id: string) => void;
  onEdit: (variable: ModelVariable) => void;
}

export function VariableManager({ variables, onAdd, onDelete }: VariableManagerProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [minRange, setMinRange] = useState('');
  const [maxRange, setMaxRange] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Variable name is required');
      return;
    }

    // Check uniqueness
    const isDuplicate = variables.some(
      (v) => v.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (isDuplicate) {
      setError('A variable with this name already exists');
      return;
    }

    const min = parseFloat(minRange);
    const max = parseFloat(maxRange);
    if (isNaN(min) || isNaN(max)) {
      setError('Valid min and max range values are required');
      return;
    }

    if (min >= max) {
      setError('Min range must be less than max range');
      return;
    }

    onAdd({
      id: generateId(),
      name: trimmedName,
      unit: unit.trim(),
      minRange: min,
      maxRange: max,
      category: category.trim(),
    });

    setName('');
    setUnit('');
    setMinRange('');
    setMaxRange('');
    setCategory('');
    setError('');
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="section-header">Model Variables</h3>

      {variables.length > 0 && (
        <ul className="space-y-2" aria-label="Model variables list">
          {variables.map((v) => (
            <li
              key={v.id}
              className="group flex items-start justify-between rounded-lg bg-gray-50/80 px-3.5 py-2.5 text-sm border border-gray-100 transition-all duration-150 hover:border-gray-200 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{v.name}</span>
                  {v.category && (
                    <span className="badge bg-gray-200/80 text-gray-600 text-[10px]">
                      {v.category}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 block font-mono text-xs text-gray-500">
                  {v.minRange} – {v.maxRange} {v.unit}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {confirmDeleteId === v.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="btn bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700 min-h-[32px]"
                      aria-label="Confirm delete"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="btn px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 min-h-[32px]"
                      aria-label="Cancel delete"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="btn px-2 py-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all min-h-[32px]"
                    aria-label={`Delete ${v.name}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {variables.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No model variables defined yet. Add your system's known design variables below.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-100 pt-5" aria-label="Add model variable">
        {error && (
          <div className="animate-fade-in rounded-lg bg-red-50 border border-red-200 p-2.5" role="alert">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="var-name" className="block text-xs font-medium text-gray-700 mb-1">
              Variable Name
            </label>
            <input
              id="var-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              className="input"
              placeholder="e.g., Operating Temperature"
            />
          </div>
          <div>
            <label htmlFor="var-unit" className="block text-xs font-medium text-gray-700 mb-1">
              Unit
            </label>
            <input
              id="var-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input"
              placeholder="e.g., °C"
            />
          </div>
          <div>
            <label htmlFor="var-min" className="block text-xs font-medium text-gray-700 mb-1">
              Min Range
            </label>
            <input
              id="var-min"
              type="number"
              step="any"
              value={minRange}
              onChange={(e) => setMinRange(e.target.value)}
              className="input font-mono"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="var-max" className="block text-xs font-medium text-gray-700 mb-1">
              Max Range
            </label>
            <input
              id="var-max"
              type="number"
              step="any"
              value={maxRange}
              onChange={(e) => setMaxRange(e.target.value)}
              className="input font-mono"
              placeholder="100"
            />
          </div>
        </div>
        <div>
          <label htmlFor="var-category" className="block text-xs font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            id="var-category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            placeholder="e.g., Thermal"
          />
        </div>
        <button
          type="submit"
          className="btn w-full bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 active:scale-[0.98] min-h-[44px]"
        >
          Add Variable
        </button>
      </form>
    </div>
  );
}
