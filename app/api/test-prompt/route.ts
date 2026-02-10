import { NextRequest } from 'next/server';
import { runTest, evaluateComparativePerformance, ModelProvider, ModelResult, ComparativeResult } from '@/lib/llm-client';
import { saveTestResult } from '@/lib/file-storage';
import pLimit from 'p-limit';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { testTitle, testQuestionId, versionA, versionB, userMessage, models, repeatCount } = body;

    const encoder = new TextEncoder();
    const finalRepeatCount = Math.max(1, parseInt(repeatCount) || 1);

    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = (type: string, data: unknown) => {
                controller.enqueue(encoder.encode(JSON.stringify({ type, data }) + '\n'));
            };

            try {
                // 1. A/B 테스트 배치 실행 계획
                // 각 프롬프트 버전별로 runTest를 각각 호출하거나, 아니면 합쳐서 멀티 모델처럼 부름
                // 여기서는 "VersionName + ModelName"을 식별자로 사용하도록 처리

                // tasks: [Version A - Model 1, Version B - Model 1, ...]
                const results: ModelResult[] = [];

                // 실행 편의를 위해 내부적으로 runTest 루프를 돌림 (병렬 처리 루틱은 llm-client가 처리)
                const [resultsA, resultsB] = await Promise.all([
                    runTest({
                        testTitle: `${testTitle} (${versionA.name})`,
                        systemPrompt: versionA.prompt,
                        userMessage,
                        models: models as ModelProvider[],
                        repeatCount: finalRepeatCount
                    }),
                    runTest({
                        testTitle: `${testTitle} (${versionB.name})`,
                        systemPrompt: versionB.prompt,
                        userMessage,
                        models: models as ModelProvider[],
                        repeatCount: finalRepeatCount
                    })
                ]);

                // 결과에 버전 정보를 주입 (UI 구분용)
                const taggedResultsA = resultsA.map(r => ({ ...r, version: versionA.name }));
                const taggedResultsB = resultsB.map(r => ({ ...r, version: versionB.name }));
                const allResults = [...taggedResultsA, ...taggedResultsB];

                sendUpdate('generation_all', allResults);

                // 2. 분석 단계: 버전A vs 버전B 직접 비교 (Comparative Evaluation)
                const comparativeResults: (ComparativeResult & { targetModel: string })[] = [];
                const analysisLimit = pLimit(3);
                const analysisTasks: Promise<void>[] = []; // 중복 선언 방지

                // 모델별로 결과를 묶음 (key: modelName)
                const modelMapA = resultsA.reduce((acc, curr) => {
                    if (!acc[curr.model]) acc[curr.model] = [];
                    acc[curr.model].push(curr);
                    return acc;
                }, {} as Record<string, ModelResult[]>);

                const modelMapB = resultsB.reduce((acc, curr) => {
                    if (!acc[curr.model]) acc[curr.model] = [];
                    acc[curr.model].push(curr);
                    return acc;
                }, {} as Record<string, ModelResult[]>);

                // 각 모델에 대해 A/B 답변 비교 실행
                for (const modelName of Object.keys(modelMapA)) {
                    const runsA = modelMapA[modelName];
                    const runsB = modelMapB[modelName] || [];

                    // 각 회차별로 1:1 비교 (또는 첫 번째 대표 결과만 비교 - 여기서는 편의상 각 회차 1:1 매칭 후 첫번째만 대표로 할지, 전체 평균을 낼지 결정해야 함)
                    // 기획 의도상 "프롬프트의 차이"를 보는 것이므로, 가장 첫 번째 생성을 대표값으로 비교하거나
                    // 모든 회차를 비교할 수 있음. 여기서는 리소스 절약을 위해 '첫 번째 생성 결과'끼리 비교.
                    if (runsA.length > 0 && runsB.length > 0) {
                        analysisTasks.push(analysisLimit(async () => {
                            // 대표 답변 (첫번째)
                            const respA = runsA[0].response;
                            const respB = runsB[0].response;

                            const [gptJudge, claudeJudge] = await Promise.all([
                                evaluateComparativePerformance(
                                    versionA.prompt, versionB.prompt,
                                    respA, respB,
                                    userMessage,
                                    'gpt'
                                ),
                                evaluateComparativePerformance(
                                    versionA.prompt, versionB.prompt,
                                    respA, respB,
                                    userMessage,
                                    'claude'
                                )
                            ]);

                            if (gptJudge) {
                                const result = { ...gptJudge, targetModel: modelName, judgeModel: 'GPT-4.1' };
                                comparativeResults.push(result);
                                sendUpdate('comparative_update', result);
                            }
                            if (claudeJudge) {
                                const result = { ...claudeJudge, targetModel: modelName, judgeModel: 'Claude 4.5 Sonnet' };
                                comparativeResults.push(result);
                                sendUpdate('comparative_update', result);
                            }
                        }));
                    }
                }

                await Promise.all(analysisTasks);

                // 3. 파일 저장
                const folderPath = saveTestResult({
                    testTitle,
                    testQuestionId,
                    testType: 'prompt_eval',
                    systemPrompt: `Version A: ${versionA.name}\n${versionA.prompt}\n\nVersion B: ${versionB.name}\n${versionB.prompt}`,
                    userMessage,
                    models,
                    results: allResults,
                    comparativeResults, // 실제 생성된 비교 결과 전달
                    analysisResults: [],
                    performanceResults: [],
                    repeatCount: finalRepeatCount
                });

                sendUpdate('done', { savedPath: folderPath });
                controller.close();
            } catch (error) {
                console.error('Streaming error (Prompt Eval):', error);
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
