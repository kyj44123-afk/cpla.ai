export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4">
      <h1
        className="select-none text-center text-[clamp(3.2rem,17vw,16rem)] font-black uppercase leading-none tracking-[0.03em] text-[#ff6b73]"
        style={{
          fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
          textShadow: "0 8px 0 rgba(0,0,0,0.45), 0 14px 18px rgba(255, 107, 115, 0.35)",
        }}
      >
        CPLA + AI
      </h1>
    </main>
  );
}
