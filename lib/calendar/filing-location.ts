import { programCodeKey } from "@/lib/benefits/program-meta";

export type FilingLocation = {
  /** Short place name shown on the card. */
  name: string;
  /** One-line role, e.g. "Online filing · SSA". */
  role: string;
  line1: string;
  line2: string;
  /** Prefer online filing when true. */
  onlineFirst: boolean;
  /** OSM / Google query for embed + directions. */
  mapQuery: string;
  /** Approximate pin for the stylized map. */
  lat: number;
  lng: number;
  directionsUrl: string;
  mapsEmbedUrl: string;
};

function mapsUrls(query: string, lat: number, lng: number) {
  const q = encodeURIComponent(query);
  const delta = 0.035;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  return {
    directionsUrl: `https://www.google.com/maps/search/?api=1&query=${q}`,
    mapsEmbedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`,
  };
}

/**
 * A concrete filing place for the event — online channel + a PA office pin
 * so the detail page can show an address/map card like a venue invite.
 */
export function filingLocationForEvent(input: {
  program: string | null;
  channelLabel?: string | null;
  channelUrl?: string | null;
}): FilingLocation {
  const code = input.program ? programCodeKey(input.program) : "";
  const channel = input.channelLabel?.trim() || null;

  if (code === "SSI" || code === "SSDI" || code === "VA") {
    const query = "Social Security Administration, Philadelphia, PA";
    const lat = 39.9526;
    const lng = -75.1652;
    const urls = mapsUrls(query, lat, lng);
    return {
      name: channel ?? "myWageReport / SSA",
      role: "Federal · Social Security Administration",
      line1: "Local SSA field office",
      line2: "Philadelphia metro · or file online",
      onlineFirst: true,
      mapQuery: query,
      lat,
      lng,
      ...urls,
    };
  }

  if (code === "SNAP" || code === "MEDICAID" || code === "TANF" || code === "LIHEAP") {
    const query = "Pennsylvania Department of Human Services, Harrisburg, PA";
    const lat = 40.2732;
    const lng = -76.8867;
    const urls = mapsUrls(query, lat, lng);
    return {
      name: channel ?? "COMPASS / MyCOMPASS PA",
      role: "Pennsylvania · County Assistance Office",
      line1: "County Assistance Office",
      line2: "Harrisburg · or file on COMPASS",
      onlineFirst: true,
      mapQuery: query,
      lat,
      lng,
      ...urls,
    };
  }

  if (code === "SECTION8") {
    const query = "Housing Authority of the City of Pittsburgh, Pittsburgh, PA";
    const lat = 40.4406;
    const lng = -79.9959;
    const urls = mapsUrls(query, lat, lng);
    return {
      name: channel ?? "Local housing authority",
      role: "HUD · Housing Choice Voucher",
      line1: "Your Public Housing Authority",
      line2: "Confirm the office on your voucher packet",
      onlineFirst: false,
      mapQuery: query,
      lat,
      lng,
      ...urls,
    };
  }

  const query = "Pennsylvania Capitol Complex, Harrisburg, PA";
  const lat = 40.264;
  const lng = -76.8839;
  const urls = mapsUrls(query, lat, lng);
  return {
    name: channel ?? "Agency filing channel",
    role: "Confirm with your notice",
    line1: "See your mailed packet",
    line2: "Online, phone, or local office",
    onlineFirst: Boolean(input.channelUrl),
    mapQuery: query,
    lat,
    lng,
    ...urls,
  };
}
