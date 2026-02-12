import fs from 'fs';
import path from 'path';
import { ModelResult, AnalysisResult, PerformanceResult, ComparativeResult } from './llm-client';

export type TestType = 'model_eval' | 'prompt_eval' | 'manual_eval';

export interface SaveTestResultInput {
    testTitle: string;
    testQuestionId?: string;
    testType?: TestType;
    commonTestEnv?: string; // 공통 테스트 환경
    systemPromptVersion?: string;
    systemPrompt?: string;
    userMessage: string;
    models: string[];
    results: ModelResult[];
    analysisResults?: AnalysisResult[];
    performanceResults?: PerformanceResult[];
    comparativeResults?: (ComparativeResult & { targetModel: string })[];
    repeatCount: number;
}

export function saveTestResult(input: SaveTestResultInput): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
    const timestamp = `${dateStr}_${timeStr}`;

    const safeTitle = input.testTitle.replace(/[\\/:*?"<>|]/g, '_').slice(0, 15);
    const typeFolder = input.testType || 'model_eval';
    const folderName = `${timestamp}_${safeTitle}`;
    const folderPath = path.join(process.cwd(), 'results', typeFolder, folderName);

    fs.mkdirSync(folderPath, { recursive: true });

    const filePrefix = `${timestamp}`;

    const inputContent = `# 테스트 실행 정보

**실행 시각**: ${new Date().toLocaleString('ko-KR')}
**테스트 제목**: ${input.testTitle}
**테스트질문 ID**: ${input.testQuestionId || '(없음)'}
**테스트 타입**: ${input.testType === 'prompt_eval' ? '프롬프트 A/B 비교' :
            input.testType === 'manual_eval' ? '수동 응답 비교' : '모델 성능 비교'
        }
**반복 횟수**: ${input.repeatCount}회

${input.commonTestEnv ? `## 공통 테스트 환경
${input.commonTestEnv}
` : ''}
## 시스템 프롬프트 ${input.systemPromptVersion ? `(${input.systemPromptVersion})` : ''}
${input.systemPrompt || '(없음)'}

## 사용자 질문
${input.userMessage}

## 선택된 모델
${input.models.map(m => `- ${m}`).join('\n')}
`;
    fs.writeFileSync(path.join(folderPath, `${filePrefix}_Input.md`), inputContent);

    input.results.forEach((result) => {
        const modelSafeName = result.model.replace(/[\s\.]+/g, '_');
        const versionTag = result.version ? `_${result.version}` : '';
        const repeatStr = String(result.repeatIndex).padStart(2, '0');
        const modelFileName = `${filePrefix}_${repeatStr}${versionTag}_${modelSafeName}.md`;

        const modelContent = `# ${result.model} ${result.version ? `[${result.version}]` : ''} 응답 (${result.repeatIndex}/${input.repeatCount}회차)

## 응답 내용
${result.error || result.response}

## 메타데이터
- **버전**: ${result.version || 'N/A'}
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

    if (input.performanceResults && input.performanceResults.length > 0) {
        const gptPerformance = input.performanceResults.filter(p => p.judgeModel.includes('GPT'));
        const claudePerformance = input.performanceResults.filter(p => p.judgeModel.includes('Claude'));

        if (gptPerformance.length > 0) {
            fs.writeFileSync(path.join(folderPath, `performance_gpt.json`), JSON.stringify(gptPerformance, null, 2));

            const content = `# 성능 평가 리포트 - GPT-5

${gptPerformance.map(p => `## 대상 모델: ${p.test_metadata.model}
- **평균 점수**: ${p.final_summary.avg_score.toFixed(2)}
- **최종 등급**: ${p.final_summary.grade}
- **일관성(표준편차)**: ${p.final_summary.consistency_std_dev}
- **데이터 통계**: 총 ${p.test_metadata.total_trials}회 시행 / ${p.final_summary.pass_count}회 통과

### 회차별 상세 분석:
${p.results.map(r => `#### Trial ${r.id} (총점: ${r.total_score})
- **정확성**: ${r.breakdown.accuracy}/40
- **지시 이행**: ${r.breakdown.adherence}/30
- **논리성**: ${r.breakdown.logic}/20
- **가독성**: ${r.breakdown.readability}/10
- **평가 의견**: ${r.reason}
`).join('\n')}
`).join('\n---\n\n')}
`;
            fs.writeFileSync(path.join(folderPath, `performance_gpt.md`), content);
        }
        if (claudePerformance.length > 0) {
            fs.writeFileSync(path.join(folderPath, `performance_claude.json`), JSON.stringify(claudePerformance, null, 2));

            const content = `# 성능 평가 리포트 - Claude 4.5 Sonnet

${claudePerformance.map(p => `## 대상 모델: ${p.test_metadata.model}
- **평균 점수**: ${p.final_summary.avg_score.toFixed(2)}
- **최종 등급**: ${p.final_summary.grade}
- **일관성(표준편차)**: ${p.final_summary.consistency_std_dev}
- **데이터 통계**: 총 ${p.test_metadata.total_trials}회 시행 / ${p.final_summary.pass_count}회 통과

### 회차별 상세 분석:
${p.results.map(r => `#### Trial ${r.id} (총점: ${r.total_score})
- **정확성**: ${r.breakdown.accuracy}/40
- **지시 이행**: ${r.breakdown.adherence}/30
- **논리성**: ${r.breakdown.logic}/20
- **가독성**: ${r.breakdown.readability}/10
- **평가 의견**: ${r.reason}
`).join('\n')}
`).join('\n---\n\n')}
`;
            fs.writeFileSync(path.join(folderPath, `performance_claude.md`), content);
        }
    }

    if (input.comparativeResults && input.comparativeResults.length > 0) {
        const gptComp = input.comparativeResults.filter(p => p.judgeModel.includes('GPT'));
        const claudeComp = input.comparativeResults.filter(p => p.judgeModel.includes('Claude'));

        if (gptComp.length > 0) {
            fs.writeFileSync(path.join(folderPath, `comparative_gpt.json`), JSON.stringify(gptComp, null, 2));

            const content = `# A/B 비교 평가 리포트 - GPT-5

${gptComp.map(c => `## 대상 모델: ${c.targetModel}
- **최종 우승**: **${c.winner}**
- **승리 요인**: ${c.winFactor}

### 상세 점수 비교:
| 항목 | 버전 A | 버전 B |
| :--- | :---: | :---: |
${c.scores.details.map(d => `| ${d.label} (${d.max}) | ${d.score.A} | ${d.score.B} |`).join('\n')}
| **총합 (100)** | **${c.scores.total.A}** | **${c.scores.total.B}** |

### 버전별 장단점 분석:
#### 버전 A
- **강점**: ${c.analysis.A.strengths.join(', ')}
- **약점**: ${c.analysis.A.weaknesses.join(', ')}

#### 버전 B
- **강점**: ${c.analysis.B.strengths.join(', ')}
- **약점**: ${c.analysis.B.weaknesses.join(', ')}

### 종합 제안:
${c.suggestion}
`).join('\n---\n\n')}
`;
            fs.writeFileSync(path.join(folderPath, `comparative_gpt.md`), content);
        }
        if (claudeComp.length > 0) {
            fs.writeFileSync(path.join(folderPath, `comparative_claude.json`), JSON.stringify(claudeComp, null, 2));

            const content = `# A/B 비교 평가 리포트 - Claude 4.5 Sonnet

${claudeComp.map(c => `## 대상 모델: ${c.targetModel}
- **최종 우승**: **${c.winner}**
- **승리 요인**: ${c.winFactor}

### 상세 점수 비교:
| 항목 | 버전 A | 버전 B |
| :--- | :---: | :---: |
${c.scores.details.map(d => `| ${d.label} (${d.max}) | ${d.score.A} | ${d.score.B} |`).join('\n')}
| **총합 (100)** | **${c.scores.total.A}** | **${c.scores.total.B}** |

### 버전별 장단점 분석:
#### 버전 A
- **강점**: ${c.analysis.A.strengths.join(', ')}
- **약점**: ${c.analysis.A.weaknesses.join(', ')}

#### 버전 B
- **강점**: ${c.analysis.B.strengths.join(', ')}
- **약점**: ${c.analysis.B.weaknesses.join(', ')}

### 종합 제안:
${c.suggestion}
`).join('\n---\n\n')}
`;
            fs.writeFileSync(path.join(folderPath, `comparative_claude.md`), content);
        }
    }

    const modelStats = input.results.reduce((acc, curr) => {
        const key = `${curr.model}${curr.version ? ` (${curr.version})` : ''}`;
        if (!acc[key]) acc[key] = { input: 0, output: 0, total: 0 };
        acc[key].input += curr.inputTokens;
        acc[key].output += curr.outputTokens;
        acc[key].total += curr.totalTokens;
        return acc;
    }, {} as Record<string, { input: number; output: number; total: number }>);

    const summaryContent = `=== 테스트 실행 요약 ===
테스트 제목: ${input.testTitle}
테스트질문 ID: ${input.testQuestionId || 'N/A'}
테스트 타입: ${input.testType || 'model_eval'}
실행 시각: ${new Date().toLocaleString('ko-KR')}
반복 횟수: ${input.repeatCount}

${input.results.map(r => `[${r.model}${r.version ? ` - ${r.version}` : ''} - ${r.repeatIndex}회차]
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
  - 등급: ${(p as any).final_summary.grade || 'N/A'}
`).join('\n')}
` : ''}

${input.comparativeResults && input.comparativeResults.length > 0 ? `=== A/B 비교 평가 요약 ===
${input.comparativeResults.map(c => `[${c.targetModel} - Judge: ${c.judgeModel}]
  - 승자: ${c.winner}
  - 점수: A(${c.scores.total.A}) vs B(${c.scores.total.B})
  - 요인: ${c.winFactor}
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
