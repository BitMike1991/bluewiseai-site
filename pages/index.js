import PageHead from "../src/components/PageHead";
import HeroV2 from "../src/components/HeroV2";
import HomeSections from "../src/components/HomeSections";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <PageHead page="/" locale="en" />
      <h1 className="sr-only">BlueWise AI - AI-Powered Business Optimization for Contractors</h1>
      <HeroV2 />
      <HomeSections />
    </div>
  );
}
