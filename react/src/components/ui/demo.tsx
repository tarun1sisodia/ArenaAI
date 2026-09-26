// This is a file with a demo for your component
// That's what users will see in the preview
// Create new files in this directory to add more demos

import { PortfolioScrollGrid } from "@/components/ui/portfolio-scroll-grid";
import TextLoop from "@/components/ui/text-loop";
import { AppleHelloEnglishEffect } from "@/components/ui/apple-hello-effect";

const CDN = "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev";

const IMAGES = [
  {
    src: `${CDN}/stock-images/767d99bb371a54d0d36751e8cecae43c.jpg`,
    alt: "Diver silhouetted inside a sunset seascape shaped like a profile",
  },
  {
    src: `${CDN}/gradients/moon/moon-grade-03.png`,
    alt: "Arc of orange light glowing against black",
  },
  {
    src: `${CDN}/stock-images/821d815affa6496c39cbdeeec7a84603.jpg`,
    alt: "Double-exposure portrait blended with a city skyline at dusk",
  },
  {
    src: `${CDN}/gradients/crimson_aura/crimson-aura-02.png`,
    alt: "Ribbon of teal and red light curving through black",
  },
  {
    src: `${CDN}/stock-images/937438c560ada1c83317f2c11b3454b0.jpg`,
    alt: "Motion-blurred side-profile portrait against a deep orange backdrop",
  },
  {
    src: `${CDN}/gradients/crimson_aura/crimson-aura-03.png`,
    alt: "Streak of red and violet light cutting through darkness",
  },
  {
    src: `${CDN}/stock-images/98f89cb9994f5c382ab964062c4039db.jpg`,
    alt: "Figure holding a net that dissolves into a swirling cloud at dusk",
  },
  {
    src: `${CDN}/gradients/moon/moon-grade-02.png`,
    alt: "Red half moon fading to magenta against black",
  },
  {
    src: `${CDN}/stock-images/ddcbee38be8b7274e19e132d7ab35b53.jpg`,
    alt: "Hand gesture with a cutout of a bird flying through the fingers",
  },
  {
    src: `${CDN}/gradients/crimson_aura/crimson-aura-05.png`,
    alt: "Arc of amber light sweeping across a dark frame",
  },
  {
    src: `${CDN}/gradients/fractional_walls/glass-walls-01.png`,
    alt: "Fluted glass refracting bands of violet, blue and amber light",
  },
];

// ONLY DEFAULT EXPORT WILL BE TREATED AS A DEMO
export default function DemoOne() {
  return <PortfolioScrollGrid title="Ines Marlowe" images={IMAGES} />;
}

export function TextLoopDemo() {
  return (
    <div className="flex min-h-[350px] w-full items-center justify-center p-8">
      <TextLoop
        staticText="Design"
        rotatingTexts={["Limitless", "Timeless", "Flawless"]}
      />
    </div>
  );
}

export const AppleHelloEffectDemo = () => {
  return (
    <div className="flex w-full h-screen flex-col justify-center items-center gap-16">
      <AppleHelloEnglishEffect speed={1.1} />
    </div>
  );
};
