'use client';

interface ComparativeResult {
    winner: 'A' | 'B' | 'Tie';
    winFactor: string;
    scores: {
        accuracy: { A: number; B: number };    // 20
        adherence: { A: number; B: number };   // 45
        logic: { A: number; B: number };       // 20
        readability: { A: number; B: number }; // 15
        total: { A: number; B: number };       // 100
    };
    analysis: {
        A: { strengths: string[]; weaknesses: string[] };
        B: { strengths: string[]; weaknesses: string[] };
    };
    suggestion: string;
    targetModel: string;
    judgeModel: string;
}

interface ComparativeAnalysisDisplayProps {
    results: ComparativeResult[];
}

export default function ComparativeAnalysisDisplay({ results }: ComparativeAnalysisDisplayProps) {
    if (!results || results.length === 0) return null;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* 심사결과 집계표 */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-8 pb-4 border-b border-gray-50 flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">심사 결과 요약 (Summary)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">답변 생성 모델</th>
                                <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">평가(Judge) 수행 모델</th>
                                <th className="p-6 text-xs font-black text-blue-600 uppercase tracking-[0.1em] text-center bg-blue-50/30 border-l border-blue-100">Prompt A 점수</th>
                                <th className="p-6 text-xs font-black text-purple-600 uppercase tracking-[0.1em] text-center bg-purple-50/30 border-l border-purple-100">Prompt B 점수</th>
                                <th className="p-6 text-xs font-black text-gray-900 uppercase tracking-[0.1em] text-center border-l border-gray-100">Winner</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {results.map((result, idx) => (
                                <tr key={idx} className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-6 font-bold text-gray-900">{result.targetModel}</td>
                                    <td className="p-6 font-medium text-gray-500 text-sm">{result.judgeModel}</td>
                                    <td className="p-6 text-center font-black text-blue-600 text-lg bg-blue-50/10 border-l border-blue-100/30">
                                        {result.scores.total.A}
                                    </td>
                                    <td className="p-6 text-center font-black text-purple-600 text-lg bg-purple-50/10 border-l border-purple-100/30">
                                        {result.scores.total.B}
                                    </td>
                                    <td className="p-6 text-center border-l border-gray-100/50">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight shadow-sm
                                            ${result.winner === 'A' ? 'bg-blue-100 text-blue-700' :
                                                result.winner === 'B' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                            {result.winner === 'Tie' ? 'DRAW' : result.winner}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {results.map((result, idx) => {
                const isWinnerA = result.winner === 'A';
                const isWinnerB = result.winner === 'B';
                const isTie = result.winner === 'Tie';

                const scoreDiff = Math.abs(result.scores.total.A - result.scores.total.B);
                let intensityLabel = '';
                if (!isTie) {
                    if (scoreDiff >= 15) intensityLabel = '압도적 우위';
                    else if (scoreDiff >= 7) intensityLabel = '뚜렷한 우위';
                    else intensityLabel = '근소한 우위';
                }

                return (
                    <div key={idx} className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        {/* Header: Model & Verdict */}
                        <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />

                            <div className="flex items-center gap-4 z-10">
                                <span className="text-2xl font-black tracking-tight">{result.targetModel}</span>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold ring-1 ring-white/20">
                                    Judge: {result.judgeModel}
                                </span>
                            </div>

                            <div className="flex items-center gap-6 z-10">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Final Verdict</p>
                                    <div className="flex items-center gap-3">
                                        {!isTie && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter shadow-lg ${isWinnerA ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                                {intensityLabel}
                                            </span>
                                        )}
                                        <h3
                                            className={`text-3xl font-black uppercase italic tracking-tighter
                                                ${isWinnerA ? 'text-blue-400' : isWinnerB ? 'text-purple-400' : 'text-gray-400'}
                                            `}
                                        >
                                            {isTie ? 'DRAW' : `WINNER: ${result.winner}`}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Win Factor Banner */}
                        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-8 py-5 flex items-start gap-4">
                            <div className="w-10 h-10 shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-xl">
                                🏆
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">결정적 승리 요인</h4>
                                <p className="text-gray-800 font-bold leading-relaxed">{result.winFactor}</p>
                            </div>
                        </div>

                        {/* Comparison Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                            {/* Version A Panel */}
                            <div className={`p-8 ${isWinnerA ? 'bg-blue-50/20' : ''}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <h4 className="text-xl font-black text-gray-400">Prompt</h4>
                                        <span className="text-2xl font-black text-blue-600">A</span>
                                    </div>
                                    <div className="text-3xl font-black text-gray-900">{result.scores.total.A}<span className="text-sm text-gray-300 font-bold ml-1">/100</span></div>
                                </div>
                                <div className="space-y-4">
                                    <ComparisonMetric label="지시 이행 (Primary)" score={result.scores.adherence.A} max={45} color="blue" isPrimary />
                                    <ComparisonMetric label="정확성" score={result.scores.accuracy.A} max={20} color="blue" />
                                    <ComparisonMetric label="논리성/구조" score={result.scores.logic.A} max={20} color="blue" />
                                    <ComparisonMetric label="가독성/완성도" score={result.scores.readability.A} max={15} color="blue" />
                                </div>

                                <div className="mt-10 space-y-5">
                                    <div>
                                        <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> STRENGTHS
                                        </h5>
                                        <ul className="space-y-2">
                                            {result.analysis.A.strengths.map((s, i) => (
                                                <li key={i} className="text-sm text-gray-600 pl-4 border-l-2 border-blue-100 leading-snug">{s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> WEAKNESSES
                                        </h5>
                                        <ul className="space-y-2">
                                            {result.analysis.A.weaknesses.map((w, i) => (
                                                <li key={i} className="text-sm text-gray-600 pl-4 border-l-2 border-red-100 leading-snug">{w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Version B Panel */}
                            <div className={`p-8 ${isWinnerB ? 'bg-purple-50/20' : ''}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-baseline gap-2">
                                        <h4 className="text-xl font-black text-gray-400">Prompt</h4>
                                        <span className="text-2xl font-black text-purple-600">B</span>
                                    </div>
                                    <div className="text-3xl font-black text-gray-900">{result.scores.total.B}<span className="text-sm text-gray-300 font-bold ml-1">/100</span></div>
                                </div>
                                <div className="space-y-4">
                                    <ComparisonMetric label="지시 이행 (Primary)" score={result.scores.adherence.B} max={45} color="purple" isPrimary />
                                    <ComparisonMetric label="정확성" score={result.scores.accuracy.B} max={20} color="purple" />
                                    <ComparisonMetric label="논리성/구조" score={result.scores.logic.B} max={20} color="purple" />
                                    <ComparisonMetric label="가독성/완성도" score={result.scores.readability.B} max={15} color="purple" />
                                </div>

                                <div className="mt-10 space-y-5">
                                    <div>
                                        <h5 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> STRENGTHS
                                        </h5>
                                        <ul className="space-y-2">
                                            {result.analysis.B.strengths.map((s, i) => (
                                                <li key={i} className="text-sm text-gray-600 pl-4 border-l-2 border-purple-100 leading-snug">{s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> WEAKNESSES
                                        </h5>
                                        <ul className="space-y-2">
                                            {result.analysis.B.weaknesses.map((w, i) => (
                                                <li key={i} className="text-sm text-gray-600 pl-4 border-l-2 border-red-100 leading-snug">{w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Suggestion Footer */}
                        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
                                </div>
                                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Enhanced Prompting Suggestion</h4>
                            </div>
                            <p className="text-gray-700 text-sm font-bold leading-relaxed pl-9">
                                {result.suggestion}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ComparisonMetric({ label, score, max, color, isPrimary }: { label: string, score: number, max: number, color: 'blue' | 'purple', isPrimary?: boolean }) {
    const percentage = (score / max) * 100;
    const bgClass = color === 'blue' ? 'bg-blue-500' : 'bg-purple-500';
    const textClass = color === 'blue' ? 'text-blue-600' : 'text-purple-600';

    return (
        <div className={`mb-4 last:mb-0 ${isPrimary ? 'bg-gray-50/50 p-3 rounded-xl ring-1 ring-gray-100' : ''}`}>
            <div className="flex justify-between text-[11px] mb-2 font-bold text-gray-500">
                <span className={isPrimary ? 'text-gray-900' : ''}>{label}</span>
                <span className={`${textClass} font-black`}>{score}<span className="text-[9px] text-gray-300 ml-0.5">/{max}</span></span>
            </div>
            <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${isPrimary ? 'h-2.5' : 'h-1.5'}`}>
                <div
                    className={`h-full ${bgClass} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
