'use client';

import { useState } from 'react';

interface TestFormProps {
    onSubmit: (data: any) => void;
    isLoading: boolean;
}

export default function TestForm({ onSubmit, isLoading }: TestFormProps) {
    const [testTitle, setTestTitle] = useState('');
    const [testQuestionId, setTestQuestionId] = useState('');
    const [systemPromptVersion, setSystemPromptVersion] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [userMessage, setUserMessage] = useState('');
    const [repeatCount, setRepeatCount] = useState(3);
    const [selectedModels, setSelectedModels] = useState<string[]>(['gemini-pro', 'gemini-3-pro-preview', 'gemini-flash', 'claude', 'gpt']);

    const models = [
        { id: 'gemini-pro', label: 'Gemini 2.5 Pro', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        { id: 'gemini-3-pro-preview', label: 'Gemini 3.0 Pro Preview', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
        { id: 'gemini-flash', label: 'Gemini 3.0 Flash', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
        { id: 'claude', label: 'Claude 4.5 Sonnet', color: 'bg-orange-100 text-orange-700 border-orange-200' },
        { id: 'gpt', label: 'GPT-4.1', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ testTitle, testQuestionId, systemPromptVersion, systemPrompt, userMessage, models: selectedModels, repeatCount });
    };

    const toggleModel = (id: string) => {
        setSelectedModels(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">테스트 제목 *</label>
                    <input
                        type="text"
                        value={testTitle}
                        onChange={(e) => setTestTitle(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-black"
                        placeholder="예: 세무사질문1 - 요약 성능 테스트"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">테스트질문 ID *</label>
                    <input
                        type="text"
                        value={testQuestionId}
                        onChange={(e) => setTestQuestionId(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-black"
                        placeholder="예: Q-TAX-001"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">시스템 프롬프트 버전</label>
                    <input
                        type="text"
                        value={systemPromptVersion}
                        onChange={(e) => setSystemPromptVersion(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-black"
                        placeholder="예: v1.0"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">시스템 프롬프트</label>
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none h-32 resize-none text-black"
                        placeholder="AI의 역할을 정의하세요 (예: 당신은 전문 세무사입니다...)"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">사용자 질문 *</label>
                    <textarea
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none h-32 resize-none text-black"
                        placeholder="테스트할 질문을 입력하세요..."
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-700 ml-1">대상 모델 선택 *</label>
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
                    <label className="text-sm font-semibold text-gray-700 ml-1">반복 생성 횟수 * (최대 10회)</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(parseInt(e.target.value) || 1)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-black font-bold text-center"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading || selectedModels.length === 0}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        LLM 엔진 호출 중 ({selectedModels.length * repeatCount}회 생성)...
                    </span>
                ) : (
                    `테스트 실행 (총 ${selectedModels.length * repeatCount}회 생성)`
                )}
            </button>
        </form>
    );
}
