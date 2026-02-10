'use client';

import { useState } from 'react';
import TestForm from '@/components/test-form';
import ResultDisplay from '@/components/result-display';
import AnalysisDisplay from '@/components/analysis-display';
import PerformanceDisplay from '@/components/performance-display';
import TokenUsageDisplay from '@/components/token-usage-display';

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
        <header className="text-center space-y-4">
          <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100 mb-2">
            LLM Performance Benchmark POC
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">
            LLM <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Tester</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium">
            다양한 LLM 모델의 성능과 일관성을 한눈에 비교하고 분석하세요.
            공식 SDK를 직접 호출하여 가장 정확한 토큰 및 지연 시간 데이터를 제공합니다.
          </p>
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
