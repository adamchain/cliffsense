import LandingPage, { metadata as landingMetadata } from "./(authenticated)/landing/page";

export const metadata = landingMetadata;

export default function HomePage() {
  return <LandingPage />;
}
