
import { useTranslations } from "next-intl";
import { HeaderPadding } from "@/components/Header";
import { SectionHero } from "@/app/[locale]/(common)/SectionHero";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/Containers";
import TeamCard from "@/components/fancyteams/TeamCard";
import fancyTeamsData from "@/app/[locale]/(docs)/fancy-teams/data";

export default function Page() {
  const teams = [...fancyTeamsData].sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));

  return (
    <div>
      <SectionHero />
      <Separator />

      <Container>
        {/* 再向下偏移 20px（总计 40px） */}
        <div id="teams" className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.id} item={team} />
          ))}
        </div>
      </Container>
    </div>
  );
}
