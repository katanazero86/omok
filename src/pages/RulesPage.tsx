const FREE_RULE_ITEMS = [
  '19x19 바둑판에서 진행합니다.',
  '가로, 세로, 대각선 어느 방향이든 5목 이상을 먼저 만들면 승리합니다.',
  '금수는 적용되지 않습니다.',
  '모든 칸이 찼는데 승부가 나지 않으면 무승부입니다.',
];

const RENJU_RULE_ITEMS = [
  '렌주룰에서는 흑돌에게만 금수가 적용됩니다.',
  '흑돌의 장목은 승리가 아니라 금수입니다.',
  '흑돌의 삼삼과 사사도 금수라서 둘 수 없습니다.',
  '백돌은 금수 없이 5목 이상을 만들면 승리합니다.',
];

const COMMON_RULE_ITEMS = [
  '게임 시작 전 상대, 난이도, 룰, 돌 색을 선택할 수 있습니다.',
  '게임 종료 시 결과와 총 소요 시간이 모달로 표시됩니다.',
  '마지막 착수는 빨간 점으로 표시되며, 둘 수 있는 칸에는 프리뷰 돌이 보입니다.',
];

function RuleSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rules-section">
      <h3>{title}</h3>
      <div className="rules-grid">
        {items.map((item, index) => (
          <article className="panel-card rule-card" key={item}>
            <span className="rule-index">{String(index + 1).padStart(2, '0')}</span>
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RulesPage() {
  return (
    <section className="rules-layout">
      <article className="panel-card hero-card">
        <p className="panel-label">RULE BOOK</p>
        <h2>자유룰과 렌주룰을 모두 지원합니다</h2>
        <p className="panel-copy">
          이 프로젝트는 기본 자유룰 오목과 렌주룰을 선택해서 플레이할 수 있도록 구성되어 있습니다.
          렌주룰에서는 흑돌 금수가 적용됩니다.
        </p>
      </article>

      <RuleSection items={COMMON_RULE_ITEMS} title="공통 규칙" />
      <RuleSection items={FREE_RULE_ITEMS} title="자유룰" />
      <RuleSection items={RENJU_RULE_ITEMS} title="렌주룰" />
    </section>
  );
}
