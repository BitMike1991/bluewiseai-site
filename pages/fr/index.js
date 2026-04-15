import PageHead from "../../src/components/PageHead";
import HeroV2 from "../../src/components/HeroV2";
import HomeSections from "../../src/components/HomeSections";

export default function HomeFr() {
  return (
    <div className="min-h-screen bg-bg">
      <PageHead page="/" locale="fr" />
      <h1 className="sr-only">BlueWise AI - Optimisation d&apos;entreprise propulsée par IA pour entrepreneurs</h1>
      <HeroV2 />
      <HomeSections />
    </div>
  );
}
