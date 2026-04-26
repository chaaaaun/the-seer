import { useEffect, useMemo, useState } from 'react'
import type { Choice, Scenario } from '../types'

type ScenarioViewProps = {
    scenario: Scenario
    onChoiceSelect: (choice: Choice) => void
}

function shuffleChoices(choices: Choice[]): Choice[] {
    const shuffledChoices = [...choices]

    for (let index = shuffledChoices.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        const temporaryChoice = shuffledChoices[index]
        shuffledChoices[index] = shuffledChoices[swapIndex]
        shuffledChoices[swapIndex] = temporaryChoice
    }

    return shuffledChoices
}

export default function ScenarioView({ scenario, onChoiceSelect }: ScenarioViewProps) {
    const [isCommentaryOpen, setIsCommentaryOpen] = useState(false)
    const [isImageReady, setIsImageReady] = useState(false)
    const shuffledChoices = useMemo(() => shuffleChoices(scenario.choices), [scenario.id])

    useEffect(() => {
        setIsCommentaryOpen(false)
    }, [scenario.id])

    useEffect(() => {
        let isCancelled = false
        const image = new Image()

        setIsImageReady(false)

        image.onload = () => {
            if (!isCancelled) {
                setIsImageReady(true)
            }
        }

        image.onerror = () => {
            if (!isCancelled) {
                // Avoid a stuck loading state if an asset fails to load.
                setIsImageReady(true)
            }
        }

        image.src = `/${scenario.image}`

        return () => {
            isCancelled = true
        }
    }, [scenario.id, scenario.image])

    return (
        <section className="space-y-4 p-4" aria-live="polite">
            <div className="flex flex-col gap-2 p-2">
                <div className="shadow-inner relative h-44 overflow-hidden rounded-full w-52 h-52 border-8 border-double border-slate-300 mx-auto">
                    {!isImageReady && (
                        <div className="absolute inset-0 grid place-items-center bg-slate-100">
                            <div className="relative h-20 w-20">
                                <span className="absolute inset-0 rounded-full border border-slate-400/70 animate-ping" />
                                <span className="absolute inset-2 rounded-full border border-slate-400/60 animate-ping [animation-delay:150ms]" />
                                <span className="absolute inset-4 rounded-full border border-slate-400/50 animate-ping [animation-delay:300ms]" />
                            </div>
                        </div>
                    )}

                    {isImageReady && (
                        <img
                            src={`/${scenario.image}`}
                            alt={`Vision of ${scenario.id}`}
                            className="h-full w-full object-cover"
                        />
                    )}
                </div>
                <p className="text-xs text-right text-slate-500">
                    {scenario.image.split(".").slice(0, -1).join(".")}
                </p>
                <p className="text-xs text-right text-slate-500">
                    All credit goes to the National Gallery of Art at Washington DC for the lovely open-access images of their collection.
                </p>
            </div>

            <p className="text-sm leading-6">{scenario.text}</p>

            <div className="relative">
                <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm transition hover:border-slate-500 hover:bg-slate-100"
                    onClick={() => setIsCommentaryOpen((currentValue) => !currentValue)}
                    aria-expanded={isCommentaryOpen}
                >
                    Commentary
                </button>

                {isCommentaryOpen && (
                    <div className="mt-2 rounded-md border border-slate-300 bg-white p-3 text-sm shadow-sm">
                        <div dangerouslySetInnerHTML={{ __html: scenario.commentaryHtml }} />
                    </div>
                )}
            </div>

            <div className="grid gap-2">
                {shuffledChoices.map((choice) => (
                    <button
                        key={`${scenario.id}-${choice.id}`}
                        type="button"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-left text-sm transition hover:border-slate-500 hover:bg-slate-100"
                        onClick={() => onChoiceSelect(choice)}
                    >
                        {choice.text}
                    </button>
                ))}
            </div>
        </section>
    )
}
