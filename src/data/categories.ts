/**
 * Default Category Taxonomy & Tree Hierarchy (Digital Assets Marketplace)
 *
 * Standardized multi-tier category taxonomy tailored specifically for purely digital
 * products (graphics, 3D models, code/scripts, audio, video, templates, e-books, AI prompts).
 * Structured similarly to `company.ts` for database persistence and querying.
 */

export interface CategoryNode {
  name: string;
  slug: string;
  description?: string;
  children?: CategoryNode[];
}

export interface FlatCategory {
  name: string;
  slug: string;
  parentSlug: string | null;
  fullPath: string;
  pathSlugs: string[];
  depth: number;
  hasChildren: boolean;
  childrenCount: number;
}

export interface CategoryEntity {
  id?: number | string;
  parent_id?: number | string | null;
  name: string;
  slug: string;
  depth?: number;
  path?: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CategoryTreeStats {
  totalCategories: number;
  rootCategories: number;
  subCategories: number;
  maxDepth: number;
}

/**
 * Standard URL-friendly slug generator for category names.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Canonical default digital assets category tree hierarchy.
 */
export const defaultCategories: CategoryNode[] = [
  {
    name: "Graphics & Design",
    slug: "graphics-and-design",
    children: [
      {
        name: "Illustrations & Vector Art",
        slug: "illustrations-and-vector-art",
        children: [
          {
            name: "Vector Graphics",
            slug: "vector-graphics",
          },
          {
            name: "Character Illustrations",
            slug: "character-illustrations",
          },
          {
            name: "Flat Art",
            slug: "flat-art",
          },
          {
            name: "Isometric Illustrations",
            slug: "isometric-illustrations",
          },
          {
            name: "Hand-Drawn & Sketch Art",
            slug: "hand-drawn-and-sketch-art",
          },
        ],
      },
      {
        name: "Icons & Glyphs",
        slug: "icons-and-glyphs",
        children: [
          {
            name: "2D Vector Icons",
            slug: "2d-vector-icons",
          },
          {
            name: "3D Rendered Icons",
            slug: "3d-rendered-icons",
          },
          {
            name: "Animated SVG Icons",
            slug: "animated-svg-icons",
          },
          {
            name: "Glyph & Line Icons",
            slug: "glyph-and-line-icons",
          },
          {
            name: "App Icon Packs",
            slug: "app-icon-packs",
          },
        ],
      },
      {
        name: "UI & UX Kits",
        slug: "ui-and-ux-kits",
        children: [
          {
            name: "Mobile App UI Kits",
            slug: "mobile-app-ui-kits",
          },
          {
            name: "Web UI Kits",
            slug: "web-ui-kits",
          },
          {
            name: "Wireframe Kits",
            slug: "wireframe-kits",
          },
          {
            name: "Design Systems & Component Libraries",
            slug: "design-systems-and-component-libraries",
          },
          {
            name: "Dashboard UI Kits",
            slug: "dashboard-ui-kits",
          },
        ],
      },
      {
        name: "Mockups & Branding",
        slug: "mockups-and-branding",
        children: [
          {
            name: "Device & Screen Mockups",
            slug: "device-and-screen-mockups",
          },
          {
            name: "Product & Packaging Mockups",
            slug: "product-and-packaging-mockups",
          },
          {
            name: "Apparel & Merchandise Mockups",
            slug: "apparel-and-merchandise-mockups",
          },
          {
            name: "Logo Templates & Badges",
            slug: "logo-templates-and-badges",
          },
          {
            name: "Stationery & Business Card Mockups",
            slug: "stationery-and-business-card-mockups",
          },
        ],
      },
      {
        name: "Fonts & Typography",
        slug: "fonts-and-typography",
        children: [
          {
            name: "Serif Fonts",
            slug: "serif-fonts",
          },
          {
            name: "Sans-Serif Fonts",
            slug: "sans-serif-fonts",
          },
          {
            name: "Display & Decorative Fonts",
            slug: "display-and-decorative-fonts",
          },
          {
            name: "Script & Calligraphy Fonts",
            slug: "script-and-calligraphy-fonts",
          },
          {
            name: "Monospace & Coding Fonts",
            slug: "monospace-and-coding-fonts",
          },
        ],
      },
      {
        name: "Textures & Patterns",
        slug: "textures-and-patterns",
        children: [
          {
            name: "Seamless Vector Patterns",
            slug: "seamless-vector-patterns",
          },
          {
            name: "Abstract & Grunge Textures",
            slug: "abstract-and-grunge-textures",
          },
          {
            name: "Paper & Canvas Textures",
            slug: "paper-and-canvas-textures",
          },
          {
            name: "Gradients & Overlays",
            slug: "gradients-and-overlays",
          },
        ],
      },
      {
        name: "Digital Brushes",
        slug: "digital-brushes",
        children: [
          {
            name: "Procreate Brushes",
            slug: "procreate-brushes",
          },
          {
            name: "Photoshop Brushes",
            slug: "photoshop-brushes",
          },
          {
            name: "Illustrator Vector Brushes",
            slug: "illustrator-vector-brushes",
          },
        ],
      },
    ],
  },
  {
    name: "3D Models & CGI",
    slug: "3d-models-and-cgi",
    children: [
      {
        name: "Characters & Creatures",
        slug: "characters-and-creatures",
        children: [
          {
            name: "Realistic Human Characters",
            slug: "realistic-human-characters",
          },
          {
            name: "Stylized & Anime Characters",
            slug: "stylized-and-anime-characters",
          },
          {
            name: "Fantasy & Sci-Fi Creatures",
            slug: "fantasy-and-sci-fi-creatures",
          },
          {
            name: "Animals & Wildlife",
            slug: "animals-and-wildlife",
          },
        ],
      },
      {
        name: "Environments & Architecture",
        slug: "environments-and-architecture",
        children: [
          {
            name: "Buildings & Urban Sets",
            slug: "buildings-and-urban-sets",
          },
          {
            name: "Interior Architecture & Rooms",
            slug: "interior-architecture-and-rooms",
          },
          {
            name: "Nature, Terrain & Landscapes",
            slug: "nature-terrain-and-landscapes",
          },
          {
            name: "Sci-Fi & Cyberpunk Scenes",
            slug: "sci-fi-and-cyberpunk-scenes",
          },
          {
            name: "Historical & Medieval Sets",
            slug: "historical-and-medieval-sets",
          },
        ],
      },
      {
        name: "Vehicles & Transportation",
        slug: "vehicles-and-transportation",
        children: [
          {
            name: "Cars & Commercial Vehicles",
            slug: "cars-and-commercial-vehicles",
          },
          {
            name: "Aircraft & Drones",
            slug: "aircraft-and-drones",
          },
          {
            name: "Spacecraft & Sci-Fi Vehicles",
            slug: "spacecraft-and-sci-fi-vehicles",
          },
          {
            name: "Ships & Watercraft",
            slug: "ships-and-watercraft",
          },
          {
            name: "Military Vehicles",
            slug: "military-vehicles",
          },
        ],
      },
      {
        name: "Props & Objects",
        slug: "props-and-objects",
        children: [
          {
            name: "Furniture & Interior Props",
            slug: "furniture-and-interior-props",
          },
          {
            name: "Weapons & Armor",
            slug: "weapons-and-armor",
          },
          {
            name: "Electronics & Tech Props",
            slug: "electronics-and-tech-props",
          },
          {
            name: "Household & Food Props",
            slug: "household-and-food-props",
          },
        ],
      },
      {
        name: "PBR Materials & Shaders",
        slug: "pbr-materials-and-shaders",
        children: [
          {
            name: "Architectural Materials",
            slug: "architectural-materials",
          },
          {
            name: "Metal, Stone & Concrete",
            slug: "metal-stone-and-concrete",
          },
          {
            name: "Fabric & Leather PBR",
            slug: "fabric-and-leather-pbr",
          },
          {
            name: "Procedural Shaders",
            slug: "procedural-shaders",
          },
        ],
      },
      {
        name: "Rigging & Animation",
        slug: "rigging-and-animation",
        children: [
          {
            name: "Biped Character Rigs",
            slug: "biped-character-rigs",
          },
          {
            name: "Motion Capture Data (MoCap)",
            slug: "motion-capture-data-mocap",
          },
          {
            name: "3D Animations & Cycles",
            slug: "3d-animations-and-cycles",
          },
        ],
      },
      {
        name: "3D Printable Models (STL)",
        slug: "3d-printable-models-stl",
        children: [
          {
            name: "Tabletop & RPG Miniatures",
            slug: "tabletop-and-rpg-miniatures",
          },
          {
            name: "Cosplay Props & Helmets",
            slug: "cosplay-props-and-helmets",
          },
          {
            name: "Sculptures & Figurines",
            slug: "sculptures-and-figurines",
          },
          {
            name: "Functional & Gadget Prints",
            slug: "functional-and-gadget-prints",
          },
        ],
      },
    ],
  },
  {
    name: "Code, Software & Web",
    slug: "code-software-and-web",
    children: [
      {
        name: "Web Templates & Themes",
        slug: "web-templates-and-themes",
        children: [
          {
            name: "Next.js & React Templates",
            slug: "next-js-and-react-templates",
          },
          {
            name: "Vue & Nuxt Templates",
            slug: "vue-and-nuxt-templates",
          },
          {
            name: "Tailwind CSS Templates",
            slug: "tailwind-css-templates",
          },
          {
            name: "HTML5 & CSS3 Landing Pages",
            slug: "html5-and-css3-landing-pages",
          },
          {
            name: "Admin & Dashboard Themes",
            slug: "admin-and-dashboard-themes",
          },
          {
            name: "E-Commerce Web Templates",
            slug: "e-commerce-web-templates",
          },
        ],
      },
      {
        name: "Application Starters & SaaS Boilerplates",
        slug: "application-starters-and-saas-boilerplates",
        children: [
          {
            name: "Full-Stack SaaS Starter Kits",
            slug: "full-stack-saas-starter-kits",
          },
          {
            name: "React Native App Starters",
            slug: "react-native-app-starters",
          },
          {
            name: "Flutter App Starters",
            slug: "flutter-app-starters",
          },
          {
            name: "API Backend Boilerplates",
            slug: "api-backend-boilerplates",
          },
          {
            name: "Microservices & Docker Templates",
            slug: "microservices-and-docker-templates",
          },
        ],
      },
      {
        name: "Plugins & Extensions",
        slug: "plugins-and-extensions",
        children: [
          {
            name: "WordPress & WooCommerce Plugins",
            slug: "wordpress-and-woocommerce-plugins",
          },
          {
            name: "Chrome & Browser Extensions",
            slug: "chrome-and-browser-extensions",
          },
          {
            name: "Shopify Apps & Add-ons",
            slug: "shopify-apps-and-add-ons",
          },
          {
            name: "Figma Plugins & Widgets",
            slug: "figma-plugins-and-widgets",
          },
          {
            name: "VS Code Extensions",
            slug: "vs-code-extensions",
          },
        ],
      },
      {
        name: "Scripts & Utilities",
        slug: "scripts-and-utilities",
        children: [
          {
            name: "Web Scraping & Automation Scripts",
            slug: "web-scraping-and-automation-scripts",
          },
          {
            name: "Database Schemas & Migrations",
            slug: "database-schemas-and-migrations",
          },
          {
            name: "API Integrations & Webhooks",
            slug: "api-integrations-and-webhooks",
          },
          {
            name: "CLI Tools & Shell Scripts",
            slug: "cli-tools-and-shell-scripts",
          },
        ],
      },
      {
        name: "Mobile App Source Code",
        slug: "mobile-app-source-code",
        children: [
          {
            name: "iOS Swift Projects",
            slug: "ios-swift-projects",
          },
          {
            name: "Android Kotlin Projects",
            slug: "android-kotlin-projects",
          },
          {
            name: "Cross-Platform App Source Code",
            slug: "cross-platform-app-source-code",
          },
        ],
      },
    ],
  },
  {
    name: "Audio & Sound Production",
    slug: "audio-and-sound-production",
    children: [
      {
        name: "Music Tracks & Royalty-Free Music",
        slug: "music-tracks-and-royalty-free-music",
        children: [
          {
            name: "Cinematic & Orchestral",
            slug: "cinematic-and-orchestral",
          },
          {
            name: "Electronic & Synthwave",
            slug: "electronic-and-synthwave",
          },
          {
            name: "Ambient & Lo-Fi Beats",
            slug: "ambient-and-lo-fi-beats",
          },
          {
            name: "Corporate & Commercial",
            slug: "corporate-and-commercial",
          },
          {
            name: "Hip Hop & Trap Beats",
            slug: "hip-hop-and-trap-beats",
          },
          {
            name: "Rock & Acoustic",
            slug: "rock-and-acoustic",
          },
        ],
      },
      {
        name: "Sound Effects (SFX)",
        slug: "sound-effects-sfx",
        children: [
          {
            name: "Game & Combat SFX",
            slug: "game-and-combat-sfx",
          },
          {
            name: "UI, Click & Interface Sounds",
            slug: "ui-click-and-interface-sounds",
          },
          {
            name: "Sci-Fi & Futuristic FX",
            slug: "sci-fi-and-futuristic-fx",
          },
          {
            name: "Horror & Thriller Sounds",
            slug: "horror-and-thriller-sounds",
          },
          {
            name: "Ambient Foley & Nature Environments",
            slug: "ambient-foley-and-nature-environments",
          },
          {
            name: "Transitions & Whooshes",
            slug: "transitions-and-whooshes",
          },
        ],
      },
      {
        name: "Sample Packs & Loops",
        slug: "sample-packs-and-loops",
        children: [
          {
            name: "Drum Kits & One-Shots",
            slug: "drum-kits-and-one-shots",
          },
          {
            name: "Synth Loops & Melodies",
            slug: "synth-loops-and-melodies",
          },
          {
            name: "Vocal Chops & Acapellas",
            slug: "vocal-chops-and-acapellas",
          },
          {
            name: "Basslines & 808s",
            slug: "basslines-and-808s",
          },
          {
            name: "Instrumental Loops",
            slug: "instrumental-loops",
          },
        ],
      },
      {
        name: "Presets & Sound Banks",
        slug: "presets-and-sound-banks",
        children: [
          {
            name: "Xfer Serum Presets",
            slug: "xfer-serum-presets",
          },
          {
            name: "Vital Presets",
            slug: "vital-presets",
          },
          {
            name: "Massive & Sylenth1 Presets",
            slug: "massive-and-sylenth1-presets",
          },
          {
            name: "Guitar Amp & Effect Presets",
            slug: "guitar-amp-and-effect-presets",
          },
        ],
      },
      {
        name: "DAW Project Templates",
        slug: "daw-project-templates",
        children: [
          {
            name: "Ableton Live Projects",
            slug: "ableton-live-projects",
          },
          {
            name: "FL Studio Projects",
            slug: "fl-studio-projects",
          },
          {
            name: "Logic Pro Projects",
            slug: "logic-pro-projects",
          },
          {
            name: "Cubase Projects",
            slug: "cubase-projects",
          },
        ],
      },
    ],
  },
  {
    name: "Video & Motion Graphics",
    slug: "video-and-motion-graphics",
    children: [
      {
        name: "Stock Video Footage",
        slug: "stock-video-footage",
        children: [
          {
            name: "4K Aerial & Drone Footage",
            slug: "4k-aerial-and-drone-footage",
          },
          {
            name: "Nature & Wildlife Clips",
            slug: "nature-and-wildlife-clips",
          },
          {
            name: "Tech & Abstract Backgrounds",
            slug: "tech-and-abstract-backgrounds",
          },
          {
            name: "City & Urban Timelapse",
            slug: "city-and-urban-timelapse",
          },
          {
            name: "Slow Motion Video",
            slug: "slow-motion-video",
          },
        ],
      },
      {
        name: "Video Templates",
        slug: "video-templates",
        children: [
          {
            name: "After Effects Templates",
            slug: "after-effects-templates",
          },
          {
            name: "Premiere Pro MOGRT Templates",
            slug: "premiere-pro-mogrt-templates",
          },
          {
            name: "DaVinci Resolve Templates",
            slug: "davinci-resolve-templates",
          },
          {
            name: "Final Cut Pro Templates",
            slug: "final-cut-pro-templates",
          },
        ],
      },
      {
        name: "Motion Graphics & Animations",
        slug: "motion-graphics-and-animations",
        children: [
          {
            name: "Title Sequences & Kinetic Typography",
            slug: "title-sequences-and-kinetic-typography",
          },
          {
            name: "Logo Reveals & Openers",
            slug: "logo-reveals-and-openers",
          },
          {
            name: "Lower Thirds & Callouts",
            slug: "lower-thirds-and-callouts",
          },
          {
            name: "Transition Packs & Glitches",
            slug: "transition-packs-and-glitches",
          },
          {
            name: "Infographics & Animated Charts",
            slug: "infographics-and-animated-charts",
          },
          {
            name: "Lottie & JSON Animations",
            slug: "lottie-and-json-animations",
          },
        ],
      },
      {
        name: "Visual Effects (VFX)",
        slug: "visual-effects-vfx",
        children: [
          {
            name: "Particle & Dust Overlays",
            slug: "particle-and-dust-overlays",
          },
          {
            name: "Fire, Smoke & Explosion VFX",
            slug: "fire-smoke-and-explosion-vfx",
          },
          {
            name: "Light Leaks & Lens Flares",
            slug: "light-leaks-and-lens-flares",
          },
          {
            name: "Green Screen Elements",
            slug: "green-screen-elements",
          },
        ],
      },
      {
        name: "Color Grading & LUTs",
        slug: "color-grading-and-luts",
        children: [
          {
            name: "Cinematic LUTs",
            slug: "cinematic-luts",
          },
          {
            name: "Drone & Action Cam LUTs",
            slug: "drone-and-action-cam-luts",
          },
          {
            name: "Vintage & Film Emulation LUTs",
            slug: "vintage-and-film-emulation-luts",
          },
        ],
      },
    ],
  },
  {
    name: "Game Development Assets",
    slug: "game-development-assets",
    children: [
      {
        name: "2D Game Assets",
        slug: "2d-game-assets",
        children: [
          {
            name: "2D Sprite Sheets & Characters",
            slug: "2d-sprite-sheets-and-characters",
          },
          {
            name: "Tilemaps & Level Tilesets",
            slug: "tilemaps-and-level-tilesets",
          },
          {
            name: "Pixel Art Packs",
            slug: "pixel-art-packs",
          },
          {
            name: "Game UI, HUD & Buttons",
            slug: "game-ui-hud-and-buttons",
          },
          {
            name: "Parallax Backgrounds",
            slug: "parallax-backgrounds",
          },
        ],
      },
      {
        name: "Game Audio & Chiptune",
        slug: "game-audio-and-chiptune",
        children: [
          {
            name: "8-Bit & Retro Chiptune",
            slug: "8-bit-and-retro-chiptune",
          },
          {
            name: "Battle & Boss Theme Music",
            slug: "battle-and-boss-theme-music",
          },
          {
            name: "Character Voice Lines & Grunts",
            slug: "character-voice-lines-and-grunts",
          },
        ],
      },
      {
        name: "Game Shaders & VFX",
        slug: "game-shaders-and-vfx",
        children: [
          {
            name: "Unity Shader Graph & HLSL",
            slug: "unity-shader-graph-and-hlsl",
          },
          {
            name: "Unreal Engine Niagara Particles",
            slug: "unreal-engine-niagara-particles",
          },
          {
            name: "Stylized Cartoon Shaders",
            slug: "stylized-cartoon-shaders",
          },
          {
            name: "Water & Weather Shaders",
            slug: "water-and-weather-shaders",
          },
        ],
      },
      {
        name: "Game Templates & Frameworks",
        slug: "game-templates-and-frameworks",
        children: [
          {
            name: "Platformer Engine Kits",
            slug: "platformer-engine-kits",
          },
          {
            name: "Top-Down & RPG Kits",
            slug: "top-down-and-rpg-kits",
          },
          {
            name: "Endless Runner Templates",
            slug: "endless-runner-templates",
          },
          {
            name: "Survival & FPS Kits",
            slug: "survival-and-fps-kits",
          },
        ],
      },
      {
        name: "Textures & Normal Maps for Games",
        slug: "textures-and-normal-maps-for-games",
        children: [
          {
            name: "Low-Poly Hand-Painted Textures",
            slug: "low-poly-hand-painted-textures",
          },
          {
            name: "Pixel Textures & Palettes",
            slug: "pixel-textures-and-palettes",
          },
        ],
      },
    ],
  },
  {
    name: "Templates & Productivity",
    slug: "templates-and-productivity",
    children: [
      {
        name: "Notion Templates",
        slug: "notion-templates",
        children: [
          {
            name: "Project Management & Agile Boards",
            slug: "project-management-and-agile-boards",
          },
          {
            name: "Personal Knowledge Management (Second Brain)",
            slug: "personal-knowledge-management-second-brain",
          },
          {
            name: "Daily Habits & Routine Trackers",
            slug: "daily-habits-and-routine-trackers",
          },
          {
            name: "Freelance & Client Portals",
            slug: "freelance-and-client-portals",
          },
          {
            name: "Budget & Expense Planners",
            slug: "budget-and-expense-planners",
          },
        ],
      },
      {
        name: "Presentation & Pitch Decks",
        slug: "presentation-and-pitch-decks",
        children: [
          {
            name: "Startup Pitch Decks",
            slug: "startup-pitch-decks",
          },
          {
            name: "Keynote Presentation Templates",
            slug: "keynote-presentation-templates",
          },
          {
            name: "PowerPoint Business Slides",
            slug: "powerpoint-business-slides",
          },
          {
            name: "Google Slides Themes",
            slug: "google-slides-themes",
          },
        ],
      },
      {
        name: "Social Media Templates",
        slug: "social-media-templates",
        children: [
          {
            name: "Instagram Post & Carousel Packs",
            slug: "instagram-post-and-carousel-packs",
          },
          {
            name: "Instagram Story Templates",
            slug: "instagram-story-templates",
          },
          {
            name: "YouTube Thumbnail & Banner Kits",
            slug: "youtube-thumbnail-and-banner-kits",
          },
          {
            name: "TikTok & Reels Cover Packs",
            slug: "tiktok-and-reels-cover-packs",
          },
          {
            name: "LinkedIn Carousel Templates",
            slug: "linkedin-carousel-templates",
          },
        ],
      },
      {
        name: "Spreadsheet Models",
        slug: "spreadsheet-models",
        children: [
          {
            name: "Financial Forecast & Valuation Models",
            slug: "financial-forecast-and-valuation-models",
          },
          {
            name: "Real Estate & Investment Analyzers",
            slug: "real-estate-and-investment-analyzers",
          },
          {
            name: "Inventory & Order Tracking Sheets",
            slug: "inventory-and-order-tracking-sheets",
          },
          {
            name: "Google Sheets Dashboards",
            slug: "google-sheets-dashboards",
          },
        ],
      },
      {
        name: "Resume & CV Templates",
        slug: "resume-and-cv-templates",
        children: [
          {
            name: "Modern Tech Resume Templates",
            slug: "modern-tech-resume-templates",
          },
          {
            name: "Creative Portfolio Layouts",
            slug: "creative-portfolio-layouts",
          },
          {
            name: "Executive CV Templates",
            slug: "executive-cv-templates",
          },
        ],
      },
    ],
  },
  {
    name: "Photography & Stock Imagery",
    slug: "photography-and-stock-imagery",
    children: [
      {
        name: "Stock Photos",
        slug: "stock-photos",
        children: [
          {
            name: "Technology & Remote Work",
            slug: "technology-and-remote-work",
          },
          {
            name: "Modern Architecture & Interiors",
            slug: "modern-architecture-and-interiors",
          },
          {
            name: "Business, Finance & Corporate",
            slug: "business-finance-and-corporate",
          },
          {
            name: "Minimalist & Still Life",
            slug: "minimalist-and-still-life",
          },
          {
            name: "Nature, Flora & Landscapes",
            slug: "nature-flora-and-landscapes",
          },
        ],
      },
      {
        name: "Textures & Background Images",
        slug: "textures-and-background-images",
        children: [
          {
            name: "Studio Photo Backdrops",
            slug: "studio-photo-backdrops",
          },
          {
            name: "Macro & Abstract Textures",
            slug: "macro-and-abstract-textures",
          },
          {
            name: "Concrete, Stone & Marble Backdrops",
            slug: "concrete-stone-and-marble-backdrops",
          },
        ],
      },
      {
        name: "Photo Presets & Actions",
        slug: "photo-presets-and-actions",
        children: [
          {
            name: "Adobe Lightroom Presets (.xmp, .dng)",
            slug: "adobe-lightroom-presets-xmp-dng",
          },
          {
            name: "Photoshop Actions & Camera Raw",
            slug: "photoshop-actions-and-camera-raw",
          },
          {
            name: "Capture One Film Styles",
            slug: "capture-one-film-styles",
          },
        ],
      },
    ],
  },
  {
    name: "E-Books & Digital Learning",
    slug: "e-books-and-digital-learning",
    children: [
      {
        name: "Programming & Tech E-Books",
        slug: "programming-and-tech-e-books",
        children: [
          {
            name: "Full-Stack Web Development Guides",
            slug: "full-stack-web-development-guides",
          },
          {
            name: "Cloud Architecture & DevOps Books",
            slug: "cloud-architecture-and-devops-books",
          },
          {
            name: "AI, Data Science & Machine Learning",
            slug: "ai-data-science-and-machine-learning",
          },
          {
            name: "System Design & Scalability Guides",
            slug: "system-design-and-scalability-guides",
          },
          {
            name: "Cybersecurity & Ethical Hacking",
            slug: "cybersecurity-and-ethical-hacking",
          },
        ],
      },
      {
        name: "Design & Creative Guides",
        slug: "design-and-creative-guides",
        children: [
          {
            name: "UI/UX Design Manuals",
            slug: "ui-ux-design-manuals",
          },
          {
            name: "Typography & Layout Masterclasses",
            slug: "typography-and-layout-masterclasses",
          },
          {
            name: "3D Modeling & Rendering Guides",
            slug: "3d-modeling-and-rendering-guides",
          },
        ],
      },
      {
        name: "Business, SaaS & Indie Hacking",
        slug: "business-saas-and-indie-hacking",
        children: [
          {
            name: "SaaS Launch & Growth Playbooks",
            slug: "saas-launch-and-growth-playbooks",
          },
          {
            name: "Freelance Consulting Blueprints",
            slug: "freelance-consulting-blueprints",
          },
          {
            name: "Product Management Guides",
            slug: "product-management-guides",
          },
        ],
      },
      {
        name: "Quick Reference & Cheat Sheets",
        slug: "quick-reference-and-cheat-sheets",
        children: [
          {
            name: "Programming Syntax Cheat Sheets",
            slug: "programming-syntax-cheat-sheets",
          },
          {
            name: "Developer Command Line Guides",
            slug: "developer-command-line-guides",
          },
          {
            name: "Design Shortcut Posters",
            slug: "design-shortcut-posters",
          },
        ],
      },
    ],
  },
  {
    name: "AI Prompts & Machine Learning",
    slug: "ai-prompts-and-machine-learning",
    children: [
      {
        name: "Image Generation Prompts",
        slug: "image-generation-prompts",
        children: [
          {
            name: "Midjourney Prompt Libraries",
            slug: "midjourney-prompt-libraries",
          },
          {
            name: "Stable Diffusion Prompts & Workflows",
            slug: "stable-diffusion-prompts-and-workflows",
          },
          {
            name: "DALL-E Creative Prompts",
            slug: "dall-e-creative-prompts",
          },
        ],
      },
      {
        name: "LLM & System Prompts",
        slug: "llm-and-system-prompts",
        children: [
          {
            name: "ChatGPT Expert Prompts",
            slug: "chatgpt-expert-prompts",
          },
          {
            name: "Claude System & Reasoning Prompts",
            slug: "claude-system-and-reasoning-prompts",
          },
          {
            name: "Coding & Architecture Prompts",
            slug: "coding-and-architecture-prompts",
          },
          {
            name: "Copywriting & Marketing Prompts",
            slug: "copywriting-and-marketing-prompts",
          },
        ],
      },
      {
        name: "Fine-Tuned Weights & LoRAs",
        slug: "fine-tuned-weights-and-loras",
        children: [
          {
            name: "Stable Diffusion LoRA Models",
            slug: "stable-diffusion-lora-models",
          },
          {
            name: "Stylistic & Aesthetic Embeddings",
            slug: "stylistic-and-aesthetic-embeddings",
          },
        ],
      },
      {
        name: "Automated AI Workflows",
        slug: "automated-ai-workflows",
        children: [
          {
            name: "n8n Automation Blueprints",
            slug: "n8n-automation-blueprints",
          },
          {
            name: "LangChain & LlamaIndex Pipelines",
            slug: "langchain-and-llamaindex-pipelines",
          },
          {
            name: "Make & Zapier Scenario Blueprints",
            slug: "make-and-zapier-scenario-blueprints",
          },
        ],
      },
    ],
  },
  {
    name: "AR, VR & Spatial Computing",
    slug: "ar-vr-and-spatial-computing",
    children: [
      {
        name: "Virtual Reality Assets",
        slug: "virtual-reality-assets",
        children: [
          {
            name: "VRChat Avatars & Outfits",
            slug: "vrchat-avatars-and-outfits",
          },
          {
            name: "VR Worlds & Spatial Environments",
            slug: "vr-worlds-and-spatial-environments",
          },
          {
            name: "Interactive VR Controller Props",
            slug: "interactive-vr-controller-props",
          },
        ],
      },
      {
        name: "Augmented Reality Assets",
        slug: "augmented-reality-assets",
        children: [
          {
            name: "Instagram & Spark AR Filters",
            slug: "instagram-and-spark-ar-filters",
          },
          {
            name: "TikTok Effect House Lenses",
            slug: "tiktok-effect-house-lenses",
          },
          {
            name: "Snapchat Lens Studio Projects",
            slug: "snapchat-lens-studio-projects",
          },
          {
            name: "WebAR 3D Models (.usdz, .gltf)",
            slug: "webar-3d-models-usdz-gltf",
          },
        ],
      },
      {
        name: "Spatial OS & Vision Assets",
        slug: "spatial-os-and-vision-assets",
        children: [
          {
            name: "Apple Vision Pro UI Components",
            slug: "apple-vision-pro-ui-components",
          },
          {
            name: "Spatial Audio Soundstages",
            slug: "spatial-audio-soundstages",
          },
        ],
      },
    ],
  },
  {
    name: "Printable Digital Art & Planners",
    slug: "printable-digital-art-and-planners",
    children: [
      {
        name: "Printable Wall Art",
        slug: "printable-wall-art",
        children: [
          {
            name: "Minimalist & Line Art Prints",
            slug: "minimalist-and-line-art-prints",
          },
          {
            name: "Botanical & Floral Art",
            slug: "botanical-and-floral-art",
          },
          {
            name: "Mid-Century Modern Art Prints",
            slug: "mid-century-modern-art-prints",
          },
          {
            name: "Typography & Motivational Posters",
            slug: "typography-and-motivational-posters",
          },
          {
            name: "Abstract Geometric Prints",
            slug: "abstract-geometric-prints",
          },
        ],
      },
      {
        name: "Digital Planners & Journals",
        slug: "digital-planners-and-journals",
        children: [
          {
            name: "GoodNotes & Notability Planners",
            slug: "goodnotes-and-notability-planners",
          },
          {
            name: "Digital Bullet Journals",
            slug: "digital-bullet-journals",
          },
          {
            name: "Fitness & Wellness Digital Journals",
            slug: "fitness-and-wellness-digital-journals",
          },
          {
            name: "Meal & Recipe Digital Notebooks",
            slug: "meal-and-recipe-digital-notebooks",
          },
        ],
      },
      {
        name: "Printable Stationery & Paper Craft",
        slug: "printable-stationery-and-paper-craft",
        children: [
          {
            name: "Printable Planner Inserts",
            slug: "printable-planner-inserts",
          },
          {
            name: "Digital Stickers & PNG Packs",
            slug: "digital-stickers-and-png-packs",
          },
          {
            name: "Printable Gift Tags & Labels",
            slug: "printable-gift-tags-and-labels",
          },
        ],
      },
    ],
  },
];

/**
 * Alias for default category tree.
 */
export const CATEGORY_TREE = defaultCategories;

/**
 * Recursively flattens the category tree into an ordered array of FlatCategory items.
 * Root items (depth 0) appear first, followed by descendants with breadcrumb paths.
 */
export function flattenCategories(
  nodes: readonly CategoryNode[] = defaultCategories,
  parentSlug: string | null = null,
  depth = 0,
  pathNames: string[] = [],
  pathSlugs: string[] = [],
): FlatCategory[] {
  const result: FlatCategory[] = [];

  for (const node of nodes) {
    const currentPathNames = [...pathNames, node.name];
    const currentPathSlugs = [...pathSlugs, node.slug];
    const children = node.children ?? [];

    result.push({
      name: node.name,
      slug: node.slug,
      parentSlug,
      fullPath: currentPathNames.join(" > "),
      pathSlugs: currentPathSlugs,
      depth,
      hasChildren: children.length > 0,
      childrenCount: children.length,
    });

    if (children.length > 0) {
      result.push(
        ...flattenCategories(
          children,
          node.slug,
          depth + 1,
          currentPathNames,
          currentPathSlugs,
        ),
      );
    }
  }

  return result;
}

/**
 * Finds a category node by slug (depth-first search).
 */
export function findCategoryBySlug(
  slug: string,
  nodes: readonly CategoryNode[] = defaultCategories,
): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    if (node.children) {
      const found = findCategoryBySlug(slug, node.children);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Finds a category node matching full hierarchical breadcrumb path (e.g. "Graphics & Design > UI & UX Kits > Mobile App UI Kits").
 */
export function findCategoryByPath(
  path: string,
  nodes: readonly CategoryNode[] = defaultCategories,
): CategoryNode | undefined {
  const parts = path.split(">").map((p) => p.trim().toLowerCase());
  if (parts.length === 0) return undefined;

  let currentLevel: readonly CategoryNode[] | undefined = nodes;
  let target: CategoryNode | undefined;

  for (const part of parts) {
    if (!currentLevel) return undefined;
    target = currentLevel.find((c) => c.name.toLowerCase() === part || c.slug === part);
    if (!target) return undefined;
    currentLevel = target.children;
  }

  return target;
}

/**
 * Returns overall statistics for the category tree.
 */
export function getCategoryStats(
  nodes: readonly CategoryNode[] = defaultCategories,
): CategoryTreeStats {
  const flat = flattenCategories(nodes);
  const rootCount = nodes.length;
  const maxDepth = flat.reduce((max, c) => (c.depth > max ? c.depth : max), 0);

  return {
    totalCategories: flat.length,
    rootCategories: rootCount,
    subCategories: flat.length - rootCount,
    maxDepth,
  };
}

/**
 * Returns top-level root categories.
 */
export function getRootCategories(
  nodes: readonly CategoryNode[] = defaultCategories,
): CategoryNode[] {
  return [...nodes];
}

/**
 * Returns direct subcategories for a given parent slug.
 */
export function getSubcategories(
  parentSlug: string,
  nodes: readonly CategoryNode[] = defaultCategories,
): CategoryNode[] {
  const parent = findCategoryBySlug(parentSlug, nodes);
  return parent?.children ? [...parent.children] : [];
}

export default defaultCategories;
