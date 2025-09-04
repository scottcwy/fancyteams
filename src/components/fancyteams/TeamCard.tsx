"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Users, Tag } from "lucide-react";
import { ResourceItem } from "@/lib/data_types";
import { cn } from "@/lib/utils";

function buildFavicons(url: string, size: number = 64): string[] {
  try {
    const u = new URL(url);
    const host = u.hostname;
    return [
      `https://www.google.com/s2/favicons?sz=${size}&domain=${host}`,
      `https://icons.duckduckgo.com/ip3/${host}.ico`,
      `${u.protocol}//${host}/favicon.ico`,
    ];
  } catch {
    return [
      `https://www.google.com/s2/favicons?sz=${size}&domain=${url}`,
      `https://icons.duckduckgo.com/ip3/${url}.ico`,
    ];
  }
}

function parseMeta(
  desc?: string
): {
  summary?: string;
  city?: string;
  size?: string;
  track?: string;
} {
  if (!desc) return {};
  const cityMatch = desc.match(/城市:\s*([^·]+)/);
  const sizeMatch = desc.match(/规模:\s*([^·]+)/);
  const trackMatch = desc.match(/赛道:\s*([^·]+)/);
  let summary: string | undefined = desc
    .replace(/\s*·\s*城市:\s*[^·]+/g, "")
    .replace(/\s*·\s*规模:\s*[^·]+/g, "")
    .replace(/\s*·\s*赛道:\s*[^·]+/g, "")
    .trim();
  if (!summary || summary === desc) {
    const onlyMeta = /^(城市:|规模:|赛道:)/.test(desc);
    summary = onlyMeta ? undefined : desc;
  }
  return {
    summary,
    city: cityMatch?.[1]?.trim(),
    size: sizeMatch?.[1]?.trim(),
    track: trackMatch?.[1]?.trim(),
  };
}

export interface TeamCardProps {
  item: ResourceItem;
  className?: string;
}

export function TeamCard({ item, className }: TeamCardProps) {
  const { summary, city, size, track } = parseMeta(item.desc);
  const sources = React.useMemo(() => buildFavicons(item.url, 64), [item.url]);
  const [favicon, setFavicon] = React.useState<string>(sources[0]);

  React.useEffect(() => {
    setFavicon(sources[0]);
  }, [sources]);

  const handleIconError = React.useCallback(() => {
    const idx = sources.indexOf(favicon);
    const next = sources[idx + 1];
    if (next) setFavicon(next);
  }, [favicon, sources]);

  return (
    <Card
      className={cn(
        "rounded-2xl border border-black/5 shadow-sm bg-card hover:shadow-md transition-shadow",
        className
      )}
      role="group"
      aria-label={`${item.name} card`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white dark:bg-background ring-1 ring-black/10 flex items-center justify-center overflow-hidden">
            <img
              src={favicon}
              alt={`${item.name} favicon`}
              className="w-7 h-7 object-contain"
              onError={handleIconError}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold leading-6 truncate" title={item.name}>
              {item.name}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {city && (
                <Badge variant="secondary" className="px-2 py-0.5 rounded-md">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" aria-hidden />
                    {city}
                  </span>
                </Badge>
              )}
              {track && (
                <Badge variant="secondary" className="px-2 py-0.5 rounded-md">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" aria-hidden />
                    {track}
                  </span>
                </Badge>
              )}
              {size && (
                <Badge variant="secondary" className="px-2 py-0.5 rounded-md">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" aria-hidden />
                    {size}
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {summary && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{summary}</p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <a
            href={item.url}
            className="inline-flex items-center text-sm text-foreground/70 hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`打开 ${item.name} 官网`}
          >
            <Globe className="w-4 h-4 mr-1.5" aria-hidden /> 官网
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamCard;