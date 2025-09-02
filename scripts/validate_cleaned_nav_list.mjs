#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve(process.cwd(), 'data', 'cleaned_nav_list.json');
let raw;
try {
  raw = fs.readFileSync(filePath, 'utf8');
} catch (e) {
  console.error('READ_ERROR', e.message);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('JSON_PARSE_ERROR', e.message);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error('FORMAT_ERROR', 'Root should be an array');
  process.exit(1);
}

const requiredKeys = ['名称', '官网链接'];
const optionalKeys = ['一句话简介', '城市', '规模', '赛道', '图标链接', '语言', '状态码', '域名'];
const keySet = new Set();
const langs = new Set();
const missingRequired = [];
const invalidUrls = [];
const invalidIconUrls = [];
const non200 = [];
const emptyDesc = [];
const duplicates = [];
const typeIssues = [];
const seenDomains = new Map();
const domainMismatch = [];

function isString(x) { return typeof x === 'string'; }

for (const it of data) {
  Object.keys(it).forEach((k) => keySet.add(k));
  const name = it['名称'];
  const url = it['官网链接'];
  const one = it['一句话简介'];
  const city = it['城市'];
  const scale = it['规模'];
  const track = it['赛道'];
  const icon = it['图标链接'];
  const lang = it['语言'];
  const code = it['状态码'];
  const domain = it['域名'];

  // Required fields present
  for (const rk of requiredKeys) {
    if (!it[rk] || String(it[rk]).trim() === '') {
      missingRequired.push({ name, domain, key: rk });
    }
  }

  // Types
  [['名称', name], ['官网链接', url], ['一句话简介', one], ['城市', city], ['规模', scale], ['赛道', track], ['图标链接', icon], ['语言', lang], ['域名', domain]].forEach(([k, v]) => {
    if (v != null && !isString(v)) typeIssues.push({ name, domain, key: k, type: typeof v });
  });
  if (code != null && typeof code !== 'number') typeIssues.push({ name, domain, key: '状态码', type: typeof code });

  // URL validity
  try { new URL(url); } catch { invalidUrls.push({ name, url }); }
  if (icon) {
    try { new URL(icon); } catch { invalidIconUrls.push({ name, icon }); }
  }

  // Status code check
  if (code !== undefined && code !== 200) {
    non200.push({ name, code });
  }

  // Empty description
  if (!one || String(one).trim() === '') {
    emptyDesc.push(name);
  }

  // Duplicates by domain
  if (domain) {
    const d = String(domain).toLowerCase();
    if (seenDomains.has(d)) {
      duplicates.push({ dupeOf: seenDomains.get(d), name, domain: d });
    } else {
      seenDomains.set(d, name);
    }
  }

  // Domain matches URL hostname?
  if (domain && url) {
    try {
      const u = new URL(url);
      const host = u.hostname.toLowerCase();
      if (host !== String(domain).toLowerCase()) {
        domainMismatch.push({ name, urlHost: host, domain });
      }
    } catch {}
  }

  if (lang) langs.add(lang);
}

const report = {
  count: data.length,
  keys: [...keySet].sort(),
  required_keys: requiredKeys,
  optional_keys_found: optionalKeys.filter((k) => keySet.has(k)),
  lang_values: [...langs],
  missing_required_count: missingRequired.length,
  missing_required_examples: missingRequired.slice(0, 5),
  invalid_url_count: invalidUrls.length,
  invalid_url_examples: invalidUrls.slice(0, 5),
  invalid_icon_url_count: invalidIconUrls.length,
  invalid_icon_url_examples: invalidIconUrls.slice(0, 5),
  non_200_count: non200.length,
  non_200_examples: non200.slice(0, 5),
  empty_desc_count: emptyDesc.length,
  duplicate_domain_count: duplicates.length,
  duplicate_domain_examples: duplicates.slice(0, 5),
  domain_mismatch_count: domainMismatch.length,
  domain_mismatch_examples: domainMismatch.slice(0, 5),
  type_issues_count: typeIssues.length,
  type_issues_examples: typeIssues.slice(0, 5),
};

// Decide pass/fail for import needs: require name+url valid and status 200 (if provided) and no invalid URL
const fatal = missingRequired.length > 0 || invalidUrls.length > 0;

console.log(JSON.stringify({ ok: !fatal, report }, null, 2));
process.exit(fatal ? 2 : 0);