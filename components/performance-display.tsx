'use client';

interface Breakdown {
    accuracy: number;    // 40
    adherence: number;   // 30
    logic: number;       // 20
    readability: number; // 10
}

interface ResultRecord {
    id: number;
    breakdown: Breakdown;
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
        grade?: 'S' | 'A' | 'B' | 'C' | 'F';
    };
    judgeModel: string;
}

interface PerformanceDisplayProps {
    performanceResults: PerformanceResult[];
}

export default function PerformanceDisplay({ performanceResults }: PerformanceDisplayProps) {
    // 성능 평가 결과가 없을 경우 렌더링하지 않음
    if (!performanceResults || performanceResults.length === 0) return null;

    // 모델별로 그룹화
    const groupedPerformance = performanceResults.reduce((acc, curr) => {
        const modelName = curr.test_metadata.model;
        if (!acc[modelName]) acc[modelName] = [];
        acc[modelName].push(curr);
        return acc;
    }, {} as Record<string, PerformanceResult[]>);

    const modelNames = Object.keys(groupedPerformance);

    // 5개 모델의 결과가 모두 수집될 때까지 대기 (사용자 요청: 5개의 결과값이 계산된 후 한번에 출력)
    if (modelNames.length < 5) return null;

    // 사용자 요청 고정 순서 (gemini-2.5-pro -> gemini-3-pro-preview -> gemini-3-flash-preview -> Claude 4.5 Sonnet -> GPT-4.1)
    const TARGET_ORDER = [
        'gemini-2.5-pro',
        'gemini-3-pro-preview',
        'gemini-3-flash-preview',
        'Claude 4.5 Sonnet',
        'GPT-4.1'
    ];

    modelNames.sort((a, b) => {
        const idxA = TARGET_ORDER.indexOf(a);
        const idxB = TARGET_ORDER.indexOf(b);
        // 미리 정의된 순서에 없는 모델은 맨 뒤로 배치
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    // 종합 요약 데이터 계산 함수
    const getAverageMetrics = (modelName: string) => {
        const records = groupedPerformance[modelName];
        if (!records || records.length === 0) return { totalAvg: 0, accAvg: 0, adhAvg: 0, logAvg: 0, readAvg: 0, grade: 'F' as const };

        const totalAvg = records.reduce((sum, r) => sum + r.final_summary.avg_score, 0) / records.length;
        const grade = records[0].final_summary.grade || 'F';

        // 세부 항목별 평균 계산 (첫 번째 판사 데이터의 breakdown 기준)
        const results = records[0].results;
        const accAvg = results.reduce((sum, r) => sum + r.breakdown.accuracy, 0) / results.length;
        const adhAvg = results.reduce((sum, r) => sum + r.breakdown.adherence, 0) / results.length;
        const logAvg = results.reduce((sum, r) => sum + r.breakdown.logic, 0) / results.length;
        const readAvg = results.reduce((sum, r) => sum + r.breakdown.readability, 0) / results.length;

        return { totalAvg, accAvg, adhAvg, logAvg, readAvg, grade };
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-indigo-600';
        if (score >= 50) return 'text-orange-500';
        return 'text-red-500';
    };

    const getGradeColor = (grade?: string) => {
        switch (grade) {
            case 'S': return 'bg-emerald-500 text-white shadow-emerald-200';
            case 'A': return 'bg-blue-500 text-white shadow-blue-200';
            case 'B': return 'bg-indigo-500 text-white shadow-indigo-200';
            case 'C': return 'bg-orange-500 text-white shadow-orange-200';
            case 'F': return 'bg-red-500 text-white shadow-red-200';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="mt-20 space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* 1. 성능 평가 종합 요약표 */}
            <div className="space-y-6">
                <div className="flex flex-col gap-2 px-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <span className="w-2 h-8 bg-blue-600 rounded-full" />
                        성능 평가 종합 요약 (100점 만점)
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">초정밀 감점제(Deductive Scoring)를 적용한 모델별 성능 지표입니다.</p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="p-8 text-xs font-black text-gray-400 uppercase tracking-[0.2em] min-w-[200px]">평가 항목</th>
                                    {modelNames.map(name => (
                                        <th key={name} className="p-8 text-sm font-black text-gray-700 uppercase tracking-tight text-center min-w-[140px] border-l border-gray-100/50">{name}</th>
                                    ))}
                                    <th className="p-8 text-xs font-black text-blue-600 uppercase tracking-[0.2em] text-center bg-blue-50/30 border-l border-blue-100">종합 평균</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-bold text-gray-900 bg-gray-50/10">최종 등급 (Grade)</td>
                                    {modelNames.map(name => (
                                        <td key={name} className="p-8 text-center border-l border-gray-100/30">
                                            <span className={`px-4 py-2 rounded-xl text-lg font-black shadow-lg ${getGradeColor(getAverageMetrics(name).grade)}`}>
                                                {getAverageMetrics(name).grade}
                                            </span>
                                        </td>
                                    ))}
                                    <td className="p-8 text-center bg-blue-50/20 border-l border-blue-100">-</td>
                                </tr>
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-bold text-gray-900 bg-gray-50/10">종합 점수 (Total Score)</td>
                                    {modelNames.map(name => {
                                        const score = getAverageMetrics(name).totalAvg;
                                        return (
                                            <td key={name} className={`p-8 text-center font-black text-xl border-l border-gray-100/30 ${getScoreColor(score)}`}>
                                                {score.toFixed(1)}
                                            </td>
                                        );
                                    })}
                                    <td className="p-8 text-center bg-blue-50/20 font-black text-blue-600 text-xl border-l border-blue-100">
                                        {(modelNames.reduce((sum, name) => sum + getAverageMetrics(name).totalAvg, 0) / modelNames.length).toFixed(1)}
                                    </td>
                                </tr>
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-semibold text-gray-600">정확성 (Accuracy)</td>
                                    {modelNames.map(name => (
                                        <td key={name} className="p-8 text-center font-medium text-gray-600 border-l border-gray-100/30">{getAverageMetrics(name).accAvg.toFixed(1)}/40</td>
                                    ))}
                                    <td className="p-8 text-center bg-blue-50/5 font-bold text-blue-500 border-l border-blue-100">
                                        {(modelNames.reduce((sum, name) => sum + getAverageMetrics(name).accAvg, 0) / modelNames.length).toFixed(1)}
                                    </td>
                                </tr>
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-semibold text-gray-600">지시 이행 (Adherence)</td>
                                    {modelNames.map(name => (
                                        <td key={name} className="p-8 text-center font-medium text-gray-600 border-l border-gray-100/30">{getAverageMetrics(name).adhAvg.toFixed(1)}/30</td>
                                    ))}
                                    <td className="p-8 text-center bg-blue-50/5 font-bold text-blue-500 border-l border-blue-100">
                                        {(modelNames.reduce((sum, name) => sum + getAverageMetrics(name).adhAvg, 0) / modelNames.length).toFixed(1)}
                                    </td>
                                </tr>
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-semibold text-gray-600">논리성 (Logic)</td>
                                    {modelNames.map(name => (
                                        <td key={name} className="p-8 text-center font-medium text-gray-600 border-l border-gray-100/30">{getAverageMetrics(name).logAvg.toFixed(1)}/20</td>
                                    ))}
                                    <td className="p-8 text-center bg-blue-50/5 font-bold text-blue-500 border-l border-blue-100">
                                        {(modelNames.reduce((sum, name) => sum + getAverageMetrics(name).logAvg, 0) / modelNames.length).toFixed(1)}
                                    </td>
                                </tr>
                                <tr className="group transition-colors hover:bg-gray-50/50">
                                    <td className="p-8 font-semibold text-gray-600">가독성 (Readability)</td>
                                    {modelNames.map(name => (
                                        <td key={name} className="p-8 text-center font-medium text-gray-600 border-l border-gray-100/30">{getAverageMetrics(name).readAvg.toFixed(1)}/10</td>
                                    ))}
                                    <td className="p-8 text-center bg-blue-50/5 font-bold text-blue-500 border-l border-blue-100">
                                        {(modelNames.reduce((sum, name) => sum + getAverageMetrics(name).readAvg, 0) / modelNames.length).toFixed(1)}
                                    </td>
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
                        const metrics = getAverageMetrics(modelName);

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
                                        <div className={`px-6 py-3 rounded-2xl text-2xl font-black shadow-xl ${getGradeColor(metrics.grade)}`}>
                                            {metrics.grade}
                                        </div>
                                    </div>

                                    {/* 점수 대시보드 */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {records.map((record, rIdx) => (
                                            <div key={rIdx} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 flex flex-col justify-between">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{record.judgeModel.split(' ')[0]} 평균</p>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className={`text-3xl font-black tracking-tighter ${getScoreColor(record.final_summary.avg_score)}`}>
                                                        {record.final_summary.avg_score.toFixed(1)}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-300">/100</span>
                                                </div>
                                            </div>
                                        ))}
                                        {/* 통합 평균 카드 (오른쪽 배치) */}
                                        <div className="bg-blue-600 p-6 rounded-[2rem] border border-blue-500 shadow-xl shadow-blue-200/50 flex flex-col justify-between transform transition-transform group-hover:scale-[1.03]">
                                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">통합 평균</p>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-3xl font-black text-white tracking-tighter">
                                                    {metrics.totalAvg.toFixed(1)}
                                                </span>
                                                <span className="text-xs font-bold text-blue-300">/100</span>
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
                                                <div key={resIdx} className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col gap-4 transition-colors hover:bg-gray-50">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-400 shadow-sm">
                                                                #{res.id}
                                                            </span>
                                                            <div className="flex gap-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] text-gray-400 font-black uppercase">정확성</span>
                                                                    <span className="text-xs font-bold text-gray-700">{res.breakdown.accuracy}/40</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] text-gray-400 font-black uppercase">지시</span>
                                                                    <span className="text-xs font-bold text-gray-700">{res.breakdown.adherence}/30</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] text-gray-400 font-black uppercase">논리</span>
                                                                    <span className="text-xs font-bold text-gray-700">{res.breakdown.logic}/20</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] text-gray-400 font-black uppercase">가독</span>
                                                                    <span className="text-xs font-bold text-gray-700">{res.breakdown.readability}/10</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={`text-xl font-black ${getScoreColor(res.total_score)}`}>
                                                                {res.total_score}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-gray-300 uppercase">pts</span>
                                                        </div>
                                                    </div>
                                                    {res.reason && (
                                                        <p className="text-xs text-gray-500 font-medium leading-relaxed bg-white/50 p-3 rounded-xl border border-gray-100/50 whitespace-pre-line">
                                                            {res.reason}
                                                        </p>
                                                    )}
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
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-4xl font-black tracking-tighter text-white">
                                                            {records[0]?.final_summary.consistency_std_dev.split(' ')[0]}
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-400">Sigma Value</span>
                                                    </div>
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
