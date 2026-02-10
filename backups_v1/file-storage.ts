import fs from 'fs';
import path from 'path';
import { ModelResult, AnalysisResult, PerformanceResult } from './llm-client';

export interface SaveTestResultInput {
    testTitle: string;
    systemPromptVersion?: string;
    systemPrompt?: string;
    userMessage: string;
    models: string[];
    results: ModelResult[];
    analysisResults?: AnalysisResult[];
    performanceResults?: PerformanceResult[];
    repeatCount: number;
}

export function saveTestResult(input: SaveTestResultInput): string {
    // YYYYMMDD_HHmm 형식 생성
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, ''); // HHmm
    const timestamp = `${dateStr}_${timeStr}`;

    // 폴더명: YYYYMMDD_HHmm_TestTitle
    const folderName = `${timestamp}_${input.testTitle}`;
    const folderPath = path.join(process.cwd(), 'results', folderName);

    // 폴더 생성
    fs.mkdirSync(folderPath, { recursive: true });

    // 공통 파일명 접두사: YYYYMMDD_HHmm
    const filePrefix = `${timestamp}`;

    // input.md 저장
    const inputContent = `# 테스트 실행 정보

**실행 시각**: ${new Date().toLocaleString('ko-KR')}
**테스트 제목**: ${input.testTitle}
**반복 횟수**: ${input.repeatCount}회

## 시스템 프롬프트 ${input.systemPromptVersion ? `(${input.systemPromptVersion})` : ''}
${input.systemPrompt || '(없음)'}

## 사용자 질문
${input.userMessage}

## 선택된 모델
${input.models.map(m => `- ${m}`).join('\n')}
`;
    fs.writeFileSync(path.join(folderPath, `${filePrefix}_Input.md`), inputContent);

    // 각 모델 결과 저장
    input.results.forEach((result) => {
        const modelSafeName = result.model.replace(/[\s\.]+/g, '_');
        const repeatStr = String(result.repeatIndex).padStart(2, '0');
        const modelFileName = `${filePrefix}_${repeatStr}_${input.testTitle}_${modelSafeName}.md`;

        const modelContent = `# ${result.model} 응답 (${result.repeatIndex}/${input.repeatCount}회차)

## 응답 내용
${result.error || result.response}

## 메타데이터
- **회차**: ${result.repeatIndex} / ${input.repeatCount}
- **입력 토큰**: ${result.inputTokens}
- **출력 토큰**: ${result.outputTokens}
- **총 토큰**: ${result.totalTokens}
- **응답 시간**: ${(result.latencyMs / 1000).toFixed(2)}초
- **실행 시각**: ${new Date().toLocaleString('ko-KR')}
${result.error ? `- **에러**: ${result.error}` : ''}
`;
        fs.writeFileSync(path.join(folderPath, modelFileName), modelContent);
    });

    // 일관성 분석 결과 저장
    if (input.analysisResults && input.analysisResults.length > 0) {
        const gptAnalyses = input.analysisResults.filter(a => a.judgeModel.includes('GPT'));
        const claudeAnalyses = input.analysisResults.filter(a => a.judgeModel.includes('Claude'));

        const saveAnalysis = (analyses: AnalysisResult[], judgeKey: string) => {
            if (analyses.length === 0) return;
            const content = `# 일관성 분석 리포트 - ${analyses[0].judgeModel}

${analyses.map(a => `## 대상 모델: ${a.targetModel}
- **점수**: ${a.score}/10
- **판정**: ${a.verdict}
- **상세 분석**:
${a.analysis}
`).join('\n---\n\n')}
`;
            fs.writeFileSync(path.join(folderPath, `analysis_${judgeKey.toLowerCase()}.md`), content);
        };

        saveAnalysis(gptAnalyses, 'GPT');
        saveAnalysis(claudeAnalyses, 'Claude');
    }

    // 성능 평가 결과(JSON) 저장
    if (input.performanceResults && input.performanceResults.length > 0) {
        const gptPerformance = input.performanceResults.filter(p => p.judgeModel.includes('GPT'));
        const claudePerformance = input.performanceResults.filter(p => p.judgeModel.includes('Claude'));

        if (gptPerformance.length > 0) {
            fs.writeFileSync(
                path.join(folderPath, `performance_gpt.json`),
                JSON.stringify(gptPerformance, null, 2)
            );
        }
        if (claudePerformance.length > 0) {
            fs.writeFileSync(
                path.join(folderPath, `performance_claude.json`),
                JSON.stringify(claudePerformance, null, 2)
            );
        }
    }

    // 모델별 토큰 집계 계산
    const modelStats = input.results.reduce((acc, curr) => {
        if (!acc[curr.model]) acc[curr.model] = { input: 0, output: 0, total: 0 };
        acc[curr.model].input += curr.inputTokens;
        acc[curr.model].output += curr.outputTokens;
        acc[curr.model].total += curr.totalTokens;
        return acc;
    }, {} as Record<string, { input: number; output: number; total: number }>);

    const summaryContent = `=== 테스트 실행 요약 ===
테스트 제목: ${input.testTitle}
실행 시각: ${new Date().toLocaleString('ko-KR')}
반복 횟수: ${input.repeatCount}

${input.results.map(r => `[${r.model} - ${r.repeatIndex}회차]
- 입력 토큰: ${r.inputTokens}
- 출력 토큰: ${r.outputTokens}
- 총 토큰: ${r.totalTokens}
- 응답 시간: ${(r.latencyMs / 1000).toFixed(2)}초
- 상태: ${r.error ? '실패' : '성공'}
${r.error ? `- 에러: ${r.error}` : ''}
`).join('\n')}

${input.analysisResults && input.analysisResults.length > 0 ? `=== 일관성 분석 요약 ===
${input.analysisResults.map(a => `[${a.targetModel} - Judge: ${a.judgeModel}]
  - 점수: ${a.score}
  - 판정: ${a.verdict}
`).join('\n')}
` : ''}

${input.performanceResults && input.performanceResults.length > 0 ? `=== 성능 평가 요약 ===
${input.performanceResults.map(p => `[${p.test_metadata.model} - Judge: ${p.judgeModel}]
  - 평균 점수: ${p.final_summary.avg_score.toFixed(2)}
  - 통계 분석: ${p.final_summary.consistency_std_dev}
`).join('\n')}
` : ''}

=== 토큰 소요량 집계 ===
${Object.entries(modelStats).map(([model, stats]) => `[${model}]
- 총 입력 토큰: ${stats.input.toLocaleString()}
- 총 출력 토큰: ${stats.output.toLocaleString()}
- 전체 합계: ${stats.total.toLocaleString()}
`).join('\n')}

총 모델 실행 수: ${input.results.length}
`;
    fs.writeFileSync(path.join(folderPath, `${filePrefix}_Summary.txt`), summaryContent);

    return folderPath;
}
