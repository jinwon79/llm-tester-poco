'use client';

interface breakdown {
    accuracy: number;
    adherence: number;
    quality: number;
}

interface ResultRecord {
    id: number;
    breakdown: breakdown;
    total_score: number;
    reason: string;
}

interface PerformanceResult {
    test_metadata: { model: string; total_trials: number };
    results: ResultRecord[];
    final_summary: {
        avg_score: number;
        pass_count: number;
        consistency_std_dev: string;
    };
    judgeModel: string;
}

interface PerformanceDisplayProps {
    performanceResults: PerformanceResult[];
}

export default function PerformanceDisplay({ performanceResults }: PerformanceDisplayProps) {
    if (!performanceResults || performanceResults.length === 0) return null;

    // 모델별로 그룹화
    const groupedPerformance = performanceResults.reduce((acc, curr) => {
        const modelName = curr.test_metadata.model;
        if (!acc[modelName]) acc[modelName] = [];
        acc[modelName].push(curr);
        return acc;
    }, {} as Record<string, PerformanceResult[]>);

    const modelNames = Object.keys(groupedPerformance);

    // 종합 요약 데이터 계산 함수
    const getAverageMetrics = (modelName: string) => {
        const records = groupedPerformance[modelName];
        const totalAvg = records.reduce((sum, r) => sum + r.final_summary.avg_score, 0) / records.length;

        // 세부 항목별 평균 계산 (첫 번째 판사 데이터의 breakdown 기준)
        const results = records[0].results;
        const accAvg = results.reduce((sum, r) => sum + r.breakdown.accuracy, 0) / results.length;
        const adhAvg = results.reduce((sum, r) => sum + r.breakdown.adherence, 0) / results.length;
        const qualAvg = results.reduce((sum, r) => sum + r.breakdown.quality, 0) / results.length;

        return { totalAvg, accAvg, adhAvg, qualAvg };
    };

    return (
        <div className="mt-20 space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* 1. 성능 평가 종합 요약표 */}
            <div className="space-y-6">
                <div className="flex flex-col gap-2 px-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-blue-600 rounded-full" />
                        성능 평가 종합 요약
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">모든 모델의 성능 지표를 한눈에 비교합니다.</p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em] min-w-[160px]">평가 항목</th>
                                    <th className="p-8 text-xs font-black text-blue-600 uppercase tracking-[0.2em] text-center bg-blue-50/30">종합 평균</th>
                                    {modelNames.map(name => (
                                        <th key={name} className="p-8 text-sm font-black text-gray-700 uppercase tracking-tight text-center min-w-[140px] border-l border-gray-100/50">{name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-bold text-gray-900 bg-gray-50/10">종합 점수 (Total Score)</td>
                                    <td className="p-8 text-center bg-blue-50/20 font-black text-blue-600 text-xl">
                                        {(modelNames.reduce((sum, name) => sum + getAverageMetrics(name).totalAvg, 0) / modelNames.length).toFixed(1)}
                                    </td>
                                    {modelNames.map(name => (
                                        <td key={name} className="p-8 text-center font-black text-gray-900 text-xl border-l border-gray-100/30">{getAverageMetrics(name).totalAvg.toFixed(1)}</td>
                                    ))}
                                </tr>
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-semibold text-gray-600">정확성 (Accuracy)</td>
                                    <td className="p-8 text-center bg-blue-50/5 font-bold text-blue-500">
                                        {(modelNames.reduce((sum, name) => sum + getAverageMetrics(name).accAvg, 0) / modelNames.length).toFixed(1)}
                                    </td>
                                    {modelNames.map(name => (
                                        <td key={name} className="p-8 text-center font-medium text-gray-600 border-l border-gray-100/30">{getAverageMetrics(name).accAvg.toFixed(1)}/5</td>
                                    ))}
                                </tr>
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-semibold text-gray-600">지시 이행 (Adherence)</td>
                                    <td className="p-8 text-center bg-blue-50/5 font-bold text-blue-500">
                                        {(modelNames.reduce((sum, name) => sum + getAverageMetrics(name).adhAvg, 0) / modelNames.length).toFixed(1)}
                                    </td>
                                    {modelNames.map(name => (
                                        <td key={name} className="p-8 text-center font-medium text-gray-600 border-l border-gray-100/30">{getAverageMetrics(name).adhAvg.toFixed(1)}/3</td>
                                    ))}
                                </tr>
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-semibold text-gray-600">논리 및 품질 (Quality)</td>
                                    <td className="p-8 text-center bg-blue-50/5 font-bold text-blue-500">
                                        {(modelNames.reduce((sum, name) => sum + getAverageMetrics(name).qualAvg, 0) / modelNames.length).toFixed(1)}
                                    </td>
                                    {modelNames.map(name => (
                                        <td key={name} className="p-8 text-center font-medium text-gray-600 border-l border-gray-100/30">{getAverageMetrics(name).qualAvg.toFixed(1)}/2</td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 2. 모델별 상세 분석 카드 */}
            <div className="space-y-8">
                <div className="flex flex-col gap-2 px-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-indigo-600 rounded-full" />
                        모델별 상세 성능 분석
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">개별 모델의 채점 내역과 통계 데이터를 확인합니다.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {Object.entries(groupedPerformance).map(([modelName, records], index) => {
                        const combinedAvg = records.reduce((sum, r) => sum + r.final_summary.avg_score, 0) / records.length;

                        return (
                            <div
                                key={index}
                                className="group bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-2xl"
                            >
                                {/* 카드 헤더 */}
                                <div className="p-10 pb-6 border-b border-gray-50">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{modelName}</h3>
                                            <div className="flex gap-2">
                                                {records.map((r, i) => (
                                                    <span key={i} className="px-3 py-1 bg-gray-50 border border-gray-100 text-[9px] font-black text-gray-400 rounded-full uppercase tracking-tighter">
                                                        {r.judgeModel}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 점수 대시보드 */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {records.map((record, rIdx) => (
                                            <div key={rIdx} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 flex flex-col justify-between">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{record.judgeModel.split(' ')[0]} 평균</p>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-3xl font-black text-gray-900 tracking-tighter">
                                                        {record.final_summary.avg_score.toFixed(1)}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-300">/10</span>
                                                </div>
                                            </div>
                                        ))}
                                        {/* 통합 평균 카드 (오른쪽 배치) */}
                                        <div className="bg-blue-600 p-6 rounded-[2rem] border border-blue-500 shadow-xl shadow-blue-200/50 flex flex-col justify-between transform transition-transform group-hover:scale-[1.03]">
                                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">통합 평균</p>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-3xl font-black text-white tracking-tighter">
                                                    {combinedAvg.toFixed(1)}
                                                </span>
                                                <span className="text-xs font-bold text-blue-300">/10</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 상세 채점 내역 */}
                                <div className="p-10 pt-8 space-y-10">
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Trial-by-Trial Score</h4>
                                        <div className="grid gap-3">
                                            {records[0]?.results.map((res, resIdx) => (
                                                <div key={resIdx} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between transition-colors hover:bg-gray-50">
                                                    <div className="flex items-center gap-6">
                                                        <span className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-400 shadow-sm">
                                                            #{res.id}
                                                        </span>
                                                        <div className="flex gap-8">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">정확성</span>
                                                                <span className="text-sm font-bold text-gray-700">{res.breakdown.accuracy}/5</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">지시 이행</span>
                                                                <span className="text-sm font-bold text-gray-700">{res.breakdown.adherence}/3</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">논리/품질</span>
                                                                <span className="text-sm font-bold text-gray-700">{res.breakdown.quality}/2</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={`text-2xl font-black ${res.total_score >= 8 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                            {res.total_score}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-300">PTS</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 일관성 및 편차 분석 */}
                                    <div className="p-8 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden group/footer">
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/30">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-blue-400">
                                                    일관성 및 편차 (Consistency & Deviation)
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black tracking-tighter text-white">
                                                        {records[0]?.final_summary.consistency_std_dev}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-500">Sigma Value</span>
                                                </div>
                                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                                        <strong className="text-blue-400 mr-2 underline underline-offset-4 decoration-blue-400/30 font-black">지표 의미:</strong>
                                                        회차별 점수들의 표준 편차를 의미하며, 값이 낮을수록 모델의 답변이 매회 균일하고 예측 가능하게 생성됨을 나타냅니다.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* 장식용 배경 */}
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover/footer:scale-150 transition-transform duration-1000" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
