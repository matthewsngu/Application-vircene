import React from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, sans, serif } from "./theme";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/* ─── Élément qui apparaît en fondu + glissement vers le haut ─── */
const Reveal: React.FC<{
  name: string;
  delay: number; // en secondes
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ name, delay, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Interactive.Div
      name={name}
      style={{
        ...style,
        opacity: interpolate(
          frame,
          [delay * fps, (delay + 0.7) * fps],
          [0, 1],
          { ...clamp, easing: easeOut },
        ),
        translate: interpolate(
          frame,
          [delay * fps, (delay + 0.9) * fps],
          ["0px 40px", "0px 0px"],
          { ...clamp, easing: easeOut },
        ),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

/* ─── Monogramme VC dessiné au trait ─── */
const Monogram: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <svg
      viewBox="0 0 160 120"
      width={size}
      height={(size * 120) / 160}
      fill="none"
    >
      <path
        d="M 38 26 L 70 92 C 88 54, 100 28, 104 30 C 120 34, 128 52, 128 72 C 128 90, 108 98, 90 92"
        stroke={colors.gold}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={interpolate(frame, [0, 1.6 * fps], [1, 0], {
          ...clamp,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        })}
      />
    </svg>
  );
};

/* ─── Scène 1 : logo ─── */
export const IntroScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.ink,
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
      }}
    >
      <Monogram size={300} />
      <Reveal
        name="Wordmark"
        delay={1.2}
        style={{
          fontFamily: serif,
          fontSize: 120,
          color: colors.cream,
          letterSpacing: "0.04em",
        }}
      >
        Vircène
      </Reveal>
    </AbsoluteFill>
  );
};

/* ─── Scène 2 : le problème ─── */
export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.cream,
        justifyContent: "center",
        padding: "0 180px",
        gap: 28,
      }}
    >
      <Reveal
        name="Line 1"
        delay={0.2}
        style={{ fontFamily: serif, fontSize: 104, color: colors.ink }}
      >
        10 produits.
      </Reveal>
      <Reveal
        name="Line 2"
        delay={0.8}
        style={{ fontFamily: serif, fontSize: 104, color: colors.ink }}
      >
        30 conseils{" "}
        <span
          style={{
            textDecorationLine: "line-through",
            textDecorationColor: colors.gold,
            textDecorationThickness: interpolate(
              frame,
              [2.2 * fps, 2.6 * fps],
              [0, 8],
              clamp,
            ),
          }}
        >
          contradictoires
        </span>
        .
      </Reveal>
      <Reveal
        name="Subtitle"
        delay={2.4}
        style={{ fontFamily: sans, fontSize: 52, color: colors.inkSoft }}
      >
        Et si ta peau avait enfin un plan&nbsp;?
      </Reveal>
    </AbsoluteFill>
  );
};

/* ─── Scène 3 : fonctionnalités ─── */
const FeatureCard: React.FC<{
  name: string;
  delay: number;
  index: string;
  title: string;
  text: string;
}> = ({ name, delay, index, title, text }) => (
  <Reveal
    name={name}
    delay={delay}
    style={{
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: 32,
      padding: "56px 48px",
      display: "flex",
      flexDirection: "column",
      gap: 24,
      boxShadow: "0 30px 60px rgba(20, 20, 20, 0.08)",
    }}
  >
    <div style={{ fontFamily: serif, fontSize: 64, color: colors.gold }}>
      {index}
    </div>
    <div style={{ fontFamily: serif, fontSize: 60, color: colors.ink }}>
      {title}
    </div>
    <div
      style={{
        fontFamily: sans,
        fontSize: 36,
        lineHeight: 1.35,
        color: colors.inkSoft,
      }}
    >
      {text}
    </div>
  </Reveal>
);

export const FeaturesScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.beige,
        padding: "120px 140px",
        gap: 72,
        justifyContent: "center",
      }}
    >
      <Reveal
        name="Features title"
        delay={0.1}
        style={{ fontFamily: serif, fontSize: 96, color: colors.ink }}
      >
        Ton dermatologue de poche.
      </Reveal>
      <div style={{ display: "flex", gap: 48 }}>
        <FeatureCard
          name="Card analyse"
          delay={0.7}
          index="01"
          title="Analyse de peau"
          text="Un diagnostic précis de ton type et de tes besoins."
        />
        <FeatureCard
          name="Card scan"
          delay={1.1}
          index="02"
          title="Scan produits"
          text="Scanne un soin, découvre s'il te convient vraiment."
        />
        <FeatureCard
          name="Card actifs"
          delay={1.5}
          index="03"
          title="Actifs compatibles"
          text="Fini les mélanges qui irritent ou s'annulent."
        />
      </div>
    </AbsoluteFill>
  );
};

/* ─── Scène 4 : slogan ─── */
export const SloganScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.ink,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Reveal
        name="Slogan 1"
        delay={0.2}
        style={{ fontFamily: serif, fontSize: 150, color: colors.cream }}
      >
        Une routine.
      </Reveal>
      <Reveal
        name="Slogan 2"
        delay={1}
        style={{
          fontFamily: serif,
          fontSize: 150,
          fontStyle: "italic",
          color: colors.gold,
        }}
      >
        Pas une tendance.
      </Reveal>
      <Interactive.Div
        name="Underline"
        style={{
          height: 4,
          backgroundColor: colors.gold,
          marginTop: 24,
          width: interpolate(frame, [1.8 * fps, 2.8 * fps], [0, 520], {
            ...clamp,
            easing: easeOut,
          }),
        }}
      />
    </AbsoluteFill>
  );
};

/* ─── Scène 5 : appel à l'action ─── */
export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.cream,
        justifyContent: "center",
        alignItems: "center",
        gap: 40,
      }}
    >
      <Reveal
        name="CTA wordmark"
        delay={0.1}
        style={{ fontFamily: serif, fontSize: 130, color: colors.ink }}
      >
        Vircène
      </Reveal>
      <Reveal
        name="CTA price"
        delay={0.6}
        style={{ fontFamily: sans, fontSize: 56, color: colors.inkSoft }}
      >
        Premium · 4,99&nbsp;€ / mois
      </Reveal>
      <Reveal name="CTA button" delay={1.1}>
        <Interactive.Div
          name="Button"
          style={{
            fontFamily: sans,
            fontWeight: 600,
            fontSize: 48,
            color: colors.cream,
            backgroundColor: colors.ink,
            padding: "30px 72px",
            borderRadius: 999,
            scale: interpolate(
              frame,
              [2 * fps, 2.4 * fps, 2.8 * fps],
              [1, 1.06, 1],
              clamp,
            ),
          }}
        >
          Commence ta routine
        </Interactive.Div>
      </Reveal>
    </AbsoluteFill>
  );
};
