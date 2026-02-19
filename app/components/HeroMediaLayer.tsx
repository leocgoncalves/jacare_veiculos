type HeroVisualPreset = "clean" | "dramatic";

type HeroMediaLayerProps = {
  posterUrl: string;
  themeColor: string;
  preset?: HeroVisualPreset;
};

const HERO_PRESETS: Record<
  HeroVisualPreset,
  {
    videoClassName: string;
    overlayGradient: string;
    topFadeClassName: string;
    bottomFadeClassName: string;
  }
> = {
  clean: {
    videoClassName:
      "h-full w-full scale-[1.1] object-cover object-[center_64%]",
    overlayGradient:
      "linear-gradient(to bottom, rgba(7, 10, 15, 0.22) 0%, rgba(7, 10, 15, 0.32) 55%, rgba(7, 10, 15, 0) 100%)",
    topFadeClassName: "absolute inset-x-0 top-0 z-[2] h-[51rem] sm:h-[4.5rem] md:h-[5.25rem]",
    bottomFadeClassName: "absolute inset-x-0 bottom-0 z-[2] h-[50rem] sm:h-36 md:h-[10.5rem]",
  },
  dramatic: {
    videoClassName:
      "h-full w-full scale-[1.14] object-cover object-[center_68%]",
    overlayGradient:
      "linear-gradient(to bottom, rgba(7, 10, 15, 0.48) 0%, rgba(7, 10, 15, 0.62) 52%, rgba(7, 10, 15, 0.46) 100%)",
    topFadeClassName: "absolute inset-x-0 top-0 z-[2] h-[51rem] sm:h-[5.25rem] md:h-24",
    bottomFadeClassName: "absolute inset-x-0 bottom-0 z-[2] h-[50rem] sm:h-36 md:h-[10.5rem]",
  },
};

export function HeroMediaLayer({
  posterUrl,
  themeColor,
  preset = "clean",
}: HeroMediaLayerProps) {
  const selectedPreset = HERO_PRESETS[preset];

  return (
    <>
      <div
        className="absolute inset-0 z-0"
        aria-hidden
        style={{ backgroundColor: themeColor }}
      >
        <video
          className={selectedPreset.videoClassName}
          src="/atualizado.mp4"
          autoPlay
          muted
          playsInline
          loop
          poster={posterUrl}
        />
      </div>

      <div
        className="absolute inset-0 z-[1]"
        style={{ background: selectedPreset.overlayGradient }}
      />
      <div
        className="absolute inset-0 z-[1] hidden sm:block"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7, 10, 15, 0.4) 0%, rgba(7, 10, 15, 0.4) 100%)",
        }}
      />

      <div
        className={selectedPreset.topFadeClassName}
        style={{
          background: `linear-gradient(to bottom, ${themeColor} 0%, transparent 100%)`,
        }}
      />
      <div
        className={selectedPreset.bottomFadeClassName}
        style={{
          background: `linear-gradient(to top, ${themeColor} 0%, transparent 100%)`,
        }}
      />
    </>
  );
}
