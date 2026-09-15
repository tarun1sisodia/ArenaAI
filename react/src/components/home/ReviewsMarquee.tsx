/**
 * ReviewsMarquee — 2-Row Liquid Glass Marquee Reviews (Phase R5.8)
 *
 * Architecture & Features:
 * - Dual opposing continuous marquee tracks:
 *   - Row 1: Scrolls left (outstation drops, local sightseeing, Taj sunrise)
 *   - Row 2: Scrolls right (pilgrimages, corporate travel, photography expeditions)
 * - Pause-on-hover interaction on both tracks
 * - Liquid glassmorphism cards (backdrop blur, subtle border highlight, ambient elevation)
 * - 5 gold Lucide SVG stars and verified customer badge
 * - Graceful avatar initials fallback on network error
 * - Responsive edge-fade gradient masks
 * - Strict prefers-reduced-motion fallback with horizontal scroll support
 * - Clean White + Solar Dusk dark mode adaptation
 */

import React, { useState } from "react";
import { reviews, type Review } from "../../data/catalogue";

interface ReviewCardProps {
  review: Review;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ReviewCard({ review }: ReviewCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(review.name);

  return (
    <article className="liquid-review-card" role="article">
      <div className="liquid-review-header">
        <div className="liquid-review-avatar-wrapper">
          <div className="liquid-review-avatar-fallback" aria-hidden="true">
            {initials}
          </div>
          {review.avatar && !imgFailed && (
            <img
              className={`liquid-review-avatar ${imgLoaded ? "is-loaded" : ""}`}
              src={review.avatar}
              alt={review.name}
              width={44}
              height={44}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgFailed(true)}
            />
          )}
        </div>
        <div className="liquid-review-meta">
          <span className="liquid-review-name">{review.name}</span>
          <span className="liquid-review-role">
            {review.role || review.place}
          </span>
        </div>
      </div>

      <p className="liquid-review-content">&ldquo;{review.quote}&rdquo;</p>

      <div className="liquid-review-footer">
        <div
          className="liquid-review-stars"
          aria-label={`${review.rating} out of 5 stars`}
        >
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className="liquid-review-star"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
        <span className="liquid-review-badge">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Verified
        </span>
      </div>
    </article>
  );
}

export function ReviewsMarquee() {
  // Split the 10 reviews evenly across 2 rows (5 per row)
  const row1 = reviews.slice(0, 5);
  const row2 = reviews.slice(5, 10);

  return (
    <section
      className="home-section section--paper-alt reviews-marquee-section"
      id="reviews-section"
      aria-labelledby="reviews-heading"
    >
      <div className="container reviews-heading-container">
        <p className="eyebrow">Verified Traveler Reviews</p>
        <h2 id="reviews-heading">
          380+ trips.
          <br />
          <i>Quiet confidence.</i>
        </h2>
        <p className="reviews-lead">
          Real reviews from tourists, pilgrims, and business travelers across
          Agra, Delhi, Jaipur, and Mathura.
        </p>
        <div className="reviews-summary-pill" aria-label="Rating summary">
          <span className="summary-star" aria-hidden="true">★</span>
          <span className="summary-score">4.9 / 5</span>
          <span className="summary-sep">·</span>
          <span className="summary-trips">3,800+ Verified Journeys</span>
        </div>
      </div>

      <div
        className="reviews-marquee-container"
        aria-label="Customer reviews dual marquee"
      >
        {/* Row 1 — Scrolls Left */}
        <div className="reviews-marquee-row reviews-marquee-row--left">
          <div className="reviews-marquee-track">
            {row1.map((rev, idx) => (
              <ReviewCard key={`r1-${idx}`} review={rev} />
            ))}
          </div>
          <div className="reviews-marquee-track" aria-hidden="true">
            {row1.map((rev, idx) => (
              <ReviewCard key={`r1-dup-${idx}`} review={rev} />
            ))}
          </div>
        </div>

        {/* Row 2 — Scrolls Right */}
        <div className="reviews-marquee-row reviews-marquee-row--right">
          <div className="reviews-marquee-track">
            {row2.map((rev, idx) => (
              <ReviewCard key={`r2-${idx}`} review={rev} />
            ))}
          </div>
          <div className="reviews-marquee-track" aria-hidden="true">
            {row2.map((rev, idx) => (
              <ReviewCard key={`r2-dup-${idx}`} review={rev} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
