import { useEffect, useMemo, useState } from 'react'
import EndingView from './game/components/EndingView'
import MetricsBar from './game/components/MetricsBar'
import ScenarioView from './game/components/ScenarioView'
import StartScreen from './game/components/StartScreen'
import { gameData, getRandomStartScenarioId } from './game/data'
import { applyChoice, createInitialState, getAllEndings, getEnding } from './game/engine'
import type { Choice, GameState } from './game/types'

const STORAGE_KEY = 'the-seer:progress:v1'
const YEAR_START = 1
const YEAR_END = 20

type PersistedProgress = {
  hasStarted: boolean
  state: GameState
  yearTimeline: number[]
}

function generateYearTimeline(turnCount: number): number[] {
  const years = [YEAR_START]
  let remainingSpan = YEAR_END - YEAR_START
  let remainingSteps = turnCount

  for (let i = 0; i < turnCount; i += 1) {
    let increment = remainingSpan

    if (remainingSteps > 1) {
      const maxIncrement = remainingSpan - (remainingSteps - 1)
      increment = Math.floor(Math.random() * maxIncrement) + 1
    }

    years.push(years[years.length - 1] + increment)
    remainingSpan -= increment
    remainingSteps -= 1
  }

  return years
}

function isValidYearTimeline(value: unknown, turnCount: number): value is number[] {
  if (!Array.isArray(value) || value.length !== turnCount + 1) {
    return false
  }

  if (value[0] !== YEAR_START || value[value.length - 1] !== YEAR_END) {
    return false
  }

  for (let i = 1; i < value.length; i += 1) {
    if (typeof value[i] !== 'number' || value[i] <= value[i - 1]) {
      return false
    }
  }

  return true
}

function isValidPersistedProgress(value: unknown): value is PersistedProgress {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<PersistedProgress>
  if (typeof candidate.hasStarted !== 'boolean') {
    return false
  }

  if (!isValidYearTimeline(candidate.yearTimeline, gameData.maxScenarios)) {
    return false
  }

  if (!candidate.state || typeof candidate.state !== 'object') {
    return false
  }

  const state = candidate.state as Partial<GameState>
  const scenarioIds = new Set(gameData.scenarios.map((scenario) => scenario.id))

  const hasValidCurrentScenario =
    state.currentScenarioId === null ||
    (typeof state.currentScenarioId === 'string' && scenarioIds.has(state.currentScenarioId))

  return (
    hasValidCurrentScenario &&
    typeof state.turnsPlayed === 'number' &&
    Array.isArray(state.visitedScenarioIds) &&
    Array.isArray(state.unlockedScenarioIds) &&
    Array.isArray(state.history) &&
    typeof state.isComplete === 'boolean' &&
    !!state.metrics &&
    typeof state.metrics.epistemic === 'number' &&
    typeof state.metrics.doxastic === 'number' &&
    typeof state.metrics.ethical === 'number'
  )
}

function loadPersistedProgress(): PersistedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown
    return isValidPersistedProgress(parsed) ? parsed : null
  } catch {
    return null
  }
}

function createFreshState(): GameState {
  return createInitialState(getRandomStartScenarioId())
}

export default function App() {
  const scenarioMap = useMemo(() => {
    return new Map(gameData.scenarios.map((scenario) => [scenario.id, scenario]))
  }, [])

  const [persistedProgress] = useState<PersistedProgress | null>(() => loadPersistedProgress())

  const [state, setState] = useState<GameState>(() =>
    persistedProgress?.state ?? createFreshState(),
  )
  const [hasStarted, setHasStarted] = useState(persistedProgress?.hasStarted ?? false)
  const [yearTimeline, setYearTimeline] = useState<number[]>(() =>
    persistedProgress?.yearTimeline ?? generateYearTimeline(gameData.maxScenarios),
  )
  const [showMetrics, setShowMetrics] = useState(false)

  useEffect(() => {
    const payload: PersistedProgress = {
      hasStarted,
      state,
      yearTimeline,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [hasStarted, state, yearTimeline])

  const currentScenario = state.currentScenarioId
    ? scenarioMap.get(state.currentScenarioId) ?? null
    : null

  const ending = state.isComplete ? getEnding(state.metrics) : null
  const allEndings = getAllEndings()
  const currentYear = yearTimeline[Math.min(state.turnsPlayed, yearTimeline.length - 1)]

  const handleChoiceSelect = (selectedChoice: Choice) => {
    setState((previousState) => {
      if (
        previousState.isComplete ||
        !previousState.currentScenarioId ||
        previousState.turnsPlayed >= gameData.maxScenarios
      ) {
        return previousState
      }

      const scenario = scenarioMap.get(previousState.currentScenarioId)
      if (!scenario) {
        return {
          ...previousState,
          currentScenarioId: null,
          isComplete: true,
        }
      }

      const choiceIndex = scenario.choices.indexOf(selectedChoice)
      if (choiceIndex === -1) {
        return previousState
      }

      return applyChoice(previousState, scenario.choices[choiceIndex], scenario, gameData)
    })
  }

  const handleRestart = () => {
    setHasStarted(false)
    setShowMetrics(false)
    setState(createFreshState())
  }

  const handleStart = () => {
    setYearTimeline(generateYearTimeline(gameData.maxScenarios))
    setState(createFreshState())
    setShowMetrics(false)
    setHasStarted(true)
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10 font-serif">
      <section className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">

        {!hasStarted && <StartScreen onStart={handleStart} />}

        {hasStarted && !state.isComplete && currentScenario && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <MetricsBar
                  metrics={state.metrics}
                  currentYear={currentYear}
                  showMetrics={showMetrics}
                  onToggleMetrics={() => setShowMetrics((currentValue) => !currentValue)}
                />
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm transition hover:border-slate-500 hover:bg-slate-100"
                onClick={handleRestart}
              >
                Restart
              </button>
            </div>

            <ScenarioView
              scenario={currentScenario}
              onChoiceSelect={handleChoiceSelect}
            />
          </div>
        )}

        {hasStarted && state.isComplete && ending && (
          <EndingView ending={ending} allEndings={allEndings} onRestart={handleRestart} />
        )}
      </section>
    </main>
  )
}
