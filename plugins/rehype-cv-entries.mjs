// Presentation-only helper for the CV.
//
// Entries in cv.qmd are plain paragraphs that begin with a date, e.g.
//   2026 Fall Quarter **Lin103B ...** *Teaching Assistant*, University ...
//
// This plugin wraps the leading date and the rest of the paragraph in two
// <span>s so CSS can lay the entry out as "date | details". It only wraps
// existing nodes: no text is added, removed, or changed, and the text content
// of the paragraph is identical before and after.

const DATE =
  /^\d{4}(?: - (?:\d{4}|Cont\.))?(?: (?:Winter|Spring|Summer|Fall) Quarter)?/;

function span(className, children) {
  return {
    type: 'element',
    tagName: 'span',
    properties: { className: [className] },
    children,
  };
}

export default function rehypeCvEntries() {
  return (tree) => {
    for (const node of tree.children ?? []) {
      if (node.type !== 'element' || node.tagName !== 'p') continue;

      const first = node.children?.[0];
      if (!first || first.type !== 'text') continue;

      const match = DATE.exec(first.value);
      if (!match) continue;

      const rest = first.value.slice(match[0].length);
      const bodyChildren = [];
      if (rest !== '') bodyChildren.push({ type: 'text', value: rest });
      bodyChildren.push(...node.children.slice(1));

      node.properties = { ...(node.properties ?? {}), className: ['cv-entry'] };
      node.children = [
        span('cv-date', [{ type: 'text', value: match[0] }]),
        span('cv-body', bodyChildren),
      ];
    }
  };
}
