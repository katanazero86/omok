# Pixel Omok

React, Vite, TypeScript 기반으로 만든 픽셀 스타일 오목 프로젝트입니다.  
자유룰과 렌주룰, CPU 대전과 GPT 대전, 결과 모달, 픽셀 애니메이션, 룰 안내 페이지까지 포함되어 있습니다.

## 배포 링크

- 서비스 URL: [https://omok-pi.vercel.app](https://omok-pi.vercel.app)

## 기술 스택

- `React`
- `Vite`
- `TypeScript`
- `PixiJS`
- `React Router DOM`
- `OpenAI API`
- `CSS`
- `Vercel`

## 개발 방식

- 이 프로젝트는 `Codex`를 활용한 바이브 코딩 방식으로 진행했습니다.
- 아이디어 구상, UI 방향 조정, 게임 로직 구현, GPT 대전 연결, 애니메이션 추가, 문서화까지 Codex와 반복적으로 다듬어가며 작업했습니다.
- 단순 코드 생성이 아니라, 실제 플레이 중 드러난 버그와 룰 오탐, 입력 이슈, UI 밀도 문제를 계속 수정하는 방식으로 발전시켰습니다.

## 주요 기능

- `19x19` 오목판
- 상대 선택: `CPU / GPT`
- CPU 난이도 선택: `하 / 중 / 상`
- 룰 선택: `자유룰 / 렌주룰`
- 돌 선택: `흑돌 / 백돌`
- 마지막 착수 빨간 점 표시
- 착수 가능 칸 프리뷰
- 착수 애니메이션
- 게임 종료 결과 모달
- 승리/패배 픽셀 연출
- 소요 시간 표시
- 룰 설명 페이지

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 프로덕션 빌드

```bash
npm run build
```

### 4. 빌드 결과 미리보기

```bash
npm run preview
```

## 환경 변수

GPT 대전을 사용하려면 `.env` 파일에 아래 값을 설정합니다.

```bash
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_MODEL=gpt-5.4-mini
```

## 프로젝트 구조

```text
omok/
├─ public/
│  ├─ favicon.svg
│  └─ og-image.svg
├─ src/
│  ├─ api/
│  │  └─ openai-move.ts
│  ├─ components/
│  │  └─ BoardCanvas.tsx
│  ├─ game/
│  │  └─ omok.ts
│  ├─ pages/
│  │  ├─ GamePage.tsx
│  │  └─ RulesPage.tsx
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ style.css
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

## 파일 설명

- `src/main.tsx`
  - React 엔트리 포인트입니다.
- `src/App.tsx`
  - 라우팅과 상단 헤더를 구성합니다.
- `src/pages/GamePage.tsx`
  - 게임 설정, 대국 진행, 상태 패널, 결과 모달 UI를 담당합니다.
- `src/pages/RulesPage.tsx`
  - 자유룰과 렌주룰 설명을 제공합니다.
- `src/components/BoardCanvas.tsx`
  - PixiJS로 바둑판, 돌, 하이라이트, 프리뷰, 착수 효과를 렌더링합니다.
- `src/game/omok.ts`
  - 보드 생성, 승리 판정, 렌주 금수 판정, CPU 수 선택 로직을 담당합니다.
- `src/api/openai-move.ts`
  - GPT 대전 시 모델 입력 구성, 합법 수 계산, 즉승/즉방 수 계산, 응답 검증을 담당합니다.
- `src/style.css`
  - 전체 화면 스타일, 게임 레이아웃, 버튼, 모달, 승패 연출을 정의합니다.

## 프롬프트 튜닝 고충

- GPT가 오목 규칙을 "이해하는 것처럼 보이지만" 실제로는 4목 방어를 놓치거나 렌주 금수를 잘못 두는 경우가 있었습니다.
- 처음에는 시스템 프롬프트를 길게 쓰면 해결될 거라고 생각했지만, 프롬프트만으로는 전술적 정확도를 안정적으로 보장하기 어려웠습니다.
- 특히 렌주룰은 `삼삼`, `사사`, `장목`처럼 사람도 헷갈리는 규칙이 있어서, 단순 설명만 추가하는 방식으로는 오탐과 이상한 수 선택이 계속 발생했습니다.
- 그래서 보드 문자열만 넘기지 않고 `legal_moves`, `immediate_winning_move`, `immediate_blocking_move`, `you_are`, `opponent_is` 같은 구조화된 입력을 함께 전달하는 방향으로 바꿨습니다.
- "만약 LLM이 오목을 완전히 정확하게 학습했다면 프롬프트만으로 충분하지 않을까?"라는 질문도 해볼 수 있지만, 실제 앱에서는 여전히 입력 구조화와 코드 검증이 필요했습니다. 모델이 규칙을 알고 있는 것과 매 턴 모든 합법 수를 빠짐없이 계산하고 최적 수를 안정적으로 고르는 것은 다른 문제였기 때문입니다.
- 결론적으로, GPT 대전은 프롬프트보다도 "모델이 선택할 수 있는 범위를 코드로 제한하는 것"이 훨씬 중요하다는 점을 확인했습니다.

## 사용 흐름

1. 시작 화면에서 상대, 난이도, 룰, 돌 색을 선택합니다.
2. 설정을 확정하면 게임이 시작됩니다.
3. 플레이어가 클릭으로 착수하고, CPU 또는 GPT가 다음 수를 둡니다.
4. 승패가 결정되거나 무승부가 되면 결과 모달이 표시됩니다.

## 참고

- GPT 대전은 재미 요소와 스타일 면에서 의미가 있지만, 순수한 수읽기 강도만 보면 전통적인 탐색형 AI보다 불안정할 수 있습니다.
- 렌주 금수 판정은 지속적으로 보정 중이며, 특정 패턴에서 추가 조정이 필요할 수 있습니다.
