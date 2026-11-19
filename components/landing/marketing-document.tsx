import "server-only";
import fs from "fs";
import path from "path";

const PAGES = ["home", "how-it-works", "testimonials", "pilot", "partners", "contact"] as const;

export type MarketingPage = (typeof PAGES)[number];

function readPage(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "content/marketing", file), "utf8");
}

const HTML: Record<MarketingPage, string> = {
  home: readPage("home.html"),
  "how-it-works": readPage("how-it-works.html"),
  testimonials: readPage("testimonials.html"),
  pilot: readPage("pilot.html"),
  partners: readPage("partners.html"),
  contact: readPage("contact.html"),
};

export function MarketingDocument({ page }: { page: MarketingPage }) {
  const html = HTML[page];

  return (
    <>
      <link rel="stylesheet" href="/site/css/site.css" />
      <link rel="stylesheet" href={`/site/css/${page}.css`} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
