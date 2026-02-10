'use client';

interface AnalysisResult {
    targetModel: string;
    judgeModel: string;
    analysis: string;
    score: number;
    verdict: 'Pass' | 'Fail';
}

interface AnalysisDisplayProps {
    analysisResults: AnalysisResult[];
}

export default function AnalysisDisplay({ analysisResults }: AnalysisDisplayProps) {
    if (!analysisResults || analysisResults.length === 0) return null;

    // 대상 모델별로 그룹화
    const groupedAnalysis = analysisResults.reduce((acc, curr) => {
        if (!acc[curr.targetModel]) acc[curr.targetModel] = [];
        acc[curr.targetModel].push(curr);
        return acc;
    }, {} as Record<string, AnalysisResult[]>);

    return (
        <div className="mt-16 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    LLM 모델 내부 일관성 분석
                </h2>
                <p className="text-gray-500 text-sm font-medium">
                    GPT-4.1 및 Claude 4.5 Sonnet 판사가 답변의 일관성을 검증한 결과입니다.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(groupedAnalysis).map(([targetModel, records], index) => (
                    <div
                        key={index}
                        className="group relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all hover:shadow-2xl hover:border-blue-200"
                    >
                        {/* 카드 헤더 */}
                        <div className="p-8 pb-4 border-b border-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {targetModel} 일관성 분석
                                </h3>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                                        Judge Matrix
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-6 space-y-8">
                            {/* 판사별 점수 비교 섹션 */}
                            <div className="grid grid-cols-2 gap-4">
                                {records.map((record, rIdx) => (
                                    <div
                                        key={rIdx}
                                        className={`p-5 rounded-2xl border transition-all ${record.verdict === 'Pass'
                                            ? 'bg-blue-50/30 border-blue-100 hover:bg-blue-50'
                                            : 'bg-orange-50/30 border-orange-100 hover:bg-orange-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {record.judgeModel}
                                            </span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${record.verdict === 'Pass' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                                                }`}>
                                                {record.verdict}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-3xl font-black tracking-tighter ${record.verdict === 'Pass' ? 'text-blue-700' : 'text-orange-700'
                                                }`}>
                                                {record.score}
                                            </span>
                                            <span className="text-sm font-bold text-gray-400">/ 10</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 상세 분석 텍스트 */}
                            <div className="space-y-6">
                                {records.map((record, rIdx) => (
                                    <div key={rIdx} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1 h-3 rounded-full ${record.judgeModel.includes('GPT') ? 'bg-emerald-400' : 'bg-orange-400'
                                                }`} />
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">
                                                {record.judgeModel} Verdict Report
                                            </span>
                                        </div>
                                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                                                {record.analysis}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 카드 푸터 장식 */}
                        <div className={`h-2 w-full ${records.every(r => r.verdict === 'Pass') ? 'bg-blue-500' : 'bg-orange-400'
                            }`} />
                    </div>
                ))}
            </div>
        </div>
    );
}
