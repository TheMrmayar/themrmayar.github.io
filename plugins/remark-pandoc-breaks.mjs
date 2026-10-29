// Quarto renders Markdown with Pandoc. Pandoc treats a backslash at the end of
// a line as a hard line break ("escaped_line_breaks"); Astro's CommonMark
// parser treats a lone trailing backslash as literal text and would print it.
//
// cv.qmd uses that Pandoc syntax in two places:
//   - a paragraph that contains only "\"           (vertical spacing)
//   - a heading ending in "\" ("Publications in refereed journals\")
//
// To keep the source file byte-for-byte unchanged while NOT showing stray
// backslashes, this plugin applies the Pandoc meaning to exactly those two
// patterns. No visible text is altered.

function isBackslashOnlyParagraph(node) {
  return (
    node.type === 'paragraph' &&
    node.children.length === 1 &&
    node.children[0].type === 'text' &&
    node.children[0].value.trim() === '\\'
  );
}

export default function remarkPandocBreaks() {
  return (tree) => {
    for (const node of tree.children ?? []) {
      if (isBackslashOnlyParagraph(node)) {
        // Becomes <p class="md-spacer" aria-hidden="true"></p>
        node.children = [];
        node.data = {
          hName: 'p',
          hProperties: { className: ['md-spacer'], ariaHidden: 'true' },
        };
        continue;
      }

      if (node.type === 'heading' && node.children.length > 0) {
        const last = node.children[node.children.length - 1];
        if (last.type === 'text' && last.value.endsWith('\\')) {
          last.value = last.value.slice(0, -1);
          if (last.value === '') node.children.pop();
        }
      }
    }
  };
}
