import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type ModelProvider = 'gemini-pro' | 'gemini-3-pro-preview' | 'gemini-flash' | 'claude' | 'gpt';

export interface TestInput {
  testTitle: string;
  systemPromptVersion?: string;
  systemPrompt?: string;
  userMessage: string;
  models: ModelProvider[];
  repeatCount: number;
}

export interface ModelResult {
  model: string;
  repeatIndex: number;
  response: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  error?: string;
  version?: string; // 버전 정보 추가
}

export interface AnalysisResult {
  targetModel: string;
  judgeModel: string;
  analysis: string;
  score: number;
  verdict: 'Pass' | 'Fail';
}

export interface PerformanceResult {
  test_metadata: { model: string; total_trials: number };
  results: {
    id: number;
    breakdown: {
      accuracy: number;    // max 40
      adherence: number;   // max 30
      logic: number;       // max 20
      readability: number; // max 10
    };
    total_score: number;   // max 100
    reason: string;
  }[];
  final_summary: {
    avg_score: number;
    pass_count: number;
    consistency_std_dev: string;
    grade: 'S' | 'A' | 'B' | 'C' | 'F';
  };
  judgeModel: string;
}

// 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import pLimit from 'p-limit';

// ... (인터페이스 생략 - 기존과 동일)

// 개별 테스트 실행을 위한 헬퍼 함수
async function runSingleTest(modelType: ModelProvider, repeatIndex: number, input: TestInput): Promise<ModelResult> {
  const startTime = Date.now();
  const result: ModelResult = {
    model: modelType,
    repeatIndex,
    response: '',
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    latencyMs: 0,
  };

  try {
    if (modelType.startsWith('gemini')) {
      let modelName = '';
      if (modelType === 'gemini-pro') modelName = 'gemini-2.5-pro';
      if (modelType === 'gemini-3-pro-preview') modelName = 'gemini-3-pro-preview';
      if (modelType === 'gemini-flash') modelName = 'gemini-3-flash-preview';

      let model = genAI.getGenerativeModel({ model: modelName });
      if (input.systemPrompt) {
        model = genAI.getGenerativeModel({ model: modelName, systemInstruction: input.systemPrompt });
      }

      const resultGen = await model.generateContent(input.userMessage);
      const response = await resultGen.response;
      const text = response.text();
      const usage = response.usageMetadata;

      result.model = modelName;
      result.response = text;
      result.inputTokens = usage?.promptTokenCount || 0;
      result.outputTokens = usage?.candidatesTokenCount || 0;
      result.totalTokens = usage?.totalTokenCount || 0;

    } else if (modelType === 'claude') {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: input.systemPrompt,
        messages: [{ role: 'user', content: input.userMessage }],
      });
      result.model = 'Claude 4.5 Sonnet';
      result.response = msg.content[0].type === 'text' ? msg.content[0].text : '';
      result.inputTokens = msg.usage.input_tokens;
      result.outputTokens = msg.usage.output_tokens;
      result.totalTokens = msg.usage.input_tokens + msg.usage.output_tokens;

    } else if (modelType === 'gpt') {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: input.systemPrompt || '' },
          { role: 'user', content: input.userMessage },
        ],
        model: 'gpt-5-2025-08-07',
      });
      result.model = 'GPT-5';
      result.response = completion.choices[0].message.content || '';
      result.inputTokens = completion.usage?.prompt_tokens || 0;
      result.outputTokens = completion.usage?.completion_tokens || 0;
      result.totalTokens = completion.usage?.total_tokens || 0;
    }

    result.latencyMs = Date.now() - startTime;
    return result;
  } catch (error) {
    result.latencyMs = Date.now() - startTime;
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

export async function runTest(input: TestInput): Promise<ModelResult[]> {
  // 동시 실행 수 제한 (API 계정 등급에 따라 조절 가능, 여기서는 5로 설정)
  const limit = pLimit(5);
  const tasks: Promise<ModelResult>[] = [];

  for (const modelType of input.models) {
    for (let i = 1; i <= input.repeatCount; i++) {
      tasks.push(limit(() => runSingleTest(modelType, i, input)));
    }
  }

  return await Promise.all(tasks);
}

export async function evaluateConsistency(
  targetModel: string,
  referenceResponse: string,
  compareResponses: string[],
  judgeProvider: 'gpt' | 'claude'
): Promise<AnalysisResult> {
  const compareText = compareResponses.map((r, i) => `[비교 답변 ${i + 2}]: ${r}`).join('\n\n');

  const prompt = `### Role: 전문 품질 평가관
### Task: 동일한 질문에 대한 LLM 답변들의 '의미적 일관성' 평가

당신은 AI 서비스의 품질을 평가하는 10년 차 전문 언어 검수사입니다. 
아래의 [기준 답변]과 여러 개의 [비교 답변]들을 대조하여 정보의 평탄도와 논리적 일관성을 판결하십시오.

[기준 답변 (1회차)]: 
${referenceResponse}

${compareText}

### 평가 가이드라인:
1. 정보 완전성 및 핵심 기준 충족 (Information Integrity & Critical Criteria, 5점):
   - 기준 답변의 핵심 정보(법적 요건, 필수 조건 등)가 모두 포함되어 있는가?
   - 필수 기준(예: 법적 감면 조건, 자격 요건 등)을 정확히 충족하는가?
   - 새로운 내용이 추가되었더라도 기준 답변의 본질을 흐리지 않는가?
2. 형식 및 제약 준수 (Format & Constraint, 3점):
   - 불렛 포인트, 표, JSON 등 요구된 형식이 동일하게 유지되었는가?
   - 답변의 길이(분량)가 유사한 수준인가?
3. 톤앤매너 및 논리 (Tone & Logic, 2점):
   - 말투(종결어미, 전문성 등)가 일관적인가?
   - 기준 답변과 논리적으로 충돌하는 내용(할루시네이션)이 없는가?

### 점수 가이드라인:
- 10점: 두 답변이 문장 구조만 약간 다를 뿐, 의미와 형식이 100% 일치함.
- 8-9점: 핵심 정보는 모두 포함됨. 사소한 표현 차이나 부연 설명이 추가됨.
- 6-7점: 주요 정보는 포함되었으나, 일부 세부 사항이 누락되거나 형식이 미세하게 틀어짐.
- 4-5점: 핵심 정보 중 일부가 누락되었거나, 말투가 기준과 확연히 다름.
- 1-3점: 정보가 왜곡되었거나, 기준 답변과 상충하는 내용이 포함됨. 전혀 다른 형식임.

### 출력 형식 (반드시 아래 형식을 지키고 한국어로 작성할 것):
분석: (답변들 사이의 공통점과 차이점, 일관성 수준을 150자 이내로 요약)
점수: (1~10점 사이의 정수)
판정: (모든 답변이 핵심적으로 일치하면 Pass, 아니면 Fail)
`;

  let responseText = '';
  let judgeModelName = '';

  try {
    if (judgeProvider === 'claude') {
      judgeModelName = 'Claude 4.5 Sonnet';
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });
      responseText = msg.content[0].type === 'text' ? msg.content[0].text : '';
    } else {
      judgeModelName = 'GPT-5';
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-5-2025-08-07',
      });
      responseText = completion.choices[0].message.content || '';
    }

    // 결과 파싱 (마크다운 별표나 공백에 유연하게 대응하도록 정규식 보강)
    const scoreMatch = responseText.match(/점수[:\s*]*(\d+)/);
    const verdictMatch = responseText.match(/판정[:\s*]*(Pass|Fail)/i);
    const analysisMatch = responseText.match(/분석[:\s*]*([\s\S]*?)(?=\n?\s*\*?\*?점수:|$)/);

    return {
      targetModel,
      judgeModel: judgeModelName,
      analysis: analysisMatch ? analysisMatch[1].trim() : responseText.slice(0, 200),
      score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      verdict: (verdictMatch ? verdictMatch[1].toLowerCase() : 'fail') === 'pass' ? 'Pass' : 'Fail',
    };
  } catch (error) {
    return {
      targetModel,
      judgeModel: judgeProvider === 'claude' ? 'Claude 4.5 Sonnet' : 'GPT-5',
      analysis: `평가 중 에러 발생: ${error instanceof Error ? error.message : 'Unknown error'}`,
      score: 0,
      verdict: 'Fail',
    };
  }
}

export async function evaluatePerformance(
  targetModel: string,
  allResponses: string[],
  judgeProvider: 'gpt' | 'claude'
): Promise<PerformanceResult | null> {
  const responsesText = allResponses.map((r, i) => `[Trial ${i + 1}]:\n${r}`).join('\n\n---\n\n');

  const prompt = `### Role: 초정밀 AI 모델 성능 비평가 (Hyper-Critical Auditor)

### Task: 아래 제시된 [대상 모델]의 답변 ${allResponses.length}개를 엄격하게 심사하여 100점 만점 기준으로 정량 평가하라.

당신은 업계에서 가장 까다로운 품질 감사관입니다. 웬만한 답변에는 80점 이상을 주지 않으며, 아주 사소한 결함(오타, 모호한 표현, 사족 등)도 반드시 찾아내어 감점해야 합니다. 95점 이상은 업계 최고 수준의 '완벽한' 답변에만 부여합니다.

[대상 모델]: ${targetModel}

[검토할 답변 리스트]:
${responsesText}

### 1. 평가 루브릭 및 감점 기준 (총점 100점):

#### A. 정확성 (Accuracy) - 40점
- 핵심 팩트 오류나 정보 왜곡: 건당 -10점
- 법적 요건 등 핵심 기준 미충족: 건당 -10점
- 중요한 정보 누락: 건당 -10점
- 모호하거나 불확실한 서술: 건당 -5점

#### B. 지시 이행 (Adherence) - 30점
- 페르소나/말투 미준수: -5점
- 지정된 출력 형식(JSON, 표 등) 위반: -10점
- 필수 포함 키워드/내용 누락: 건당 -5점
- 분량 제약 위반: -3점

#### C. 논리성 및 구조 (Logic) - 20점
- 단계별 추론 과정의 허점: -5점
- 전후 문맥의 모순: -5점
- 근거 없는 주장: -3점

#### D. 가독성 및 완성도 (Readability) - 10점
- 사족이나 불필요한 반복: -2점
- 용어 선택의 부적절함: -2점
- 문장 구조의 어색함: -1점

### 2. 등급 기준:
- S (90이상-100): 거의 완벽하며 결함이 없음
- A (80이상-90미만): 우수하지만 미세한 개선점 존재
- B (70이상-80미만): 핵심은 준수하나 보완이 필요함
- C (50이상-70미만): 정보는 제공하나 전반적인 품질이 낮음
- F (50 미만): 치명적 오류가 있거나 지시에 실패함

### 3. 출력 형식 (JSON Only, 코드 블록 없이 { }만 출력):
{
  "test_metadata": { "model": "${targetModel}", "total_trials": ${allResponses.length} },
  "results": [
    {
      "id": 1,
      "breakdown": { "accuracy": 40, "adherence": 30, "logic": 20, "readability": 10 },
      "total_score": 100,
      "reason": "감점 요인 중심으로 기술 (예: '정확성 항목에서 ~한 이유로 -5점')"
    }
  ],
  "final_summary": {
    "avg_score": 0.0,
    "pass_count": 0,
    "consistency_std_dev": "0.0",
    "grade": "S"
  }
}
`;

  let responseText = '';
  let judgeModelName = '';

  try {
    if (judgeProvider === 'claude') {
      judgeModelName = 'Claude 4.5 Sonnet';
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      responseText = msg.content[0].type === 'text' ? msg.content[0].text : '';
    } else {
      judgeModelName = 'GPT-5';
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-5-2025-08-07',
        response_format: { type: 'json_object' }
      });
      responseText = completion.choices[0].message.content || '';
    }

    // JSON 추출 (코드 블록 등이 포함될 수 있으므로 정제)
    const jsonStr = responseText.substring(
      responseText.indexOf('{'),
      responseText.lastIndexOf('}') + 1
    );
    const parsed = JSON.parse(jsonStr);

    return {
      ...parsed,
      judgeModel: judgeModelName
    };
  } catch (error) {
    console.error(`Performance evaluation error (${judgeProvider}):`, error);
    return null;
  }
}

export interface ComparativeResult {
  winner: 'A' | 'B' | 'Tie';
  winFactor: string;
  scores: {
    accuracy: { A: number; B: number };    // 20
    adherence: { A: number; B: number };   // 45
    logic: { A: number; B: number };       // 20
    readability: { A: number; B: number }; // 15
    total: { A: number; B: number };       // 100
  };
  analysis: {
    A: { strengths: string[]; weaknesses: string[] };
    B: { strengths: string[]; weaknesses: string[] };
  };
  suggestion: string;
  judgeModel: string;
}

export async function evaluateComparativePerformance(
  systemPromptA: string,
  systemPromptB: string,
  responseA: string,
  responseB: string,
  userQuery: string,
  judgeProvider: 'gpt' | 'claude'
): Promise<ComparativeResult | null> {
  const prompt = `### Role: 초정밀 AI 프롬프트 분석가 (Hyper-Critical Prompt Auditor)

### Task: 서로 다른 두 시스템 프롬프트(A/B)가 생성한 결과물을 비교 심사하여 '어느 프롬프트가 더 전략적으로 우수한가'를 판정하라.

당신은 매우 엄격한 비평가이자 프롬프트 엔지니어입니다. 두 응답을 1:1로 대조하여 아주 미묘한 품질 차이와 프롬프트 지시 사항의 이행 수준을 잡아내십시오. 특히 '지시 사항 이행(Adherence)'에 가장 높은 가중치를 두어 심사합니다.

## 1. 평가 환경 (Context)
* **목표(Goal):** 두 가지 다른 시스템 프롬프트(A/B)의 효과성 비교 검증
* **시스템 프롬프트 A:** ${systemPromptA}
* **시스템 프롬프트 B:** ${systemPromptB}
* **사용자 입력 (User Query):** ${userQuery}

## 2. 평가 루브릭 및 가중치 (총점 100점)
각 버전(A, B)에 대해 독립적인 감점식 채점을 수행한 후 최종 우승자를 결정하십시오.

1. **지시 이행 (Adherence) - 45점 [핵심]:** 
   - 해당 버전의 시스템 프롬프트에 명시된 페르소나, 말투, 출력 형식, 제약 사항을 얼마나 '완벽하게' 준수했는가? (사소한 위반도 엄격히 감점)
   - **주의:** 시스템 프롬프트에서 명시적으로 출처나 인용 표기를 요구하지 않았다면, 이를 이유로 감점하지 마십시오. 답변의 내용이 사실에 부합하는지에 집중하십시오.
2. **정확성 (Accuracy) - 20점:** 
   - 응답 내용이 사실에 근거하며 정보의 누락이 없는가?
3. **논리성 및 구조 (Logic) - 20점:** 
   - 답변 전개 과정이 논리적으로 타당하며 구조가 매끄러운가?
4. **가독성 및 완성도 (Readability) - 15점:** 
   - 사용자가 보기 편한 레이아웃과 적절한 용어들을 사용하였는가?

## 3. 출력 형식 (JSON Only)
반드시 아래 JSON 형식으로만 출력하십시오. 코드 블록 없이 순수 JSON만 반환해야 합니다.

{
  "winner": "A" 또는 "B" 또는 "Tie",
  "winFactor": "승리 요인 한 줄 요약 (예: 'B의 프롬프트가 페르소나와 제약사항을 훨씬 더 엄밀하게 준수함')",
  "scores": {
    "accuracy": { "A": 0, "B": 0 },
    "adherence": { "A": 0, "B": 0 },
    "logic": { "A": 0, "B": 0 },
    "readability": { "A": 0, "B": 0 },
    "total": { "A": 0, "B": 0 }
  },
  "analysis": {
    "A": { "strengths": ["강점1"], "weaknesses": ["약점1"] },
    "B": { "strengths": ["강점1"], "weaknesses": ["약점1"] }
  },
  "suggestion": "두 프롬프트의 공통적인 문제점이나 더 나은 성능을 위한 개선 제안 (한 문장)"
}

---
## [데이터 입력 섹션]
- **Response A:**
${responseA}

- **Response B:**
${responseB}
`;

  let responseText = '';
  let judgeModelName = '';

  try {
    if (judgeProvider === 'claude') {
      judgeModelName = 'Claude 4.5 Sonnet';
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      responseText = msg.content[0].type === 'text' ? msg.content[0].text : '';
    } else {
      judgeModelName = 'GPT-5';
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-5-2025-08-07',
        response_format: { type: 'json_object' }
      });
      responseText = completion.choices[0].message.content || '';
    }

    const jsonStr = responseText.substring(
      responseText.indexOf('{'),
      responseText.lastIndexOf('}') + 1
    );
    const parsed = JSON.parse(jsonStr);

    return {
      ...parsed,
      judgeModel: judgeModelName
    };
  } catch (error) {
    console.error(`Comparative evaluation error(${judgeProvider}): `, error);
    return null;
  }
}
