import { Composition } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import {
  CtaScene,
  FeaturesScene,
  IntroScene,
  ProblemScene,
  SloganScene,
} from "./Scenes";

const FPS = 30;
const TRANSITION = 15; // frames

export const MyComposition = () => {
  return (
    <Composition
      id="VircenePromo"
      component={VircenePromo}
      // 5 scènes (4 + 4 + 6 + 4 + 4 s) moins 4 transitions de 0,5 s = 20 s
      durationInFrames={22 * FPS - 4 * TRANSITION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};

export const VircenePromo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="Intro" durationInFrames={4 * FPS}>
        <IntroScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION })}
      />
      <TransitionSeries.Sequence name="Problème" durationInFrames={4 * FPS}>
        <ProblemScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: TRANSITION })}
      />
      <TransitionSeries.Sequence
        name="Fonctionnalités"
        durationInFrames={6 * FPS}
      >
        <FeaturesScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION })}
      />
      <TransitionSeries.Sequence name="Slogan" durationInFrames={4 * FPS}>
        <SloganScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION })}
      />
      <TransitionSeries.Sequence name="CTA" durationInFrames={4 * FPS}>
        <CtaScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
