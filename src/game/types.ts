export type MetricKey = 'epistemic' | 'doxastic' | 'ethical'

export type Metrics = Record<MetricKey, number>

export type Choice = {
    id: string
    text: string
    impact: Metrics
    nextScenarioId?: string
    unlockScenarioIds?: string[]
}

export type Scenario = {
    id: string
    text: string
    commentaryHtml: string
    image: string
    choices: Choice[]
}

export type GameData = {
    startScenarioId: string
    maxScenarios: number
    scenarios: Scenario[]
}

export type GameState = {
    currentScenarioId: string | null
    turnsPlayed: number
    metrics: Metrics
    visitedScenarioIds: string[]
    unlockedScenarioIds: string[]
    history: Array<{ scenarioId: string; choiceId: string }>
    isComplete: boolean
}

export type Ending = {
    title: string
    body: string
}
