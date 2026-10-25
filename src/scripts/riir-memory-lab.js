// Browser-only enhancement: the article and Medium exports remain fully static.
export function estimateFeatureStorage(itemCount) {
  if (!Number.isInteger(itemCount) || itemCount < 0) {
    throw new RangeError('itemCount must be a non-negative integer');
  }
  const goMB = itemCount * 10368 / 1000000;
  const arrowMB = itemCount * 825 / 1000000;
  return { goMB, arrowMB, ratio: goMB / arrowMB };
}

const copy = {
  th: {
    kicker: 'MEMORY LAYOUT · ESTIMATE',
    title: 'ลองเปลี่ยนจำนวน Items ในหนึ่ง Request',
    explanation: 'ถ้าแต่ละ Item มี 200 Features ชนิด float32 แล้วเก็บเป็น Go Map ต่อ Record เทียบกับ Arrow Columns จะต่างกันแค่ไหน?',
    go: 'Go · []map[string]any',
    arrow: 'Arrow · Column Buffers',
    label: 'ประมาณ',
    smaller: 'เท่าของพื้นที่เก็บข้อมูล',
    caveat: 'เป็น Estimate ของ Retained Data Storage ไม่ใช่ RSS ใน Production สมมติว่า Go Map มี 200 Entries และ Arrow มี Validity Bitmap ทุก Column ยังไม่รวม Metadata, Padding และ Extra Capacity',
    one: '1,000 Items',
    ten: '10,000 Items',
  },
  en: {
    kicker: 'MEMORY LAYOUT · ESTIMATE',
    title: 'Change the number of items in one request',
    explanation: 'With 200 float32 features per item, how does one Go map per record compare with Arrow columns?',
    go: 'Go · []map[string]any',
    arrow: 'Arrow · Column Buffers',
    label: 'About',
    smaller: 'times the retained storage',
    caveat: 'An estimate of retained data storage, not production RSS. Assumes Go maps with 200 entries and an Arrow validity bitmap for every column; excludes metadata, padding, and spare capacity.',
    one: '1,000 items',
    ten: '10,000 items',
  },
};

function mountMemoryLab() {
  const article = document.querySelector('.blog-article-page .article-prose .e-content');
  if (!article || !location.pathname.includes('/blog/riir-rust-prediction-service/')) return;

  const heading = [...article.querySelectorAll('h2')].find((node) =>
    /prediction request/i.test(node.textContent ?? ''));
  if (!heading || article.querySelector('.riir-memory-lab')) return;

  let last = heading;
  while (last.nextElementSibling && last.nextElementSibling.tagName !== 'H2') {
    last = last.nextElementSibling;
  }

  const language = document.documentElement.lang === 'th' ? 'th' : 'en';
  const t = copy[language];
  const lab = document.createElement('section');
  lab.className = 'riir-memory-lab';
  lab.setAttribute('aria-label', t.title);
  lab.innerHTML = [
    '<div class="riir-memory-lab-top">',
    '<div><p class="riir-memory-kicker">' + t.kicker + '</p>',
    '<h3 class="riir-memory-title">' + t.title + '</h3></div>',
    '<div class="riir-memory-presets" role="group" aria-label="' + (language === 'th' ? 'จำนวน Items' : 'Number of items') + '">',
    '<button type="button" data-riir-items="1000" aria-pressed="true">' + t.one + '</button>',
    '<button type="button" data-riir-items="10000" aria-pressed="false">' + t.ten + '</button>',
    '</div></div>',
    '<p class="riir-memory-explanation">' + t.explanation + '</p>',
    '<div class="riir-memory-row"><div class="riir-memory-label"><span>' + t.go + '</span><strong data-riir-go></strong></div>',
    '<div class="riir-memory-track"><div class="riir-memory-bar riir-memory-go"></div></div></div>',
    '<div class="riir-memory-row"><div class="riir-memory-label"><span>' + t.arrow + '</span><strong data-riir-arrow></strong></div>',
    '<div class="riir-memory-track"><div class="riir-memory-bar riir-memory-arrow"></div></div></div>',
    '<div class="riir-memory-summary" aria-live="polite">' + t.label + ' <strong data-riir-ratio></strong> ' + t.smaller + '</div>',
    '<p class="riir-memory-note">' + t.caveat + '</p>',
  ].join('');
  last.after(lab);

  const buttons = [...lab.querySelectorAll('[data-riir-items]')];
  const fmt = new Intl.NumberFormat(language, { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  function render(itemCount) {
    const estimate = estimateFeatureStorage(itemCount);
    lab.querySelector('[data-riir-go]').textContent = fmt.format(estimate.goMB) + ' MB';
    lab.querySelector('[data-riir-arrow]').textContent = fmt.format(estimate.arrowMB) + ' MB';
    lab.querySelector('[data-riir-ratio]').textContent = new Intl.NumberFormat(language, {maximumFractionDigits: 1}).format(estimate.ratio) + '×';
    lab.querySelector('.riir-memory-arrow').style.width = (100 * estimate.arrowMB / estimate.goMB) + '%';
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.riirItems) === itemCount)));
  }
  buttons.forEach((button) => button.addEventListener('click', () => render(Number(button.dataset.riirItems))));
  render(1000);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountMemoryLab, { once: true });
  } else {
    mountMemoryLab();
  }
}
