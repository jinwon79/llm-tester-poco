'use client';

import { useState } from 'react';
import TestForm from '@/components/test-form';
import ResultDisplay from '@/components/result-display';
import AnalysisDisplay from '@/components/analysis-display';
import PerformanceDisplay from '@/components/performance-display';
import TokenUsageDisplay from '@/components/token-usage-display';
import Link from 'next/link';

export default function Home() {
  const [results, setResults] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [performanceResults, setPerformanceResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPath, setSavedPath] = useState<string | undefined>(undefined);

  const handleTest = async (data: any) => {
    setIsLoading(true);
    setResults([]);
    setAnalysisResults([]);
    setPerformanceResults([]);
    setSavedPath(undefined);

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const payload = JSON.parse(line);
            const { type, data } = payload;

            if (type === 'generation_all') {
              setResults(data);
            } else if (type === 'consistency_update') {
              setAnalysisResults(prev => [...prev, ...data]);
            } else if (type === 'performance_update') {
              setPerformanceResults(prev => [...prev, data]);
            } else if (type === 'done') {
              setSavedPath(data.savedPath);
            } else if (type === 'error') {
              alert(`에러 발생: ${data}`);
            }
          } catch (e) {
            console.error('Line parse error:', e);
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert('서버와 통신 중 에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors gap-1 mb-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              메인으로 돌아가기
            </Link>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight">
              Model <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Performance</span> Eval
            </h1>
            <p className="text-gray-500 max-w-2xl font-medium">
              동일 프롬프트 기반 다중 LLM 모델 비교 분석 서비스입니다.
            </p>
          </div>
          {savedPath && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl animate-in fade-in slide-in-from-right-4">
              <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                결과 저장 완료
              </p>
              <code className="text-[10px] text-blue-600 font-mono block mt-1 break-all bg-white/50 p-1 rounded">
                {savedPath}
              </code>
            </div>
          )}
        </header>

        {/* Form Section */}
        <section className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
          <TestForm onSubmit={handleTest} isLoading={isLoading} />
        </section>

        {/* Results Section */}
        {(results.length > 0 || isLoading) && (
          <section className="space-y-12 pb-20">
            <ResultDisplay results={results} savedPath={savedPath} />
            {analysisResults.length > 0 && (
              <AnalysisDisplay analysisResults={analysisResults} />
            )}
            {performanceResults.length > 0 && (
              <PerformanceDisplay performanceResults={performanceResults} />
            )}
            {results.length > 0 && (
              <TokenUsageDisplay results={results} />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
