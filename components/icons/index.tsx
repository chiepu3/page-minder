// =============================================================================
// PageMinder - Icon Components (Official Material Symbols SVGs)
// =============================================================================

import { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

// Material Symbols uses viewBox="0 -960 960 960"
const VIEWBOX = "0 -960 960 960";

// -----------------------------------------------------------------------------
// Icons from official Material Symbols
// -----------------------------------------------------------------------------

/** 付箋アイコン (sticky_note_2) */
export function IconStickyNote({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M200-200h360v-200h200v-360H200v560Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v400L600-120H200Zm80-280v-80h200v80H280Zm0-160v-80h400v80H280Zm-80 360v-560 560Z"/>
    </svg>
  );
}

/** ピンアイコン (keep) */
export function IconPin({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z"/>
    </svg>
  );
}

/** ピン解除アイコン (keep_off) */
export function IconPinOff({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M680-840v80h-40v327l-80-80v-247H400v87l-87-87-33-33v-47h400ZM480-40l-40-40v-240H240v-80l80-80v-46L56-792l56-56 736 736-58 56-264-264h-6v240l-40 40ZM354-400h92l-44-44-2-2-46 46Zm126-193Zm-78 149Z"/>
    </svg>
  );
}

/** 編集アイコン (edit) */
export function IconEdit({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
    </svg>
  );
}

/** コピーアイコン (file_copy) */
export function IconCopy({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M760-200H320q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200ZM560-640v-200H320v560h440v-360H560ZM160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-800v200-200 560-560Z"/>
    </svg>
  );
}

/** パレットアイコン (palette) */
export function IconPalette({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-220 40q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120-160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm200 0q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120 160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"/>
    </svg>
  );
}

/** 削除アイコン (delete) */
export function IconDelete({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
    </svg>
  );
}

/** 警告アイコン (warning) */
export function IconWarning({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/>
    </svg>
  );
}

/** 最小化アイコン (remove/minus) - シンプルな横線 */
export function IconMinimize({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M200-440v-80h560v80H200Z"/>
    </svg>
  );
}

/** 追加アイコン (add) */
export function IconAdd({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/>
    </svg>
  );
}

/** 設定アイコン (settings) */
export function IconSettings({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-42-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/>
    </svg>
  );
}

/** 受信箱アイコン (inbox) - 空状態用 */
export function IconInbox({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-120H640q-30 38-71.5 59T480-240q-47 0-88.5-21T320-320H200v120Zm280-120q38 0 69-22t43-58h168v-360H200v360h168q12 36 43 58t69 22ZM200-200h560-560Z"/>
    </svg>
  );
}

/** 矢印アイコン (arrow_forward) */
export function IconArrowForward({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="m560-240-56-58 142-142H160v-80h486L504-662l56-58 240 240-240 240Z"/>
    </svg>
  );
}

/** ノートアイコン (note) */
export function IconNote({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/>
    </svg>
  );
}
/** フォントサイズアイコン (format_size) */
export function IconFormatSize({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M560-160v-520H360v-120h520v120H680v520H560Zm-360 0v-320H80v-120h360v120H320v320H200Z"/>
    </svg>
  );
}
/** ダークモードアイコン (dark_mode) */
export function IconDarkMode({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65 74.5T440-480q0 65 24 110.5t65 74.5q-13 2-26.5 3t-27.5 1Zm0-80q56 0 105.5-24t80.5-65q-71-11-123.5-61t-52.5-130q0-80 52.5-130T666-771q-31-10-63-14.5t-63-4.5q-117 0-198.5 81.5T260-510q0 117 81.5 198.5T540-230Z"/>
    </svg>
  );
}

/** ライトモードアイコン (light_mode) */
export function IconLightMode({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={VIEWBOX} fill={color} style={style}>
      <path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-101 57-57 101 101-57 57Zm548 548-101-101 57-57 101 101-57 57ZM155-256l101-101 57 57-101 101-57-57Zm548-548 101-101 57 57-101 101-57-57Z"/>
    </svg>
  );
}
