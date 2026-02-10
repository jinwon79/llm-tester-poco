'use client';

import { useState, useRef } from 'react';
import ComparativeAnalysisDisplay from '@/components/comparative-analysis-display';
import { ModelResult, ComparativeResult } from '@/lib/llm-client';

export default function ManualEvalPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const [results, setResults] = useState<ComparativeResult[]>([]);

    // Form States
    const [testTitle, setTestTitle] = useState('');
    const [testQuestionId, setTestQuestionId] = useState('');
    const [commonTestEnv, setCommonTestEnv] = useState('');
    const [question, setQuestion] = useState('');
    const [responseA, setResponseA] = useState({ env: '', content: '' });
    const [responseB, setResponseB] = useState({ env: '', content: '' });

    const abortControllerRef = useRef<AbortController | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setProgress('평가 시작 중...');
        setResults([]);

        abortControllerRef.current = new AbortController();

        try {
            const res = await fetch('/api/manual-eval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testTitle,
                    testQuestionId,
                    commonTestEnv,
                    question,
                    responseA,
                    responseB
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!res.body) throw new Error('Response body is empty');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        const { type, data } = JSON.parse(line);

                        if (type === 'comparative_update') {
                            setResults(prev => [...prev, data]);
                        } else if (type === 'done') {
                            setProgress('평가 완료 (결과 저장됨)');
                            setIsLoading(false);
                        } else if (type === 'error') {
                            console.error('Stream error:', data);
                            setProgress(`에러 발생: ${data}`);
                            setIsLoading(false);
                        }
                    } catch (err) {
                        console.error('JSON parse error:', err);
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                setProgress('평가 취소됨');
            } else {
                console.error('Fetch error:', error);
                setProgress('네트워크 에러 발생');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 sm:p-12 font-sans text-slate-900">
            <div className="max-w-5xl mx-auto space-y-12">
                <header className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">수동 응답 비교 (Manual Eval)</h1>
                    <p className="text-lg text-slate-600 font-medium">
                        두 개의 LLM 응답을 직접 입력하여 품질을 비교 평가합니다.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">테스트 제목</label>
                            <input
                                type="text"
                                value={testTitle}
                                onChange={e => setTestTitle(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                placeholder="예: 양자역학 설명 비교"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">테스트 질문 ID (선택)</label>
                            <input
                                type="text"
                                value={testQuestionId}
                                onChange={e => setTestQuestionId(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                placeholder="예: Q-001"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">공통 테스트 환경 (Common Env)</label>
                        <textarea
                            value={commonTestEnv}
                            onChange={e => setCommonTestEnv(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium h-32 resize-none"
                            placeholder="두 응답에 공통적으로 적용되는 페르소나나 제약조건을 입력하세요."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">테스트 질문 (Question)</label>
                        <textarea
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium h-32 resize-none"
                            placeholder="LLM에게 던진 질문을 입력하세요."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Response A Input */}
                        <div className="space-y-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <h3 className="text-xl font-black text-blue-900">응답 A (Response A)</h3>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-blue-800">개별 환경 (Env)</label>
                                <textarea
                                    value={responseA.env}
                                    onChange={e => setResponseA({ ...responseA, env: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium h-24 resize-none"
                                    placeholder="A 버전만의 환경 설정 (선택)"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-blue-800">생성 응답 (Content)</label>
                                <textarea
                                    value={responseA.content}
                                    onChange={e => setResponseA({ ...responseA, content: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium h-64 resize-none"
                                    placeholder="응답 A의 내용을 붙여넣으세요."
                                    required
                                />
                            </div>
                        </div>

                        {/* Response B Input */}
                        <div className="space-y-4 p-6 bg-purple-50/50 rounded-2xl border border-purple-100">
                            <h3 className="text-xl font-black text-purple-900">응답 B (Response B)</h3>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-purple-800">개별 환경 (Env)</label>
                                <textarea
                                    value={responseB.env}
                                    onChange={e => setResponseB({ ...responseB, env: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 outline-none font-medium h-24 resize-none"
                                    placeholder="B 버전만의 환경 설정 (선택)"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-purple-800">생성 응답 (Content)</label>
                                <textarea
                                    value={responseB.content}
                                    onChange={e => setResponseB({ ...responseB, content: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 outline-none font-medium h-64 resize-none"
                                    placeholder="응답 B의 내용을 붙여넣으세요."
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4">
                        {isLoading && <span className="text-slate-500 font-bold animate-pulse">{progress}</span>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-8 py-4 rounded-xl font-black text-white shadow-lg transition-all transform hover:scale-105
                                ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 hover:shadow-xl'}`}
                        >
                            {isLoading ? '평가 진행 중...' : '비교 평가 시작'}
                        </button>
                    </div>
                </form>

                {/* 결과 표시 */}
                {results.length > 0 && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-8 bg-slate-900 rounded-full" />
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">평가 결과</h2>
                        </div>
                        <ComparativeAnalysisDisplay results={results} />
                    </div>
                )}
            </div>
        </div>
    );
}
