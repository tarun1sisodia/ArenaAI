import { Component } from "@/components/ui/marquee-card";

export default function DemoOne() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Verified Traveler Reviews</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Real feedback from tourists, pilgrims, and corporate travelers across Agra, Delhi, Jaipur, and Mathura.
        </p>
      </div>
      <Component />
    </div>
  );
}
