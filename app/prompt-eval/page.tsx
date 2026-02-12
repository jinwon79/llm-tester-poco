'use client';

import { useState } from 'react';
import PromptTestForm from '@/components/prompt-test-form';
import ResultDisplay from '@/components/result-display';
import ComparativeAnalysisDisplay from '@/components/comparative-analysis-display';
import TokenUsageDisplay from '@/components/token-usage-display';
import Link from 'next/link';
import { ModelResult, ComparativeResult } from '@/lib/llm-client';

export default function PromptEvalPage() {
    const [results, setResults] = useState<ModelResult[]>([]);
    const [comparativeResults, setComparativeResults] = useState<(ComparativeResult & { targetModel: string })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [savedPath, setSavedPath] = useState<string | null>(null);

    const handleTest = async (data: {
        testTitle: string;
        versionA: { name: string; prompt: string };
        versionB: { name: string; prompt: string };
        userMessage: string;
        models: string[];
        repeatCount: number;
    }) => {
        setIsLoading(true);
        setResults([]);
        setComparativeResults([]);
        setSavedPath(null);

        try {
            const response = await fetch('/api/test-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const payload = JSON.parse(line);
                        switch (payload.type) {
                            case 'generation_all':
                                setResults(payload.data);
                                break;
                            case 'comparative_update':
                                setComparativeResults((prev: (ComparativeResult & { targetModel: string })[]) => [...prev, payload.data]);
                                break;
                            case 'done':
                                setSavedPath(payload.data.savedPath);
                                break;
                            case 'error':
                                alert(`에러 발생: ${payload.data}`);
                                break;
                        }
                    } catch (e) {
                        console.error('Failed to parse NDJSON line:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Test execution error:', error);
            alert('테스트 실행 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-10">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200">
                    <div className="space-y-2">
                        <Link href="/" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors gap-1 mb-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            메인으로 돌아가기
                        </Link>
                        <h1 className="text-4xl font-[1000] text-gray-900 tracking-tight">
                            Prompt Version <span className="text-purple-600">Comparison</span>
                        </h1>
                        <p className="text-gray-500 font-medium text-lg">
                            시스템 프롬프트의 A/B 버전을 **직접 비교(Head-to-Head)**하여 승자를 가립니다.
                        </p>
                    </div>
                    {savedPath && (
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl animate-in fade-in slide-in-from-right-4">
                            <p className="text-sm font-bold text-purple-900 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                                결과 저장 완료
                            </p>
                            <code className="text-[10px] text-purple-600 font-mono block mt-1 break-all bg-white/50 p-1 rounded">
                                {savedPath}
                            </code>
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 gap-10">
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900">시나리오 설정</h2>
                        </div>
                        <PromptTestForm onSubmit={handleTest} isLoading={isLoading} />
                    </section>

                    {results.length > 0 && (
                        <section className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">

                            <div className="pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900">LLM 생성 결과 (A vs B)</h2>
                                </div>
                                <ResultDisplay results={results} />
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900">A/B 버전 비교 심사 결과</h2>
                                </div>
                                <ComparativeAnalysisDisplay results={comparativeResults} />
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 8h-4v8h4" /><path d="M8 8h4" /></svg>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900">토큰 소요량 집계 (Total)</h2>
                                </div>
                                <TokenUsageDisplay results={results} />
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
