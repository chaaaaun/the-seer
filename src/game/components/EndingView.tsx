import { useState } from 'react'
import type { Ending } from '../types'

type EndingViewProps = {
    ending: Ending
    allEndings: Ending[]
    onRestart: () => void
}

export default function EndingView({ ending, allEndings, onRestart }: EndingViewProps) {
    const [showAllEndings, setShowAllEndings] = useState(false)

    return (
        <section className="space-y-4 p-4" aria-live="polite">
            <p className="text-sm leading-6">
                Your time as the Seer comes to an end. The Silver Basin dims, its visions fading as you step away. The world continues on, shaped in part by your guidance, but also by forces beyond your sight. As you leave the Sanctum of Echoes, the people anoint you with the title...
            </p>
            <h2 className="text-xl font-medium">{ending.title}</h2>
            <p className="text-sm leading-6">{ending.body}</p>
            <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm transition hover:border-slate-500 hover:bg-slate-100 mr-2"
                onClick={() => setShowAllEndings((currentValue) => !currentValue)}
            >
                {showAllEndings ? 'Hide All Endings' : 'Well, what are they calling the others?'}
            </button>

            {showAllEndings && (
                <div className='flex flex-col gap-2'>
                    {allEndings.map((knownEnding) => (
                        <article key={knownEnding.title} className="space-y-1 rounded-md border border-slate-200 p-3">
                            <h3 className="text-base font-medium">{knownEnding.title}</h3>
                            <p className="text-sm leading-6">{knownEnding.body}</p>
                        </article>
                    ))}
                </div>
            )}

            <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm transition hover:border-slate-500 hover:bg-slate-100"
                onClick={onRestart}
            >
                That's a terrible title! I'm going back in!
            </button>
        </section>
    )
}
