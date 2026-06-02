import { useState, useCallback, useEffect, useRef } from 'react';
import type { FieldFailure, ModelVariable, MissingVariableSuggestion } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { FailureForm } from './components/FailureForm';
import { VariableManager } from './components/VariableManager';
import { GapAnalysis } from './components/GapAnalysis';
import { FailureLog } from './components/FailureLog';
import { ModelContext } from './components/ModelContext';

type ActiveTab = 'variables' | 'log' | 'analysis';

function trackEvent(event: string, props?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.aif?.track) {
    window.aif.track(event, props);
  }
}

export function App() {
  const [variables, setVariables] = useLocalStorage<ModelVariable[]>('emergence-variables', []);
  const [failures, setFailures] = useLocalStorage<FieldFailure[]>('emergence-failures', []);
  const [activeTab, setActiveTab] = useState<ActiveTab>('log');
  const [selectedSuggestion, setSelectedSuggestion] = useState<MissingVariableSuggestion | null>(null);
  const failureFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent('page_view', { path: window.location.pathname });
  }, []);

  const handleAddFailure = useCallback((failure: FieldFailure) => {
    setFailures((prev) => [...prev, failure]);
    trackEvent('failure_logged', { component: failure.component, severity: failure.severity });
  }, [setFailures]);

  const handleAddVariable = useCallback((variable: ModelVariable) => {
    setVariables((prev) => [...prev, variable]);
    trackEvent('variable_added', { name: variable.name, category: variable.category });
  }, [setVariables]);

  const handleDeleteVariable = useCallback((id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
  }, [setVariables]);

  const handleEditVariable = useCallback((updated: ModelVariable) => {
    setVariables((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }, [setVariables]);

  const handleInspect = useCallback((suggestion: MissingVariableSuggestion) => {
    setSelectedSuggestion(suggestion);
    trackEvent('missing_variable_inspected', {
      variable: suggestion.suggestedName,
      confidence: suggestion.confidenceScore,
    });
  }, []);

  const handleCloseInspect = useCallback(() => {
    setSelectedSuggestion(null);
  }, []);

  const handleStartAnalyzing = useCallback(() => {
    setActiveTab('log');
    trackEvent('hero_cta_click', { action: 'start_analyzing' });
    // Use requestAnimationFrame to ensure tab switch renders before scroll
    requestAnimationFrame(() => {
      failureFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Focus the component input after scroll completes
      setTimeout(() => {
        const componentInput = failureFormRef.current?.querySelector<HTMLInputElement>('#component');
        componentInput?.focus();
      }, 400);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm shadow-primary-200">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-gray-900">Emergence</h1>
                <p className="text-xs text-gray-500 leading-tight">Surface what your model never included</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartAnalyzing}
                className="btn bg-primary-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm shadow-primary-200 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-200 active:scale-[0.97] sm:hidden min-h-[36px]"
                aria-label="Start analyzing failures"
              >
                Log Failure
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true"></span>
                  {variables.length} variable{variables.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" aria-hidden="true"></span>
                  {failures.length} failure{failures.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Value Prop Banner */}
      <section className="border-b border-gray-200/60 bg-white" aria-label="Value proposition">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
                Your model passed. The field failed.
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                Emergence finds the variable your model never included — backed by your actual failure data, not guesswork.
              </p>
            </div>
            <button
              onClick={handleStartAnalyzing}
              className="btn shrink-0 bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary-200 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-200 active:scale-[0.97] min-h-[44px]"
              aria-label="Start analyzing failures"
            >
              Log a Failure
            </button>
          </div>
        </div>
      </section>

      {/* Mobile Tab Navigation */}
      <nav className="sticky top-[73px] z-20 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm sm:hidden" aria-label="Main navigation">
        <div className="flex">
          {([
            { key: 'log' as ActiveTab, label: 'Log', icon: (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )},
            { key: 'analysis' as ActiveTab, label: 'Analysis', icon: (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            )},
            { key: 'variables' as ActiveTab, label: 'Variables', icon: (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )},
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 px-4 py-2.5 text-[11px] font-medium transition-all duration-200 min-h-[52px] ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary-500 text-primary-700 bg-primary-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Failure Entry */}
          <div className="lg:col-span-1 space-y-6">
            <div ref={failureFormRef} className="card p-5 sm:p-6">
              <h2 className="section-header mb-4">Log Field Failure</h2>
              <FailureForm onAdd={handleAddFailure} />
            </div>

            {/* Variable Manager (mobile: only in variables tab) */}
            <div className={`card p-5 sm:p-6 ${activeTab !== 'variables' ? 'hidden sm:block' : ''}`}>
              <VariableManager
                variables={variables}
                onAdd={handleAddVariable}
                onDelete={handleDeleteVariable}
                onEdit={handleEditVariable}
              />
            </div>
          </div>

          {/* Right Column: Gap Analysis + Failure Log */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gap Analysis (mobile: only in analysis tab, desktop: always visible) */}
            <div className={`card p-5 sm:p-6 ${activeTab !== 'analysis' ? 'hidden sm:block' : ''}`}>
              <GapAnalysis failures={failures} variables={variables} onInspect={handleInspect} />
            </div>

            {/* Model Context (evidence panel) */}
            {selectedSuggestion && (
              <div className={`animate-fade-in ${activeTab !== 'analysis' ? 'hidden sm:block' : ''}`}>
                <ModelContext
                  suggestion={selectedSuggestion}
                  failures={failures}
                  onClose={handleCloseInspect}
                />
              </div>
            )}

            {/* Failure Log (mobile: only in log tab, desktop: always visible) */}
            <div className={`card p-5 sm:p-6 ${activeTab !== 'log' ? 'hidden sm:block' : ''}`}>
              <FailureLog failures={failures} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
