export const brandTokens = {
  colors: {
    darkBase: "#0d241f",
    darkPhoto: "#081b17",
    darkPanel: "#12322b",
    darkBackdropClass: "bg-[#06110e]/88",
    accentGold: "#f4cd74",
    accentGoldStrong: "#c8a24c",
    accentGreen: "#0f3d2e",
    lightBase: "#f3f6f8",
  },
  radius: {
    modal: "rounded-[28px]",
    panelTop: "rounded-t-[26px]",
    card: "rounded-2xl",
    button: "rounded-xl",
    chip: "rounded-full",
  },
  border: {
    softDark: "border-white/10",
    mediumDark: "border-white/15",
    softLight: "border-black/10",
    mediumLight: "border-black/15",
  },
  spacing: {
    panel: "p-6 md:p-8",
    sectionTop: "mt-6",
    cardGap: "gap-3",
    ctaGap: "gap-3",
  },
  typography: {
    overline: "text-xs uppercase tracking-[0.2em]",
    sectionTitle: "text-3xl font-bold",
    price: "text-4xl font-black",
    body: "text-sm leading-relaxed",
  },
  shadow: {
    modal: "shadow-2xl",
    sheet: "shadow-[0_-16px_40px_rgba(0,0,0,0.4)]",
  },
} as const;

export function getModalTheme(isLightTheme: boolean) {
  return {
    baseBackground: isLightTheme
      ? brandTokens.colors.lightBase
      : brandTokens.colors.darkBase,
    photoBackgroundClass: isLightTheme ? "bg-[#e8edf1]" : "bg-[#081b17]",
    panelBackgroundClass: isLightTheme ? "bg-white" : "bg-[#12322b]",
    textPrimary: isLightTheme ? "text-[#111318]" : "text-white",
    textMuted: isLightTheme ? "text-[#374151]" : "text-white/70",
    textLabel: isLightTheme ? "text-[#4b5563]" : "text-white/60",
    borderSoft: isLightTheme ? "border-black/10" : "border-emerald-200/12",
    borderMedium: isLightTheme ? "border-black/15" : "border-emerald-100/18",
    softCard: isLightTheme
      ? "border-black/10 bg-black/[0.04]"
      : "border-emerald-100/12 bg-[#102922]/70",
    input: isLightTheme
      ? "border-black/20 bg-white text-[#111318]"
      : "border-emerald-100/15 bg-[#0c211c] text-white",
  } as const;
}
