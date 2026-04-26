import gameDataRaw from '../data/scenarios.json'
import type { GameData, MetricKey, Metrics } from './types'

function isMetricShape(value: unknown): value is Metrics {
    if (!value || typeof value !== 'object') {
        return false
    }

    const metrics = value as Partial<Record<MetricKey, unknown>>
    return (
        typeof metrics.epistemic === 'number' &&
        typeof metrics.doxastic === 'number' &&
        typeof metrics.ethical === 'number'
    )
}

function parseGameData(input: unknown): GameData {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid scenario data file: expected object root')
    }

    const candidate = input as Partial<GameData>

    if (typeof candidate.maxScenarios !== 'number' || candidate.maxScenarios <= 0) {
        throw new Error('Invalid scenario data file: maxScenarios must be a positive number')
    }

    if (!Array.isArray(candidate.scenarios) || candidate.scenarios.length === 0) {
        throw new Error('Invalid scenario data file: scenarios must be a non-empty array')
    }

    for (const scenario of candidate.scenarios) {
        if (!scenario || typeof scenario !== 'object') {
            throw new Error('Invalid scenario: each scenario must be an object')
        }

        if (
            typeof scenario.id !== 'string' ||
            typeof scenario.text !== 'string' ||
            typeof scenario.commentaryHtml !== 'string' ||
            typeof scenario.image !== 'string'
        ) {
            throw new Error('Invalid scenario: id, text, commentaryHtml, and image are required strings')
        }

        if (!Array.isArray(scenario.choices) || scenario.choices.length === 0) {
            throw new Error(`Invalid scenario "${scenario.id}": choices must be a non-empty array`)
        }

        for (const choice of scenario.choices) {
            if (!choice || typeof choice !== 'object') {
                throw new Error(`Invalid choice in scenario "${scenario.id}": expected object`)
            }

            if (typeof choice.id !== 'string' || typeof choice.text !== 'string') {
                throw new Error(
                    `Invalid choice in scenario "${scenario.id}": id and text are required strings`,
                )
            }

            if (!isMetricShape(choice.impact)) {
                throw new Error(
                    `Invalid choice "${choice.id}" in scenario "${scenario.id}": impact must include numeric epistemic, doxastic, ethical`,
                )
            }
        }
    }

    return candidate as GameData
}

export const gameData = parseGameData(gameDataRaw)

export function getRandomStartScenarioId(): string {
    const referencedScenarioIds = new Set<string>()

    for (const scenario of gameData.scenarios) {
        for (const choice of scenario.choices) {
            if (choice.nextScenarioId) {
                referencedScenarioIds.add(choice.nextScenarioId)
            }

            for (const unlockId of choice.unlockScenarioIds ?? []) {
                referencedScenarioIds.add(unlockId)
            }
        }
    }

    const eligibleScenarios = gameData.scenarios.filter(
        (scenario) => !referencedScenarioIds.has(scenario.id),
    )

    const randomIndex = Math.floor(Math.random() * eligibleScenarios.length)
    return eligibleScenarios[randomIndex].id
}
