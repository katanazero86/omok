const RULE_ITEMS = [
  '19x19 오목판을 사용합니다.',
  '게임 시작 전에 CPU 난이도와 플레이어 돌 색을 선택할 수 있습니다.',
  '흑돌은 선공, 백돌은 후공입니다.',
  '가로, 세로, 대각선 중 한 방향이라도 돌 5개 이상이 이어지면 승리합니다.',
  '금수 규칙은 적용하지 않는 자유룰 기반입니다.',
  '모든 칸이 찼는데 승부가 나지 않으면 무승부입니다.',
  '대국이 끝나면 승패와 함께 총 소요 시간이 표시됩니다.',
];

export function RulesPage() {
  return (
    <section className="rules-layout">
      <article className="panel-card hero-card">
        <p className="panel-label">RULE BOOK</p>
        <h2>이 게임에서 적용되는 오목 룰</h2>
        <p className="panel-copy">
          이 프로젝트는 빠르게 플레이할 수 있는 자유룰 오목을 기준으로 구성했습니다. 기본 규칙과
          현재 구현 범위는 아래와 같습니다.
        </p>
      </article>

      <div className="rules-grid">
        {RULE_ITEMS.map((item, index) => (
          <article className="panel-card rule-card" key={item}>
            <span className="rule-index">{String(index + 1).padStart(2, '0')}</span>
            <p>{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
