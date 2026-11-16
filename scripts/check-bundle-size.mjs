// Initial-JS budget check: `npm run size`. Builds in memory (nothing is written) and sums
// the gzip size of the JavaScript a visitor downloads before the first screen shows:
//   entry chunk + App chunk (imported right away by main.tsx) + the first screen's chunk,
//   each with its static imports.
// Two first screens are measured: the signed-in home page and the login form.
// Exits 1 if either is over BUDGET_KB. Mock mode is not measured (it is never deployed).
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

// kB = 1000 bytes of gzip, as Vite reports sizes. Override: BUNDLE_BUDGET_KB=140 npm run size
const BUDGET_KB = Number(process.env.BUNDLE_BUDGET_KB ?? 150);

const result = await build({ logLevel: 'silent', build: { write: false } });
const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);
const chunks = outputs.filter((o) => o.type === 'chunk');
const byFile = new Map(chunks.map((c) => [c.fileName, c]));

const find = (test, what) => {
  const chunk = chunks.find(test);
  if (!chunk) throw new Error(`check-bundle-size: no chunk for ${what}`);
  return chunk;
};
const entry = find((c) => c.isEntry, 'the entry');
/** The chunk that contains the given source module. */
const facade = (suffix) =>
  find((c) => c.moduleIds.some((id) => id.replaceAll('\\', '/').endsWith(suffix)), suffix);

/** The chunks plus everything they import statically. */
function closure(roots) {
  const seen = new Set();
  const visit = (chunk) => {
    if (seen.has(chunk.fileName)) return;
    seen.add(chunk.fileName);
    for (const file of chunk.imports) visit(byFile.get(file));
  };
  roots.forEach(visit);
  return [...seen].map((file) => byFile.get(file));
}

const gzipKb = (chunk) => gzipSync(chunk.code).length / 1000;
const shell = [entry, facade('src/App.tsx')];
const scenarios = {
  'signed-in home': closure([...shell, facade('src/routes/HomeRoute.tsx')]),
  'login form': closure([...shell, facade('src/components/Login.tsx')]),
};

let failed = false;
for (const [name, files] of Object.entries(scenarios)) {
  const total = files.reduce((sum, c) => sum + gzipKb(c), 0);
  const over = total > BUDGET_KB;
  failed ||= over;
  console.log(`${over ? '✗' : '✓'} ${name}: ${total.toFixed(1)} kB gzip (budget ${BUDGET_KB} kB)`);
  for (const c of files.sort((a, b) => gzipKb(b) - gzipKb(a))) {
    console.log(`    ${gzipKb(c).toFixed(1).padStart(6)} kB  ${c.fileName}`);
  }
}
const lazy = chunks.filter((c) => !scenarios['signed-in home'].includes(c) && !c.fileName.includes('browser'));
console.log(`  not in the signed-in first load: ${lazy.map((c) => `${c.fileName} ${gzipKb(c).toFixed(1)} kB`).join(', ') || 'nothing'}`);
process.exit(failed ? 1 : 0);
