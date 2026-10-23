import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const element = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });
const isElement = (node, tag) => node?.type === 'element' && node.tagName === tag;
const plainText = (node) => node.type === 'text' ? node.value : (node.children ?? []).map(plainText).join('');
const meaningful = (nodes) => nodes.filter((n) => n.type !== 'text' || n.value.trim());
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** Resolve article images against the deployed page, including a Pages project base. */
export function imageUrl(source, { site, base, slug }) {
  const prefix = '/' + base.split('/').filter(Boolean).join('/') + '/';
  const projectBase = prefix === '//' ? '/' : prefix;
  const page = new URL(`${projectBase}blog/${slug}/`, site);
  let input = String(source ?? '').trim();
  if (!input) throw new Error('Blog images need a real src, not a lazy-loading placeholder.');
  // A project-relative public asset path must not lose the GitHub Pages base.
  if (input.startsWith('/blog/figures/')) input = projectBase + input.slice(1);
  const url = new URL(input, page);
  if (url.origin === new URL(site).origin && url.pathname.startsWith(`${projectBase}blog/figures/`)) {
    url.pathname = url.pathname.replace(/\.svg$/i, '.png');
  }
  if (url.protocol !== 'https:' || !/\.(png|jpe?g|gif)$/i.test(url.pathname)) {
    throw new Error(`Blog image must use HTTPS and a raster format: ${url.href}`);
  }
  return url;
}

/** Build-time HTML only. No client scripts are needed to discover article images. */
export default function rehypeBlogHtml({ site, base = '/', publicDir = resolve('public') } = {}) {
  if (!site) throw new Error('rehypeBlogHtml requires the canonical site URL.');
  const prefix = '/' + base.split('/').filter(Boolean).join('/');
  const projectBase = prefix === '/' ? '' : prefix;

  return (tree, file) => {
    const path = String(file.path ?? '').replaceAll('\\', '/');
    const match = path.match(/(?:^|\/)src\/pages\/blog\/(.+)\.md$/);
    if (!match) return;
    const slug = match[1].replace(/\/index$/, '');

    function normalizeImage(node) {
      const props = node.properties ?? (node.properties = {});
      const url = imageUrl(props.src, { site, base, slug });
      props.src = url.href;
      props.loading = 'eager';
      props.decoding = 'async';
      for (const key of ['srcSet', 'srcset', 'sizes', 'dataSrc', 'data-src', 'dataSrcset', 'data-srcset', 'data-src-set']) delete props[key];
      if (url.origin === new URL(site).origin && url.pathname.startsWith(`${projectBase}/blog/figures/`) && url.pathname.endsWith('.png')) {
        const relative = decodeURIComponent(url.pathname.slice(projectBase.length)).replace(/^\/+/, '');
        const diskPath = resolve(publicDir, relative);
        if (!diskPath.startsWith(resolve(publicDir) + '/')) throw new Error('Blog image escapes public directory.');
        const bytes = readFileSync(diskPath);
        if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature)) throw new Error(`Invalid PNG: ${diskPath}`);
        props.width = bytes.readUInt32BE(16);
        props.height = bytes.readUInt32BE(20);
      }
    }

    function tableParagraphs(table) {
      const groups = meaningful(table.children);
      const head = groups.find((n) => isElement(n, 'thead'));
      const headerRow = head?.children.find((n) => isElement(n, 'tr'));
      const headers = headerRow?.children.filter((n) => isElement(n, 'th')) ?? [];
      const bodies = groups.filter((n) => isElement(n, 'tbody'));
      const rows = bodies.flatMap((body) => body.children.filter((n) => isElement(n, 'tr')));
      if (headers.length < 2 || !rows.length) throw new Error('Blog comparison tables need a header and data rows.');
      return rows.map((row) => {
        const cells = row.children.filter((n) => isElement(n, 'td'));
        if (cells.length !== headers.length || cells.some((c) => c.properties?.colSpan || c.properties?.rowSpan)) {
          throw new Error('Complex blog tables need a hand-written text alternative.');
        }
        const label = cells[0].children.length === 1 && isElement(cells[0].children[0], 'strong')
          ? cells[0].children : [element('strong', {}, cells[0].children)];
        const children = [...label];
        for (let i = 1; i < cells.length; i += 1) {
          children.push(element('br', {}, []), element('strong', {}, [text(plainText(headers[i]).trim() + ': ')]), ...cells[i].children);
        }
        return element('p', { className: ['comparison-record'] }, children);
      });
    }

    function visit(parent) {
      if (!parent.children) return;
      parent.children = parent.children.flatMap((node) => {
        if (isElement(node, 'img')) normalizeImage(node);
        visit(node);
        if (isElement(node, 'p')) {
          const content = meaningful(node.children);
          if (content.length === 1 && isElement(content[0], 'img')) {
            const image = content[0];
            const caption = String(image.properties.title || image.properties.alt || '').trim();
            return [element('figure', { className: ['article-figure'] }, [
              image,
              ...(caption ? [element('figcaption', {}, [text(caption)])] : []),
            ])];
          }
        }
        if (isElement(node, 'table')) return tableParagraphs(node);
        return [node];
      });
    }
    visit(tree);
  };
}
