// =============================================================================
// PageMinder - Settings Modal Component
// =============================================================================

import { useState, useEffect } from 'react';
import { Memo, UrlPattern, GlobalSettings, ActivationConfig, HideCondition, ActivationTrigger, PositionMode } from '@/types';
import { IconDelete, IconAdd, IconWarning, IconNote } from '@/components/icons';
import { isValidUrlPattern, matchUrlPattern } from '@/lib/url-matcher';
import { THEMES } from '@/lib/constants';
import { ElementPicker } from './ElementPicker';

interface SettingsModalProps {
  memo: Memo;
  settings: GlobalSettings;
  onUpdate: (memo: Memo) => void;
  onClose: () => void;
  onStartElementPicker?: () => void;
  initialTab?: SettingsTab;
  onMount?: () => void;
}

type SettingsTab = 'general' | 'activation';

// デフォルトのアクティブ化設定
const DEFAULT_ACTIVATION: ActivationConfig = {
  enabled: false,
  trigger: 'hover',
  selector: '',
  delay: 500,
  positionMode: 'near-element',
  offsetX: 10,
  offsetY: 10,
  highlightElement: true,
  highlightColor: 'rgba(255, 193, 7, 0.3)',
  hideCondition: 'trigger-end',
  hideDelay: 5000,
  clickStopPropagation: true,
};

/**
 * ページ内設定モーダル
 */
export function SettingsModal({ memo, settings, onUpdate, onClose, onStartElementPicker, initialTab = 'general', onMount }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [title, setTitle] = useState(memo.title || '');
  const [urlPatterns, setUrlPatterns] = useState<UrlPattern[]>(memo.urlPatterns);
  const [activation, setActivation] = useState<ActivationConfig>(memo.activation ?? DEFAULT_ACTIVATION);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showElementPicker, setShowElementPicker] = useState(false);

  // テーマ取得
  const theme = THEMES[settings.theme === 'system' ? 'dark' : settings.theme];

  useEffect(() => {
    setCurrentUrl(window.location.href);
    if (onMount) {
      onMount();
    }
  }, [onMount]);

  const handleSave = () => {
    onUpdate({
      ...memo,
      title,
      urlPatterns,
      activation,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const addPattern = () => {
    const newPattern: UrlPattern = {
      id: crypto.randomUUID(),
      type: 'wildcard',
      pattern: window.location.href,
      description: '',
    };
    setUrlPatterns([...urlPatterns, newPattern]);
  };

  const updatePattern = (id: string, updates: Partial<UrlPattern>) => {
    setUrlPatterns(urlPatterns.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePattern = (id: string) => {
    if (urlPatterns.length > 1) {
      setUrlPatterns(urlPatterns.filter(p => p.id !== id));
    }
  };

  // スタイル
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: settings.theme === 'light' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000001,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const modalStyle: React.CSSProperties = {
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '85vh',
    backgroundColor: theme.bg,
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${theme.border}`,
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.bg} 100%)`,
    borderBottom: `1px solid ${theme.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const bodyStyle: React.CSSProperties = {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px 20px',
    background: `linear-gradient(135deg, ${theme.surface} 0%, ${theme.bg} 100%)`,
    borderTop: `1px solid ${theme.border}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: theme.textSecondary,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.surface,
    color: theme.text,
    fontSize: '14px',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  // ElementPicker表示中はピッカーだけを表示
  if (showElementPicker) {
    return (
      <ElementPicker
        onSelect={(selector) => {
          setActivation({ ...activation, selector });
          setShowElementPicker(false);
        }}
        onCancel={() => setShowElementPicker(false)}
      />
    );
  }

  return (
    <div 
      style={overlayStyle} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: settings.theme === 'light' ? '#e8d6ff' : 'rgba(179, 157, 219, 0.15)' }}>
              <IconNote size={20} color={theme.accent} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: theme.text, margin: 0 }}>メモの設定</h2>
          </div>
          <button 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '24px', color: theme.textSecondary }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* タブナビゲーション */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${theme.border}`,
          padding: '0 20px',
          backgroundColor: theme.surface,
        }}>
          {(['general', 'activation'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : '2px solid transparent',
                color: activeTab === tab ? theme.accent : theme.textSecondary,
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'general' ? '基本設定' : 'アクティブ化'}
            </button>
          ))}
        </div>

        <div style={bodyStyle}>
          {activeTab === 'general' ? (
            <>
              {/* タイトル設定 */}
              <div style={sectionStyle}>
                <label style={labelStyle}>メモのタイトル</label>
                <input
                  style={inputStyle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="タイトルを入力..."
                  onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
                />
              </div>

          {/* 出現条件設定 */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={labelStyle}>表示するページ (URLパターン)</label>
              <button
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', 
                  color: theme.accent, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 
                }}
                onClick={addPattern}
              >
                <IconAdd size={14} color={theme.accent} /> 追加
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {urlPatterns.map((pattern) => {
                const isValid = isValidUrlPattern(pattern);
                const isMatch = matchUrlPattern(currentUrl, pattern);
                
                return (
                  <div key={pattern.id} style={{ 
                    padding: '12px', borderRadius: '10px', backgroundColor: theme.surface, 
                    border: '2px solid', borderColor: isValid ? (isMatch ? theme.success : theme.border) : theme.danger
                  }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <select
                        style={{ 
                          ...inputStyle, 
                          width: 'auto', 
                          padding: '6px 10px',
                          cursor: 'pointer'
                        }}
                        value={pattern.type}
                        onChange={(e) => updatePattern(pattern.id, { type: e.target.value as any })}
                      >
                        <option value="wildcard">Wildcard</option>
                        <option value="regex">Regex</option>
                      </select>
                      <input
                        style={inputStyle}
                        value={pattern.pattern}
                        onChange={(e) => updatePattern(pattern.id, { pattern: e.target.value })}
                        placeholder="https://example.com/*"
                        onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
                      />
                      <button
                        style={{ 
                          ...buttonStyle, 
                          padding: '6px', 
                          backgroundColor: 'transparent', 
                          opacity: urlPatterns.length <= 1 ? 0.3 : 1,
                          cursor: urlPatterns.length <= 1 ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => removePattern(pattern.id)}
                        disabled={urlPatterns.length <= 1}
                      >
                        <IconDelete size={18} color={urlPatterns.length <= 1 ? theme.textSecondary : theme.danger} />
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                      {!isValid ? (
                        <div style={{ color: theme.danger, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IconWarning size={12} color={theme.danger} /> 無効なパターンです
                        </div>
                      ) : isMatch ? (
                        <div style={{ color: theme.success, fontWeight: 600 }}>このページにマッチしています</div>
                      ) : (
                        <div style={{ color: theme.textSecondary }}>このページにはマッチしません</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            </>
          ) : (
            /* アクティブ化タブ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 有効/無効トグル */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ ...labelStyle, flex: 1 }}>アクティブ化を有効にする</label>
                <button
                  onClick={() => setActivation({ ...activation, enabled: !activation.enabled })}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '13px',
                    border: 'none',
                    backgroundColor: activation.enabled ? theme.accent : theme.border,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: '2px',
                    left: activation.enabled ? '24px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>

              {activation.enabled && (
                <>
                  {/* トリガー種別 */}
                  <div style={sectionStyle}>
                    <label style={labelStyle}>トリガー</label>
                    <select
                      value={activation.trigger}
                      onChange={(e) => setActivation({ ...activation, trigger: e.target.value as ActivationTrigger })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="hover">ホバー（マウスを乗せた時）</option>
                      <option value="click">クリック</option>
                      <option value="focus">フォーカス</option>
                    </select>
                  </div>

                  {/* セレクタ設定 */}
                  <div style={sectionStyle}>
                    <label style={labelStyle}>対象要素のセレクタ</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                        value={activation.selector}
                        onChange={(e) => setActivation({ ...activation, selector: e.target.value })}
                        placeholder="例: #submit-button, .form-input"
                        onFocus={(e) => (e.currentTarget.style.borderColor = theme.accent)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = theme.border)}
                      />
                      <button
                        onClick={() => {
                          if (onStartElementPicker) {
                            onStartElementPicker();
                          }
                        }}
                        style={{
                          ...buttonStyle,
                          backgroundColor: theme.surface,
                          border: `1px solid ${theme.border}`,
                          color: theme.text,
                        }}
                      >
                        🎯 要素を選択
                      </button>
                    </div>
                  </div>

                  {/* hover時の遅延 */}
                  {activation.trigger === 'hover' && (
                    <div style={sectionStyle}>
                      <label style={labelStyle}>表示遅延 (ms)</label>
                      <input
                        type="number"
                        value={activation.delay ?? 500}
                        onChange={(e) => setActivation({ ...activation, delay: parseInt(e.target.value) || 500 })}
                        style={{ ...inputStyle, width: '120px' }}
                        min={0}
                        step={100}
                      />
                    </div>
                  )}

                  {/* click時のイベント伝播停止 */}
                  {activation.trigger === 'click' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={activation.clickStopPropagation ?? true}
                        onChange={(e) => setActivation({ ...activation, clickStopPropagation: e.target.checked })}
                        id="stopPropagation"
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="stopPropagation" style={{ fontSize: '14px', color: theme.text, cursor: 'pointer' }}>
                        初回クリック時にイベントを止める（警告として表示）
                      </label>
                    </div>
                  )}

                  {/* 非表示条件 */}
                  <div style={sectionStyle}>
                    <label style={labelStyle}>非表示条件</label>
                    {activation.trigger === 'click' && (
                      <div style={{ fontSize: '11px', color: theme.textSecondary, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconNote size={12} /> クリックトリガーの場合、対象要素をもう一度クリックすると常に非表示になります（トグル動作）。
                        さらに以下の条件でも非表示にできます：
                      </div>
                    )}
                    <select
                      value={activation.hideCondition}
                      onChange={(e) => setActivation({ ...activation, hideCondition: e.target.value as HideCondition })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="trigger-end">
                        {activation.trigger === 'hover' ? 'ホバー解除時' :
                         activation.trigger === 'focus' ? 'フォーカスが外れた時' :
                         activation.trigger === 'click' ? '再クリックのみ（トグル）' :
                         'トリガー解除時'}
                      </option>
                      <option value="manual">手動で閉じるまで表示（×ボタン）</option>
                      <option value="timeout">
                        {activation.trigger === 'hover' ? '一定時間後に自動非表示（ホバー中は停止）' : '一定時間後に自動非表示'}
                      </option>
                      <option value="click-outside">
                        {activation.trigger === 'click' ? 'メモ外をクリック（推奨）' : 'メモ外をクリック'}
                      </option>
                    </select>
                  </div>

                  {/* timeout時の遅延 */}
                  {activation.hideCondition === 'timeout' && (
                    <div style={sectionStyle}>
                      <label style={labelStyle}>自動非表示までの時間 (ms)</label>
                      <input
                        type="number"
                        value={activation.hideDelay ?? 5000}
                        onChange={(e) => setActivation({ ...activation, hideDelay: parseInt(e.target.value) || 5000 })}
                        style={{ ...inputStyle, width: '120px' }}
                        min={1000}
                        step={1000}
                      />
                    </div>
                  )}

                  {/* 表示位置モード */}
                  <div style={sectionStyle}>
                    <label style={labelStyle}>表示位置</label>
                    <select
                      value={activation.positionMode}
                      onChange={(e) => setActivation({ ...activation, positionMode: e.target.value as PositionMode })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="near-element">トリガー要素の近く</option>
                      <option value="fixed-position">メモの固定位置</option>
                    </select>
                  </div>

                  {/* 要素ハイライト */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={activation.highlightElement ?? true}
                      onChange={(e) => setActivation({ ...activation, highlightElement: e.target.checked })}
                      id="highlight"
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="highlight" style={{ fontSize: '14px', color: theme.text, cursor: 'pointer' }}>
                      トリガー時に要素をハイライト
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div style={footerStyle}>
          <button
            style={{ 
              ...buttonStyle, 
              backgroundColor: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary 
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.surface;
              e.currentTarget.style.color = theme.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.textSecondary;
            }}
          >
            キャンセル
          </button>
          <button
            style={{ 
              ...buttonStyle, 
              background: settings.theme === 'light' ? theme.accent : `linear-gradient(135deg, ${theme.accent} 0%, #9575cd 100%)`,
              color: settings.theme === 'light' ? '#fff' : '#1a1a2e' 
            }}
            onClick={handleSave}
            onMouseEnter={(e) => {
              if (settings.theme === 'dark') {
                e.currentTarget.style.background = `linear-gradient(135deg, ${theme.accentHover} 0%, ${theme.accent} 100%)`;
              } else {
                e.currentTarget.style.backgroundColor = theme.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              if (settings.theme === 'dark') {
                e.currentTarget.style.background = `linear-gradient(135deg, ${theme.accent} 0%, #9575cd 100%)`;
              } else {
                e.currentTarget.style.backgroundColor = theme.accent;
              }
            }}
          >
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
}
