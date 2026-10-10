# Homepage hero photo credits

The slideshow uses local responsive derivatives of genuine photographs from Wikimedia Commons. No runtime image request goes to a third-party image CDN — every slide is self-hosted under `react/public/assets/home-hero/`.

Each source below was opened and verified: it is a real camera photograph (no AI-generated imagery, no AI disclaimer on the source page), the license was read from the file page's license metadata and permits commercial use on a travel website, and the exact photographer/author and source photo page are recorded. Attribution follows the CC BY / CC BY-SA requirements via this credits record.

| File stem | Landmark | Photographer/author | Exact source photo page | License | Verified real photograph |
| --- | --- | --- | --- | --- | --- |
| `taj-mahal-agra` | Taj Mahal, Agra | Yann | https://commons.wikimedia.org/wiki/File:Taj_Mahal,_Agra,_India.jpg | CC BY-SA 4.0 | Yes — bright daylight frontal view; Commons Quality Image + Wikipedia Featured Picture |
| `agra-fort` | Agra Fort | Preetam Chakraborty | https://commons.wikimedia.org/wiki/File:Sunset_at_Agra_Fort.jpg | CC BY-SA 4.0 | Yes — sunset glowing through an ornate Mughal archway |
| `fatehpur-sikri` | Fatehpur Sikri (Jama Masjid corridor) | Kuntal Guharaja | https://commons.wikimedia.org/wiki/File:Corridor_of_Jama_Masjid,_Fatehpur_Sikri,_Agra_during_sunset.jpg | CC BY-SA 4.0 | Yes — sunset light streaming through the pillared corridor |
| `hawa-mahal-jaipur` | Hawa Mahal, Jaipur | shikhers | https://commons.wikimedia.org/wiki/File:Hawa_Mahal_flooded_with_lights.jpg | CC BY-SA 4.0 | Yes — facade floodlit at dusk under a deep blue sky |
| `amber-fort-jaipur` | Amber Fort, Jaipur | Sumedh Patil | https://commons.wikimedia.org/wiki/File:Amber_Fort_Jaipur_india.jpg | CC BY-SA 4.0 | Yes — fort illuminated at night, reflected in Maota Lake |
| `india-gate-delhi` | India Gate, New Delhi | Aravindjnath | https://commons.wikimedia.org/wiki/File:India_Gate_at_night,_New_Delhi,_India.JPG | CC BY-SA 3.0 | Yes — memorial illuminated at night with glowing lamps |
| `varanasi-ghats` | Varanasi / Ganga Ghats | Nikhilesh Kumar Prajapati | https://commons.wikimedia.org/wiki/File:Light_in_Shade.jpg | CC BY-SA 4.0 | Yes — sun setting over the Ganges with boats and reflections |
| `kerala-backwaters` | Kerala backwaters | Mohanrangaphotography | https://commons.wikimedia.org/wiki/File:Alleppey_Boat_houses.jpg | CC BY-SA 4.0 | Yes — houseboats at sunset with palm reflections |
| `manali-solang-valley` | Manali / Himalayan ranges | Aniket431 | https://commons.wikimedia.org/wiki/File:Manali,himalayas.jpg | CC BY-SA 4.0 | Yes — sunrise over snow-capped ranges above clouds |
| `golden-temple-amritsar` | Golden Temple, Amritsar | Indiancuisne | https://commons.wikimedia.org/wiki/File:Golden_Temple_2022.jpg | CC BY-SA 4.0 | Yes — shrine at dawn with mirror reflection in the sarovar |

## Generated variants

Each slide has:

- `480` mobile crop (480×270);
- `960` tablet/medium crop (960×540);
- `1600` desktop crop (1600×900);
- WebP and AVIF formats.

All variants are 16:9, cropped deterministically from the source photograph with FFmpeg (no generative editing, no AI upscaling). The first slide (Taj Mahal) is served with `fetchpriority="high"` and correct intrinsic dimensions (1600×900) to prevent layout shift; mobile viewports receive the 480/960 variants via `srcset`/`sizes` so phones never download the desktop image.

## Licensing note

CC BY-SA 4.0 and CC BY-SA 3.0 permit commercial use with attribution and share-alike on adaptations of the image itself. Attribution for every slide is recorded in the table above and mirrored in `react/src/data/homeHeroSlides.ts`.
