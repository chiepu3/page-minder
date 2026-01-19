// =============================================================================
// PageMinder - Selector Generator Utility
// =============================================================================

/**
 * DOM要素からユニークなCSSセレクタを生成する
 * 優先順位: ID → data属性 → class → tag+nth-child
 */
export function generateSelector(element: Element): string {
    // body要素の場合
    if (element.tagName.toLowerCase() === 'body') {
        return 'body';
    }

    // html要素の場合
    if (element.tagName.toLowerCase() === 'html') {
        return 'html';
    }

    // IDがある場合は最優先
    if (element.id && isUniqueSelector(`#${element.id}`, element)) {
        return `#${element.id}`;
    }

    // data-testid, data-id などのdata属性をチェック
    const dataSelector = getDataAttributeSelector(element);
    if (dataSelector && isUniqueSelector(dataSelector, element)) {
        return dataSelector;
    }

    // ユニークなclassの組み合わせを探す
    const classSelector = getUniqueClassSelector(element);
    if (classSelector && isUniqueSelector(classSelector, element)) {
        return classSelector;
    }

    // 親要素からのパスを構築
    return buildPathSelector(element);
}

/**
 * 複数のセレクタ候補を優先度順で返す
 */
export function generateSelectorCandidates(element: Element): string[] {
    const candidates: string[] = [];
    const seen = new Set<string>();

    const addCandidate = (selector: string) => {
        if (selector && !seen.has(selector) && isUniqueSelector(selector, element)) {
            seen.add(selector);
            candidates.push(selector);
        }
    };

    // 1. IDセレクタ
    if (element.id) {
        addCandidate(`#${element.id}`);
    }

    // 2. data属性セレクタ
    const dataSelector = getDataAttributeSelector(element);
    if (dataSelector) {
        addCandidate(dataSelector);
    }

    // 3. ユニークなclassセレクタ
    const classSelector = getUniqueClassSelector(element);
    if (classSelector) {
        addCandidate(classSelector);
    }

    // 4. タグ + class
    const tagName = element.tagName.toLowerCase();
    if (element.classList.length > 0) {
        const tagClassSelector = `${tagName}.${Array.from(element.classList).join('.')}`;
        addCandidate(tagClassSelector);
    }

    // 5. パスセレクタ
    addCandidate(buildPathSelector(element));

    return candidates;
}

/**
 * セレクタの構文が有効かどうかを検証
 */
export function validateSelector(selector: string, doc: Document): boolean {
    if (!selector || selector.trim() === '') {
        return false;
    }

    try {
        doc.querySelector(selector);
        return true;
    } catch {
        return false;
    }
}

/**
 * セレクタの詳細度（specificity）を計算
 * 100: ID, 10: class/attr, 1: tag
 */
export function getSelectorSpecificity(selector: string): number {
    let specificity = 0;

    // IDの数をカウント (#)
    const idMatches = selector.match(/#[a-zA-Z_-][\w-]*/g);
    specificity += (idMatches?.length || 0) * 100;

    // classと属性の数をカウント (., [])
    const classMatches = selector.match(/\.[a-zA-Z_-][\w-]*/g);
    const attrMatches = selector.match(/\[[^\]]+\]/g);
    specificity += (classMatches?.length || 0) * 10;
    specificity += (attrMatches?.length || 0) * 10;

    // タグの数をカウント
    const tagMatches = selector.match(/(?:^|[\s>+~])([a-zA-Z][\w-]*)/g);
    specificity += (tagMatches?.length || 0) * 1;

    return specificity;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * セレクタが対象要素のみを選択するかチェック
 */
function isUniqueSelector(selector: string, element: Element): boolean {
    try {
        const doc = element.ownerDocument;
        const matches = doc.querySelectorAll(selector);
        return matches.length === 1 && matches[0] === element;
    } catch {
        return false;
    }
}

/**
 * data-* 属性からセレクタを生成
 */
function getDataAttributeSelector(element: Element): string | null {
    // 優先順位の高いdata属性
    const priorityAttrs = ['data-testid', 'data-id', 'data-key', 'data-name'];

    for (const attr of priorityAttrs) {
        const value = element.getAttribute(attr);
        if (value) {
            return `[${attr}="${escapeAttributeValue(value)}"]`;
        }
    }

    // その他のdata属性
    for (const attr of element.getAttributeNames()) {
        if (attr.startsWith('data-') && !priorityAttrs.includes(attr)) {
            const value = element.getAttribute(attr);
            if (value) {
                return `[${attr}="${escapeAttributeValue(value)}"]`;
            }
        }
    }

    return null;
}

/**
 * ユニークなclass組み合わせを見つける
 */
function getUniqueClassSelector(element: Element): string | null {
    const classes = Array.from(element.classList);
    if (classes.length === 0) return null;

    const tagName = element.tagName.toLowerCase();

    // 単一classでユニークな場合
    for (const cls of classes) {
        // 動的に見えるclassはスキップ
        if (isDynamicClassName(cls)) continue;

        const selector = `.${cls}`;
        if (isUniqueSelector(selector, element)) {
            return selector;
        }
    }

    // タグ + 単一class
    for (const cls of classes) {
        if (isDynamicClassName(cls)) continue;

        const selector = `${tagName}.${cls}`;
        if (isUniqueSelector(selector, element)) {
            return selector;
        }
    }

    // 複数classの組み合わせ
    const stableClasses = classes.filter(c => !isDynamicClassName(c));
    if (stableClasses.length >= 2) {
        const selector = `.${stableClasses.join('.')}`;
        if (isUniqueSelector(selector, element)) {
            return selector;
        }
    }

    return null;
}

/**
 * 動的に生成されたclass名かどうかを判定
 */
function isDynamicClassName(className: string): boolean {
    // ハッシュを含むclass名（CSSモジュール等）
    if (/[_-][a-f0-9]{5,}/i.test(className)) return true;
    // 数字で終わるclass名
    if (/\d{3,}$/.test(className)) return true;
    return false;
}

/**
 * 親要素からのパスセレクタを構築
 */
function buildPathSelector(element: Element): string {
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current.tagName.toLowerCase() !== 'html') {
        const tagName = current.tagName.toLowerCase();

        if (tagName === 'body') {
            path.unshift('body');
            break;
        }

        // IDがあればそこで終了
        if (current.id) {
            path.unshift(`#${current.id}`);
            break;
        }

        // nth-childを計算
        const parent: Element | null = current.parentElement;
        if (parent) {
            const currentElement = current; // クロージャ用に変数をキャプチャ
            const siblings = Array.from(parent.children).filter(
                (c: Element) => c.tagName === currentElement.tagName
            );
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                path.unshift(`${tagName}:nth-of-type(${index})`);
            } else {
                path.unshift(tagName);
            }
        } else {
            path.unshift(tagName);
        }

        current = parent;
    }

    return path.join(' > ');
}

/**
 * 属性値をエスケープ
 */
function escapeAttributeValue(value: string): string {
    return value.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
}
