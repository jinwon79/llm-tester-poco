'use client';

import { useState } from 'react';

interface PromptTestFormProps {
    onSubmit: (data: any) => void;
    isLoading: boolean;
}

export default function PromptTestForm({ onSubmit, isLoading }: PromptTestFormProps) {
    const [testTitle, setTestTitle] = useState('');
    const [testQuestionId, setTestQuestionId] = useState('');

    // 버전 A
    const [versionAName, setVersionAName] = useState('v1.0 (Base)');
    const [versionAPrompt, setVersionAPrompt] = useState('');

    // 버전 B
    const [versionBName, setVersionBName] = useState('v1.1 (Experimental)');
    const [versionBPrompt, setVersionBPrompt] = useState('');

    const [userMessage, setUserMessage] = useState('');
    const [repeatCount, setRepeatCount] = useState(5);
    const [selectedModels, setSelectedModels] = useState<string[]>(['gemini-pro']);

    const models = [
        { id: 'gemini-pro', label: 'Gemini 2.5 Pro', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        { id: 'gemini-3-pro-preview', label: 'Gemini 3.0 Pro Preview', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
        { id: 'gemini-flash', label: 'Gemini 3.0 Flash', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
        { id: 'claude', label: 'Claude 4.5 Sonnet', color: 'bg-orange-100 text-orange-700 border-orange-200' },
        { id: 'gpt', label: 'GPT-4.1', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            testTitle,
            testQuestionId,
            versionA: { name: versionAName, prompt: versionAPrompt },
            versionB: { name: versionBName, prompt: versionBPrompt },
            userMessage,
            models: selectedModels,
            repeatCount
        });
    };

    const toggleModel = (id: string) => {
        setSelectedModels(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">테스트 제목 *</label>
                    <input
                        type="text"
                        value={testTitle}
                        onChange={(e) => setTestTitle(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-black"
                        placeholder="예: 조세 판례 요약 프롬프트 A/B 테스트"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">테스트질문 ID *</label>
                    <input
                        type="text"
                        value={testQuestionId}
                        onChange={(e) => setTestQuestionId(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-black"
                        placeholder="예: Q-TAX-001"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sticky top-0 bg-white z-10 py-2 border-b border-gray-50">
                {/* Version A Section */}
                <div className="space-y-4 p-6 bg-blue-50/30 rounded-3xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">A</span>
                        <h3 className="text-lg font-black text-blue-900 tracking-tight">기준 프롬프트 (Base)</h3>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-700 ml-1 uppercase tracking-wider">버전명</label>
                        <input
                            type="text"
                            value={versionAName}
                            onChange={(e) => setVersionAName(e.target.value)}
                            className="w-full p-3 bg-white border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-black text-sm"
                            placeholder="예: v1.0"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-700 ml-1 uppercase tracking-wider">시스템 프롬프트</label>
                        <textarea
                            value={versionAPrompt}
                            onChange={(e) => setVersionAPrompt(e.target.value)}
                            className="w-full p-4 bg-white border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none h-40 resize-none text-black text-sm leading-relaxed"
                            placeholder="비교할 첫 번째 시스템 프롬프트를 입력하세요."
                            required
                        />
                    </div>
                </div>

                {/* Version B Section */}
                <div className="space-y-4 p-6 bg-purple-50/30 rounded-3xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-sm">B</span>
                        <h3 className="text-lg font-black text-purple-900 tracking-tight">실험 프롬프트 (Experimental)</h3>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-purple-700 ml-1 uppercase tracking-wider">버전명</label>
                        <input
                            type="text"
                            value={versionBName}
                            onChange={(e) => setVersionBName(e.target.value)}
                            className="w-full p-3 bg-white border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-black text-sm"
                            placeholder="예: v1.1 (CoT 적용)"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-purple-700 ml-1 uppercase tracking-wider">시스템 프롬프트</label>
                        <textarea
                            value={versionBPrompt}
                            onChange={(e) => setVersionBPrompt(e.target.value)}
                            className="w-full p-4 bg-white border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none h-40 resize-none text-black text-sm leading-relaxed"
                            placeholder="비교할 두 번째 시스템 프롬프트를 입력하세요 (A 버전에서 개선된 사항 위주로)."
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2 pt-4">
                <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-2">
                    사용자 질문 *
                    <span className="text-xs font-medium text-gray-400 font-normal">(두 버전 모드에 동일하게 적용됩니다)</span>
                </label>
                <textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none h-32 resize-none text-black"
                    placeholder="테스트할 질문을 입력하세요..."
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-700 ml-1">테스트 적용 모델 *</label>
                    <div className="flex flex-wrap gap-3">
                        {models.map((model) => (
                            <button
                                key={model.id}
                                type="button"
                                onClick={() => toggleModel(model.id)}
                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedModels.includes(model.id)
                                    ? `${model.color} border-current shadow-sm`
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {model.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">각 버전별 반복 생성 횟수 * (기본 5회 권장)</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={repeatCount}
                            onChange={(e) => setRepeatCount(parseInt(e.target.value) || 1)}
                            className="flex-1 accent-purple-600"
                        />
                        <span className="text-xl font-black text-purple-600 w-12 text-center">{repeatCount}회</span>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading || selectedModels.length === 0}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:scale-[0.98]"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        A/B 집단 대조 분석 엔진 가동 중...
                    </span>
                ) : (
                    `A/B 테스트 시작 (총 ${selectedModels.length * repeatCount * 2}회 생성)`
                )}
            </button>
        </form>
    );
}
