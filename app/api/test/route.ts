import { NextRequest, NextResponse } from 'next/server';
import { runTest, evaluateConsistency, evaluatePerformance, ModelProvider, ModelResult, AnalysisResult, PerformanceResult } from '@/lib/llm-client';
import { saveTestResult } from '@/lib/file-storage';

import pLimit from 'p-limit';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { testTitle, testQuestionId, systemPromptVersion, systemPrompt, userMessage, models, repeatCount } = body;

    const encoder = new TextEncoder();
    const finalRepeatCount = Math.max(1, parseInt(repeatCount) || 1);

    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = (type: string, data: any) => {
                controller.enqueue(encoder.encode(JSON.stringify({ type, data }) + '\n'));
            };

            try {
                // 1. LLM 테스트 실행 (병렬)
                const results = await runTest({
                    testTitle, systemPromptVersion, systemPrompt, userMessage,
                    models: models as ModelProvider[],
                    repeatCount: finalRepeatCount,
                });

                // 생성 결과 즉시 스트리밍 (하나씩 보낼 수도 있지만, runTest가 완성된 리스트를 반환하므로 우선 통째로 보냄)
                // 추후 runTest 내부에서 콜백을 받도록 고도화 가능
                sendUpdate('generation_all', results);

                // 2. 분석 단계 (병렬)
                const analysisResults: AnalysisResult[] = [];
                const performanceResults: PerformanceResult[] = [];

                if (finalRepeatCount > 1) {
                    const groupedResults = results.reduce((acc, curr) => {
                        if (!acc[curr.model]) acc[curr.model] = [];
                        acc[curr.model].push(curr);
                        return acc;
                    }, {} as Record<string, ModelResult[]>);

                    const analysisLimit = pLimit(3); // 분석용 동시 실행 제한
                    const analysisTasks: Promise<void>[] = [];

                    for (const [modelName, modelRuns] of Object.entries(groupedResults)) {
                        // 일관성 분석 태스크
                        if (modelRuns.length >= 2) {
                            const reference = modelRuns.find(r => r.repeatIndex === 1)?.response || '';
                            const compares = modelRuns.filter(r => r.repeatIndex > 1).map(r => r.response);

                            analysisTasks.push(analysisLimit(async () => {
                                const [gpt, claude] = await Promise.all([
                                    evaluateConsistency(modelName, reference, compares, 'gpt'),
                                    evaluateConsistency(modelName, reference, compares, 'claude')
                                ]);
                                analysisResults.push(gpt, claude);
                                sendUpdate('consistency_update', [gpt, claude]);
                            }));
                        }

                        // 성능 분석 태스크
                        const allResponses = modelRuns.map(r => r.response);
                        analysisTasks.push(analysisLimit(async () => {
                            const [gpt, claude] = await Promise.all([
                                evaluatePerformance(modelName, allResponses, 'gpt'),
                                evaluatePerformance(modelName, allResponses, 'claude')
                            ]);
                            if (gpt) {
                                performanceResults.push(gpt);
                                sendUpdate('performance_update', gpt);
                            }
                            if (claude) {
                                performanceResults.push(claude);
                                sendUpdate('performance_update', claude);
                            }
                        }));
                    }

                    await Promise.all(analysisTasks);
                }

                // 3. 파일 저장
                const folderPath = saveTestResult({
                    testTitle, testQuestionId, systemPromptVersion, systemPrompt, userMessage, models,
                    results, analysisResults, performanceResults,
                    repeatCount: finalRepeatCount,
                    testType: 'model_eval', // 모델 성능 비교 서비스임을 명시
                });

                sendUpdate('done', { savedPath: folderPath });
                controller.close();
            } catch (error) {
                console.error('Streaming error:', error);
                sendUpdate('error', error instanceof Error ? error.message : 'Unknown error');
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
