# Pixel Omok

React, Vite, TypeScript 기반으로 만든 CPU 대전 오목 프로젝트입니다.  
픽셀 감성의 바둑판 UI 위에 난이도 선택, 돌 색 선택, CPU 대전, 룰 안내, 종료 결과 모달 등을 구현했습니다.

## 배포 링크

- 서비스 URL: [https://omok-pi.vercel.app](https://omok-pi.vercel.app)

## 기술 스택

- `React`
- `Vite`
- `TypeScript`
- `PixiJS`
- `React Router DOM`
- `CSS`
- `Vercel`

## 개발 방식

- 이 프로젝트는 `Codex`를 활용한 바이브 코딩 방식으로 제작했습니다.
- 아이디어 구상, UI 방향 조정, 기능 구현, 리팩터링, 문서화까지 Codex와 상호작용하며 빠르게 반복 개발했습니다.
- 단순 코드 생성에 그치지 않고, 게임 룰 반영, 렌더링 개선, 애니메이션 추가, README 정리 같은 작업도 함께 진행했습니다.

## 주요 기능

- `19x19` 오목판
- CPU 난이도 선택: `상 / 중 / 하`
- 플레이어 돌 선택: `흑돌 / 백돌`
- 플레이어 vs CPU 대전
- 착수 프리뷰 표시
- 마지막 착수 위치 하이라이트
- 착수 애니메이션 효과
- 게임 종료 시 결과 모달 표시
- 대국 소요 시간 표시
- 오목 룰 안내 페이지

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

기본적으로 Vite 개발 서버가 실행되며, 브라우저에서 표시된 로컬 주소로 접속하면 됩니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉터리에 생성됩니다.

### 4. 빌드 결과 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```text
omok/
├─ public/
├─ src/
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
  - 라우팅과 전체 앱 레이아웃을 구성합니다.
- `src/pages/GamePage.tsx`
  - 게임 시작 설정, 대국 진행, 결과 모달 UI를 담당합니다.
- `src/pages/RulesPage.tsx`
  - 현재 프로젝트에 적용된 오목 룰을 안내합니다.
- `src/components/BoardCanvas.tsx`
  - PixiJS로 바둑판, 돌, 하이라이트, 프리뷰, 착수 효과를 렌더링합니다.
- `src/game/omok.ts`
  - 보드 생성, 승리 판정, CPU 수 선택 로직 등 게임 핵심 로직을 담고 있습니다.
- `src/style.css`
  - 전체 화면 스타일, 게임 레이아웃, 모달, 버튼 UI를 정의합니다.

## 사용 흐름

1. 게임 시작 화면에서 CPU 난이도와 돌 색을 선택합니다.
2. 설정을 확정하면 게임이 시작됩니다.
3. 플레이어는 클릭으로 착수하고, CPU는 난이도에 맞는 휴리스틱으로 수를 둡니다.
4. 승패가 결정되거나 무승부가 되면 결과 모달이 표시됩니다.

## 참고

- 현재 룰은 금수 규칙이 없는 자유룰 기준입니다.
- 흑돌은 선공, 백돌은 후공입니다.
