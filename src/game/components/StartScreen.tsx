type StartScreenProps = {
    onStart: () => void
}

export default function StartScreen({ onStart }: StartScreenProps) {
    return (
        <section className="space-y-4 p-4 text-center" aria-live="polite">
            <p className="text-sm leading-6 text-slate-700">
                The heavy incense of the Sanctum of Echoes settles in your lungs. Before you sits the Silver Basin, its surface reflecting not your face, but a swirling tapestry of the world as it is, as it was, and as it could be. Others will call upon you to answer questions of knowledge, belief, and morality. Through the Basin, you will answer, as have your predecessors, and as will your successors, until the end of time itself.
            </p>
            <p>You are...</p>
            <h2 className="text-4xl font-medium">The Seer</h2>
            <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm transition hover:border-slate-500 hover:bg-slate-100"
                onClick={onStart}
            >
                Answer the Call
            </button>
        </section>
    )
}
