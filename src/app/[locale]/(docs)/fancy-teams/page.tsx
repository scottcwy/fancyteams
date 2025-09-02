import { CollectionLayout } from "@/components/SimpleLayout";
import { SectionTitle } from "@/components/collection/SectionTitle";
import { ListView } from "@/components/collection/ListView";
import data from "./data";

export default function Page() {
  const title = "Fancy Teams";
  const intro = "精选的中文产品团队与公司导航（含官网与一句话简介）。";
  return (
    <CollectionLayout title={title} intro={intro} authors={["onemachi"]}>
      <SectionTitle title={title} />
      <ListView data={data} />
    </CollectionLayout>
  );
}

export async function generateMetadata() {
  const title = "Fancy Teams";
  const description = "A curated list of Chinese product teams and companies with official websites and one-line summaries.";
  return {
    title,
    description,
    keywords: [
      "fancy teams",
      "product teams",
      "china",
      "startups",
      "companies",
      "导航",
      "团队",
    ],
  };
}