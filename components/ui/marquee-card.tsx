import { Star } from "lucide-react"

import { LiquidCard, CardContent } from "@/components/ui/liquid-glass-card"
import { Marquee } from "@/components/ui/marquee"

export interface Testimonial {
  name: string
  role: string
  content: string
  avatar: string
  rating: number
}

export const testimonialsRow1: Testimonial[] = [
  {
    name: "Vikram Malhotra",
    role: "Delhi to Agra Traveler",
    content:
      "Sedan arrived 15 mins early at Delhi T3. Transparent ₹3,500 fare with all tolls included. Best taxi service in Agra!",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Elena Rostova",
    role: "International Tourist",
    content:
      "Spotless Innova Crysta with courteous English-speaking chauffeur. Taj sunrise tour was completely hassle-free.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Rajesh & Family",
    role: "Mathura-Vrindavan Pilgrimage",
    content:
      "Booked Tempo Traveller for 12 family members. Punctual, safe driving along Yamuna Expressway and patient temple stops.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "David Miller",
    role: "Golden Triangle Traveler",
    content:
      "Reliable dispatch via WhatsApp, verified driver, no commission shop traps. Pure hospitality and transparent pricing.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
]

export const testimonialsRow2: Testimonial[] = [
  {
    name: "Ananya Singhal",
    role: "Corporate Travel Manager",
    content:
      "Regular vendor for our executives visiting Agra. Official GST invoices delivered instantly with pristine fleet.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Marcus Vance",
    role: "Photographer & Explorer",
    content:
      "Driver knew optimal timing for Mehtab Bagh sunset and Fatehpur Sikri lighting. Exceptional experience!",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Priya Nair",
    role: "Jaipur to Agra Route",
    content:
      "Comfortable outstation cab with baby seat accommodated. Driver was attentive and polite throughout the 5-hour drive.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
  {
    name: "Dr. Arvind Gupta",
    role: "Senior Citizen Pilgrimage",
    content:
      "Special care given to elderly parents at Agra Cantt station. AC was comfortable and driving was very gentle.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
  },
]

export interface MarqueeReviewsProps {
  row1?: Testimonial[]
  row2?: Testimonial[]
  className?: string
}

export const Component = ({
  row1 = testimonialsRow1,
  row2 = testimonialsRow2,
  className = "",
}: MarqueeReviewsProps) => {
  return (
    <div className={`space-y-4 overflow-hidden py-4 ${className}`}>
      {/* Row 1: Forward Marquee */}
      <Marquee pauseOnHover speed="normal">
        {row1.map((testimonial, index) => (
          <LiquidCard key={`row1-${index}`} className="mx-2 rounded-2xl w-84 h-full">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="h-11 w-11 object-cover rounded-full ring-2 ring-primary/20"
                />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <p className="mb-3 text-sm text-foreground/90 line-clamp-3 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex space-x-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-[#E5A044] text-[#E5A044]"
                  />
                ))}
              </div>
            </CardContent>
          </LiquidCard>
        ))}
      </Marquee>

      {/* Row 2: Reverse Marquee (User requested 2 rows) */}
      <Marquee pauseOnHover reverse speed="normal">
        {row2.map((testimonial, index) => (
          <LiquidCard key={`row2-${index}`} className="mx-2 rounded-2xl w-84 h-full">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center space-x-3">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="h-11 w-11 object-cover rounded-full ring-2 ring-primary/20"
                />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <p className="mb-3 text-sm text-foreground/90 line-clamp-3 leading-relaxed">
                "{testimonial.content}"
              </p>
              <div className="flex space-x-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-[#E5A044] text-[#E5A044]"
                  />
                ))}
              </div>
            </CardContent>
          </LiquidCard>
        ))}
      </Marquee>
    </div>
  );
};

export default Component;
