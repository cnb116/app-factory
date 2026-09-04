# 프리미엄 UI 표준 — PremiumCapsule

앱팩토리 전체(01호기~)에서 유료/프리미엄 기능을 노출할 때 쓰는 공통 UI 표준이다. "마음 권력" 스타일 참고 — 절제된 캡슐형, 상시 노출, 클릭 유도 최소화.

## 왜 이 표준을 쓰는가

- "무료 N회 제한 후 결제 유도" 방식(카운트다운 + 큰 CTA 버튼)은 폐지한다. 대신 프리미엄 기능은 처음부터 캡슐 UI로 조용히 안내하고, 기본 기능에는 "FREE" 같은 뱃지를 붙이지 않는다.
- 50~60대도 읽기 불편하지 않은 크기는 유지하되, "눌러야 할 것 같은 느낌"(큰 배경색, 굵은 글씨, 뱃지)은 없앤다.
- 실제 결제 로직(토스 연동 등)은 이 표준의 범위가 아니다. 이 표준은 UI/구조만 다룬다.

## 컴포넌트: `PremiumCapsule`

각 앱의 `components/PremiumCapsule.tsx`에 동일한 코드로 둔다 (앱마다 독립 프로젝트라 공유 패키지가 없으므로, 신규 앱을 만들 때 이 파일을 그대로 복사해서 쓴다).

```tsx
"use client";

interface PremiumCapsuleProps {
  description: string;
  price: string;
  subtext?: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

export default function PremiumCapsule({
  description,
  price,
  subtext,
  onClick,
  disabled,
  isLoading,
  loadingText,
}: PremiumCapsuleProps) {
  const content = (
    <>
      <span className="flex items-center gap-2 text-lg text-amber-700 sm:text-xl">
        <span aria-hidden>🔒</span>
        <span>{isLoading && loadingText ? loadingText : `${description} — ${price}`}</span>
      </span>
      {subtext && !isLoading && (
        <span className="text-sm text-amber-600/80">{subtext}</span>
      )}
    </>
  );

  const baseClassName =
    "flex w-full flex-col items-center justify-center gap-0.5 rounded-full border border-amber-400 bg-transparent px-5 py-3 text-center transition";

  if (!onClick) {
    return <div className={baseClassName}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClassName} hover:border-amber-500 active:scale-95 disabled:opacity-50`}
    >
      {content}
    </button>
  );
}
```

## Props

| prop | 설명 |
|---|---|
| `description` | 기능 설명. 괄호로 부가 설명 붙이는 걸 권장 (예: `프리미엄 확장팩 (AI 맞춤법 교정 평생 사용)`) |
| `price` | 가격 문자열 (예: `3,900원`) |
| `subtext?` | 선택적 보조 줄. description에 이미 다 담겼으면 생략 |
| `onClick?` | 클릭 핸들러. 없으면 `<div>`로 렌더링되어 순수 안내용(비클릭)으로 동작 — 온보딩 화면에 "이건 프리미엄이다"만 알릴 때 사용 |
| `disabled?` / `isLoading?` / `loadingText?` | 실제 결제/처리 로직과 연결할 때 사용 |

## 텍스트 포맷

한 줄: `🔒 {description} — {price}`. 최대 2줄(보조 줄 포함)을 넘기지 않는다. 굵은 글씨(`font-bold` 등) 쓰지 않는다.

## 스타일 기준

- 테두리만 있는 캡슐형 (`rounded-full border`)
- 배경은 투명(`bg-transparent`) — 검정 배경 앱이면 자연스럽게 검정과 어우러지고, 흰 배경 앱이면 흰 배경과 어우러진다
- 테두리·텍스트는 골드 계열 (`border-amber-400`, `text-amber-700`) — 회색 계열도 허용되지만 골드가 기본값
- 폰트 크기는 `text-lg sm:text-xl` 정도 유지 (50~60대 가독성), 굵기는 보통(400)

## 적용 원칙

1. **뱃지 금지**: "FREE", "유료" 같은 뱃지를 버튼에 겹쳐 올리지 않는다. 기본 기능은 표시 없이 자연스럽게 쓰게 하고, 유료 기능만 캡슐로 존재를 알린다.
2. **상시 노출**: 프리미엄 기능은 사용자가 시도한 뒤에야 나타나는 게 아니라, 처음부터 화면에 보이게 배치한다.
3. **위계 최소화**: 다른 카드·버튼과 크기·색상 대비에서 튀지 않게 조용히 섞이도록 배치한다.
4. **무료 카운트다운 금지**: "오늘 남은 무료 횟수: N회" 같은 카운트다운 UI는 쓰지 않는다.

## 실제 사용 예 (2026-09)

- **01호기 (텍스트 정리기)**: AI 맞춤법 교정 버튼을 `PremiumCapsule`로 교체.
  `<PremiumCapsule description="프리미엄 확장팩 (AI 맞춤법 교정 평생 사용)" price="3,900원" onClick={...} isLoading={...} loadingText="교정 중..." />`
  (일일 무료 횟수 제한 로직은 완전히 제거 — 결제 로직이 실제로 붙기 전까지는 무제한으로 동작한다.)

- **02호기 (마케팅 페이스메이커)**: 온보딩의 채널 선택 화면에 `onClick` 없이 안내용으로 배치.
  `<PremiumCapsule description="프리미엄 확장팩 (채널 3개 동시 운영)" price="3,900원" />`
  (채널 선택은 코드상 1개로 제한되어 있고, 캡슐은 그 이유를 상시 노출로 설명한다. 멀티채널 선택 로직 자체는 `Onboarding.tsx`에 그대로 남아 있으며 `app/page.tsx`의 `MULTI_CHANNEL_ENABLED` 플래그로 전체 온보딩을 켜고 끈다.)

## 신규 앱(03호기~)에 적용하는 법

1. `components/PremiumCapsule.tsx`를 위 코드 그대로 복사한다.
2. 유료 기능이 있는 화면에서, 기존에 뱃지/큰 버튼/카운트다운을 쓰던 자리를 `PremiumCapsule`로 교체한다.
3. `description`에 기능 설명을, `price`에 가격을 넣는다. 클릭 시 실제 동작(또는 향후 결제 연동 지점)이 있으면 `onClick`을 연결하고, 순수 안내용이면 `onClick`을 생략한다.
