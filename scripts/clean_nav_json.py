#!/usr/bin/env python3
"""
clean_nav_json.py

用途：
  从原始抓取 JSON（如 fancyteams.json）中清洗并导出导航站需要的精简 JSON，
  字段命名清晰、值类型严格、易读易懂。

输出字段（中文键名）：
  - 名称: string
  - 官网链接: string (统一补 https:// 前缀)
  - 一句话简介: string
  - 城市: string（当前无结构化来源，留空；多条模式将尝试从 markdown 猜测）
  - 规模: string（当前无结构化来源，留空；多条模式将尝试从 markdown 猜测）
  - 赛道: string（当前无结构化来源，留空）
  - 图标链接: string（优先使用 Google Favicon API，也可选择使用源数据中的 dataURL）
  - 语言: string
  - 状态码: number（若原始为数字字符串，会自动转为整数）
  - 域名: string（由官网链接解析）

用法示例：
  python3 clean_nav_json.py --input fancyteams.json --output cleaned_nav.json --icon-mode google
  python3 clean_nav_json.py -i fancyteams.json -o cleaned_nav.json -m dataurl
  python3 clean_nav_json.py -i fancyteams.json -o cleaned_nav_list.json -m google --multi

参数：
  --input/-i      输入原始 JSON 文件路径（默认：fancyteams.json）
  --output/-o     输出清洗后的 JSON 文件路径（默认：cleaned_nav.json）
  --icon-mode/-m  图标模式：google 或 dataurl（默认：google）
  --multi         是否从 data.markdown 中解析并导出多条记录（默认：关闭）
"""

import argparse
import json
import re
from urllib.parse import urlparse
from pathlib import Path
from typing import List, Tuple


def ensure_https(u: str) -> str:
    """统一将链接转为带协议的 https URL。"""
    if not u:
        return ""
    u = u.strip()
    if u.startswith("//"):
        u = "https:" + u
    if not re.match(r"^https?://", u, flags=re.IGNORECASE):
        u = "https://" + u
    return u


def extract_domain(u: str) -> str:
    """从 URL 提取主机名。"""
    try:
        return urlparse(u).hostname or ""
    except Exception:
        return ""


def clean_text(s: str) -> str:
    """去除多余空白，保持简洁可读。"""
    s = (s or "").strip()
    s = re.sub(r"\s+", " ", s)
    return s


def to_int_if_numeric(v):
    """若 v 为数字字符串则转 int，否则原样返回。"""
    if isinstance(v, int):
        return v
    if isinstance(v, str) and v.isdigit():
        try:
            return int(v)
        except Exception:
            return v
    return v


def build_icon_link(domain: str, meta_favicon: str, mode: str) -> str:
    """根据模式生成图标链接。
    - google: 使用 Google Favicon API（简洁、稳定）
    - dataurl: 若 meta_favicon 存在则用其 dataURL，否则回退到 google
    """
    domain = domain or ""
    if mode == "dataurl" and meta_favicon:
        return meta_favicon
    # 回退或指定 google 模式
    if domain:
        return f"https://www.google.com/s2/favicons?domain={domain}"
    return meta_favicon or ""


def clean_entry(raw: dict, icon_mode: str = "google") -> dict:
    data = raw.get("data", {}) or {}
    meta = data.get("metadata", {}) or {}
    form = raw.get("formState", {}) or {}

    # 网址优先级：metadata.url > metadata.sourceURL > form.url
    url = meta.get("url") or meta.get("sourceURL") or form.get("url") or ""
    url = ensure_https(url)

    domain = extract_domain(url)

    # 名称优先级：metadata.title > 域名 > form.url
    name = clean_text(meta.get("title") or domain or (form.get("url") or "")) or "Unknown"

    # 简介
    desc = clean_text(meta.get("description") or "")

    # 语言
    lang = clean_text(meta.get("language") or "")

    # 状态码
    status_code = to_int_if_numeric(meta.get("statusCode"))

    # 图标
    favicon = build_icon_link(domain, meta.get("favicon") or "", icon_mode)

    # 目前无结构化城市/规模/赛道，预留字段为空字符串
    city = ""
    size = ""
    track = ""

    return {
        "名称": name,
        "官网链接": url,
        "一句话简介": desc,
        "城市": city,
        "规模": size,
        "赛道": track,
        "图标链接": favicon,
        "语言": lang,
        "状态码": status_code,
        "域名": domain,
    }


# -------- 多条解析（基于 data.markdown 的启发式解析） --------
CITY_CANDIDATES = [
    "北京", "上海", "杭州", "深圳", "苏州", "远程", "广州", "成都", "武汉", "厦门", "南京", "西安",
    "重庆", "青岛", "天津", "合肥", "宁波", "杭州/北京", "北京/上海",
]


def is_image_or_link_line(line: str) -> bool:
    l = line.strip()
    return (l.startswith("![") or l.startswith("[![") or l.startswith("[") or l.startswith("<"))


def is_size_line(line: str) -> bool:
    l = line.strip()
    if not l:
        return False
    if "估值" in l:
        return False
    # 诸如：11-50人、100-499人、20-99人、5-10人、60-99人、100人
    return bool(re.search(r"\b\d{1,4}(?:[-–—]\d{1,4})?人\b", l))


def is_city_line(line: str) -> bool:
    l = line.strip()
    if not l:
        return False
    if "人" in l or "估值" in l:
        return False
    if is_image_or_link_line(l):
        return False
    # 仅允许候选城市关键字或有斜杠的城市组合
    if any(c in l for c in CITY_CANDIDATES):
        return True
    if re.fullmatch(r"[\u4e00-\u9fa5A-Za-z]+(?:/[\u4e00-\u9fa5A-Za-z]+)+", l):
        return True
    return False


def extract_website_from_line(line: str) -> str:
    # 先移除内层图片 markdown，避免误抓取图片 URL
    cleaned = re.sub(r"!\[[^\]]*\]\([^\)]+\)", "", line)
    m = re.search(r"\[官网[^\]]*\]\((https?://[^)]+)\)", cleaned)
    return m.group(1) if m else ""


def find_name(lines: List[str], idx: int) -> str:
    # 优先策略：向上寻找最近的图片行，取其下一条非空、非链接、非图片行作为名称
    for j in range(idx - 1, -1, -1):
        if lines[j].strip().startswith("!["):
            # 从 j+1 开始向下找首个文本行
            k = j + 1
            while k < len(lines):
                t = lines[k].strip()
                if not t:
                    k += 1
                    continue
                if is_image_or_link_line(t):
                    k += 1
                    continue
                if "Founder" in t or "CEO" in t or "创始" in t:
                    k += 1
                    continue
                if len(t) <= 60:  # 名称放宽一点，但仍限制长度
                    return t
                break
        # 如果遇到明显分隔（例如空行多次）可继续向上
    # 退回到原有的向上扫描简化策略
    j = idx - 1
    while j >= 0:
        l = lines[j].strip()
        if not l:
            j -= 1
            continue
        if is_image_or_link_line(l):
            j -= 1
            continue
        if "Founder" in l or "CEO" in l or "创始" in l or "估值" in l or "人" in l:
            j -= 1
            continue
        if len(l) <= 30:
            return l
        j -= 1
    return ""


def find_desc_city_size(lines: List[str], name_idx: int, search_limit: int = 12) -> Tuple[str, str, str]:
    desc = ""
    city = ""
    size = ""
    # 从名称下一行往下找，限定窗口
    i = name_idx + 1
    steps = 0
    while i < len(lines) and steps < search_limit:
        l = lines[i].strip()
        steps += 1
        if not l:
            i += 1
            continue
        if is_image_or_link_line(l):
            i += 1
            continue
        if not desc and not is_city_line(l) and not is_size_line(l) and "估值" not in l:
            # 第一条像样的描述
            desc = l
            i += 1
            continue
        if not city and is_city_line(l):
            city = l
            i += 1
            continue
        if not size and is_size_line(l):
            size = l
            i += 1
            continue
        # 当描述/城市/规模都有或遇到明显分隔时可以提前结束
        if desc and (city or size):
            break
        i += 1
    return desc, city, size


def parse_markdown_entries(md: str) -> List[dict]:
    """从 markdown 文本中解析出多条公司记录（名称/官网/简介/城市/规模）。"""
    if not md:
        return []
    lines = md.splitlines()
    entries = []
    used_urls = set()

    for idx, line in enumerate(lines):
        if "官网" not in line:
            continue
        url = extract_website_from_line(line)
        if not url:
            continue
        url = ensure_https(url)
        if url in used_urls:
            continue

        # 定位名称行（向上搜索）
        name = find_name(lines, idx)
        if not name:
            # 若未找到名称，跳过该条
            continue

        # 名称行的索引再向上找
        # 简单再向上回溯以定位名称真实位置
        name_line_index = None
        for j in range(idx - 1, -1, -1):
            if lines[j].strip() == name:
                name_line_index = j
                break
        if name_line_index is None:
            name_line_index = idx - 1

        desc, city, size = find_desc_city_size(lines, name_line_index)

        entries.append({
            "名称": clean_text(name),
            "官网链接": url,
            "一句话简介": clean_text(desc),
            "城市": clean_text(city),
            "规模": clean_text(size),
        })
        used_urls.add(url)

    return entries


def build_clean_item(item: dict, language: str, status_code, icon_mode: str) -> dict:
    url = ensure_https(item.get("官网链接", ""))
    domain = extract_domain(url)
    return {
        "名称": clean_text(item.get("名称", "Unknown")) or "Unknown",
        "官网链接": url,
        "一句话简介": clean_text(item.get("一句话简介", "")),
        "城市": clean_text(item.get("城市", "")),
        "规模": clean_text(item.get("规模", "")),
        "赛道": "",
        "图标链接": build_icon_link(domain, "", icon_mode),
        "语言": clean_text(language or ""),
        "状态码": to_int_if_numeric(status_code),
        "域名": domain,
    }


def main():
    parser = argparse.ArgumentParser(description="清洗抓取 JSON 为导航站字段 JSON")
    parser.add_argument("--input", "-i", default="fancyteams.json", help="输入原始 JSON 文件路径")
    parser.add_argument("--output", "-o", default="cleaned_nav.json", help="输出清洗后 JSON 文件路径")
    parser.add_argument("--icon-mode", "-m", choices=["google", "dataurl"], default="google", help="图标模式：google 或 dataurl")
    parser.add_argument("--multi", action="store_true", help="是否从 data.markdown 中解析多条记录")
    args = parser.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        raise FileNotFoundError(f"输入文件不存在：{in_path}")

    with in_path.open("r", encoding="utf-8") as f:
        raw = json.load(f)

    if args.multi:
        data = raw.get("data", {}) or {}
        meta = data.get("metadata", {}) or {}
        md = data.get("markdown", "") or ""
        language = meta.get("language") or ""
        status_code = meta.get("statusCode")
        # 解析 markdown
        items = parse_markdown_entries(md)
        # 映射到输出结构
        cleaned_list = [build_clean_item(it, language, status_code, args.icon_mode) for it in items]
        # 若未解析到，退回单条模式
        if not cleaned_list:
            cleaned_list = [clean_entry(raw, icon_mode=args.icon_mode)]
        out_path = Path(args.output)
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(cleaned_list, f, ensure_ascii=False, indent=2)
        print(f"已生成（多条）：{out_path.resolve()} 条数={len(cleaned_list)}")
        return

    # 单条模式
    cleaned = clean_entry(raw, icon_mode=args.icon_mode)

    out_path = Path(args.output)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    print(f"已生成：{out_path.resolve()}")


if __name__ == "__main__":
    main()