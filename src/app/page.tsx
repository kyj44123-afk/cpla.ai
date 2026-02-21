import { access, readdir } from "node:fs/promises";
import path from "node:path";
import AutoPostsCarousel from "@/components/landing-premium/AutoPostsCarousel";
import BrandStory from "@/components/landing-premium/BrandStory";
import HeroFollowupSections from "@/components/landing-premium/HeroFollowupSections";
import HeroSequence from "@/components/landing-premium/HeroSequence";
import PostFeatureCtaCards from "@/components/landing-premium/PostFeatureCtaCards";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import TopHeader from "@/components/landing-premium/TopHeader";

export const dynamic = "force-static";

function getFrameOrder(filename: string) {
  const basename = filename.replace(/\.[^.]+$/, "");
  const parts = basename.split("_");
  const tail = parts[parts.length - 1];
  const order = Number.parseInt(tail ?? "", 10);
  if (Number.isNaN(order)) return Number.MAX_SAFE_INTEGER;
  return order;
}

async function getHeroFrameSources() {
  const sequenceDirectory = path.join(process.cwd(), "public", "hero", "sequence");
  try {
    const files = await readdir(sequenceDirectory);
    return files
      .filter((file) => file.toLowerCase().endsWith(".jpg"))
      .sort((a, b) => getFrameOrder(a) - getFrameOrder(b))
      .map((file) => `/hero/sequence/${file}`);
  } catch {
    return [];
  }
}

async function resolveIntroSource(frameSources: string[]) {
  const introPath = path.join(process.cwd(), "public", "hero", "intro.jpg");
  try {
    await access(introPath);
    return "/hero/intro.jpg";
  } catch {
    return frameSources[0] ?? "";
  }
}

export default async function Home() {
  const frameSources = await getHeroFrameSources();
  const introSource = await resolveIntroSource(frameSources);

  return (
    <main className="premium-landing bg-white text-slate-900">
      <TopHeader />
      <HeroSequence
        introSrc={introSource}
        frameSources={frameSources}
        ctaHref="/counseling"
        headline={"노무를 완성하는\n노동법률 파트너"}
        subcopy="공인노무사 경영진이 상담부터 진단, 실행까지 연결합니다. AI 분석으로 기업과 개인의 중요한 결정을 더 빠르고 명확하게 지원합니다."
      />
      <div className="relative z-10 bg-white">
        <AutoPostsCarousel />
        <PostFeatureCtaCards />
        <HeroFollowupSections />
        <BrandStory />
      </div>
      <SiteFooter />
    </main>
  );
}
