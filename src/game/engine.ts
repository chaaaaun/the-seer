import type { Choice, Ending, GameData, GameState, Metrics, Scenario } from './types'

const HIGH_METRIC_THRESHOLD = 15
const LOW_METRIC_THRESHOLD = 6
const METRIC_MIN = 0
const METRIC_MAX = 20

const INITIAL_METRICS: Metrics = {
    epistemic: 10,
    doxastic: 10,
    ethical: 10,
}

type EndingRule = {
    matches: (metrics: Metrics) => boolean
    ending: Ending
}

const ARCHITECT_OF_CERTAINTIES_ENDING: Ending = {
    title: 'Architect of Certainties',
    body: 'New orders has been established, built on revelation, maintained by will, and justified by outcomes. History will call you prophet, tyrant, or god depending on who survives to write it.',
}

const HOLLOW_SAINT_ENDING: Ending = {
    title: 'Hollow Saint',
    body: 'Divine truth pursued with absolute conviction and imposed it at great cost, but the truth upheld may have been your own projection all along.',
}

const AGNOSTIC_EMPIRICIST_ENDING: Ending = {
    title: 'Agnostic Empiricist',
    body: 'Proof demanded before acting and judgment suspended often enough that events outpaced you. You made no great errors, and also no great interventions.',
}

const FAITHFUL_PRAGMATIST_ENDING: Ending = {
    title: 'Faithful Pragmatist',
    body: 'Acting on faith but remaining flexible enough to change course when beliefs proved harmful. Perhaps the gods might be displeased, but it is a reasonable compromise.',
}

const AGNOSTIC_CUSTODIAN_ENDING: Ending = {
    title: 'Agnostic Custodian',
    body: 'Neither imposing beliefs nor abandoning responsibility. You\'ve presided over a careful, modest, stable outcome. No legend. No disaster. Some might say it\'s the best outcome one could hope for.',
}

const UNCERTAIN_HAND_ENDING: Ending = {
    title: 'Uncertain Hand',
    body: 'The world expected a prophet, a tyrant, or a saint. What it got was someone who kept asking questions and never quite decided what the answers meant. History will record them as a minor figure of significant restraint, or forget them entirely. Either way, the gods, if there are any, remain undecided.',
}

const ENDING_RULES: EndingRule[] = [
    {
        matches: (metrics) =>
            metrics.epistemic <= LOW_METRIC_THRESHOLD &&
            metrics.doxastic <= LOW_METRIC_THRESHOLD &&
            metrics.ethical <= LOW_METRIC_THRESHOLD,
        ending: ARCHITECT_OF_CERTAINTIES_ENDING,
    },
    {
        matches: (metrics) =>
            metrics.epistemic <= LOW_METRIC_THRESHOLD &&
            metrics.doxastic <= LOW_METRIC_THRESHOLD &&
            metrics.ethical >= HIGH_METRIC_THRESHOLD,
        ending: HOLLOW_SAINT_ENDING,
    },
    {
        matches: (metrics) =>
            metrics.epistemic >= HIGH_METRIC_THRESHOLD &&
            metrics.doxastic >= HIGH_METRIC_THRESHOLD &&
            metrics.ethical < HIGH_METRIC_THRESHOLD,
        ending: AGNOSTIC_EMPIRICIST_ENDING,
    },
    {
        matches: (metrics) =>
            metrics.epistemic <= LOW_METRIC_THRESHOLD &&
            metrics.doxastic >= HIGH_METRIC_THRESHOLD &&
            metrics.ethical <= LOW_METRIC_THRESHOLD,
        ending: FAITHFUL_PRAGMATIST_ENDING,
    },
    {
        matches: (metrics) =>
            metrics.doxastic >= HIGH_METRIC_THRESHOLD &&
            metrics.ethical <= LOW_METRIC_THRESHOLD,
        ending: AGNOSTIC_CUSTODIAN_ENDING,
    },
]

const ALL_ENDINGS: Ending[] = [
    ARCHITECT_OF_CERTAINTIES_ENDING,
    HOLLOW_SAINT_ENDING,
    AGNOSTIC_EMPIRICIST_ENDING,
    FAITHFUL_PRAGMATIST_ENDING,
    AGNOSTIC_CUSTODIAN_ENDING,
    UNCERTAIN_HAND_ENDING,
]

function clampMetric(value: number): number {
    return Math.min(METRIC_MAX, Math.max(METRIC_MIN, value))
}

function getPrerequisiteFreeScenarioIds(scenarios: Scenario[]): Set<string> {
    const referencedScenarioIds = new Set<string>()

    for (const scenario of scenarios) {
        for (const choice of scenario.choices) {
            if (choice.nextScenarioId) {
                referencedScenarioIds.add(choice.nextScenarioId)
            }

            for (const unlockScenarioId of choice.unlockScenarioIds ?? []) {
                referencedScenarioIds.add(unlockScenarioId)
            }
        }
    }

    return new Set(scenarios.filter((scenario) => !referencedScenarioIds.has(scenario.id)).map((s) => s.id))
}

function addMetrics(base: Metrics, delta: Metrics): Metrics {
    return {
        epistemic: clampMetric(base.epistemic + delta.epistemic),
        doxastic: clampMetric(base.doxastic + delta.doxastic),
        ethical: clampMetric(base.ethical + delta.ethical),
    }
}

function pickNextScenarioId(
    preferredId: string | undefined,
    baselineScenarioIds: Set<string>,
    unlockedScenarioIds: string[],
    visitedScenarioIds: string[],
): string | null {
    const visited = new Set(visitedScenarioIds)
    const allowedScenarioIds = new Set([...baselineScenarioIds, ...unlockedScenarioIds])

    if (preferredId && !visited.has(preferredId)) {
        return preferredId
    }

    for (const id of allowedScenarioIds) {
        if (!visited.has(id)) {
            return id
        }
    }

    return null
}

export function createInitialState(startScenarioId: string): GameState {
    return {
        currentScenarioId: startScenarioId,
        turnsPlayed: 0,
        metrics: INITIAL_METRICS,
        visitedScenarioIds: [],
        unlockedScenarioIds: [],
        history: [],
        isComplete: false,
    }
}

export function getEnding(metrics: Metrics): Ending {
    for (const endingRule of ENDING_RULES) {
        if (endingRule.matches(metrics)) {
            return endingRule.ending
        }
    }

    return UNCERTAIN_HAND_ENDING
}

export function getAllEndings(): Ending[] {
    return ALL_ENDINGS
}

export function applyChoice(
    previousState: GameState,
    selectedChoice: Choice,
    scenario: Scenario,
    gameData: GameData,
): GameState {
    const turnsPlayed = previousState.turnsPlayed + 1
    const metrics = addMetrics(previousState.metrics, selectedChoice.impact)
    const visitedScenarioIds = [...previousState.visitedScenarioIds, scenario.id]
    const baselineScenarioIds = getPrerequisiteFreeScenarioIds(gameData.scenarios)
    const unlockedScenarioIds = [
        ...new Set([
            ...previousState.unlockedScenarioIds,
            ...(selectedChoice.unlockScenarioIds ?? []),
        ]),
    ]

    const reachedLimit = turnsPlayed >= gameData.maxScenarios
    const nextScenarioId = reachedLimit
        ? null
        : pickNextScenarioId(
            selectedChoice.nextScenarioId,
            baselineScenarioIds,
            unlockedScenarioIds,
            visitedScenarioIds,
        )

    return {
        ...previousState,
        turnsPlayed,
        metrics,
        visitedScenarioIds,
        unlockedScenarioIds,
        currentScenarioId: nextScenarioId,
        history: [...previousState.history, { scenarioId: scenario.id, choiceId: selectedChoice.id }],
        isComplete: reachedLimit || nextScenarioId === null,
    }
}
