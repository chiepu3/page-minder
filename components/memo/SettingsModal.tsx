// =============================================================================
// PageMinder - Settings Modal Component
// =============================================================================

import { useState, useEffect } from 'react';
import { Memo, UrlPattern, GlobalSettings } from '@/types';
import { IconDelete, IconAdd, IconWarning, IconNote } from '@/components/icons';
import { isValidUrlPattern, matchUrlPattern } from '@/lib/url-matcher';
import { THEMES } from '@/lib/constants';

interface SettingsModalProps {
  memo: Memo;
  settings: GlobalSettings;
  onUpdate: (memo: Memo) => void;
  onClose: () => void;
}

/**
 * ページ内設定モーダル
 */
export function SettingsModal({ memo, settings, onUpdate, onClose }: SettingsModalProps) {
  const [title, setTitle] = useState(memo.title || '');
  const [urlPatterns, setUrlPatterns] = useState<UrlPattern[]>(memo.urlPatterns);
  const [currentUrl, setCurrentUrl] = useState('');

  // テーマ取得
  const theme = THEMES[settings.theme === 'system' ? 'dark' : settings.theme];

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handleSave = () => {
    onUpdate({
      ...memo,
      title,
      urlPatterns,
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

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
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

        <div style={bodyStyle}>
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
