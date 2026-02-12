import { NextRequest } from 'next/server';
import { evaluateComparativePerformance, evaluateServiceSpecificPerformance, ComparativeResult, ModelResult } from '@/lib/llm-client';
import { saveTestResult } from '@/lib/file-storage';
import pLimit from 'p-limit';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const {
        testTitle,
        testQuestionId,
        commonTestEnv,
        question,
        responseA,
        responseB
    } = body;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = (type: string, data: unknown) => {
                controller.enqueue(encoder.encode(JSON.stringify({ type, data }) + '\n'));
            };

            try {
                // 1. Mock Model Results 생성 (저장용)
                const mockResults: ModelResult[] = [
                    {
                        model: 'Manual Input A',
                        repeatIndex: 1,
                        response: responseA.content,
                        inputTokens: 0,
                        outputTokens: 0,
                        totalTokens: 0,
                        latencyMs: 0,
                        version: 'A'
                    },
                    {
                        model: 'Manual Input B',
                        repeatIndex: 1,
                        response: responseB.content,
                        inputTokens: 0,
                        outputTokens: 0,
                        totalTokens: 0,
                        latencyMs: 0,
                        version: 'B'
                    }
                ];

                // 2. 분석 단계: 버전A vs 버전B 직접 비교
                const comparativeResults: (ComparativeResult & { targetModel: string })[] = [];
                const analysisLimit = pLimit(2); // GPT, Claude 동시 실행

                const systemPromptA = `${commonTestEnv ? `[Common Env]\n${commonTestEnv}\n\n` : ''}${responseA.env}`;
                const systemPromptB = `${commonTestEnv ? `[Common Env]\n${commonTestEnv}\n\n` : ''}${responseB.env}`;

                // Manual Input A/B를 하나의 '모델'로 취급하여 비교 평가 수행
                // 여기서는 'Manual Input'이라는 가상의 모델명 하나에 대해 평가를 수행
                const modelName = 'Manual Comparison';

                const analysisTasks: Promise<void>[] = [];

                analysisTasks.push(analysisLimit(async () => {
                    const [gptJudge, claudeJudge] = await Promise.all([
                        evaluateServiceSpecificPerformance(
                            body.serviceType || 'consulting_tech',
                            commonTestEnv,
                            question,
                            responseA.content,
                            responseB.content,
                            'gpt'
                        ),
                        evaluateServiceSpecificPerformance(
                            body.serviceType || 'consulting_tech',
                            commonTestEnv,
                            question,
                            responseA.content,
                            responseB.content,
                            'claude'
                        )
                    ]);

                    if (gptJudge) {
                        const result = { ...gptJudge, targetModel: modelName, judgeModel: 'GPT-5' };
                        comparativeResults.push(result);
                        sendUpdate('comparative_update', result);
                    }
                    if (claudeJudge) {
                        const result = { ...claudeJudge, targetModel: modelName, judgeModel: 'Claude 4.5 Sonnet' };
                        comparativeResults.push(result);
                        sendUpdate('comparative_update', result);
                    }
                }));

                await Promise.all(analysisTasks);

                // 3. 파일 저장
                const folderPath = saveTestResult({
                    testTitle,
                    testQuestionId,
                    testType: 'manual_eval',
                    commonTestEnv,
                    systemPrompt: `Version A Env:\n${responseA.env}\n\nVersion B Env:\n${responseB.env}`,
                    userMessage: question,
                    models: ['Manual Input A', 'Manual Input B'],
                    results: mockResults,
                    comparativeResults,
                    analysisResults: [],
                    performanceResults: [],
                    repeatCount: 1
                });

                sendUpdate('done', { savedPath: folderPath });
                controller.close();
            } catch (error) {
                console.error('Streaming error (Manual Eval):', error);
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
