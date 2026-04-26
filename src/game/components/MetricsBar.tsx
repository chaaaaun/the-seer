import type { Metrics } from '../types'

type MetricsBarProps = {
    metrics: Metrics
    currentYear: number
    showMetrics: boolean
    onToggleMetrics: () => void
}

export default function MetricsBar({
    metrics,
    currentYear,
    showMetrics,
    onToggleMetrics,
}: MetricsBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2" aria-label="Current metrics">
            <div className="ml-auto rounded-md border border-slate-300 px-2 py-1 text-sm">
                Year {currentYear}/{20}
            </div>
            <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm transition hover:border-slate-500 hover:bg-slate-100"
                onClick={onToggleMetrics}
                aria-expanded={showMetrics}
            >
                {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
            </button>
            {showMetrics && (
                <>
                    <div className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                        Epistemic: {metrics.epistemic}
                    </div>
                    <div className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                        Doxastic: {metrics.doxastic}
                    </div>
                    <div className="rounded-md border border-slate-300 px-2 py-1 text-sm">
                        Ethical: {metrics.ethical}
                    </div>
                </>
            )}
        </div>
    )
}
