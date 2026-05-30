import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GapAnalysis } from '../src/components/GapAnalysis';
import type { FieldFailure, ModelVariable } from '../src/types';

const baseVariables: ModelVariable[] = [
  { id: 'v1', name: 'Operating Temperature', unit: '°C', minRange: 0, maxRange: 85, category: 'Thermal' },
  { id: 'v2', name: 'Supply Voltage', unit: 'V', minRange: 3.0, maxRange: 3.6, category: 'Electrical' },
  { id: 'v3', name: 'Load Cycles', unit: 'cycles', minRange: 0, maxRange: 10000, category: 'Mechanical' },
];

const baseFailures: FieldFailure[] = [
  {
    id: 'f1',
    component: 'PSU',
    conditions: [{ key: 'Temperature', value: '92' }, { key: 'Humidity', value: '85' }],
    symptoms: 'Voltage dropout under load',
    severity: 'high',
    timestamp: Date.now() - 5000,
  },
  {
    id: 'f2',
    component: 'Capacitor',
    conditions: [{ key: 'Temperature', value: '78' }, { key: 'Humidity', value: '90' }],
    symptoms: 'Capacitance drift',
    severity: 'medium',
    timestamp: Date.now() - 4000,
  },
  {
    id: 'f3',
    component: 'Connector',
    conditions: [{ key: 'Vibration', value: '15g' }, { key: 'Temperature', value: '70' }],
    symptoms: 'Intermittent contact loss',
    severity: 'critical',
    timestamp: Date.now() - 3000,
  },
  {
    id: 'f4',
    component: 'PCB Trace',
    conditions: [{ key: 'Humidity', value: '92' }, { key: 'Vibration', value: '12g' }],
    symptoms: 'Corrosion-induced opens',
    severity: 'high',
    timestamp: Date.now() - 2000,
  },
  {
    id: 'f5',
    component: 'Resistor Array',
    conditions: [{ key: 'Supply Voltage', value: '3.8' }, { key: 'Humidity', value: '88' }],
    symptoms: 'Resistance shift out of tolerance',
    severity: 'medium',
    timestamp: Date.now() - 1000,
  },
];

describe('GapAnalysis', () => {
  const mockOnInspect = vi.fn();

  beforeEach(() => {
    mockOnInspect.mockClear();
  });

  it('renders without crash', () => {
    render(<GapAnalysis failures={[]} variables={[]} onInspect={mockOnInspect} />);
  });

  it('shows "insufficient data" message when fewer than 3 failures are logged', () => {
    render(<GapAnalysis failures={[baseFailures[0]]} variables={baseVariables} onInspect={mockOnInspect} />);
    expect(screen.getByText(/insufficient data/i)).toBeInTheDocument();
  });

  it('shows prompt to define variables when none exist', () => {
    render(<GapAnalysis failures={baseFailures} variables={[]} onInspect={mockOnInspect} />);
    expect(screen.getByText(/define model variables/i)).toBeInTheDocument();
  });

  it('displays suggested missing variables when 5+ failures are logged across 3+ known variables', () => {
    render(<GapAnalysis failures={baseFailures} variables={baseVariables} onInspect={mockOnInspect} />);

    // Should show at least one suggestion (Humidity or Vibration — both are NOT in known variables)
    const suggestions = screen.getAllByTestId(/suggestion-/);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('each suggested variable includes a confidence score (0-100)', () => {
    render(<GapAnalysis failures={baseFailures} variables={baseVariables} onInspect={mockOnInspect} />);

    const scores = screen.getAllByText(/\d+\/100/);
    scores.forEach((el) => {
      const match = el.textContent?.match(/(\d+)\/100/);
      expect(match).toBeTruthy();
      const score = parseInt(match![1], 10);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it('each suggested variable links to the specific failure records that support it', () => {
    render(<GapAnalysis failures={baseFailures} variables={baseVariables} onInspect={mockOnInspect} />);

    // Each suggestion should show evidence count or linked failures
    const evidenceLinks = screen.getAllByText(/\d+ failure/i);
    expect(evidenceLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('correctly identifies a condition dimension present in failures but NOT in known variables', () => {
    render(<GapAnalysis failures={baseFailures} variables={baseVariables} onInspect={mockOnInspect} />);

    // Humidity is in 4 of 5 failures and NOT in any known variable
    const humidityElements = screen.getAllByText(/humidity/i);
    expect(humidityElements.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT suggest dimensions already covered by known variables', () => {
    render(<GapAnalysis failures={baseFailures} variables={baseVariables} onInspect={mockOnInspect} />);

    // "Temperature" IS covered by "Operating Temperature" variable
    // "Supply Voltage" IS covered by "Supply Voltage" variable
    // These should NOT appear as suggestions
    const suggestionElements = screen.getAllByTestId(/suggestion-/);
    for (const el of suggestionElements) {
      expect(el.textContent).not.toMatch(/\bTemperature\b/i);
      expect(el.textContent).not.toMatch(/\bSupply Voltage\b/i);
    }
  });

  it('updates suggestions in real-time when new failures are added', () => {
    const { rerender } = render(
      <GapAnalysis failures={baseFailures.slice(0, 2)} variables={baseVariables} onInspect={mockOnInspect} />,
    );
    // Only 2 failures → insufficient data
    expect(screen.getByText(/insufficient data/i)).toBeInTheDocument();

    // Add more failures
    rerender(<GapAnalysis failures={baseFailures} variables={baseVariables} onInspect={mockOnInspect} />);
    // Now 5 failures → should show suggestions
    const suggestions = screen.queryAllByTestId(/suggestion-/);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "no missing variables" when all failure conditions are covered by known variables', () => {
    const coveredFailures: FieldFailure[] = [
      {
        id: 'f1',
        component: 'PSU',
        conditions: [{ key: 'Temperature', value: '90' }],
        symptoms: 'Overheating',
        severity: 'high',
        timestamp: Date.now(),
      },
      {
        id: 'f2',
        component: 'MCU',
        conditions: [{ key: 'Supply Voltage', value: '3.8' }],
        symptoms: 'Brownout reset',
        severity: 'medium',
        timestamp: Date.now(),
      },
      {
        id: 'f3',
        component: 'Bearing',
        conditions: [{ key: 'Load Cycles', value: '12000' }],
        symptoms: 'Wear-out',
        severity: 'low',
        timestamp: Date.now(),
      },
    ];

    render(<GapAnalysis failures={coveredFailures} variables={baseVariables} onInspect={mockOnInspect} />);

    expect(screen.getByText(/no missing variables/i)).toBeInTheDocument();
  });

  it('allows clicking a suggested variable to inspect supporting failures', async () => {
    const user = userEvent.setup();
    render(<GapAnalysis failures={baseFailures} variables={baseVariables} onInspect={mockOnInspect} />);

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    if (inspectButtons.length > 0) {
      await user.click(inspectButtons[0]);
      expect(mockOnInspect).toHaveBeenCalledTimes(1);
    }
  });
});
