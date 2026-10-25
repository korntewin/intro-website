import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateFeatureStorage } from '../src/scripts/riir-memory-lab.js';

test('200 float32 features per item reproduce the documented retained-storage estimate', () => {
  const oneThousand = estimateFeatureStorage(1000);
  assert.equal(oneThousand.goMB, 10.368);
  assert.equal(oneThousand.arrowMB, 0.825);
  assert(Math.abs(oneThousand.ratio - 12.56727) < 0.0001);
  const tenThousand = estimateFeatureStorage(10000);
  assert.equal(tenThousand.goMB, 103.68);
  assert.equal(tenThousand.arrowMB, 8.25);
  assert.equal(tenThousand.ratio, oneThousand.ratio);
});

test('rejects non-integer and negative item counts', () => {
  for (const input of [-1, 1.5, NaN, Infinity, '1000']) {
    assert.throws(() => estimateFeatureStorage(input), RangeError);
  }
});
