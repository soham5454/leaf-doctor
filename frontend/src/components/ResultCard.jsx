const GUIDANCE_SECTIONS = [
  { key: 'symptoms', title: 'Symptoms' },
  { key: 'treatment', title: 'Treatment' },
  { key: 'prevention', title: 'Prevention' },
];

/**
 * Displays diagnosis results, guidance or uncertainty warning,
 * closest matches, and a reset action.
 */
export default function ResultCard({ result, onReset }) {
  if (!result) return null;

  const isConfident = result.status === 'confident';
  const topPredictions = result.top_predictions ?? [];
  const guidance = result.guidance ?? {};
  const headingText = isConfident
    ? result.display_name
    : `Possible: ${result.display_name}`;

  return (
    <section
      aria-label="Leaf check result"
      className="w-full max-w-[560px] mx-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm text-slate-800"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <h2 className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-tight break-words min-w-0">
          {headingText}
        </h2>
        <span
          className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-base font-semibold shrink-0 ${
            isConfident
              ? 'bg-emerald-100 text-emerald-900'
              : 'bg-amber-100 text-amber-950'
          }`}
        >
          {result.confidence}% confident
        </span>
      </header>

      {isConfident ? (
        <div className="mt-6 space-y-6">
          {GUIDANCE_SECTIONS.map(({ key, title }) => {
            const items = guidance[key] ?? [];
            if (items.length === 0) return null;

            return (
              <div key={key}>
                <h3 className="text-[20px] sm:text-[22px] font-bold text-slate-900">
                  {title}
                </h3>
                <ul className="mt-2.5 list-disc pl-6 space-y-2 text-[18px] text-slate-800 leading-relaxed">
                  {items.map((item, index) => (
                    <li key={`${key}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-[18px] text-amber-950 leading-relaxed"
        >
          We&apos;re not sure about this result. Please consult a local
          agriculture expert for a proper diagnosis.
        </div>
      )}

      {topPredictions.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="text-base font-bold uppercase tracking-wide text-slate-600">
            Closest matches
          </h3>
          <ul className="mt-3 space-y-2 text-[16px] sm:text-[18px] text-slate-800">
            {topPredictions.map((prediction, index) => (
              <li
                key={`${prediction.label}-${index}`}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0 break-words">{prediction.label}</span>
                <span className="font-semibold text-slate-900 shrink-0">
                  {prediction.confidence}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-7 w-full min-h-[56px] rounded-xl bg-emerald-600 px-6 py-4 text-xl font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 cursor-pointer"
      >
        Try another photo
      </button>

      <p className="mt-4 text-center text-[14px] sm:text-[15px] text-slate-600 leading-snug">
        This is an AI-assisted guide, not a replacement for expert advice.
      </p>
    </section>
  );
}
