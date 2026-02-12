'use client';

import { ModelResult } from '@/lib/llm-client';

interface TokenUsageDisplayProps {
    results: ModelResult[];
}

export default function TokenUsageDisplay({ results }: TokenUsageDisplayProps) {
    if (!results || results.length === 0) return null;

    // 모델별 토큰 집계
    const modelStats = results.reduce((acc, curr) => {
        if (!acc[curr.model]) {
            acc[curr.model] = { input: 0, output: 0, total: 0 };
        }
        acc[curr.model].input += curr.inputTokens;
        acc[curr.model].output += curr.outputTokens;
        acc[curr.model].total += curr.totalTokens;
        return acc;
    }, {} as Record<string, { input: number; output: number; total: number }>);

    // 전체 합계 계산
    const totalStats = Object.values(modelStats).reduce(
        (acc, curr) => ({
            input: acc.input + curr.input,
            output: acc.output + curr.output,
            total: acc.total + curr.total,
        }),
        { input: 0, output: 0, total: 0 }
    );

    return (
        <div className="mt-20 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20">
            <div className="flex flex-col gap-2 px-2">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-purple-600 rounded-full" />
                    토큰 소요량 집계 (Token Usage Summary)
                </h2>
                <p className="text-gray-500 text-sm font-medium">테스트에 소요된 총 토큰량을 모델별로 분석합니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 요약 카드 */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col justify-between group hover:border-purple-200 transition-colors">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">총 입력 토큰 (Sum of Input)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-gray-900 tracking-tighter">{totalStats.input.toLocaleString()}</span>
                        <span className="text-sm font-bold text-gray-300">Tokens</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col justify-between group hover:border-purple-200 transition-colors">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">총 출력 토큰 (Sum of Output)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-purple-600 tracking-tighter">{totalStats.output.toLocaleString()}</span>
                        <span className="text-sm font-bold text-purple-200">Tokens</span>
                    </div>
                </div>
                <div className="bg-purple-600 p-8 rounded-[2rem] shadow-2xl shadow-purple-200 border border-purple-500 flex flex-col justify-between transform hover:scale-[1.02] transition-transform">
                    <p className="text-xs font-black text-purple-100 uppercase tracking-widest mb-2">전체 합계 (Grand Total)</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white tracking-tighter">{totalStats.total.toLocaleString()}</span>
                        <span className="text-sm font-bold text-purple-300 uppercase">Total</span>
                    </div>
                </div>
            </div>

            {/* 집계 테이블 */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {(() => {
                        const modelNames = Object.keys(modelStats);

                        // 사용자 요청 고정 순서 (PerformanceDisplay와 동일)
                        const TARGET_ORDER = [
                            'gemini-2.5-pro',
                            'gemini-3-pro-preview',
                            'gemini-3-flash-preview',
                            'Claude 4.5 Sonnet',
                            'GPT-5'
                        ];

                        modelNames.sort((a, b) => {
                            const idxA = TARGET_ORDER.indexOf(a);
                            const idxB = TARGET_ORDER.indexOf(b);
                            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
                        });

                        return (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em] min-w-[200px]">토큰 유형</th>
                                        {modelNames.map(name => (
                                            <th key={name} className="p-8 text-sm font-black text-gray-700 uppercase tracking-tight text-center min-w-[140px] border-l border-gray-100/50">
                                                {name}
                                            </th>
                                        ))}
                                        <th className="p-8 text-xs font-black text-purple-600 uppercase tracking-[0.2em] text-center bg-purple-50/30 border-l border-purple-100">
                                            전체 합계
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <tr className="group transition-colors hover:bg-gray-50/50">
                                        <td className="p-8 font-semibold text-gray-600">입력 토큰 (Input)</td>
                                        {modelNames.map(name => (
                                            <td key={name} className="p-8 text-center font-medium text-gray-600 border-l border-gray-100/30">
                                                {modelStats[name].input.toLocaleString()}
                                            </td>
                                        ))}
                                        <td className="p-8 text-center bg-purple-50/5 font-bold text-purple-500 border-l border-purple-100">
                                            {totalStats.input.toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr className="group transition-colors hover:bg-gray-50/50">
                                        <td className="p-8 font-semibold text-gray-600">출력 토큰 (Output)</td>
                                        {modelNames.map(name => (
                                            <td key={name} className="p-8 text-center font-medium text-gray-600 border-l border-gray-100/30">
                                                {modelStats[name].output.toLocaleString()}
                                            </td>
                                        ))}
                                        <td className="p-8 text-center bg-purple-50/5 font-bold text-purple-500 border-l border-purple-100">
                                            {totalStats.output.toLocaleString()}
                                        </td>
                                    </tr>
                                    <tr className="group transition-colors hover:bg-gray-50/50">
                                        <td className="p-8 font-bold text-gray-900 bg-gray-50/10">총 토큰 (Total)</td>
                                        {modelNames.map(name => (
                                            <td key={name} className="p-8 text-center font-black text-xl text-gray-900 border-l border-gray-100/30">
                                                {modelStats[name].total.toLocaleString()}
                                            </td>
                                        ))}
                                        <td className="p-8 text-center bg-purple-50/20 font-black text-purple-600 text-xl border-l border-purple-100">
                                            {totalStats.total.toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
