# LLM Tester POC (Proof of Concept)

LLM 모델 간의 성능 비교 및 시스템 프롬프트 A/B 테스트를 위한 정밀 평가 플랫폼입니다.

## 🚀 주요 기능

### 1. 모델 성능 비교 (`/model-eval`)

- **멀티 모델 동시 테스트**: Gemini, Claude, GPT 등을 한 번에 비교 실행합니다.
- **스트리밍 실시간 결과**: LLM 응답이 생성되는 즉시 화면에 노출됩니다.
- **100점 만점 감점제 채점**: 정확성, 지시이행, 논리성, 가독성을 판자 모델(Judge)이 정밀 채점합니다.
- **PASS/FAIL 판정**: 기준 점수 이상 획득 시 합격 여부를 판정합니다.

### 2. 프롬프트 A/B 테스트 (`/prompt-eval`)

- **시스템 프롬프트 비교**: 서로 다른 두 버전의 프롬프트가 모델 응답에 미치는 영향을 직접 비교합니다.
- **승자 판정 (Winning Intensity)**: 판자 모델이 두 응답을 비교하여 승자를 결정하고 우위 정도를 표시합니다.
- **개선 가이드**: 프롬프트의 약점을 분석하고 보완할 수 있는 팁을 제공합니다.

### 3. 결과 관리 및 리포팅

- **Markdown/JSON 자동 저장**: 모든 실행 결과는 `results/` 폴더에 날짜별로 저장됩니다.
- **토큰 사용량 집계**: 모델별 비용 및 사용 효율을 한눈에 파악할 수 있습니다.

## 🛠 실행 방법

### 환경 변수 설정

`.env` 파일을 생성하고 다음 API Key들을 입력합니다:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
```

### 서버 시작

```bash
npm install
npm run dev
```

이후 [http://localhost:3000](http://localhost:3000)에서 대시보드를 확인할 수 있습니다.

## 🏗 아키텍처

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Next.js Route Handlers
- **LLM SDK**: Google Generative AI, Anthropic SDK, OpenAI SDK
- **Storage**: Local File System (JSON/MD)
