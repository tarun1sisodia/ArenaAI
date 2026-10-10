# Homepage hero photo credits

The slideshow uses local responsive derivatives of genuine photographs from Wikimedia Commons. No runtime image request goes to a third-party image CDN — every slide is self-hosted under `react/public/assets/home-hero/`.

Each source below was opened and visually verified at full resolution: it is a real camera photograph (no AI-generated imagery, no AI disclaimer on the source page), the license was read from the file page's license metadata and permits commercial use on a travel website, and the exact photographer/author and source photo page are recorded. Attribution follows the CC BY / CC BY-SA / Free Art License requirements via this credits record.

The 2026-10-10 refresh replaced the whole set with very bright, high-key daylight photographs (mean luminance 0.53–0.67) so the slides show vividly on the page.

| File stem | Landmark | Photographer/author | Exact source photo page | License | Verified real photograph |
| --- | --- | --- | --- | --- | --- |
| `taj-mahal-agra` | Taj Mahal, Agra | Sourabhdotrai | https://commons.wikimedia.org/wiki/File:Taj_Mahal_on_a_bright_sunny_day.jpg | CC0 (public domain) | Yes — bright sunny frontal view, sunlit marble, vivid blue sky |
| `agra-fort` | Agra Fort | Benh | https://commons.wikimedia.org/wiki/File:Agra_03-2016_14_Agra_Fort.jpg | Free Art License 1.3 | Yes — sunlit white-marble Khas Mahal complex with gardens |
| `fatehpur-sikri` | Fatehpur Sikri (Buland Darwaza) | A.Savin | https://commons.wikimedia.org/wiki/File:Fatehpur_Sikri_near_Agra_2016-03_img08.jpg | Free Art License 1.3 | Yes — sunlit red-sandstone gate against a clear blue sky |
| `hawa-mahal-jaipur` | Hawa Mahal, Jaipur | Faraz iitj | https://commons.wikimedia.org/wiki/File:Hawa_Mahal_Day_View.jpg | CC BY-SA 4.0 | Yes — full sun on the pink facade, blue sky, crisp detail |
| `amber-fort-jaipur` | Amber Fort, Jaipur | A.Savin | https://commons.wikimedia.org/wiki/File:Jaipur_03-2016_02_Amber_Fort.jpg | Free Art License 1.3 | Yes — sunlit fort reflected across Maota Lake under blue sky |
| `india-gate-delhi` | India Gate, New Delhi | AravindGP | https://commons.wikimedia.org/wiki/File:All_India_War_Memorial_(INDIA_GATE).jpg | CC BY-SA 4.0 | Yes — sunlit sandstone memorial, saturated blue sky, white clouds |
| `varanasi-ghats` | Varanasi / Ganga Ghats | Suzerainty13 | https://commons.wikimedia.org/wiki/File:DASHASHWAMEDH_GHAT,_VARANASI.jpg | CC BY-SA 4.0 | Yes — warm daylight on Dashashwamedh Ghat, colorful boats and umbrellas |
| `kerala-backwaters` | Kerala backwaters | PrasanPadale | https://commons.wikimedia.org/wiki/File:Houseboat_at_Kerala_Backwaters.jpg | CC BY-SA 4.0 | Yes — houseboat on glittering water under a bright blue sky |
| `manali-solang-valley` | Manali / Solang Valley | Harvinder Chandigarh | https://commons.wikimedia.org/wiki/File:Solang_Valley_,Manali,_Himachal_Pardes,_India.JPG | CC BY-SA 4.0 | Yes — green valley with snow peaks under a blue sky, vivid and high-key |
| `golden-temple-amritsar` | Golden Temple, Amritsar | Oleg Yunakov | https://commons.wikimedia.org/wiki/File:Hamandir_Sahib_(Golden_Temple).jpg | CC BY-SA 3.0 | Yes — gleaming gold sanctum across the sarovar in full daylight |

## Generated variants

Each slide has:

- `480` mobile crop (480×270);
- `960` tablet/medium crop (960×540);
- `1600` desktop crop (1600×900);
- WebP and AVIF formats.

All variants are 16:9, cropped deterministically from the source photograph with FFmpeg (no generative editing, no AI upscaling). The first slide (Taj Mahal) is served with `fetchpriority="high"` and correct intrinsic dimensions (1600×900) to prevent layout shift; mobile viewports receive the 480/960 variants via `srcset`/`sizes` so phones never download the desktop image.

## Licensing note

CC0 is a public-domain dedication (no attribution required; photographer credited here anyway). CC BY-SA 4.0 and CC BY-SA 3.0 permit commercial use with attribution and share-alike on adaptations of the image itself. The Free Art License 1.3 likewise permits commercial use with attribution and share-alike. Attribution for every slide is recorded in the table above and mirrored in `react/src/data/homeHeroSlides.ts`.
