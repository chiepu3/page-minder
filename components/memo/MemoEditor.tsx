import { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, Decoration, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { EditorState, EditorSelection, Range } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput, bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import type { GlobalSettings } from '@/types';

interface MemoEditorProps {
  content: string;
  settings: GlobalSettings;
  onSave: (content: string) => void;
  onCancel: () => void;
  onChange?: (content: string) => void;
}

const LINK_REGEX = /\[([^\]]*)\]\(([^)]*)\)/g;

class LinkChipWidget extends WidgetType {
  constructor(readonly text: string, readonly url: string, readonly isDark: boolean) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-link-chip';
    span.textContent = this.text;
    span.title = this.url;
    span.style.cssText = [
      'display: inline-block',
      'padding: 1px 6px',
      'border-radius: 4px',
      'cursor: pointer',
      'font-size: inherit',
      'line-height: 1.4',
      'vertical-align: baseline',
      this.isDark
        ? 'background: rgba(255,255,255,0.1); color: #d1c4e9;'
        : 'background: rgba(0,0,0,0.08); color: #7c3aed;',
      'text-decoration: none',
      'white-space: nowrap',
    ].join(';');

    span.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        window.open(this.url, '_blank', 'noopener');
      }
    });

    return span;
  }

  ignoreEvent(event: Event): boolean {
    // Ctrl+click はウィジェット側で処理（CodeMirrorにカーソル移動させない）
    if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey)) {
      return true;
    }
    // 通常クリックはCodeMirrorに処理させてチップを解除し編集モードに入る
    return false;
  }
}

function linkChipDecorations(view: EditorView, isDark: boolean): Range<Decoration>[] {
  const doc = view.state.doc.toString();
  const pos = view.state.selection.main.head;
  const decorations: Range<Decoration>[] = [];

  let match: RegExpExecArray | null;
  const regex = new RegExp(LINK_REGEX.source, 'g');
  while ((match = regex.exec(doc)) !== null) {
    const from = match.index;
    const to = match.index + match[0].length;

    if (pos >= from && pos <= to) continue;

    decorations.push(
      Decoration.replace({
        widget: new LinkChipWidget(match[1], match[2], isDark),
      }).range(from, to)
    );
  }

  return decorations;
}

function linkChipViewPlugin(isDark: boolean) {
  return ViewPlugin.define((view) => ({
    decorations: Decoration.set(linkChipDecorations(view, isDark), true),
    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = Decoration.set(linkChipDecorations(update.view, isDark), true);
      }
    },
  }), {
    decorations: (v) => v.decorations,
  });
}

const baseTheme = EditorView.theme({
  '&': {
    fontSize: 'inherit',
    backgroundColor: 'transparent',
    color: 'inherit',
    height: '100%',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    overflow: 'auto',
    lineHeight: '1.5',
  },
  '.cm-content': {
    padding: '0',
    caretColor: 'inherit',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-editor': {
    outline: 'none',
    border: 'none',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-placeholder': {
    color: 'rgba(0,0,0,0.35)',
    fontStyle: 'italic',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    background: 'rgba(179, 157, 219, 0.3) !important',
  },
});

const darkTheme = EditorView.theme({
  '.cm-placeholder': {
    color: 'rgba(255,255,255,0.35)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    background: 'rgba(179, 157, 219, 0.4) !important',
  },
});

export function MemoEditor({ content, settings, onSave, onCancel, onChange }: MemoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onSaveRef = useRef(onSave);
  const onCancelRef = useRef(onCancel);
  const onChangeRef = useRef(onChange);

  onSaveRef.current = onSave;
  onCancelRef.current = onCancel;
  onChangeRef.current = onChange;

  const stopPropagationPlugin = useCallback(() => {
    return EditorView.domEventHandlers({
      keydown(event) {
        event.stopPropagation();
        return false;
      },
      keyup(event) {
        event.stopPropagation();
        return false;
      },
      wheel(event) {
        // エディタにフォーカスがあるときはページのスクロールをブロック
        event.stopPropagation();
        return false;
      },
    });
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    const isDarkMode = settings.theme === 'dark';

    // Markdown書式ショートカット（選択範囲またはカーソル位置に適用）
    function wrapSelection(view: EditorView, before: string, after: string) {
      const { state } = view;
      const changes = state.changeByRange((range) => {
        if (range.empty) {
          // カーソル位置に挿入してカーソルを中央に
          const insert = before + after;
          const cursorPos = range.from + before.length;
          return {
            changes: { from: range.from, insert },
            range: EditorSelection.cursor(cursorPos),
          };
        }
        const selectedText = state.sliceDoc(range.from, range.to);
        const insert = before + selectedText + after;
        return {
          changes: { from: range.from, to: range.to, insert },
          range: EditorSelection.range(range.from + before.length, range.from + before.length + selectedText.length),
        };
      });
      view.dispatch(changes);
      return true;
    }

    function wrapLine(view: EditorView, prefix: string) {
      const { state } = view;
      const line = state.doc.lineAt(state.selection.main.head);
      const alreadyHas = line.text.startsWith(prefix);
      const changes = alreadyHas
        ? { from: line.from, to: line.from + prefix.length, insert: '' }
        : { from: line.from, insert: prefix };
      view.dispatch({ changes });
      return true;
    }

    // カスタムキーマップをdefaultKeymapより先に置くことで優先処理させる
    const keymaps = keymap.of([
      {
        key: 'Mod-Enter',
        run: (view) => {
          onSaveRef.current(view.state.doc.toString());
          return true;
        },
      },
      {
        key: 'Shift-Enter',
        run: (view) => {
          onSaveRef.current(view.state.doc.toString());
          return true;
        },
      },
      {
        key: 'Escape',
        run: () => {
          onCancelRef.current();
          return true;
        },
      },
      { key: 'Mod-b', run: (v) => wrapSelection(v, '**', '**') },
      { key: 'Mod-i', run: (v) => wrapSelection(v, '*', '*') },
      { key: 'Mod-`', run: (v) => wrapSelection(v, '`', '`') },
      { key: 'Mod-Shift-x', run: (v) => wrapSelection(v, '~~', '~~') },
      { key: 'Mod-Shift-7', run: (v) => wrapLine(v, '1. ') },
      { key: 'Mod-Shift-8', run: (v) => wrapLine(v, '- ') },
      { key: 'Mod-Shift-9', run: (v) => wrapLine(v, '> ') },
      ...defaultKeymap,
      ...historyKeymap,
    ]);

    const state = EditorState.create({
      doc: content,
      extensions: [
        keymaps,
        history(),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        baseTheme,
        isDarkMode ? oneDark : [],
        isDarkMode ? darkTheme : [],
        linkChipViewPlugin(isDarkMode),
        stopPropagationPlugin(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
        indentOnInput(),
        bracketMatching(),
        EditorState.tabSize.of(2),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    view.focus();
    view.dispatch({
      selection: { anchor: view.state.doc.length },
    });

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== content) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: content },
      });
    }
  }, [content]);

  return <div ref={editorRef} style={{ width: '100%', height: '100%', minHeight: '100%' }} />;
}
