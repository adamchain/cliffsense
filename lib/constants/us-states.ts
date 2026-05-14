/** US states + DC, sorted by name for dropdowns. Codes are uppercase. */
const TAB = "\t";

const LINES = `
AL${TAB}Alabama
AK${TAB}Alaska
AZ${TAB}Arizona
AR${TAB}Arkansas
CA${TAB}California
CO${TAB}Colorado
CT${TAB}Connecticut
DE${TAB}Delaware
DC${TAB}District of Columbia
FL${TAB}Florida
GA${TAB}Georgia
HI${TAB}Hawaii
ID${TAB}Idaho
IL${TAB}Illinois
IN${TAB}Indiana
IA${TAB}Iowa
KS${TAB}Kansas
KY${TAB}Kentucky
LA${TAB}Louisiana
ME${TAB}Maine
MD${TAB}Maryland
MA${TAB}Massachusetts
MI${TAB}Michigan
MN${TAB}Minnesota
MS${TAB}Mississippi
MO${TAB}Missouri
MT${TAB}Montana
NE${TAB}Nebraska
NV${TAB}Nevada
NH${TAB}New Hampshire
NJ${TAB}New Jersey
NM${TAB}New Mexico
NY${TAB}New York
NC${TAB}North Carolina
ND${TAB}North Dakota
OH${TAB}Ohio
OK${TAB}Oklahoma
OR${TAB}Oregon
PA${TAB}Pennsylvania
RI${TAB}Rhode Island
SC${TAB}South Carolina
SD${TAB}South Dakota
TN${TAB}Tennessee
TX${TAB}Texas
UT${TAB}Utah
VT${TAB}Vermont
VA${TAB}Virginia
WA${TAB}Washington
WV${TAB}West Virginia
WI${TAB}Wisconsin
WY${TAB}Wyoming
`
  .trim()
  .split("\n")
  .map((line) => {
    const [code, name] = line.split(TAB);
    return { code: code!, name: name! };
  });

export const US_STATES: readonly { code: string; name: string }[] = [...LINES].sort((a, b) =>
  a.name.localeCompare(b.name),
);
