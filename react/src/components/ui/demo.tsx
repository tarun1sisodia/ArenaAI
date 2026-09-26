import TextLoop from "@/components/ui/text-loop";
import { AppleHelloEnglishEffect } from "@/components/ui/apple-hello-effect";

export default function TextLoopDemo() {
  return (
    <div className="flex min-h-[350px] w-full items-center justify-center p-8">
      <TextLoop
        staticText="Design"
        rotatingTexts={["Limitless", "Timeless", "Flawless"]}
      />
    </div>
  );
}

const AppleHelloEffectDemo = () => {
  return (
    <div className="flex w-full h-screen flex-col justify-center items-center gap-16">
      <AppleHelloEnglishEffect speed={1.1} />
    </div>
  );
};

export { AppleHelloEffectDemo, TextLoopDemo };
