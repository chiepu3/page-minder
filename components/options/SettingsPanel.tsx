// =============================================================================
// PageMinder - Settings Panel Component
// =============================================================================

import { useState, useEffect } from 'react';
import type { GlobalSettings, LogLevel } from '@/types';
import { COLOR_PALETTE } from '@/lib/constants';

interface SettingsPanelProps {
    settings: GlobalSettings;
    onSave: (settings: GlobalSettings) => void;
}

/**
 * グローバル設定の編集パネル
 */
export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
    const [localSettings, setLocalSettings] = useState<GlobalSettings>(settings);
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);

    // 外部からのsettings変更を反映
    useEffect(() => {
        setLocalSettings(settings);
        setHasChanges(false);
    }, [settings]);

    // 変更を検知
    const updateSetting = <K extends keyof GlobalSettings>(
        key: K,
        value: GlobalSettings[K]
    ) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSaved(false);
    };

    // 保存
    const handleSave = () => {
        onSave(localSettings);
        setHasChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="settings-panel">
            {/* 表示設定 */}
            <section className="settings-section">
                <h3 className="settings-section-title">表示設定</h3>

                {/* テーマ */}
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">テーマ</span>
                        <span className="settings-label-description">
                            ポップアップとOptions Pageの配色
                        </span>
                    </div>
                    <div className="settings-input">
                        <select
                            className="settings-select"
                            value={localSettings.theme}
                            onChange={(e) =>
                                updateSetting('theme', e.target.value as 'light' | 'dark' | 'system')
                            }
                        >
                            <option value="dark">ダーク</option>
                            <option value="light">ライト</option>
                            <option value="system">システム設定に従う</option>
                        </select>
                    </div>
                </div>

                {/* デフォルトフォントサイズ */}
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">デフォルトフォントサイズ</span>
                        <span className="settings-label-description">
                            新規メモ作成時のフォントサイズ (px)
                        </span>
                    </div>
                    <div className="settings-input">
                        <input
                            type="number"
                            className="settings-number"
                            value={localSettings.defaultFontSize}
                            min={10}
                            max={24}
                            onChange={(e) =>
                                updateSetting('defaultFontSize', parseInt(e.target.value, 10) || 14)
                            }
                        />
                    </div>
                </div>

                {/* デフォルト背景色 */}
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">デフォルト背景色</span>
                        <span className="settings-label-description">
                            新規メモ作成時の背景色
                        </span>
                    </div>
                    <div className="settings-input">
                        <div className="settings-color">
                            <input
                                type="color"
                                className="settings-color-picker"
                                value={localSettings.defaultBackgroundColor}
                                onChange={(e) =>
                                    updateSetting('defaultBackgroundColor', e.target.value)
                                }
                            />
                            <span className="settings-color-value">
                                {localSettings.defaultBackgroundColor}
                            </span>
                        </div>
                    </div>
                </div>

                {/* デフォルト文字色 */}
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">デフォルト文字色</span>
                        <span className="settings-label-description">
                            新規メモ作成時の文字色
                        </span>
                    </div>
                    <div className="settings-input">
                        <div className="settings-color">
                            <input
                                type="color"
                                className="settings-color-picker"
                                value={localSettings.defaultTextColor}
                                onChange={(e) =>
                                    updateSetting('defaultTextColor', e.target.value)
                                }
                            />
                            <span className="settings-color-value">
                                {localSettings.defaultTextColor}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* アクティブ化設定 */}
            <section className="settings-section">
                <h3 className="settings-section-title">アクティブ化設定</h3>

                {/* 表示遅延 */}
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">表示遅延</span>
                        <span className="settings-label-description">
                            hover時、メモが表示されるまでの時間 (ms)
                        </span>
                    </div>
                    <div className="settings-input">
                        <input
                            type="number"
                            className="settings-number"
                            value={localSettings.activationShowDelay}
                            min={0}
                            max={2000}
                            step={100}
                            onChange={(e) =>
                                updateSetting(
                                    'activationShowDelay',
                                    parseInt(e.target.value, 10) || 500
                                )
                            }
                        />
                    </div>
                </div>

                {/* 非表示猶予時間 */}
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">非表示猶予時間</span>
                        <span className="settings-label-description">
                            トリガー解除後、メモが消えるまでの猶予時間 (ms)
                        </span>
                    </div>
                    <div className="settings-input">
                        <input
                            type="number"
                            className="settings-number"
                            value={localSettings.activationHideGracePeriod}
                            min={0}
                            max={2000}
                            step={100}
                            onChange={(e) =>
                                updateSetting(
                                    'activationHideGracePeriod',
                                    parseInt(e.target.value, 10) || 300
                                )
                            }
                        />
                    </div>
                </div>
            </section>

            {/* 開発者向け設定 */}
            <section className="settings-section">
                <h3 className="settings-section-title">開発者向け設定</h3>

                {/* ログレベル */}
                <div className="settings-row">
                    <div className="settings-label">
                        <span className="settings-label-title">ログレベル</span>
                        <span className="settings-label-description">
                            コンソールに出力するログの詳細度
                        </span>
                    </div>
                    <div className="settings-input">
                        <select
                            className="settings-select"
                            value={localSettings.logLevel}
                            onChange={(e) =>
                                updateSetting('logLevel', e.target.value as LogLevel)
                            }
                        >
                            <option value="debug">Debug (全て)</option>
                            <option value="info">Info</option>
                            <option value="warn">Warn</option>
                            <option value="error">Error (エラーのみ)</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* 保存ボタン */}
            <div className="settings-save">
                <button
                    className="settings-save-button"
                    onClick={handleSave}
                    disabled={!hasChanges}
                >
                    <span className="material-symbols-outlined">
                        {saved ? 'check' : 'save'}
                    </span>
                    <span>{saved ? '保存しました' : '設定を保存'}</span>
                </button>
            </div>
        </div>
    );
}
