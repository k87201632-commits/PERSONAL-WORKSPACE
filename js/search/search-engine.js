// ==========================================================================
// PERSONAL-WORKSPACE — SEARCH ENGINE (SEARCH-ENGINE.JS)
// Lightweight ranking, fuzzy subsequence match, grouping.
// ==========================================================================

(function () {
    'use strict';

    const MAX_TOTAL = 15;
    const MAX_PER_GROUP = 5;

    const GROUP_ORDER = [
        'page', 'task', 'subject', 'schedule',
        'music-local', 'music-spotify', 'game', 'achievement',
    ];

    function _norm(s) {
        return (s || '').toLowerCase().trim();
    }

    function _haystack(item) {
        return [
            item.title,
            item.description,
            ...(item.keywords || []),
        ].join(' ').toLowerCase();
    }

    /** Simple subsequence fuzzy — "inf" matches "informatika" */
    function _subsequence(hay, needle) {
        if (!needle) return true;
        let i = 0;
        for (let c = 0; c < hay.length && i < needle.length; c++) {
            if (hay[c] === needle[i]) i++;
        }
        return i === needle.length;
    }

    function _score(item, query) {
        const q = _norm(query);
        if (!q) return 0;

        const title = _norm(item.title);
        const hay = _haystack(item);
        let score = 0;

        if (title === q) score = 100;
        else if (title.startsWith(q)) score = 85;
        else if (title.includes(q)) score = 70;
        else if (_subsequence(title, q)) score = 50;

        if (score === 0) {
            if (hay.includes(q)) score = 35;
            else if (_subsequence(hay, q)) score = 20;
            else if (q.split(/\s+/).every(w => hay.includes(w))) score = 25;
        }

        return score;
    }

    function search(items, query, options = {}) {
        const q = _norm(query);
        const maxTotal = options.maxTotal ?? MAX_TOTAL;
        const maxPerGroup = options.maxPerGroup ?? MAX_PER_GROUP;

        if (!q) return { groups: [], total: 0, hasMore: false };

        const scored = items
            .map(item => ({ item, score: _score(item, q) }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score);

        const byType = {};
        scored.forEach(({ item, score }) => {
            if (!byType[item.type]) byType[item.type] = [];
            byType[item.type].push({ item, score });
        });

        const groups = [];
        let total = 0;
        let hasMore = false;

        GROUP_ORDER.forEach(type => {
            if (!byType[type]?.length) return;
            const entries = byType[type];
            const limited = entries.slice(0, maxPerGroup);
            if (entries.length > maxPerGroup) hasMore = true;

            const groupItems = [];
            limited.forEach(({ item }) => {
                if (total >= maxTotal) {
                    hasMore = true;
                    return;
                }
                groupItems.push(item);
                total++;
            });

            if (groupItems.length) {
                groups.push({ type, items: groupItems, hiddenCount: Math.max(0, entries.length - groupItems.length) });
            }
        });

        return { groups, total, hasMore };
    }

    window.searchEngine = { search, MAX_TOTAL, MAX_PER_GROUP };
})();
