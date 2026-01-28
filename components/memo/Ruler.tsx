// =============================================================================
// PageMinder - Ruler Component
// =============================================================================

import React from 'react';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RulerProps {
  triggerRect: DOMRect;
  memoRect: Rect;
  scroll: { x: number; y: number };
}

/**
 * ドラッグ中にトリガー要素とメモの位置関係を表示するルーラー
 */
export const Ruler: React.FC<RulerProps> = ({ triggerRect, memoRect, scroll }) => {
  // SVGの描画領域（全画面）
  const svgStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: 9999999, // 最前面
  };

  // 座標計算（すべてviewport基準）
  // triggerRectは既にviewport基準（getBoundingClientRectの結果）
  // memoRectは絶対座標（scroll込み）なのでviewport基準に変換
  const memoX = memoRect.x - scroll.x;
  const memoY = memoRect.y - scroll.y;

  // 中心点
  const triggerCenter = {
    x: triggerRect.left + triggerRect.width / 2,
    y: triggerRect.top + triggerRect.height / 2,
  };

  const memoCenter = {
    x: memoX + memoRect.width / 2,
    y: memoY + memoRect.height / 2,
  };

  // 距離計算
  const dx = memoCenter.x - triggerCenter.x;
  const dy = memoCenter.y - triggerCenter.y;
  const distance = Math.round(Math.sqrt(dx * dx + dy * dy));

  // テキストの位置（線の中点）
  const textX = (triggerCenter.x + memoCenter.x) / 2;
  const textY = (triggerCenter.y + memoCenter.y) / 2;

  // 原点（トリガー要素）のマーク
  const triggerPointRadius = 4;
  
  // 終点（メモ）のマーク
  const memoPointRadius = 4;

  return (
    <svg style={svgStyle}>
      <defs>
        <marker
          id="arrowhead-end"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" />
        </marker>
        <marker
          id="arrowhead-start"
          markerWidth="10"
          markerHeight="7"
          refX="1"
          refY="3.5"
          orient="auto"
        >
          <polygon points="10 0, 0 3.5, 10 7" fill="#4B5563" />
        </marker>
      </defs>

      {/* 線 */}
      <line
        x1={triggerCenter.x}
        y1={triggerCenter.y}
        x2={memoCenter.x}
        y2={memoCenter.y}
        stroke="#4B5563"
        strokeWidth="2"
        strokeDasharray="5,5"
        markerEnd="url(#arrowhead-end)"
        markerStart="url(#arrowhead-start)"
      />

      {/* トリガー要素のハイライト枠（オプション） */}
      <rect
        x={triggerRect.left}
        y={triggerRect.top}
        width={triggerRect.width}
        height={triggerRect.height}
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeOpacity="0.5"
        rx="2"
      />

      {/* 距離テキストの背景 */}
      <rect
        x={textX - 25}
        y={textY - 12}
        width="50"
        height="24"
        rx="12"
        fill="#1F2937"
        opacity="0.9"
      />

      {/* 距離テキスト */}
      <text
        x={textX}
        y={textY}
        dy="0.35em"
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {distance}px
      </text>
    </svg>
  );
};
