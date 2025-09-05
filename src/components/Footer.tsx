import { Container, ContainerFull } from "@/components/Containers";
import Link from "next/link";
import {
  NextIntlClientProvider,
  useMessages,
  useTranslations,
} from "next-intl";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { ModeToggle } from "@/components/ModeToggle";
import pick from "lodash/pick";
import React from "react";
import { TrackLink } from "@/components/TrackComponents";

export function Footer() {
  const t = useTranslations("footer");
  const messages = useMessages();

  return (
    <div className="w-full _border-t py-9 lg:py-12 flex flex-col mt-12">
      <div className="text-sm text-muted-foreground mb-2 flex gap-4">
        <LocaleSwitcher />

        <NextIntlClientProvider messages={pick(messages, ["ModeToggle"])}>
          <ModeToggle />
        </NextIntlClientProvider>
      </div>
      <p className="text-sm text-muted-foreground">
        Built by{" "}
        <TrackLink
          trackValue={["firenze", "footer"]}
          href="https://firenze2024.com"
          target="_blank"
          className="border-b"
        >
          燕耳Firenze
        </TrackLink>
      </p>
      <p className="safe-pb" />
    </div>
  );
}
