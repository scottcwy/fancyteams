import { ResourceItem } from "@/lib/data_types";
import cleaned from "../../../../../data/cleaned_nav_list.json";

// 原始 JSON 条目类型（根据已清洗的数据字段命名）
// 示例字段：{"名称": string, "官网链接": string, "一句话简介"?: string, ...}
// 这里使用最关键的三个字段进行映射，其余业务字段暂不纳入页面渲染
interface FancyTeamRawItem {
  名称?: string;
  官网链接?: string;
  一句话简介?: string;
  // 其他字段保留但不在此类型中强约束
  [key: string]: any;
}

function toKebabCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    // 将中文、空格和特殊字符统一替换为连字符
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function idFromUrl(url: string): string {
  try {
    const u = new URL(url);
    let host = u.hostname.toLowerCase();
    // 去掉常见的 www. 前缀
    host = host.replace(/^www\./, "");
    // 域名转为 kebab 作为 id，避免中文名转拼音带来的不一致
    return toKebabCase(host);
  } catch {
    // 如果 URL 不合法，退化为基于字符串内容的 id
    return toKebabCase(url);
  }
}

function buildResourceItem(raw: FancyTeamRawItem, index: number): ResourceItem | null {
  const name = (raw["名称"] ?? raw.name ?? "").toString().trim();
  const url = (raw["官网链接"] ?? raw.url ?? "").toString().trim();
  const baseDesc = (raw["一句话简介"] ?? raw.desc ?? undefined) as string | undefined;

  if (!name || !url) return null;

  // 仅将 城市 / 公司规模 合并到描述中（本次新增：赛道）
  const city = (raw["城市"] ?? raw.city ?? "").toString().trim();
  const size = (raw["公司规模"] ?? raw["规模"] ?? raw.size ?? "").toString().trim();
  const track = (raw["赛道"] ?? raw.track ?? "").toString().trim();

  const metaParts: string[] = [];
  if (city) metaParts.push(`城市: ${city}`);
  if (track) metaParts.push(`赛道: ${track}`);
  if (size) metaParts.push(`规模: ${size}`);
  const meta = metaParts.join(" · ");
  const finalDesc = [baseDesc?.trim(), meta].filter(Boolean).join(" · ");

  const id = idFromUrl(url) || toKebabCase(name) || `fancy-team-${index}`;

  const item: ResourceItem = {
    id,
    name,
    url,
    // 只在存在简介或元数据时添加，避免空串
    ...(finalDesc ? { desc: finalDesc } : {}),
  };
  return item;
}

const mapped: ResourceItem[] = (cleaned as FancyTeamRawItem[])
  .map((it, idx) => buildResourceItem(it, idx))
  .filter((x): x is ResourceItem => Boolean(x));

// 保证 id 唯一性：若重复则追加 -数字 后缀
const seen = new Map<string, number>();
const unique: ResourceItem[] = mapped.map((item) => {
  const count = seen.get(item.id) ?? 0;
  if (count === 0) {
    seen.set(item.id, 1);
    return item;
  }
  const next = count + 1;
  seen.set(item.id, next);
  return { ...item, id: `${item.id}-${next}` };
});

export const data: ResourceItem[] = unique;
export default data;