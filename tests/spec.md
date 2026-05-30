# Test Specifications

## Unit Tests (Vitest + React Testing Library)

### FailureForm.test.tsx
- [ ] renders without crash
- [ ] shows form fields for component, conditions (key-value), symptoms, and severity
- [ ] validates that component and at least one condition are required before submission
- [ ] submits failure and calls onAdd callback with correct structured data
- [ ] clears form after successful submission
- [ ] shows validation message when submitting with empty required fields

### VariableManager.test.tsx
- [ ] renders without crash
- [ ] displays list of existing model variables with name, unit, and range
- [ ] allows adding a new variable with name, unit, min/max range, and category
- [ ] validates that variable name is unique before allowing addition
- [ ] allows deleting a variable with confirmation
- [ ] persists variables to localStorage on every add/delete

### GapAnalysis.test.tsx
- [ ] renders without crash
- [ ] shows "insufficient data" message when fewer than 3 failures are logged
- [ ] displays suggested missing variables when 5+ failures are logged across 3+ known variables
- [ ] each suggested variable includes a confidence score (0-100)
- [ ] each suggested variable links to the specific failure records that support it
- [ ] correctly identifies a condition dimension present in failures but NOT in known variables
- [ ] does NOT suggest dimensions already covered by known variables
- [ ] updates suggestions in real-time when new failures are added

### FailureLog.test.tsx
- [ ] renders without crash
- [ ] displays all logged failures in reverse-chronological order
- [ ] shows component, symptom summary, and severity badge for each failure
- [ ] allows filtering failures by component or severity
- [ ] persists failures to localStorage on every add

## User Journey Tests

### Primary Workflow
1. App loads → hero shows failure entry form on the left, gap analysis panel on the right, variable manager accessible via tab/toggle
2. Engineer adds 3+ model variables (e.g., "Operating Temperature" 0-85°C, "Supply Voltage" 3.0-3.6V, "Load Cycles" 0-10000)
3. Engineer logs 5+ field failures with varying conditions, some including a dimension NOT covered by known variables (e.g., humidity, vibration)
4. Gap analysis panel updates → shows "Humidity" or "Vibration" as suggested missing variable with confidence score and linked failure evidence
5. Engineer clicks a suggested variable → sees the specific failures that triggered the suggestion
6. All data persists after page reload (localStorage)

### Edge Case Workflow
1. App loads with no variables defined → variable manager is shown with prompt to add at least one variable before logging failures
2. Engineer logs failures without adding variables → failures are stored but gap analysis shows "define model variables to enable analysis"
3. All failures map to known variable ranges → gap analysis shows "No missing variables detected" (model is good)

## Acceptance Criteria Checklist
(Reviewer verifies these against PRD.md Must Have features)
- [ ] AC: Given at least 5 logged failures across at least 3 known model variables, the engine identifies at least one condition dimension present in failures but NOT covered by any known variable, and presents it as a suggested missing variable with a confidence score and supporting failure evidence.
- [ ] AC: Engineer can add, edit, and delete model variables with name, unit, expected range (min/max), and category, and these persist across page reloads via localStorage.
