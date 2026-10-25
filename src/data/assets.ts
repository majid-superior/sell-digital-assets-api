/**
 * Digital Assets Dataset & Seed Definitions
 *
 * Generated automatically by 'npm run db:assets'.
 * Contains 61 realistic digital assets randomized across active platform sellers.
 * Generated at: 2026-10-24T21:14:38.707Z
 */

export interface AssetTierSeed {
  tierType: "personal" | "commercial" | "extended";
  price: number;
  licenseTermsSummary: string;
}

export interface AssetFileSeed {
  fileName: string;
  fileSizeBytes: number;
  version: string;
  storageKey: string;
}

export interface AssetMediaSeed {
  mediaType: "thumbnail" | "screenshot";
  url: string;
  displayOrder: number;
}

export interface DigitalAssetData {
  id?: string | undefined;
  sellerId?: string | undefined;
  sellerName?: string | undefined;
  sellerEmail?: string | undefined;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  previewUrl: string;
  storagePath: string;
  status: "published" | "pending" | "draft";
  tags: string[];
  technicalSpecs: Record<string, string>;
  viewCount: number;
  downloadCount: number;
  tiers: AssetTierSeed[];
  file: AssetFileSeed;
  media: AssetMediaSeed[];
  createdAt?: string | undefined;
}

export interface AssetTemplate {
  domain: "3d" | "ui-ux" | "code" | "motion" | "graphics" | "audio" | "general";
  categorySlug: string;
  titlePrefixes: string[];
  titleNouns: string[];
  titleSuffixes: string[];
  shortDescriptions: string[];
  fullDescriptions: string[];
  tags: string[];
  technicalSpecs: Record<string, string>;
  previewImages: string[];
  galleryImages: string[];
  suggestedFiles: string[];
}

export const assetTemplates: AssetTemplate[] = [
  {
    "domain": "3d",
    "categorySlug": "3d-models-and-cgi",
    "titlePrefixes": [
      "Cyberpunk",
      "Sci-Fi",
      "Low-Poly",
      "Photorealistic",
      "Futuristic",
      "Modular",
      "Stylized"
    ],
    "titleNouns": [
      "City Street Scene",
      "Character Rig",
      "Space Station Kit",
      "PBR Texture Suite",
      "Product Studio Rig",
      "Vehicle Fleet",
      "Mech Warrior"
    ],
    "titleSuffixes": [
      "4K PBR Bundle",
      "for Blender & Unreal",
      "Game-Ready Asset",
      "with Custom Shaders",
      "Studio Edition",
      "Collection v2"
    ],
    "shortDescriptions": [
      "Production-ready 3D asset featuring optimized polygon topology, 4K PBR textures, and universal FBX/OBJ exports.",
      "High-fidelity 3D model designed for game engines and architectural visualizers with clean UV unwraps.",
      "Modular 3D environment kit engineered for real-time engines with full LOD hierarchies and custom collision meshes."
    ],
    "fullDescriptions": [
      "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.",
      "Engineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins."
    ],
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "previewImages": [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1633493106185-1123bc882199?auto=format&fit=crop&w=1200&q=80"
    ],
    "galleryImages": [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1600&q=80"
    ],
    "suggestedFiles": [
      "cyberpunk-street-environment-3d.blend",
      "pbr-sci-fi-materials-pack-4k.zip",
      "3d-product-lighting-studio-rig.blend",
      "low-poly-medieval-game-characters.zip",
      "rpg-weapons-and-armor-3d-models.zip"
    ]
  },
  {
    "domain": "ui-ux",
    "categorySlug": "ui-and-ux-kits",
    "titlePrefixes": [
      "Enterprise",
      "Modern",
      "Minimalist",
      "Fintech",
      "Multi-Brand",
      "Clean",
      "Glassmorphic"
    ],
    "titleNouns": [
      "Design System",
      "Mobile App UI Kit",
      "Dashboard Analytics Library",
      "Component Vault",
      "Crypto Wallet Interface",
      "Commerce Flow Kit"
    ],
    "titleSuffixes": [
      "Figma Pro Edition",
      "with Auto-Layout 5",
      "Multi-Theme Ready",
      "Design Tokens Included",
      "WCAG Compliant",
      "v3.0 Release"
    ],
    "shortDescriptions": [
      "Enterprise-grade UI library featuring hundreds of accessible components, responsive layouts, and multi-brand design tokens.",
      "Comprehensive mobile and web interface system crafted in Figma with strict variable modes and atomic components.",
      "Production-focused Figma design system with full dark/light modes, accessible typography scales, and state variants."
    ],
    "fullDescriptions": [
      "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.",
      "Includes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks."
    ],
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "previewImages": [
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
    ],
    "galleryImages": [
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80"
    ],
    "suggestedFiles": [
      "figma-enterprise-design-system-2026.fig",
      "mobile-banking-fintech-ui-kit.fig",
      "dashboard-crm-tailwind-react-template.zip"
    ]
  },
  {
    "domain": "code",
    "categorySlug": "code-software-and-web",
    "titlePrefixes": [
      "Next.js 15",
      "Full-Stack",
      "High-Performance",
      "Scalable",
      "Microservice",
      "Serverless",
      "Enterprise"
    ],
    "titleNouns": [
      "SaaS Boilerplate",
      "REST API Framework",
      "Marketplace Engine",
      "E-Commerce Monorepo",
      "Cloud Starter Kit",
      "Authentication Backend"
    ],
    "titleSuffixes": [
      "with Stripe & Postgres",
      "TypeScript Native",
      "Production-Ready",
      "Docker & CI/CD",
      "TurboRepo Suite",
      "Zero Config"
    ],
    "shortDescriptions": [
      "Production-ready web application boilerplate with authentication, payments, database migrations, and edge deployments.",
      "Modern full-stack architecture built on Next.js 15, PostgreSQL, and Tailwind CSS engineered for rapid MVP-to-scale launches.",
      "Battle-tested microservice backend codebase featuring automated rate-limiting, JWT authentication, and connection pooling."
    ],
    "fullDescriptions": [
      "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.",
      "Written in strict TypeScript with 100% test coverage and zero runtime mock data dependencies."
    ],
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "previewImages": [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80"
    ],
    "galleryImages": [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80"
    ],
    "suggestedFiles": [
      "nextjs-enterprise-saas-starter-v2.zip",
      "express-postgres-microservices-kit.zip",
      "react-native-multivendor-marketplace.zip"
    ]
  },
  {
    "domain": "motion",
    "categorySlug": "video-and-motion-graphics",
    "titlePrefixes": [
      "Kinetic",
      "Cinematic",
      "Dynamic",
      "Glitch",
      "Broadcast",
      "High-Impact",
      "Futuristic"
    ],
    "titleNouns": [
      "Typography Presets",
      "Title Sequence Template",
      "Video Transitions Pack",
      "Lower Thirds Suite",
      "Logo Reveal Animation",
      "Promo Toolkit"
    ],
    "titleSuffixes": [
      "After Effects & Premiere",
      "4K Ultra HD",
      "Modular Pack",
      "Sound Effects Included",
      "Essential Graphics (.mogrt)",
      "Creator Suite"
    ],
    "shortDescriptions": [
      "Cinematic motion graphic templates and After Effects typography presets with universal expressions and 4K resolution.",
      "High-energy video transition pack engineered for Premiere Pro and After Effects with custom sound design.",
      "Broadcast-quality lower-thirds and title reveal animations designed for easy text and color customizations."
    ],
    "fullDescriptions": [
      "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.",
      "Compatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins."
    ],
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "previewImages": [
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80"
    ],
    "galleryImages": [
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1600&q=80"
    ],
    "suggestedFiles": [
      "kinetic-typography-after-effects.zip",
      "glitch-transition-presets-premiere.prproj"
    ]
  },
  {
    "domain": "graphics",
    "categorySlug": "graphics-and-design",
    "titlePrefixes": [
      "Minimalist",
      "Geometric",
      "Isometric",
      "Vibrant",
      "Hand-Crafted",
      "Abstract",
      "Scalable"
    ],
    "titleNouns": [
      "Vector Icon Bundle",
      "Brand Identity Mockup Kit",
      "Tech Illustration Suite",
      "Iconography System",
      "Social Media Graphics",
      "Pattern Collection"
    ],
    "titleSuffixes": [
      "1,200+ Icons Pack",
      "PSD & Vector AI",
      "SVG & Figma Ready",
      "Curated Designer Edition",
      "Commercial Asset Set"
    ],
    "shortDescriptions": [
      "Curated vector icon pack and scalable graphic illustrations formatted in SVG, EPS, and high-resolution PNG.",
      "Photorealistic branding stationery mockup scenes with smart objects, displacement maps, and custom shadows.",
      "Isometric digital technology illustrations depicting cloud infrastructure, AI nodes, and cybersecurity workflows."
    ],
    "fullDescriptions": [
      "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.",
      "Delivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories."
    ],
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "previewImages": [
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80"
    ],
    "galleryImages": [
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1600&q=80"
    ],
    "suggestedFiles": [
      "vector-brand-icon-library-1200.zip",
      "minimalist-branding-stationery-mockups.psd",
      "isometric-tech-illustrations-pack.zip",
      "cyberpunk-futuristic-display-font.zip"
    ]
  },
  {
    "domain": "audio",
    "categorySlug": "audio-and-sound-production",
    "titlePrefixes": [
      "Cinematic",
      "Ambient",
      "Cyberpunk",
      "Orchestral",
      "Epic",
      "Lo-Fi",
      "Foley"
    ],
    "titleNouns": [
      "Game Audio Tracks",
      "Sound Effects Library",
      "Trailer Scoring Pack",
      "Atmosphere Loop Suite",
      "UI Soundscapes Kit",
      "Action Impacts Pack"
    ],
    "titleSuffixes": [
      "Royalty-Free WAV",
      "Lossless 96kHz/24bit",
      "Broadcast Licensed",
      "Game Engine Ready",
      "Volume 1"
    ],
    "shortDescriptions": [
      "High-definition royalty-free audio tracks and atmospheric sound loops mastered for interactive game audio and trailers.",
      "Studio-recorded Foley sound effects library with cinematic whooshes, impacts, and mechanical interfaces."
    ],
    "fullDescriptions": [
      "Elevate game presence and media productions with studio-mastered lossless audio. Includes seamlessly loopable stems, alternative mixes, and metadata embedded for Soundminer and BaseHead."
    ],
    "tags": [
      "audio",
      "sound-effects",
      "soundtrack",
      "game-audio",
      "wav",
      "royalty-free",
      "music"
    ],
    "technicalSpecs": {
      "Format": "WAV (96kHz / 24-bit)",
      "Channels": "Stereo 2.0 & Binaural 3D",
      "Loopable": "Yes (Seamless Stems Included)",
      "Mastering": "-14 LUFS Streaming Standard"
    },
    "previewImages": [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80"
    ],
    "galleryImages": [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80"
    ],
    "suggestedFiles": [
      "ambient-game-soundtracks-wav-bundle.zip",
      "cinematic-sound-effects-foley-pack.zip"
    ]
  }
];

export function generateRandomTiers(basePriceMultiplier = 1): AssetTierSeed[] {
  const basePersonal = Math.round((19 + Math.random() * 20) * basePriceMultiplier);
  const baseCommercial = Math.round(basePersonal * 2.5 + Math.random() * 15);
  const baseExtended = Math.round(baseCommercial * 2.8 + Math.random() * 40);

  return [
    {
      tierType: "personal",
      price: basePersonal,
      licenseTermsSummary: "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited.",
    },
    {
      tierType: "commercial",
      price: baseCommercial,
      licenseTermsSummary: "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited.",
    },
    {
      tierType: "extended",
      price: baseExtended,
      licenseTermsSummary: "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights.",
    },
  ];
}

/**
 * Seeded Digital Assets Registry (61 items)
 */
export const defaultAssets: DigitalAssetData[] = [
  {
    "id": "fef36c4c-f337-4710-bf3e-6baa545b10f7",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Glassmorphic Crypto Wallet Interface Multi-Theme Ready",
    "slug": "glassmorphic-crypto-wallet-interface-multi-theme-ready-2q5bv",
    "shortDescription": "Production-focused Figma design system with full dark/light modes, accessible typography scales, and state variants.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/fef36c4c-f337-4710-bf3e-6baa545b10f7/thumbnail.webp",
    "storagePath": "vault/assets/glassmorphic-crypto-wallet-interface-multi-theme-ready-2q5bv/dashboard-crm-tailwind-react-template.zip",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 1487,
    "downloadCount": 349,
    "tiers": [
      {
        "tierType": "personal",
        "price": 25,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 63,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 187,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "dashboard-crm-tailwind-react-template.zip",
      "fileSizeBytes": 134,
      "version": "1.0.0",
      "storageKey": "vault/assets/glassmorphic-crypto-wallet-interface-multi-theme-ready-2q5bv/dashboard-crm-tailwind-react-template.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/fef36c4c-f337-4710-bf3e-6baa545b10f7/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/fef36c4c-f337-4710-bf3e-6baa545b10f7/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:04.128Z"
  },
  {
    "id": "6c9d4171-edc5-4dc9-8b8d-1a6b3fefadc4",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Modern Commerce Flow Kit v3.0 Release",
    "slug": "modern-commerce-flow-kit-v3-0-release-6f3i1",
    "shortDescription": "Comprehensive mobile and web interface system crafted in Figma with strict variable modes and atomic components.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/6c9d4171-edc5-4dc9-8b8d-1a6b3fefadc4/thumbnail.webp",
    "storagePath": "vault/assets/modern-commerce-flow-kit-v3-0-release-6f3i1/ai-prompt-vault-midjourney-v6.pdf",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 1955,
    "downloadCount": 378,
    "tiers": [
      {
        "tierType": "personal",
        "price": 20,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 53,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 163,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "ai-prompt-vault-midjourney-v6.pdf",
      "fileSizeBytes": 130,
      "version": "1.0.0",
      "storageKey": "vault/assets/modern-commerce-flow-kit-v3-0-release-6f3i1/ai-prompt-vault-midjourney-v6.pdf"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/6c9d4171-edc5-4dc9-8b8d-1a6b3fefadc4/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/6c9d4171-edc5-4dc9-8b8d-1a6b3fefadc4/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:07.495Z"
  },
  {
    "id": "2251c4c0-5d6e-4983-b232-2a61bbaa6aee",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Glassmorphic Component Vault with Auto-Layout 5",
    "slug": "glassmorphic-component-vault-with-auto-layout-5-ppmu3",
    "shortDescription": "Enterprise-grade UI library featuring hundreds of accessible components, responsive layouts, and multi-brand design tokens.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2251c4c0-5d6e-4983-b232-2a61bbaa6aee/thumbnail.webp",
    "storagePath": "vault/assets/glassmorphic-component-vault-with-auto-layout-5-ppmu3/nextjs-enterprise-saas-starter-v2.zip",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 1982,
    "downloadCount": 201,
    "tiers": [
      {
        "tierType": "personal",
        "price": 25,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 72,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 237,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "nextjs-enterprise-saas-starter-v2.zip",
      "fileSizeBytes": 116,
      "version": "1.0.0",
      "storageKey": "vault/assets/glassmorphic-component-vault-with-auto-layout-5-ppmu3/nextjs-enterprise-saas-starter-v2.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2251c4c0-5d6e-4983-b232-2a61bbaa6aee/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2251c4c0-5d6e-4983-b232-2a61bbaa6aee/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:09.881Z"
  },
  {
    "id": "05e3d1fb-5ab8-4a8c-ad54-754bb78f10b5",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Clean Dashboard Analytics Library v3.0 Release",
    "slug": "clean-dashboard-analytics-library-v3-0-release-9ml07",
    "shortDescription": "Enterprise-grade UI library featuring hundreds of accessible components, responsive layouts, and multi-brand design tokens.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/05e3d1fb-5ab8-4a8c-ad54-754bb78f10b5/thumbnail.webp",
    "storagePath": "vault/assets/clean-dashboard-analytics-library-v3-0-release-9ml07/low-poly-medieval-game-characters.zip",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 2334,
    "downloadCount": 353,
    "tiers": [
      {
        "tierType": "personal",
        "price": 29,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 75,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 219,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "low-poly-medieval-game-characters.zip",
      "fileSizeBytes": 136,
      "version": "1.0.0",
      "storageKey": "vault/assets/clean-dashboard-analytics-library-v3-0-release-9ml07/low-poly-medieval-game-characters.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/05e3d1fb-5ab8-4a8c-ad54-754bb78f10b5/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/05e3d1fb-5ab8-4a8c-ad54-754bb78f10b5/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:12.713Z"
  },
  {
    "id": "87489eaa-ae65-4e88-8cef-fc3a5054b438",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Clean Dashboard Analytics Library Multi-Theme Ready",
    "slug": "clean-dashboard-analytics-library-multi-theme-ready-luyae",
    "shortDescription": "Enterprise-grade UI library featuring hundreds of accessible components, responsive layouts, and multi-brand design tokens.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/87489eaa-ae65-4e88-8cef-fc3a5054b438/thumbnail.webp",
    "storagePath": "vault/assets/clean-dashboard-analytics-library-multi-theme-ready-luyae/glitch-transition-presets-premiere.prproj",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 397,
    "downloadCount": 109,
    "tiers": [
      {
        "tierType": "personal",
        "price": 36,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 100,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 313,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "glitch-transition-presets-premiere.prproj",
      "fileSizeBytes": 121,
      "version": "1.0.0",
      "storageKey": "vault/assets/clean-dashboard-analytics-library-multi-theme-ready-luyae/glitch-transition-presets-premiere.prproj"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/87489eaa-ae65-4e88-8cef-fc3a5054b438/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/87489eaa-ae65-4e88-8cef-fc3a5054b438/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:15.557Z"
  },
  {
    "id": "ac77affc-06fb-4bea-b973-afb0fe7f041f",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Enterprise Dashboard Analytics Library Figma Pro Edition",
    "slug": "enterprise-dashboard-analytics-library-figma-pro-edition-e4jac",
    "shortDescription": "Production-focused Figma design system with full dark/light modes, accessible typography scales, and state variants.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/ac77affc-06fb-4bea-b973-afb0fe7f041f/thumbnail.webp",
    "storagePath": "vault/assets/enterprise-dashboard-analytics-library-figma-pro-edition-e4jac/react-native-multivendor-marketplace.zip",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 2245,
    "downloadCount": 220,
    "tiers": [
      {
        "tierType": "personal",
        "price": 29,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 82,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 240,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "react-native-multivendor-marketplace.zip",
      "fileSizeBytes": 129,
      "version": "1.0.0",
      "storageKey": "vault/assets/enterprise-dashboard-analytics-library-figma-pro-edition-e4jac/react-native-multivendor-marketplace.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/ac77affc-06fb-4bea-b973-afb0fe7f041f/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/ac77affc-06fb-4bea-b973-afb0fe7f041f/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:18.067Z"
  },
  {
    "id": "7c6496fd-6c94-4f9d-b113-df8e6f275967",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Clean Component Vault Multi-Theme Ready",
    "slug": "clean-component-vault-multi-theme-ready-uob9n",
    "shortDescription": "Comprehensive mobile and web interface system crafted in Figma with strict variable modes and atomic components.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/7c6496fd-6c94-4f9d-b113-df8e6f275967/thumbnail.webp",
    "storagePath": "vault/assets/clean-component-vault-multi-theme-ready-uob9n/ai-prompt-vault-midjourney-v6.pdf",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 1971,
    "downloadCount": 207,
    "tiers": [
      {
        "tierType": "personal",
        "price": 31,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 91,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 270,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "ai-prompt-vault-midjourney-v6.pdf",
      "fileSizeBytes": 130,
      "version": "1.0.0",
      "storageKey": "vault/assets/clean-component-vault-multi-theme-ready-uob9n/ai-prompt-vault-midjourney-v6.pdf"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/7c6496fd-6c94-4f9d-b113-df8e6f275967/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/7c6496fd-6c94-4f9d-b113-df8e6f275967/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:21.162Z"
  },
  {
    "id": "8358d9b7-eb91-4303-a692-3eb7824bb05d",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Enterprise Dashboard Analytics Library v3.0 Release",
    "slug": "enterprise-dashboard-analytics-library-v3-0-release-6ld5b",
    "shortDescription": "Production-focused Figma design system with full dark/light modes, accessible typography scales, and state variants.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8358d9b7-eb91-4303-a692-3eb7824bb05d/thumbnail.webp",
    "storagePath": "vault/assets/enterprise-dashboard-analytics-library-v3-0-release-6ld5b/react-native-multivendor-marketplace.zip",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 1366,
    "downloadCount": 106,
    "tiers": [
      {
        "tierType": "personal",
        "price": 20,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 60,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 181,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "react-native-multivendor-marketplace.zip",
      "fileSizeBytes": 129,
      "version": "1.0.0",
      "storageKey": "vault/assets/enterprise-dashboard-analytics-library-v3-0-release-6ld5b/react-native-multivendor-marketplace.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8358d9b7-eb91-4303-a692-3eb7824bb05d/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8358d9b7-eb91-4303-a692-3eb7824bb05d/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:23.563Z"
  },
  {
    "id": "650d837b-b21c-41d9-85ea-6246b08f3813",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Enterprise Crypto Wallet Interface v3.0 Release",
    "slug": "enterprise-crypto-wallet-interface-v3-0-release-wcm8a",
    "shortDescription": "Production-focused Figma design system with full dark/light modes, accessible typography scales, and state variants.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/650d837b-b21c-41d9-85ea-6246b08f3813/thumbnail.webp",
    "storagePath": "vault/assets/enterprise-crypto-wallet-interface-v3-0-release-wcm8a/kinetic-typography-after-effects.zip",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 811,
    "downloadCount": 147,
    "tiers": [
      {
        "tierType": "personal",
        "price": 37,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 107,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 337,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "kinetic-typography-after-effects.zip",
      "fileSizeBytes": 142,
      "version": "1.0.0",
      "storageKey": "vault/assets/enterprise-crypto-wallet-interface-v3-0-release-wcm8a/kinetic-typography-after-effects.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/650d837b-b21c-41d9-85ea-6246b08f3813/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/650d837b-b21c-41d9-85ea-6246b08f3813/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:25.990Z"
  },
  {
    "id": "5273487c-d573-4509-bc40-cb5ddcfdd9ab",
    "sellerId": "d86c0864-6e9e-4106-81b2-e467900bcb8b",
    "sellerName": "Ali",
    "sellerEmail": "ali@ovi.com",
    "categoryId": 15,
    "categorySlug": "ui-and-ux-kits",
    "categoryName": "UI & UX Kits",
    "title": "Glassmorphic Component Vault Multi-Theme Ready",
    "slug": "glassmorphic-component-vault-multi-theme-ready-a9ue5",
    "shortDescription": "Comprehensive mobile and web interface system crafted in Figma with strict variable modes and atomic components.",
    "fullDescription": "Accelerate product delivery with over 450+ production-verified components, auto-layout 5 architectures, comprehensive mobile app flows, and typography hierarchies built according to WCAG 2.2 AA accessibility standards.\n\nIncludes complete design token architecture compatible with Tailwind CSS, CSS variables, and modern front-end frameworks.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5273487c-d573-4509-bc40-cb5ddcfdd9ab/thumbnail.webp",
    "storagePath": "vault/assets/glassmorphic-component-vault-multi-theme-ready-a9ue5/express-postgres-microservices-kit.zip",
    "status": "published",
    "tags": [
      "figma",
      "ui-kit",
      "design-system",
      "fintech",
      "mobile-ui",
      "dashboard",
      "tokens"
    ],
    "technicalSpecs": {
      "Format": "Figma (.fig), Design Tokens (JSON)",
      "Components": "450+ Variants",
      "Themes": "Light & Dark Modes",
      "AutoLayout": "Version 5.0 Compliant",
      "Accessibility": "WCAG 2.2 AA Verified"
    },
    "viewCount": 1102,
    "downloadCount": 143,
    "tiers": [
      {
        "tierType": "personal",
        "price": 23,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 67,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 190,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "express-postgres-microservices-kit.zip",
      "fileSizeBytes": 131,
      "version": "1.0.0",
      "storageKey": "vault/assets/glassmorphic-component-vault-multi-theme-ready-a9ue5/express-postgres-microservices-kit.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5273487c-d573-4509-bc40-cb5ddcfdd9ab/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5273487c-d573-4509-bc40-cb5ddcfdd9ab/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:28.266Z"
  },
  {
    "id": "24505e61-1446-4064-93c3-7a2f14de35fa",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Microservice Cloud Starter Kit TurboRepo Suite",
    "slug": "microservice-cloud-starter-kit-turborepo-suite-9u5qc",
    "shortDescription": "Production-ready web application boilerplate with authentication, payments, database migrations, and edge deployments.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/24505e61-1446-4064-93c3-7a2f14de35fa/thumbnail.webp",
    "storagePath": "vault/assets/microservice-cloud-starter-kit-turborepo-suite-9u5qc/dashboard-crm-tailwind-react-template.zip",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 1840,
    "downloadCount": 363,
    "tiers": [
      {
        "tierType": "personal",
        "price": 39,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 98,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 281,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "dashboard-crm-tailwind-react-template.zip",
      "fileSizeBytes": 134,
      "version": "1.0.0",
      "storageKey": "vault/assets/microservice-cloud-starter-kit-turborepo-suite-9u5qc/dashboard-crm-tailwind-react-template.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/24505e61-1446-4064-93c3-7a2f14de35fa/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/24505e61-1446-4064-93c3-7a2f14de35fa/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:30.578Z"
  },
  {
    "id": "5e88ebce-cf00-464c-a5a9-6f60f0b56e25",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Serverless E-Commerce Monorepo TurboRepo Suite",
    "slug": "serverless-e-commerce-monorepo-turborepo-suite-0gjie",
    "shortDescription": "Production-ready web application boilerplate with authentication, payments, database migrations, and edge deployments.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5e88ebce-cf00-464c-a5a9-6f60f0b56e25/thumbnail.webp",
    "storagePath": "vault/assets/serverless-e-commerce-monorepo-turborepo-suite-0gjie/3d-product-lighting-studio-rig.blend",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 1149,
    "downloadCount": 200,
    "tiers": [
      {
        "tierType": "personal",
        "price": 29,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 73,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 208,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "3d-product-lighting-studio-rig.blend",
      "fileSizeBytes": 125,
      "version": "1.0.0",
      "storageKey": "vault/assets/serverless-e-commerce-monorepo-turborepo-suite-0gjie/3d-product-lighting-studio-rig.blend"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5e88ebce-cf00-464c-a5a9-6f60f0b56e25/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5e88ebce-cf00-464c-a5a9-6f60f0b56e25/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:32.853Z"
  },
  {
    "id": "c0800d35-f3c6-458e-8678-00b6996ed60a",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Enterprise Authentication Backend with Stripe & Postgres",
    "slug": "enterprise-authentication-backend-with-stripe-and-postgres-yqyye",
    "shortDescription": "Production-ready web application boilerplate with authentication, payments, database migrations, and edge deployments.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/c0800d35-f3c6-458e-8678-00b6996ed60a/thumbnail.webp",
    "storagePath": "vault/assets/enterprise-authentication-backend-with-stripe-and-postgres-yqyye/express-postgres-microservices-kit.zip",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 1766,
    "downloadCount": 100,
    "tiers": [
      {
        "tierType": "personal",
        "price": 36,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 101,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 322,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "express-postgres-microservices-kit.zip",
      "fileSizeBytes": 131,
      "version": "1.0.0",
      "storageKey": "vault/assets/enterprise-authentication-backend-with-stripe-and-postgres-yqyye/express-postgres-microservices-kit.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/c0800d35-f3c6-458e-8678-00b6996ed60a/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/c0800d35-f3c6-458e-8678-00b6996ed60a/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:35.111Z"
  },
  {
    "id": "cd747d06-bde2-44e0-9120-a6dcf0b8022b",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Next.js 15 E-Commerce Monorepo TypeScript Native",
    "slug": "next-js-15-e-commerce-monorepo-typescript-native-mhnfj",
    "shortDescription": "Production-ready web application boilerplate with authentication, payments, database migrations, and edge deployments.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/cd747d06-bde2-44e0-9120-a6dcf0b8022b/thumbnail.webp",
    "storagePath": "vault/assets/next-js-15-e-commerce-monorepo-typescript-native-mhnfj/react-native-multivendor-marketplace.zip",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 692,
    "downloadCount": 97,
    "tiers": [
      {
        "tierType": "personal",
        "price": 58,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 160,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 474,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "react-native-multivendor-marketplace.zip",
      "fileSizeBytes": 129,
      "version": "1.0.0",
      "storageKey": "vault/assets/next-js-15-e-commerce-monorepo-typescript-native-mhnfj/react-native-multivendor-marketplace.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/cd747d06-bde2-44e0-9120-a6dcf0b8022b/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/cd747d06-bde2-44e0-9120-a6dcf0b8022b/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:37.443Z"
  },
  {
    "id": "918959ce-789b-4c3e-bbcc-fa9cd91124b2",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "High-Performance E-Commerce Monorepo Production-Ready",
    "slug": "high-performance-e-commerce-monorepo-production-ready-ac9uo",
    "shortDescription": "Modern full-stack architecture built on Next.js 15, PostgreSQL, and Tailwind CSS engineered for rapid MVP-to-scale launches.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/918959ce-789b-4c3e-bbcc-fa9cd91124b2/thumbnail.webp",
    "storagePath": "vault/assets/high-performance-e-commerce-monorepo-production-ready-ac9uo/vector-brand-icon-library-1200.zip",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 1182,
    "downloadCount": 260,
    "tiers": [
      {
        "tierType": "personal",
        "price": 43,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 112,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 335,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "vector-brand-icon-library-1200.zip",
      "fileSizeBytes": 126,
      "version": "1.0.0",
      "storageKey": "vault/assets/high-performance-e-commerce-monorepo-production-ready-ac9uo/vector-brand-icon-library-1200.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/918959ce-789b-4c3e-bbcc-fa9cd91124b2/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/918959ce-789b-4c3e-bbcc-fa9cd91124b2/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:39.725Z"
  },
  {
    "id": "d5cdf1ea-2fd1-49f5-ae82-d045fb7f256d",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Microservice Marketplace Engine with Stripe & Postgres",
    "slug": "microservice-marketplace-engine-with-stripe-and-postgres-rkdyy",
    "shortDescription": "Battle-tested microservice backend codebase featuring automated rate-limiting, JWT authentication, and connection pooling.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d5cdf1ea-2fd1-49f5-ae82-d045fb7f256d/thumbnail.webp",
    "storagePath": "vault/assets/microservice-marketplace-engine-with-stripe-and-postgres-rkdyy/express-postgres-microservices-kit.zip",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 530,
    "downloadCount": 138,
    "tiers": [
      {
        "tierType": "personal",
        "price": 52,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 141,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 417,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "express-postgres-microservices-kit.zip",
      "fileSizeBytes": 131,
      "version": "1.0.0",
      "storageKey": "vault/assets/microservice-marketplace-engine-with-stripe-and-postgres-rkdyy/express-postgres-microservices-kit.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d5cdf1ea-2fd1-49f5-ae82-d045fb7f256d/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d5cdf1ea-2fd1-49f5-ae82-d045fb7f256d/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:42.009Z"
  },
  {
    "id": "6d61a48d-ece0-4a05-94fa-2461058cb8f3",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Next.js 15 REST API Framework with Stripe & Postgres",
    "slug": "next-js-15-rest-api-framework-with-stripe-and-postgres-y9v7w",
    "shortDescription": "Battle-tested microservice backend codebase featuring automated rate-limiting, JWT authentication, and connection pooling.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/6d61a48d-ece0-4a05-94fa-2461058cb8f3/thumbnail.webp",
    "storagePath": "vault/assets/next-js-15-rest-api-framework-with-stripe-and-postgres-y9v7w/ai-prompt-vault-midjourney-v6.pdf",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 1174,
    "downloadCount": 145,
    "tiers": [
      {
        "tierType": "personal",
        "price": 32,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 90,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 257,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "ai-prompt-vault-midjourney-v6.pdf",
      "fileSizeBytes": 130,
      "version": "1.0.0",
      "storageKey": "vault/assets/next-js-15-rest-api-framework-with-stripe-and-postgres-y9v7w/ai-prompt-vault-midjourney-v6.pdf"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/6d61a48d-ece0-4a05-94fa-2461058cb8f3/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/6d61a48d-ece0-4a05-94fa-2461058cb8f3/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:44.362Z"
  },
  {
    "id": "8f40eadc-dba4-431a-b0f2-acf94d268ab4",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Scalable SaaS Boilerplate TypeScript Native",
    "slug": "scalable-saas-boilerplate-typescript-native-wt20q",
    "shortDescription": "Modern full-stack architecture built on Next.js 15, PostgreSQL, and Tailwind CSS engineered for rapid MVP-to-scale launches.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8f40eadc-dba4-431a-b0f2-acf94d268ab4/thumbnail.webp",
    "storagePath": "vault/assets/scalable-saas-boilerplate-typescript-native-wt20q/mobile-banking-fintech-ui-kit.fig",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 1037,
    "downloadCount": 203,
    "tiers": [
      {
        "tierType": "personal",
        "price": 39,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 99,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 302,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "mobile-banking-fintech-ui-kit.fig",
      "fileSizeBytes": 125,
      "version": "1.0.0",
      "storageKey": "vault/assets/scalable-saas-boilerplate-typescript-native-wt20q/mobile-banking-fintech-ui-kit.fig"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8f40eadc-dba4-431a-b0f2-acf94d268ab4/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8f40eadc-dba4-431a-b0f2-acf94d268ab4/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:46.785Z"
  },
  {
    "id": "2559ee6c-579b-4bd8-a9d5-3f60ef725711",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Microservice E-Commerce Monorepo Zero Config",
    "slug": "microservice-e-commerce-monorepo-zero-config-qb2hy",
    "shortDescription": "Modern full-stack architecture built on Next.js 15, PostgreSQL, and Tailwind CSS engineered for rapid MVP-to-scale launches.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2559ee6c-579b-4bd8-a9d5-3f60ef725711/thumbnail.webp",
    "storagePath": "vault/assets/microservice-e-commerce-monorepo-zero-config-qb2hy/mobile-banking-fintech-ui-kit.fig",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 2060,
    "downloadCount": 331,
    "tiers": [
      {
        "tierType": "personal",
        "price": 41,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 103,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 301,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "mobile-banking-fintech-ui-kit.fig",
      "fileSizeBytes": 125,
      "version": "1.0.0",
      "storageKey": "vault/assets/microservice-e-commerce-monorepo-zero-config-qb2hy/mobile-banking-fintech-ui-kit.fig"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2559ee6c-579b-4bd8-a9d5-3f60ef725711/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2559ee6c-579b-4bd8-a9d5-3f60ef725711/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:49.367Z"
  },
  {
    "id": "134a24d7-791b-47d4-b444-4ac9f15290c6",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Scalable Authentication Backend Zero Config",
    "slug": "scalable-authentication-backend-zero-config-ksjvb",
    "shortDescription": "Battle-tested microservice backend codebase featuring automated rate-limiting, JWT authentication, and connection pooling.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/134a24d7-791b-47d4-b444-4ac9f15290c6/thumbnail.webp",
    "storagePath": "vault/assets/scalable-authentication-backend-zero-config-ksjvb/react-native-multivendor-marketplace.zip",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 2006,
    "downloadCount": 267,
    "tiers": [
      {
        "tierType": "personal",
        "price": 34,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 98,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 298,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "react-native-multivendor-marketplace.zip",
      "fileSizeBytes": 129,
      "version": "1.0.0",
      "storageKey": "vault/assets/scalable-authentication-backend-zero-config-ksjvb/react-native-multivendor-marketplace.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/134a24d7-791b-47d4-b444-4ac9f15290c6/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/134a24d7-791b-47d4-b444-4ac9f15290c6/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:51.666Z"
  },
  {
    "id": "d8b647a1-5489-430a-bb51-d7361d2810fe",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Microservice SaaS Boilerplate TypeScript Native",
    "slug": "microservice-saas-boilerplate-typescript-native-hf7f9",
    "shortDescription": "Battle-tested microservice backend codebase featuring automated rate-limiting, JWT authentication, and connection pooling.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d8b647a1-5489-430a-bb51-d7361d2810fe/thumbnail.webp",
    "storagePath": "vault/assets/microservice-saas-boilerplate-typescript-native-hf7f9/cinematic-sound-effects-foley-pack.zip",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 1447,
    "downloadCount": 228,
    "tiers": [
      {
        "tierType": "personal",
        "price": 43,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 111,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 324,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "cinematic-sound-effects-foley-pack.zip",
      "fileSizeBytes": 134,
      "version": "1.0.0",
      "storageKey": "vault/assets/microservice-saas-boilerplate-typescript-native-hf7f9/cinematic-sound-effects-foley-pack.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d8b647a1-5489-430a-bb51-d7361d2810fe/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d8b647a1-5489-430a-bb51-d7361d2810fe/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:53.974Z"
  },
  {
    "id": "19115bbc-0ad1-4a82-b607-f16315debfc3",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "High-Performance SaaS Boilerplate TypeScript Native",
    "slug": "high-performance-saas-boilerplate-typescript-native-taqcv",
    "shortDescription": "Modern full-stack architecture built on Next.js 15, PostgreSQL, and Tailwind CSS engineered for rapid MVP-to-scale launches.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/19115bbc-0ad1-4a82-b607-f16315debfc3/thumbnail.webp",
    "storagePath": "vault/assets/high-performance-saas-boilerplate-typescript-native-taqcv/ai-prompt-vault-midjourney-v6.pdf",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 924,
    "downloadCount": 211,
    "tiers": [
      {
        "tierType": "personal",
        "price": 50,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 137,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 410,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "ai-prompt-vault-midjourney-v6.pdf",
      "fileSizeBytes": 130,
      "version": "1.0.0",
      "storageKey": "vault/assets/high-performance-saas-boilerplate-typescript-native-taqcv/ai-prompt-vault-midjourney-v6.pdf"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/19115bbc-0ad1-4a82-b607-f16315debfc3/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/19115bbc-0ad1-4a82-b607-f16315debfc3/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:56.245Z"
  },
  {
    "id": "0457c544-d80e-4b62-bb82-07c5e4c84be5",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Microservice REST API Framework Production-Ready",
    "slug": "microservice-rest-api-framework-production-ready-2vdix",
    "shortDescription": "Production-ready web application boilerplate with authentication, payments, database migrations, and edge deployments.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/0457c544-d80e-4b62-bb82-07c5e4c84be5/thumbnail.webp",
    "storagePath": "vault/assets/microservice-rest-api-framework-production-ready-2vdix/pbr-sci-fi-materials-pack-4k.zip",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 596,
    "downloadCount": 62,
    "tiers": [
      {
        "tierType": "personal",
        "price": 57,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 156,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 458,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "pbr-sci-fi-materials-pack-4k.zip",
      "fileSizeBytes": 127,
      "version": "1.0.0",
      "storageKey": "vault/assets/microservice-rest-api-framework-production-ready-2vdix/pbr-sci-fi-materials-pack-4k.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/0457c544-d80e-4b62-bb82-07c5e4c84be5/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/0457c544-d80e-4b62-bb82-07c5e4c84be5/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:12:58.566Z"
  },
  {
    "id": "ab0ffd55-6f9d-4c75-81fd-c7ea5c63a318",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Microservice Authentication Backend with Stripe & Postgres",
    "slug": "microservice-authentication-backend-with-stripe-and-postgres-sukjc",
    "shortDescription": "Battle-tested microservice backend codebase featuring automated rate-limiting, JWT authentication, and connection pooling.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/ab0ffd55-6f9d-4c75-81fd-c7ea5c63a318/thumbnail.webp",
    "storagePath": "vault/assets/microservice-authentication-backend-with-stripe-and-postgres-sukjc/figma-enterprise-design-system-2026.fig",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 1549,
    "downloadCount": 290,
    "tiers": [
      {
        "tierType": "personal",
        "price": 58,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 149,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 432,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "figma-enterprise-design-system-2026.fig",
      "fileSizeBytes": 115,
      "version": "1.0.0",
      "storageKey": "vault/assets/microservice-authentication-backend-with-stripe-and-postgres-sukjc/figma-enterprise-design-system-2026.fig"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/ab0ffd55-6f9d-4c75-81fd-c7ea5c63a318/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/ab0ffd55-6f9d-4c75-81fd-c7ea5c63a318/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:00.873Z"
  },
  {
    "id": "da7c9df4-bd0a-467b-a316-f994069551ac",
    "sellerId": "78320649-a3d3-41d1-b96a-b93694efcddb",
    "sellerName": "Asif",
    "sellerEmail": "asif@ovi.com",
    "categoryId": 3,
    "categorySlug": "code-software-and-web",
    "categoryName": "Code, Software & Web",
    "title": "Serverless Marketplace Engine with Stripe & Postgres",
    "slug": "serverless-marketplace-engine-with-stripe-and-postgres-y5kvm",
    "shortDescription": "Modern full-stack architecture built on Next.js 15, PostgreSQL, and Tailwind CSS engineered for rapid MVP-to-scale launches.",
    "fullDescription": "Stop wasting weeks on boilerplates. This production codebase includes automated dual-token JWT authentication, transactional emails, multi-tenant database partitioning, Stripe checkout webhooks, and GitHub Actions deployment workflows.\n\nWritten in strict TypeScript with 100% test coverage and zero runtime mock data dependencies.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/da7c9df4-bd0a-467b-a316-f994069551ac/thumbnail.webp",
    "storagePath": "vault/assets/serverless-marketplace-engine-with-stripe-and-postgres-y5kvm/pbr-sci-fi-materials-pack-4k.zip",
    "status": "published",
    "tags": [
      "nextjs",
      "typescript",
      "react",
      "postgresql",
      "saas",
      "stripe",
      "fullstack"
    ],
    "technicalSpecs": {
      "Framework": "Next.js 15 App Router / Express 5",
      "Database": "PostgreSQL 16 via Connection Pool",
      "Language": "TypeScript 5.6 (Strict Mode)",
      "Authentication": "Dual-Token JWT & Bcrypt",
      "Deployment": "Docker, Vercel & AWS S3 Ready"
    },
    "viewCount": 893,
    "downloadCount": 40,
    "tiers": [
      {
        "tierType": "personal",
        "price": 42,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 118,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 336,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "pbr-sci-fi-materials-pack-4k.zip",
      "fileSizeBytes": 127,
      "version": "1.0.0",
      "storageKey": "vault/assets/serverless-marketplace-engine-with-stripe-and-postgres-y5kvm/pbr-sci-fi-materials-pack-4k.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/da7c9df4-bd0a-467b-a316-f994069551ac/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/da7c9df4-bd0a-467b-a316-f994069551ac/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:03.152Z"
  },
  {
    "id": "3dd663eb-993b-46c8-a2aa-a91da318dac2",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Low-Poly Product Studio Rig Studio Edition",
    "slug": "low-poly-product-studio-rig-studio-edition-1piik",
    "shortDescription": "Production-ready 3D asset featuring optimized polygon topology, 4K PBR textures, and universal FBX/OBJ exports.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/3dd663eb-993b-46c8-a2aa-a91da318dac2/thumbnail.webp",
    "storagePath": "vault/assets/low-poly-product-studio-rig-studio-edition-1piik/pbr-sci-fi-materials-pack-4k.zip",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 293,
    "downloadCount": 37,
    "tiers": [
      {
        "tierType": "personal",
        "price": 48,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 134,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 409,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "pbr-sci-fi-materials-pack-4k.zip",
      "fileSizeBytes": 127,
      "version": "1.0.0",
      "storageKey": "vault/assets/low-poly-product-studio-rig-studio-edition-1piik/pbr-sci-fi-materials-pack-4k.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/3dd663eb-993b-46c8-a2aa-a91da318dac2/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/3dd663eb-993b-46c8-a2aa-a91da318dac2/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:05.411Z"
  },
  {
    "id": "1e4a93de-eb2c-4ca9-93d2-d0acd386f263",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Modular Vehicle Fleet for Blender & Unreal",
    "slug": "modular-vehicle-fleet-for-blender-and-unreal-3elh4",
    "shortDescription": "High-fidelity 3D model designed for game engines and architectural visualizers with clean UV unwraps.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/1e4a93de-eb2c-4ca9-93d2-d0acd386f263/thumbnail.webp",
    "storagePath": "vault/assets/modular-vehicle-fleet-for-blender-and-unreal-3elh4/minimalist-branding-stationery-mockups.psd",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 1610,
    "downloadCount": 289,
    "tiers": [
      {
        "tierType": "personal",
        "price": 39,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 105,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 298,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "minimalist-branding-stationery-mockups.psd",
      "fileSizeBytes": 123,
      "version": "1.0.0",
      "storageKey": "vault/assets/modular-vehicle-fleet-for-blender-and-unreal-3elh4/minimalist-branding-stationery-mockups.psd"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/1e4a93de-eb2c-4ca9-93d2-d0acd386f263/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/1e4a93de-eb2c-4ca9-93d2-d0acd386f263/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:07.844Z"
  },
  {
    "id": "80841b35-1e46-441b-a070-1483bcf47a56",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Low-Poly City Street Scene Collection v2",
    "slug": "low-poly-city-street-scene-collection-v2-bjck2",
    "shortDescription": "High-fidelity 3D model designed for game engines and architectural visualizers with clean UV unwraps.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/80841b35-1e46-441b-a070-1483bcf47a56/thumbnail.webp",
    "storagePath": "vault/assets/low-poly-city-street-scene-collection-v2-bjck2/figma-enterprise-design-system-2026.fig",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 580,
    "downloadCount": 52,
    "tiers": [
      {
        "tierType": "personal",
        "price": 44,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 123,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 358,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "figma-enterprise-design-system-2026.fig",
      "fileSizeBytes": 115,
      "version": "1.0.0",
      "storageKey": "vault/assets/low-poly-city-street-scene-collection-v2-bjck2/figma-enterprise-design-system-2026.fig"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/80841b35-1e46-441b-a070-1483bcf47a56/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/80841b35-1e46-441b-a070-1483bcf47a56/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:10.163Z"
  },
  {
    "id": "5f467351-5970-4f48-8d26-1366402a4837",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Low-Poly Space Station Kit for Blender & Unreal",
    "slug": "low-poly-space-station-kit-for-blender-and-unreal-uzld1",
    "shortDescription": "Modular 3D environment kit engineered for real-time engines with full LOD hierarchies and custom collision meshes.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5f467351-5970-4f48-8d26-1366402a4837/thumbnail.webp",
    "storagePath": "vault/assets/low-poly-space-station-kit-for-blender-and-unreal-uzld1/figma-enterprise-design-system-2026.fig",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 1289,
    "downloadCount": 157,
    "tiers": [
      {
        "tierType": "personal",
        "price": 54,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 140,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 429,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "figma-enterprise-design-system-2026.fig",
      "fileSizeBytes": 115,
      "version": "1.0.0",
      "storageKey": "vault/assets/low-poly-space-station-kit-for-blender-and-unreal-uzld1/figma-enterprise-design-system-2026.fig"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5f467351-5970-4f48-8d26-1366402a4837/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5f467351-5970-4f48-8d26-1366402a4837/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:12.634Z"
  },
  {
    "id": "3cfd10cf-ed9a-4902-80f4-ccb08758e3bd",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Futuristic Mech Warrior 4K PBR Bundle",
    "slug": "futuristic-mech-warrior-4k-pbr-bundle-2sa9q",
    "shortDescription": "Modular 3D environment kit engineered for real-time engines with full LOD hierarchies and custom collision meshes.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/3cfd10cf-ed9a-4902-80f4-ccb08758e3bd/thumbnail.webp",
    "storagePath": "vault/assets/futuristic-mech-warrior-4k-pbr-bundle-2sa9q/react-native-multivendor-marketplace.zip",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 1125,
    "downloadCount": 141,
    "tiers": [
      {
        "tierType": "personal",
        "price": 35,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 89,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 255,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "react-native-multivendor-marketplace.zip",
      "fileSizeBytes": 129,
      "version": "1.0.0",
      "storageKey": "vault/assets/futuristic-mech-warrior-4k-pbr-bundle-2sa9q/react-native-multivendor-marketplace.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/3cfd10cf-ed9a-4902-80f4-ccb08758e3bd/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/3cfd10cf-ed9a-4902-80f4-ccb08758e3bd/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:14.953Z"
  },
  {
    "id": "d1fd58c0-8924-4db3-aa75-1ae0169cdbde",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Stylized Product Studio Rig 4K PBR Bundle",
    "slug": "stylized-product-studio-rig-4k-pbr-bundle-za4mn",
    "shortDescription": "Modular 3D environment kit engineered for real-time engines with full LOD hierarchies and custom collision meshes.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d1fd58c0-8924-4db3-aa75-1ae0169cdbde/thumbnail.webp",
    "storagePath": "vault/assets/stylized-product-studio-rig-4k-pbr-bundle-za4mn/3d-product-lighting-studio-rig.blend",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 1409,
    "downloadCount": 353,
    "tiers": [
      {
        "tierType": "personal",
        "price": 50,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 134,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 398,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "3d-product-lighting-studio-rig.blend",
      "fileSizeBytes": 125,
      "version": "1.0.0",
      "storageKey": "vault/assets/stylized-product-studio-rig-4k-pbr-bundle-za4mn/3d-product-lighting-studio-rig.blend"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d1fd58c0-8924-4db3-aa75-1ae0169cdbde/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d1fd58c0-8924-4db3-aa75-1ae0169cdbde/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:17.523Z"
  },
  {
    "id": "42a4b9c4-5a41-47f6-a92e-96f41cc2a795",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Low-Poly Space Station Kit 4K PBR Bundle",
    "slug": "low-poly-space-station-kit-4k-pbr-bundle-6qvwi",
    "shortDescription": "Modular 3D environment kit engineered for real-time engines with full LOD hierarchies and custom collision meshes.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/42a4b9c4-5a41-47f6-a92e-96f41cc2a795/thumbnail.webp",
    "storagePath": "vault/assets/low-poly-space-station-kit-4k-pbr-bundle-6qvwi/vector-brand-icon-library-1200.zip",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 726,
    "downloadCount": 39,
    "tiers": [
      {
        "tierType": "personal",
        "price": 42,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 111,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 330,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "vector-brand-icon-library-1200.zip",
      "fileSizeBytes": 126,
      "version": "1.0.0",
      "storageKey": "vault/assets/low-poly-space-station-kit-4k-pbr-bundle-6qvwi/vector-brand-icon-library-1200.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/42a4b9c4-5a41-47f6-a92e-96f41cc2a795/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/42a4b9c4-5a41-47f6-a92e-96f41cc2a795/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:19.942Z"
  },
  {
    "id": "588e795f-2518-4e72-b653-b70272eb0f66",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Cyberpunk Mech Warrior Game-Ready Asset",
    "slug": "cyberpunk-mech-warrior-game-ready-asset-6rn7n",
    "shortDescription": "Production-ready 3D asset featuring optimized polygon topology, 4K PBR textures, and universal FBX/OBJ exports.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/588e795f-2518-4e72-b653-b70272eb0f66/thumbnail.webp",
    "storagePath": "vault/assets/cyberpunk-mech-warrior-game-ready-asset-6rn7n/vector-brand-icon-library-1200.zip",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 1904,
    "downloadCount": 361,
    "tiers": [
      {
        "tierType": "personal",
        "price": 57,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 153,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 465,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "vector-brand-icon-library-1200.zip",
      "fileSizeBytes": 126,
      "version": "1.0.0",
      "storageKey": "vault/assets/cyberpunk-mech-warrior-game-ready-asset-6rn7n/vector-brand-icon-library-1200.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/588e795f-2518-4e72-b653-b70272eb0f66/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/588e795f-2518-4e72-b653-b70272eb0f66/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:22.255Z"
  },
  {
    "id": "dae5b5e8-e287-49a7-8b65-f650ff596b0a",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Stylized Character Rig Collection v2",
    "slug": "stylized-character-rig-collection-v2-7d6vt",
    "shortDescription": "Modular 3D environment kit engineered for real-time engines with full LOD hierarchies and custom collision meshes.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/dae5b5e8-e287-49a7-8b65-f650ff596b0a/thumbnail.webp",
    "storagePath": "vault/assets/stylized-character-rig-collection-v2-7d6vt/kinetic-typography-after-effects.zip",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 1763,
    "downloadCount": 120,
    "tiers": [
      {
        "tierType": "personal",
        "price": 53,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 145,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 407,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "kinetic-typography-after-effects.zip",
      "fileSizeBytes": 142,
      "version": "1.0.0",
      "storageKey": "vault/assets/stylized-character-rig-collection-v2-7d6vt/kinetic-typography-after-effects.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/dae5b5e8-e287-49a7-8b65-f650ff596b0a/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/dae5b5e8-e287-49a7-8b65-f650ff596b0a/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:24.584Z"
  },
  {
    "id": "d3079b54-d671-4b43-ae97-6cc3315b2bbc",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Futuristic PBR Texture Suite for Blender & Unreal",
    "slug": "futuristic-pbr-texture-suite-for-blender-and-unreal-v2o60",
    "shortDescription": "Modular 3D environment kit engineered for real-time engines with full LOD hierarchies and custom collision meshes.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d3079b54-d671-4b43-ae97-6cc3315b2bbc/thumbnail.webp",
    "storagePath": "vault/assets/futuristic-pbr-texture-suite-for-blender-and-unreal-v2o60/low-poly-medieval-game-characters.zip",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 1355,
    "downloadCount": 204,
    "tiers": [
      {
        "tierType": "personal",
        "price": 58,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 159,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 450,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "low-poly-medieval-game-characters.zip",
      "fileSizeBytes": 136,
      "version": "1.0.0",
      "storageKey": "vault/assets/futuristic-pbr-texture-suite-for-blender-and-unreal-v2o60/low-poly-medieval-game-characters.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d3079b54-d671-4b43-ae97-6cc3315b2bbc/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/d3079b54-d671-4b43-ae97-6cc3315b2bbc/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:27.112Z"
  },
  {
    "id": "65091301-3a71-4478-b314-cd0ac8376f25",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Low-Poly Space Station Kit Studio Edition",
    "slug": "low-poly-space-station-kit-studio-edition-ydrub",
    "shortDescription": "Modular 3D environment kit engineered for real-time engines with full LOD hierarchies and custom collision meshes.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/65091301-3a71-4478-b314-cd0ac8376f25/thumbnail.webp",
    "storagePath": "vault/assets/low-poly-space-station-kit-studio-edition-ydrub/cyberpunk-street-environment-3d.blend",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 1038,
    "downloadCount": 117,
    "tiers": [
      {
        "tierType": "personal",
        "price": 57,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 145,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 437,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "cyberpunk-street-environment-3d.blend",
      "fileSizeBytes": 117,
      "version": "1.0.0",
      "storageKey": "vault/assets/low-poly-space-station-kit-studio-edition-ydrub/cyberpunk-street-environment-3d.blend"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/65091301-3a71-4478-b314-cd0ac8376f25/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/65091301-3a71-4478-b314-cd0ac8376f25/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:29.952Z"
  },
  {
    "id": "c02cafa1-2c25-4b3d-80fb-edb501ac1ad4",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Sci-Fi Vehicle Fleet with Custom Shaders",
    "slug": "sci-fi-vehicle-fleet-with-custom-shaders-0kng0",
    "shortDescription": "High-fidelity 3D model designed for game engines and architectural visualizers with clean UV unwraps.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/c02cafa1-2c25-4b3d-80fb-edb501ac1ad4/thumbnail.webp",
    "storagePath": "vault/assets/sci-fi-vehicle-fleet-with-custom-shaders-0kng0/cinematic-sound-effects-foley-pack.zip",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 189,
    "downloadCount": 30,
    "tiers": [
      {
        "tierType": "personal",
        "price": 50,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 128,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 389,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "cinematic-sound-effects-foley-pack.zip",
      "fileSizeBytes": 134,
      "version": "1.0.0",
      "storageKey": "vault/assets/sci-fi-vehicle-fleet-with-custom-shaders-0kng0/cinematic-sound-effects-foley-pack.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/c02cafa1-2c25-4b3d-80fb-edb501ac1ad4/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/c02cafa1-2c25-4b3d-80fb-edb501ac1ad4/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:32.397Z"
  },
  {
    "id": "8e63413b-f44d-4299-972e-3e4fc4308358",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Sci-Fi City Street Scene Game-Ready Asset",
    "slug": "sci-fi-city-street-scene-game-ready-asset-p9tfh",
    "shortDescription": "High-fidelity 3D model designed for game engines and architectural visualizers with clean UV unwraps.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8e63413b-f44d-4299-972e-3e4fc4308358/thumbnail.webp",
    "storagePath": "vault/assets/sci-fi-city-street-scene-game-ready-asset-p9tfh/low-poly-medieval-game-characters.zip",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 158,
    "downloadCount": 42,
    "tiers": [
      {
        "tierType": "personal",
        "price": 53,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 140,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 427,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "low-poly-medieval-game-characters.zip",
      "fileSizeBytes": 136,
      "version": "1.0.0",
      "storageKey": "vault/assets/sci-fi-city-street-scene-game-ready-asset-p9tfh/low-poly-medieval-game-characters.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8e63413b-f44d-4299-972e-3e4fc4308358/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8e63413b-f44d-4299-972e-3e4fc4308358/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:34.887Z"
  },
  {
    "id": "5e1cb3cd-65e7-47b7-ae0e-be3aec865175",
    "sellerId": "cecc6e9e-a92d-4d11-a39a-ace10fb049c8",
    "sellerName": "Majid",
    "sellerEmail": "majid@ovi.com",
    "categoryId": 2,
    "categorySlug": "3d-models-and-cgi",
    "categoryName": "3D Models & CGI",
    "title": "Modular PBR Texture Suite Collection v2",
    "slug": "modular-pbr-texture-suite-collection-v2-ov7ms",
    "shortDescription": "Production-ready 3D asset featuring optimized polygon topology, 4K PBR textures, and universal FBX/OBJ exports.",
    "fullDescription": "A master-class 3D digital asset built specifically for CGI directors, visual effects supervisors, and game developers. Includes meticulously crafted normal maps, roughness maps, metallic passes, and pre-configured Blender shader nodes.\n\nEngineered for frictionless drag-and-drop into Unreal Engine 5 (Nanite ready) and Unity 6 HDRP. All pivot points are pre-aligned to grid origins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5e1cb3cd-65e7-47b7-ae0e-be3aec865175/thumbnail.webp",
    "storagePath": "vault/assets/modular-pbr-texture-suite-collection-v2-ov7ms/mobile-banking-fintech-ui-kit.fig",
    "status": "published",
    "tags": [
      "3d-model",
      "blender",
      "unreal-engine",
      "pbr",
      "game-ready",
      "low-poly",
      "cgi"
    ],
    "technicalSpecs": {
      "Format": "Blend, FBX, OBJ, GLTF",
      "PolygonCount": "45,000 Triangles",
      "Textures": "4K PBR (Albedo, Normal, Roughness, Metallic, AO)",
      "Rigged": "Yes (Humanoid / Mech)",
      "LODs": "4 Levels (LOD0 - LOD3)"
    },
    "viewCount": 1992,
    "downloadCount": 92,
    "tiers": [
      {
        "tierType": "personal",
        "price": 40,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 102,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 286,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "mobile-banking-fintech-ui-kit.fig",
      "fileSizeBytes": 125,
      "version": "1.0.0",
      "storageKey": "vault/assets/modular-pbr-texture-suite-collection-v2-ov7ms/mobile-banking-fintech-ui-kit.fig"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5e1cb3cd-65e7-47b7-ae0e-be3aec865175/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/5e1cb3cd-65e7-47b7-ae0e-be3aec865175/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:37.244Z"
  },
  {
    "id": "aed4febc-8982-43fd-8f4c-9939cc5838b5",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Vibrant Pattern Collection Curated Designer Edition",
    "slug": "vibrant-pattern-collection-curated-designer-edition-t4fcu",
    "shortDescription": "Curated vector icon pack and scalable graphic illustrations formatted in SVG, EPS, and high-resolution PNG.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/aed4febc-8982-43fd-8f4c-9939cc5838b5/thumbnail.webp",
    "storagePath": "vault/assets/vibrant-pattern-collection-curated-designer-edition-t4fcu/glitch-transition-presets-premiere.prproj",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 1191,
    "downloadCount": 141,
    "tiers": [
      {
        "tierType": "personal",
        "price": 38,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 109,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 318,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "glitch-transition-presets-premiere.prproj",
      "fileSizeBytes": 121,
      "version": "1.0.0",
      "storageKey": "vault/assets/vibrant-pattern-collection-curated-designer-edition-t4fcu/glitch-transition-presets-premiere.prproj"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/aed4febc-8982-43fd-8f4c-9939cc5838b5/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/aed4febc-8982-43fd-8f4c-9939cc5838b5/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:39.569Z"
  },
  {
    "id": "2a35288f-5393-47cb-9e9d-8145a9c5d13c",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Vibrant Pattern Collection SVG & Figma Ready",
    "slug": "vibrant-pattern-collection-svg-and-figma-ready-hm5vq",
    "shortDescription": "Isometric digital technology illustrations depicting cloud infrastructure, AI nodes, and cybersecurity workflows.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2a35288f-5393-47cb-9e9d-8145a9c5d13c/thumbnail.webp",
    "storagePath": "vault/assets/vibrant-pattern-collection-svg-and-figma-ready-hm5vq/vector-brand-icon-library-1200.zip",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 901,
    "downloadCount": 148,
    "tiers": [
      {
        "tierType": "personal",
        "price": 36,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 98,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 314,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "vector-brand-icon-library-1200.zip",
      "fileSizeBytes": 126,
      "version": "1.0.0",
      "storageKey": "vault/assets/vibrant-pattern-collection-svg-and-figma-ready-hm5vq/vector-brand-icon-library-1200.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2a35288f-5393-47cb-9e9d-8145a9c5d13c/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2a35288f-5393-47cb-9e9d-8145a9c5d13c/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:41.828Z"
  },
  {
    "id": "30903651-d420-4089-a8d4-9e03a62a3e9e",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Hand-Crafted Pattern Collection Commercial Asset Set",
    "slug": "hand-crafted-pattern-collection-commercial-asset-set-6d2i1",
    "shortDescription": "Curated vector icon pack and scalable graphic illustrations formatted in SVG, EPS, and high-resolution PNG.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/30903651-d420-4089-a8d4-9e03a62a3e9e/thumbnail.webp",
    "storagePath": "vault/assets/hand-crafted-pattern-collection-commercial-asset-set-6d2i1/nextjs-enterprise-saas-starter-v2.zip",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 1703,
    "downloadCount": 128,
    "tiers": [
      {
        "tierType": "personal",
        "price": 19,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 58,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 201,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "nextjs-enterprise-saas-starter-v2.zip",
      "fileSizeBytes": 116,
      "version": "1.0.0",
      "storageKey": "vault/assets/hand-crafted-pattern-collection-commercial-asset-set-6d2i1/nextjs-enterprise-saas-starter-v2.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/30903651-d420-4089-a8d4-9e03a62a3e9e/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/30903651-d420-4089-a8d4-9e03a62a3e9e/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:44.515Z"
  },
  {
    "id": "6f8835f5-4870-4f15-b18b-c74714fcd390",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Minimalist Social Media Graphics SVG & Figma Ready",
    "slug": "minimalist-social-media-graphics-svg-and-figma-ready-rt5v8",
    "shortDescription": "Isometric digital technology illustrations depicting cloud infrastructure, AI nodes, and cybersecurity workflows.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/6f8835f5-4870-4f15-b18b-c74714fcd390/thumbnail.webp",
    "storagePath": "vault/assets/minimalist-social-media-graphics-svg-and-figma-ready-rt5v8/nextjs-enterprise-saas-starter-v2.zip",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 1367,
    "downloadCount": 227,
    "tiers": [
      {
        "tierType": "personal",
        "price": 34,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 94,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 285,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "nextjs-enterprise-saas-starter-v2.zip",
      "fileSizeBytes": 116,
      "version": "1.0.0",
      "storageKey": "vault/assets/minimalist-social-media-graphics-svg-and-figma-ready-rt5v8/nextjs-enterprise-saas-starter-v2.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/6f8835f5-4870-4f15-b18b-c74714fcd390/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/6f8835f5-4870-4f15-b18b-c74714fcd390/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:47.051Z"
  },
  {
    "id": "ffd9a833-8067-4cec-94ae-8d7d3ef23359",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Geometric Tech Illustration Suite PSD & Vector AI",
    "slug": "geometric-tech-illustration-suite-psd-and-vector-ai-hqma6",
    "shortDescription": "Isometric digital technology illustrations depicting cloud infrastructure, AI nodes, and cybersecurity workflows.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/ffd9a833-8067-4cec-94ae-8d7d3ef23359/thumbnail.webp",
    "storagePath": "vault/assets/geometric-tech-illustration-suite-psd-and-vector-ai-hqma6/glitch-transition-presets-premiere.prproj",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 597,
    "downloadCount": 156,
    "tiers": [
      {
        "tierType": "personal",
        "price": 26,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 77,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 250,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "glitch-transition-presets-premiere.prproj",
      "fileSizeBytes": 121,
      "version": "1.0.0",
      "storageKey": "vault/assets/geometric-tech-illustration-suite-psd-and-vector-ai-hqma6/glitch-transition-presets-premiere.prproj"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/ffd9a833-8067-4cec-94ae-8d7d3ef23359/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/ffd9a833-8067-4cec-94ae-8d7d3ef23359/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:49.557Z"
  },
  {
    "id": "f1f0c2e4-ab8c-4658-81ed-3192eed003c2",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Abstract Vector Icon Bundle 1,200+ Icons Pack",
    "slug": "abstract-vector-icon-bundle-1-200-icons-pack-y3imh",
    "shortDescription": "Photorealistic branding stationery mockup scenes with smart objects, displacement maps, and custom shadows.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/f1f0c2e4-ab8c-4658-81ed-3192eed003c2/thumbnail.webp",
    "storagePath": "vault/assets/abstract-vector-icon-bundle-1-200-icons-pack-y3imh/ai-prompt-vault-midjourney-v6.pdf",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 887,
    "downloadCount": 69,
    "tiers": [
      {
        "tierType": "personal",
        "price": 38,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 103,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 308,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "ai-prompt-vault-midjourney-v6.pdf",
      "fileSizeBytes": 130,
      "version": "1.0.0",
      "storageKey": "vault/assets/abstract-vector-icon-bundle-1-200-icons-pack-y3imh/ai-prompt-vault-midjourney-v6.pdf"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/f1f0c2e4-ab8c-4658-81ed-3192eed003c2/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/f1f0c2e4-ab8c-4658-81ed-3192eed003c2/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:52.109Z"
  },
  {
    "id": "98ecd14a-8037-48f8-b37c-6e0c3eaa54f5",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Geometric Social Media Graphics Commercial Asset Set",
    "slug": "geometric-social-media-graphics-commercial-asset-set-k934m",
    "shortDescription": "Photorealistic branding stationery mockup scenes with smart objects, displacement maps, and custom shadows.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/98ecd14a-8037-48f8-b37c-6e0c3eaa54f5/thumbnail.webp",
    "storagePath": "vault/assets/geometric-social-media-graphics-commercial-asset-set-k934m/cyberpunk-futuristic-display-font.zip",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 1746,
    "downloadCount": 169,
    "tiers": [
      {
        "tierType": "personal",
        "price": 35,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 92,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 274,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "cyberpunk-futuristic-display-font.zip",
      "fileSizeBytes": 133,
      "version": "1.0.0",
      "storageKey": "vault/assets/geometric-social-media-graphics-commercial-asset-set-k934m/cyberpunk-futuristic-display-font.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/98ecd14a-8037-48f8-b37c-6e0c3eaa54f5/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/98ecd14a-8037-48f8-b37c-6e0c3eaa54f5/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:54.469Z"
  },
  {
    "id": "154ff70b-2569-4e51-9a96-69d49170013d",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Abstract Vector Icon Bundle PSD & Vector AI",
    "slug": "abstract-vector-icon-bundle-psd-and-vector-ai-oq4mi",
    "shortDescription": "Photorealistic branding stationery mockup scenes with smart objects, displacement maps, and custom shadows.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/154ff70b-2569-4e51-9a96-69d49170013d/thumbnail.webp",
    "storagePath": "vault/assets/abstract-vector-icon-bundle-psd-and-vector-ai-oq4mi/minimalist-branding-stationery-mockups.psd",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 2114,
    "downloadCount": 306,
    "tiers": [
      {
        "tierType": "personal",
        "price": 36,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 94,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 287,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "minimalist-branding-stationery-mockups.psd",
      "fileSizeBytes": 123,
      "version": "1.0.0",
      "storageKey": "vault/assets/abstract-vector-icon-bundle-psd-and-vector-ai-oq4mi/minimalist-branding-stationery-mockups.psd"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/154ff70b-2569-4e51-9a96-69d49170013d/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/154ff70b-2569-4e51-9a96-69d49170013d/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:56.912Z"
  },
  {
    "id": "1bbbacd4-b7d9-4d67-96d7-5ad489daa72b",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Hand-Crafted Tech Illustration Suite Commercial Asset Set",
    "slug": "hand-crafted-tech-illustration-suite-commercial-asset-set-u28w0",
    "shortDescription": "Isometric digital technology illustrations depicting cloud infrastructure, AI nodes, and cybersecurity workflows.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/1bbbacd4-b7d9-4d67-96d7-5ad489daa72b/thumbnail.webp",
    "storagePath": "vault/assets/hand-crafted-tech-illustration-suite-commercial-asset-set-u28w0/3d-product-lighting-studio-rig.blend",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 1346,
    "downloadCount": 37,
    "tiers": [
      {
        "tierType": "personal",
        "price": 21,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 65,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 198,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "3d-product-lighting-studio-rig.blend",
      "fileSizeBytes": 125,
      "version": "1.0.0",
      "storageKey": "vault/assets/hand-crafted-tech-illustration-suite-commercial-asset-set-u28w0/3d-product-lighting-studio-rig.blend"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/1bbbacd4-b7d9-4d67-96d7-5ad489daa72b/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/1bbbacd4-b7d9-4d67-96d7-5ad489daa72b/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:13:59.187Z"
  },
  {
    "id": "15b0eeb0-c17b-4ac7-851d-d80134c3aa78",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Minimalist Social Media Graphics SVG & Figma Ready",
    "slug": "minimalist-social-media-graphics-svg-and-figma-ready-3ak5q",
    "shortDescription": "Isometric digital technology illustrations depicting cloud infrastructure, AI nodes, and cybersecurity workflows.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/15b0eeb0-c17b-4ac7-851d-d80134c3aa78/thumbnail.webp",
    "storagePath": "vault/assets/minimalist-social-media-graphics-svg-and-figma-ready-3ak5q/dashboard-crm-tailwind-react-template.zip",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 460,
    "downloadCount": 112,
    "tiers": [
      {
        "tierType": "personal",
        "price": 32,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 81,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 257,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "dashboard-crm-tailwind-react-template.zip",
      "fileSizeBytes": 134,
      "version": "1.0.0",
      "storageKey": "vault/assets/minimalist-social-media-graphics-svg-and-figma-ready-3ak5q/dashboard-crm-tailwind-react-template.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/15b0eeb0-c17b-4ac7-851d-d80134c3aa78/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/15b0eeb0-c17b-4ac7-851d-d80134c3aa78/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:01.421Z"
  },
  {
    "id": "40c76760-89c5-40d0-9085-12ab9f1beada",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Scalable Social Media Graphics SVG & Figma Ready",
    "slug": "scalable-social-media-graphics-svg-and-figma-ready-1eiev",
    "shortDescription": "Curated vector icon pack and scalable graphic illustrations formatted in SVG, EPS, and high-resolution PNG.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/40c76760-89c5-40d0-9085-12ab9f1beada/thumbnail.webp",
    "storagePath": "vault/assets/scalable-social-media-graphics-svg-and-figma-ready-1eiev/ambient-game-soundtracks-wav-bundle.zip",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 1924,
    "downloadCount": 377,
    "tiers": [
      {
        "tierType": "personal",
        "price": 39,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 99,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 291,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "ambient-game-soundtracks-wav-bundle.zip",
      "fileSizeBytes": 131,
      "version": "1.0.0",
      "storageKey": "vault/assets/scalable-social-media-graphics-svg-and-figma-ready-1eiev/ambient-game-soundtracks-wav-bundle.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/40c76760-89c5-40d0-9085-12ab9f1beada/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/40c76760-89c5-40d0-9085-12ab9f1beada/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:03.700Z"
  },
  {
    "id": "11aea0a6-2562-43f6-86b1-8e8e272e7b49",
    "sellerId": "11b5b0ec-ca17-4a66-b459-3b668129ed0c",
    "sellerName": "Noreen",
    "sellerEmail": "noreen@ovi.com",
    "categoryId": 1,
    "categorySlug": "graphics-and-design",
    "categoryName": "Graphics & Design",
    "title": "Scalable Tech Illustration Suite Commercial Asset Set",
    "slug": "scalable-tech-illustration-suite-commercial-asset-set-d5r39",
    "shortDescription": "Photorealistic branding stationery mockup scenes with smart objects, displacement maps, and custom shadows.",
    "fullDescription": "Designed for modern UI designers and branding agencies. Features perfectly snapped pixel grids, consistent stroke weights, customizable color paths, and production-tested vector exports.\n\nDelivered with pre-built Figma component libraries, raw Adobe Illustrator files, and organized SVG directories.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/11aea0a6-2562-43f6-86b1-8e8e272e7b49/thumbnail.webp",
    "storagePath": "vault/assets/scalable-tech-illustration-suite-commercial-asset-set-d5r39/low-poly-medieval-game-characters.zip",
    "status": "published",
    "tags": [
      "vector",
      "icons",
      "svg",
      "illustrations",
      "mockup",
      "branding",
      "graphic-design"
    ],
    "technicalSpecs": {
      "Formats": "SVG, AI, EPS, PNG, PSD Mockups",
      "Resolution": "Vector Infinitely Scalable / 6000x4000 PSD",
      "Grid": "24px & 48px Optical Grids",
      "ColorProfiles": "sRGB & Display P3"
    },
    "viewCount": 2117,
    "downloadCount": 259,
    "tiers": [
      {
        "tierType": "personal",
        "price": 36,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 93,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 269,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "low-poly-medieval-game-characters.zip",
      "fileSizeBytes": 136,
      "version": "1.0.0",
      "storageKey": "vault/assets/scalable-tech-illustration-suite-commercial-asset-set-d5r39/low-poly-medieval-game-characters.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/11aea0a6-2562-43f6-86b1-8e8e272e7b49/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/11aea0a6-2562-43f6-86b1-8e8e272e7b49/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:06.061Z"
  },
  {
    "id": "bc9a6c71-cd61-4a06-a998-d1408b602127",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "Futuristic Video Transitions Pack 4K Ultra HD",
    "slug": "futuristic-video-transitions-pack-4k-ultra-hd-12631",
    "shortDescription": "High-energy video transition pack engineered for Premiere Pro and After Effects with custom sound design.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/bc9a6c71-cd61-4a06-a998-d1408b602127/thumbnail.webp",
    "storagePath": "vault/assets/futuristic-video-transitions-pack-4k-ultra-hd-12631/cyberpunk-street-environment-3d.blend",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 778,
    "downloadCount": 16,
    "tiers": [
      {
        "tierType": "personal",
        "price": 19,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 62,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 180,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "cyberpunk-street-environment-3d.blend",
      "fileSizeBytes": 117,
      "version": "1.0.0",
      "storageKey": "vault/assets/futuristic-video-transitions-pack-4k-ultra-hd-12631/cyberpunk-street-environment-3d.blend"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/bc9a6c71-cd61-4a06-a998-d1408b602127/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/bc9a6c71-cd61-4a06-a998-d1408b602127/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:08.289Z"
  },
  {
    "id": "933807dc-410d-4362-99da-0f63aba3768e",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "Broadcast Promo Toolkit Essential Graphics (.mogrt)",
    "slug": "broadcast-promo-toolkit-essential-graphics-mogrt-lfxli",
    "shortDescription": "Broadcast-quality lower-thirds and title reveal animations designed for easy text and color customizations.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/933807dc-410d-4362-99da-0f63aba3768e/thumbnail.webp",
    "storagePath": "vault/assets/broadcast-promo-toolkit-essential-graphics-mogrt-lfxli/cinematic-sound-effects-foley-pack.zip",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 1732,
    "downloadCount": 330,
    "tiers": [
      {
        "tierType": "personal",
        "price": 20,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 53,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 170,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "cinematic-sound-effects-foley-pack.zip",
      "fileSizeBytes": 134,
      "version": "1.0.0",
      "storageKey": "vault/assets/broadcast-promo-toolkit-essential-graphics-mogrt-lfxli/cinematic-sound-effects-foley-pack.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/933807dc-410d-4362-99da-0f63aba3768e/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/933807dc-410d-4362-99da-0f63aba3768e/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:10.619Z"
  },
  {
    "id": "2b258272-8e2c-4e0c-a99b-6afd37bddc9c",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "Kinetic Lower Thirds Suite Essential Graphics (.mogrt)",
    "slug": "kinetic-lower-thirds-suite-essential-graphics-mogrt-6t5oc",
    "shortDescription": "Broadcast-quality lower-thirds and title reveal animations designed for easy text and color customizations.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2b258272-8e2c-4e0c-a99b-6afd37bddc9c/thumbnail.webp",
    "storagePath": "vault/assets/kinetic-lower-thirds-suite-essential-graphics-mogrt-6t5oc/mobile-banking-fintech-ui-kit.fig",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 2552,
    "downloadCount": 100,
    "tiers": [
      {
        "tierType": "personal",
        "price": 32,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 91,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 269,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "mobile-banking-fintech-ui-kit.fig",
      "fileSizeBytes": 125,
      "version": "1.0.0",
      "storageKey": "vault/assets/kinetic-lower-thirds-suite-essential-graphics-mogrt-6t5oc/mobile-banking-fintech-ui-kit.fig"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2b258272-8e2c-4e0c-a99b-6afd37bddc9c/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/2b258272-8e2c-4e0c-a99b-6afd37bddc9c/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:13.544Z"
  },
  {
    "id": "56b5c3c0-4423-45f8-ad20-47b5db4ca04f",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "Cinematic Logo Reveal Animation Modular Pack",
    "slug": "cinematic-logo-reveal-animation-modular-pack-tjhd7",
    "shortDescription": "Cinematic motion graphic templates and After Effects typography presets with universal expressions and 4K resolution.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/56b5c3c0-4423-45f8-ad20-47b5db4ca04f/thumbnail.webp",
    "storagePath": "vault/assets/cinematic-logo-reveal-animation-modular-pack-tjhd7/glitch-transition-presets-premiere.prproj",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 2075,
    "downloadCount": 442,
    "tiers": [
      {
        "tierType": "personal",
        "price": 25,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 69,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 214,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "glitch-transition-presets-premiere.prproj",
      "fileSizeBytes": 121,
      "version": "1.0.0",
      "storageKey": "vault/assets/cinematic-logo-reveal-animation-modular-pack-tjhd7/glitch-transition-presets-premiere.prproj"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/56b5c3c0-4423-45f8-ad20-47b5db4ca04f/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/56b5c3c0-4423-45f8-ad20-47b5db4ca04f/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:19.119Z"
  },
  {
    "id": "fb987c29-b9af-487d-82e2-8fb350a581c6",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "Dynamic Title Sequence Template Creator Suite",
    "slug": "dynamic-title-sequence-template-creator-suite-xxqs3",
    "shortDescription": "Cinematic motion graphic templates and After Effects typography presets with universal expressions and 4K resolution.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/fb987c29-b9af-487d-82e2-8fb350a581c6/thumbnail.webp",
    "storagePath": "vault/assets/dynamic-title-sequence-template-creator-suite-xxqs3/vector-brand-icon-library-1200.zip",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 2419,
    "downloadCount": 41,
    "tiers": [
      {
        "tierType": "personal",
        "price": 37,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 99,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 313,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "vector-brand-icon-library-1200.zip",
      "fileSizeBytes": 126,
      "version": "1.0.0",
      "storageKey": "vault/assets/dynamic-title-sequence-template-creator-suite-xxqs3/vector-brand-icon-library-1200.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/fb987c29-b9af-487d-82e2-8fb350a581c6/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/fb987c29-b9af-487d-82e2-8fb350a581c6/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:22.113Z"
  },
  {
    "id": "63282223-f261-4b4e-90ed-37e946d306e3",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "Broadcast Logo Reveal Animation 4K Ultra HD",
    "slug": "broadcast-logo-reveal-animation-4k-ultra-hd-wacz9",
    "shortDescription": "Broadcast-quality lower-thirds and title reveal animations designed for easy text and color customizations.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/63282223-f261-4b4e-90ed-37e946d306e3/thumbnail.webp",
    "storagePath": "vault/assets/broadcast-logo-reveal-animation-4k-ultra-hd-wacz9/low-poly-medieval-game-characters.zip",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 159,
    "downloadCount": 47,
    "tiers": [
      {
        "tierType": "personal",
        "price": 35,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 93,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 292,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "low-poly-medieval-game-characters.zip",
      "fileSizeBytes": 136,
      "version": "1.0.0",
      "storageKey": "vault/assets/broadcast-logo-reveal-animation-4k-ultra-hd-wacz9/low-poly-medieval-game-characters.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/63282223-f261-4b4e-90ed-37e946d306e3/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/63282223-f261-4b4e-90ed-37e946d306e3/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:25.078Z"
  },
  {
    "id": "0b64aa3b-432f-4dc6-aab7-10fff89d782e",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "High-Impact Title Sequence Template Sound Effects Included",
    "slug": "high-impact-title-sequence-template-sound-effects-included-st4rt",
    "shortDescription": "Broadcast-quality lower-thirds and title reveal animations designed for easy text and color customizations.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/0b64aa3b-432f-4dc6-aab7-10fff89d782e/thumbnail.webp",
    "storagePath": "vault/assets/high-impact-title-sequence-template-sound-effects-included-st4rt/nextjs-enterprise-saas-starter-v2.zip",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 1202,
    "downloadCount": 272,
    "tiers": [
      {
        "tierType": "personal",
        "price": 30,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 81,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 236,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "nextjs-enterprise-saas-starter-v2.zip",
      "fileSizeBytes": 116,
      "version": "1.0.0",
      "storageKey": "vault/assets/high-impact-title-sequence-template-sound-effects-included-st4rt/nextjs-enterprise-saas-starter-v2.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/0b64aa3b-432f-4dc6-aab7-10fff89d782e/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/0b64aa3b-432f-4dc6-aab7-10fff89d782e/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:27.842Z"
  },
  {
    "id": "95176cc6-f61a-4b75-b4d2-615115451f60",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "Broadcast Typography Presets After Effects & Premiere",
    "slug": "broadcast-typography-presets-after-effects-and-premiere-xb89x",
    "shortDescription": "High-energy video transition pack engineered for Premiere Pro and After Effects with custom sound design.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/95176cc6-f61a-4b75-b4d2-615115451f60/thumbnail.webp",
    "storagePath": "vault/assets/broadcast-typography-presets-after-effects-and-premiere-xb89x/vector-brand-icon-library-1200.zip",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 1485,
    "downloadCount": 213,
    "tiers": [
      {
        "tierType": "personal",
        "price": 23,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 69,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 231,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "vector-brand-icon-library-1200.zip",
      "fileSizeBytes": 126,
      "version": "1.0.0",
      "storageKey": "vault/assets/broadcast-typography-presets-after-effects-and-premiere-xb89x/vector-brand-icon-library-1200.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/95176cc6-f61a-4b75-b4d2-615115451f60/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/95176cc6-f61a-4b75-b4d2-615115451f60/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:30.837Z"
  },
  {
    "id": "8ed3c431-21ad-44cd-8510-94308c6638ad",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "Glitch Lower Thirds Suite Modular Pack",
    "slug": "glitch-lower-thirds-suite-modular-pack-wx8uw",
    "shortDescription": "High-energy video transition pack engineered for Premiere Pro and After Effects with custom sound design.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8ed3c431-21ad-44cd-8510-94308c6638ad/thumbnail.webp",
    "storagePath": "vault/assets/glitch-lower-thirds-suite-modular-pack-wx8uw/glitch-transition-presets-premiere.prproj",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 955,
    "downloadCount": 20,
    "tiers": [
      {
        "tierType": "personal",
        "price": 28,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 71,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 228,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "glitch-transition-presets-premiere.prproj",
      "fileSizeBytes": 121,
      "version": "1.0.0",
      "storageKey": "vault/assets/glitch-lower-thirds-suite-modular-pack-wx8uw/glitch-transition-presets-premiere.prproj"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8ed3c431-21ad-44cd-8510-94308c6638ad/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/8ed3c431-21ad-44cd-8510-94308c6638ad/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:34.822Z"
  },
  {
    "id": "af4ef867-1081-4a51-9e6e-7dad38ead24a",
    "sellerId": "8513361d-8cde-4975-b776-c16265a1cf47",
    "sellerName": "Tariq",
    "sellerEmail": "tariq@ovi.com",
    "categoryId": 5,
    "categorySlug": "video-and-motion-graphics",
    "categoryName": "Video & Motion Graphics",
    "title": "Dynamic Title Sequence Template 4K Ultra HD",
    "slug": "dynamic-title-sequence-template-4k-ultra-hd-9qic0",
    "shortDescription": "Broadcast-quality lower-thirds and title reveal animations designed for easy text and color customizations.",
    "fullDescription": "Elevate your video production with professional motion graphics assets. Includes customizable responsive speed controls, multi-color presets, alpha channel transparency, and royalty-free impact sound effects.\n\nCompatible with Adobe After Effects CC 2024+ and Premiere Pro MOGRT workflows without third-party plugins.",
    "previewUrl": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/af4ef867-1081-4a51-9e6e-7dad38ead24a/thumbnail.webp",
    "storagePath": "vault/assets/dynamic-title-sequence-template-4k-ultra-hd-9qic0/ambient-game-soundtracks-wav-bundle.zip",
    "status": "published",
    "tags": [
      "after-effects",
      "premiere-pro",
      "motion-graphics",
      "typography",
      "transitions",
      "4k",
      "video-editing"
    ],
    "technicalSpecs": {
      "Software": "After Effects CC 2024+, Premiere Pro",
      "Resolution": "3840x2160 (4K UHD) @ 60fps",
      "PluginsRequired": "None (100% Native Expressions)",
      "AudioIncluded": "Yes (Mastered Foley FX)"
    },
    "viewCount": 76,
    "downloadCount": 19,
    "tiers": [
      {
        "tierType": "personal",
        "price": 37,
        "licenseTermsSummary": "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited."
      },
      {
        "tierType": "commercial",
        "price": 95,
        "licenseTermsSummary": "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited."
      },
      {
        "tierType": "extended",
        "price": 302,
        "licenseTermsSummary": "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights."
      }
    ],
    "file": {
      "fileName": "ambient-game-soundtracks-wav-bundle.zip",
      "fileSizeBytes": 131,
      "version": "1.0.0",
      "storageKey": "vault/assets/dynamic-title-sequence-template-4k-ultra-hd-9qic0/ambient-game-soundtracks-wav-bundle.zip"
    },
    "media": [
      {
        "mediaType": "thumbnail",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/af4ef867-1081-4a51-9e6e-7dad38ead24a/thumbnail.webp",
        "displayOrder": 1
      },
      {
        "mediaType": "screenshot",
        "url": "https://kvhntcdqispownhlsoxo.supabase.co/storage/v1/object/public/sell-digital-assets-storage-previews/previews/af4ef867-1081-4a51-9e6e-7dad38ead24a/screenshot-1.webp",
        "displayOrder": 2
      }
    ],
    "createdAt": "2026-10-24T21:14:37.540Z"
  }
];
