import { LatentBoxLogo } from "@/components/Logos";
import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";
import { GitHubButton } from "@/components/GitHubButton";
import { HeaderPadding } from "@/components/Header";
import { Container, ContainerFull } from "@/components/Containers";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import { DiscordIcon, XhsIcon, XIcon } from "@/components/LogosBrand";
import { CollectionGroupProps, CollectionItemProps, useCollectionData } from "@/lib/docs_navigation";
import { Separator } from "@/components/ui/separator";
import { CollectionGroup } from "@/components/collection/CollectionView";
import TeamCard from "@/components/fancyteams/TeamCard";
import fancyTeamsData from "@/app/[locale]/(docs)/fancy-teams/data";


export function SectionCollections() {
  const t = useTranslations("index.collections");
  const tDocs = useTranslations("docs");
  // 正确获取集合数据
  const { collectionList } = useCollectionData();
  // 过滤掉“杂项”分组
  const filteredList = collectionList.filter((g) => g.title !== tDocs("group.miscellaneous"));

  // Fancy Teams 数据（按中文名排序）
  const teams = [...fancyTeamsData].sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));

  return (
    <div className="py-12">
      <Container>
        <div className="flex flex-col items-center ">
          <h2 className="text-2xl font-bold text-center">{t("title")}</h2>

          <div className="h-9" />

          <div className="w-full flex flex-col items-center gap-9">
            {filteredList.map((item, index) => (
              <CollectionGroup key={index} {...item} />
            ))}

            {/* Fancy Teams grid */}
            <div className="w-full">
              <h3 className="text-xl font-bold mb-6">{tDocs("fancy-teams.title")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <TeamCard key={team.id} item={team} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}