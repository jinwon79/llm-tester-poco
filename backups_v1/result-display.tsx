'use client';

interface ResultDisplayProps {
    results: any[];
    savedPath?: string;
}

export default function ResultDisplay({ results, savedPath }: ResultDisplayProps) {
    if (!results || results.length === 0) return null;

    return (
        <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                    LLM 생성 결과
                </h2>
                {savedPath && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        성공적으로 저장됨
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result, index) => (
                    <div
                        key={index}
                        className={`flex flex-col h-full bg-white rounded-2xl shadow-lg border transition-all hover:shadow-2xl ${result.error ? 'border-red-100 hover:border-red-200' : 'border-gray-100 hover:border-blue-100'
                            }`}
                    >
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{result.model}</h3>
                                <span className="text-xs text-gray-400 font-mono">Run #{result.repeatIndex}</span>
                            </div>
                            {!result.error && (
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded uppercase tracking-wider border border-blue-100">
                                    {result.repeatIndex}회차 SUCCESS
                                </span>
                            )}
                        </div>

                        <div className="flex-grow p-6">
                            {result.error ? (
                                <div className="p-4 bg-red-50 rounded-xl text-red-700">
                                    <p className="font-bold mb-1 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        API Error
                                    </p>
                                    <p className="text-sm opacity-90 leading-relaxed font-mono break-all">{result.error}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-xl max-h-[300px] overflow-y-auto border border-gray-100">
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                            {result.response}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 bg-blue-50/50 rounded-lg flex flex-col gap-1 border border-blue-50">
                                            <span className="text-blue-600 font-semibold uppercase tracking-tighter">Latency</span>
                                            <span className="text-lg font-bold text-blue-900 tracking-tight">
                                                {(result.latencyMs / 1000).toFixed(2)}s
                                            </span>
                                        </div>
                                        <div className="p-3 bg-indigo-50/50 rounded-lg flex flex-col gap-1 border border-indigo-50">
                                            <span className="text-indigo-600 font-semibold uppercase tracking-tighter">Tokens</span>
                                            <span className="text-lg font-bold text-indigo-900 tracking-tight">
                                                {result.totalTokens}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                        <div className="flex justify-between text-[10px] text-gray-400 font-medium uppercase px-1">
                                            <span>Prompt: {result.inputTokens}</span>
                                            <span>Completion: {result.outputTokens}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                                            <div
                                                className="h-full bg-blue-400"
                                                style={{ width: `${(result.inputTokens / result.totalTokens) * 100}%` }}
                                            />
                                            <div
                                                className="h-full bg-indigo-400"
                                                style={{ width: `${(result.outputTokens / result.totalTokens) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {savedPath && (
                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-lg border border-gray-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h4 className="font-bold text-lg flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            로컬 저장 경로
                        </h4>
                        <p className="text-sm text-gray-400 font-mono break-all">{savedPath}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-bold uppercase border border-blue-500/30">
                            Auto-Saved
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
