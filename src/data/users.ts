/**
 * User Profiles Dataset
 *
 * Sourced for seeding realistic accounts across platform roles and cities.
 * All emails use single-word identifiers ending with @ovi.com.
 */

export interface UserProfile {
  name: string;
  email: string;
  city:
    | "Lahore"
    | "Karachi"
    | "Islamabad"
    | "Rawalpindi"
    | "Faisalabad"
    | "Peshawar"
    | string;
  defaultRole: "seller" | "buyer";
  title: string;
  bio: string;
  phoneNumber: string;
}

export const defaultUsers: UserProfile[] = [
  {
    name: "Majid",
    email: "majid@ovi.com",
    city: "Lahore",
    defaultRole: "seller",
    title: "Senior 3D Artist & Visualizer",
    bio: "Specializes in high-fidelity 3D models, PBR textures, and game environments.",
    phoneNumber: "+92-300-5550101",
  },
  {
    name: "Ali",
    email: "ali@ovi.com",
    city: "Karachi",
    defaultRole: "seller",
    title: "UI/UX & Design Systems Architect",
    bio: "Creates Figma enterprise design libraries, mobile UI kits, and multi-brand tokens.",
    phoneNumber: "+92-321-5550102",
  },
  {
    name: "Asif",
    email: "asif@ovi.com",
    city: "Islamabad",
    defaultRole: "seller",
    title: "Full-Stack Engineer & Template Developer",
    bio: "Publishes production-ready microservice starter kits, REST API boilerplates, and pipelines.",
    phoneNumber: "+92-333-5550103",
  },
  {
    name: "Noreen",
    email: "noreen@ovi.com",
    city: "Rawalpindi",
    defaultRole: "seller",
    title: "Vector Illustrator & Graphic Designer",
    bio: "Creates scalable illustration bundles, branding iconography, and typographic assets.",
    phoneNumber: "+92-345-5550104",
  },
  {
    name: "Tariq",
    email: "tariq@ovi.com",
    city: "Faisalabad",
    defaultRole: "seller",
    title: "Motion Graphics Designer & Animator",
    bio: "Designs cinematic title sequences, After Effects kinetic typography, and presets.",
    phoneNumber: "+92-312-5550105",
  },
  {
    name: "Fatima",
    email: "fatima@ovi.com",
    city: "Peshawar",
    defaultRole: "buyer",
    title: "Commercial Audio Engineer",
    bio: "Licenses acoustic game loops, sound effects, and instrumental tracks for media.",
    phoneNumber: "+92-301-5550106",
  },
  {
    name: "Usman",
    email: "usman@ovi.com",
    city: "Lahore",
    defaultRole: "buyer",
    title: "Creative Agency Art Director",
    bio: "Regularly procures premium 3D product mockups, typography licenses, and visual kits.",
    phoneNumber: "+92-322-5550107",
  },
  {
    name: "Hamza",
    email: "hamza@ovi.com",
    city: "Karachi",
    defaultRole: "buyer",
    title: "Fintech Startup Product Manager",
    bio: "Procures compliant UI component libraries, financial dashboard themes, and icon sets.",
    phoneNumber: "+92-334-5550108",
  },
  {
    name: "Ayesha",
    email: "ayesha@ovi.com",
    city: "Islamabad",
    defaultRole: "buyer",
    title: "Independent Game Developer",
    bio: "Acquires low-poly 3D environmental assets, character rigs, and custom shader packs.",
    phoneNumber: "+92-346-5550109",
  },
  {
    name: "Zeeshan",
    email: "zeeshan@ovi.com",
    city: "Rawalpindi",
    defaultRole: "buyer",
    title: "E-Commerce Consultant & Developer",
    bio: "Sources verified Shopify and Next.js commerce storefront starter kits.",
    phoneNumber: "+92-313-5550110",
  },
];

/**
 * Calculates assigned role based on requested seller distribution.
 * Ensures both buyer and seller roles are guaranteed.
 */
export function resolveConfiguredRole(
  index: number,
  totalUsers: number,
  sellerCount: number,
): "seller" | "buyer" {
  const boundedSellers = Math.max(1, Math.min(totalUsers - 1, sellerCount));
  return index < boundedSellers ? "seller" : "buyer";
}
