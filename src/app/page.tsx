import { access, readdir } from "node:fs/promises";
import path from "node:path";
import AutoPostsCarousel from "@/components/landing-premium/AutoPostsCarousel";
import BrandStory from "@/components/landing-premium/BrandStory";
import HeroFollowupSections from "@/components/landing-premium/HeroFollowupSections";
import HeroSequence from "@/components/landing-premium/HeroSequence";
import ProductGrid from "@/components/landing-premium/ProductGrid";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import TopHeader from "@/components/landing-premium/TopHeader";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function getFrameOrder(filename: string) {
  const match = filename.match(/_(\d+)\.jpg$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]);
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

type AutoPost = {
  id: string;
  title: string;
  excerpt: string;
  createdAt: string;
};

async function getAutoPosts(): Promise<AutoPost[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("posts")
      .select("id, title, content, created_at, status")
      .eq("status", "open")
      .not("content", "is", null)
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !data) return [];

    return data
      .map((row) => {
        const content = String(row.content ?? "");
        const plain = content.replace(/[#>*`[\]()_-]/g, " ").replace(/\s+/g, " ").trim();
        return {
          id: String(row.id),
          title: String(row.title ?? "제목 없음"),
          excerpt: plain.slice(0, 130) || "자동 발행된 포스트 본문입니다.",
          createdAt: String(row.created_at ?? ""),
        };
      })
      .filter((post) => post.title);
  } catch {
    return [];
  }
}

export default async function Home() {
  const frameSources = await getHeroFrameSources();
  const introSource = await resolveIntroSource(frameSources);
  const autoPosts = await getAutoPosts();

  return (
    <main className="premium-landing bg-white text-slate-900">
      <TopHeader />
      <HeroSequence
        introSrc={introSource}
        frameSources={frameSources}
        ctaHref="/counseling"
        headline={"신뢰를 완성하는\n노동법률 파트너"}
        subcopy="공인노무사 곽영준의 깊이 있는 경험과 정교한 전략, 그리고 적극적 AI 활용으로 기업과 개인의 중요한 결정에 명확한 기준을 제시합니다."
      />
      <AutoPostsCarousel posts={autoPosts} />
      <HeroFollowupSections />
      <BrandStory />
      <ProductGrid />
      <SiteFooter />
    </main>
  );
}
