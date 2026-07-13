/**
 * Freelance gig seed fixtures.
 *
 * Content migrated verbatim from the Astro website:
 *   exyconn-website/src/data/career/gigs.data.ts   (freelanceGigsData.gigs)
 */

import type { GigInput } from '../../website.inputs';

export const gigFixtures: GigInput[] = [
  {
    gigCode: "GIG-DES-001",
    title: "Brand & Logo Designer (Freelance / Contract)",
    category: "Design",
    shortDescription:
      "Redesign logos for our 4 brands with modern, horizontal, scalable designs for web, mobile, and marketing.",
    fullDescription: `
        <p class="text-base text-gray-700 leading-7 mb-4">We are looking for a creative and experienced Brand & Logo Designer to redesign logos for our 4 brands. The goal is to create modern, simple, and scalable horizontal logos that follow current design standards and work seamlessly across web, mobile apps, and marketing platforms.</p>
        
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6 first:mt-0">🏢 Our Brands:</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Exyconn</strong> – <a href="https://exyconn.com" target="_blank" class="text-blue-600 hover:underline">https://exyconn.com</a></span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Sibera</strong> – <a href="https://sibera.work" target="_blank" class="text-purple-600 hover:underline">https://sibera.work</a></span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Spentiva</strong> – <a href="https://spentiva.com" target="_blank" class="text-emerald-600 hover:underline">https://spentiva.com</a></span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-pink-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Duncit</strong> – <a href="https://duncit.com" target="_blank" class="text-pink-600 hover:underline">https://duncit.com</a></span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">🎯 Project Scope:</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span>Complete logo redesign for all 4 brands</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span>Logos must be horizontal</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span>Clean, modern, and minimal design</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span>Must follow current branding & design standards</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span>Compatible with Light & Dark modes</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span>Optimized for App, Web, Website, and Marketing use</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">📐 Required Deliverables:</h4>
        <p class="text-base font-semibold text-gray-900 mb-2 mt-4"><strong>1️⃣ Favicon</strong></p>
        <ul class="space-y-2 mb-4 ml-6">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>16×16, 32×32, 48×48, 64×64</span></li>
        </ul>

        <p class="text-base font-semibold text-gray-900 mb-2 mt-4"><strong>2️⃣ Light & Dark Mode Logos (SVG + PNG)</strong></p>
        <p class="text-base text-gray-700 leading-7 mb-2">For each brand:</p>
        <ul class="space-y-2 mb-2 ml-6">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>64×64, 128×128, 256×256, 512×512, 1024×1024</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>➡️ Total: 10 images per brand (Light + Dark)</span></li>
        </ul>

        <p class="text-base font-semibold text-gray-900 mb-2 mt-4"><strong>3️⃣ Mobile App Icon Style Logos</strong></p>
        <p class="text-base text-gray-700 leading-7 mb-2">For each brand:</p>
        <ul class="space-y-2 mb-4 ml-6">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>64×64, 128×128, 256×256, 512×512, 1024×1024</span></li>
        </ul>

        <p class="text-base font-semibold text-gray-900 mb-2 mt-4"><strong>4️⃣ Additional Required Sizes (App, Web & Marketing)</strong></p>
        <ul class="space-y-2 mb-4 ml-6">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>App Store Icon (1024×1024)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>Web Header Logo</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>Footer Logo</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>Social Media Profile (Square)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>Social Media Cover</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>Email Signature Logo</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>Splash Screen Logo</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-gray-500 font-bold mt-1">•</span><span>Branding Kit Preview</span></li>
        </ul>

        <p class="text-base font-semibold text-gray-900 mb-2 mt-4"><strong>📦 Final Files Required:</strong></p>
        <ul class="space-y-2 mb-4 ml-6">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>SVG (Primary format)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>PNG (Transparent background)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>Source files (Figma / Adobe XD / Illustrator)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>Color palette</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>Font recommendations</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>Basic brand usage guidelines (preferred)</span></li>
        </ul>
      `,
    deliverables: [
      "Complete favicon set (16×16 to 64×64)",
      "Light & Dark mode logos in all sizes (4 brands × 10 images each)",
      "Mobile app icon style logos for all brands",
      "Marketing assets (social media, email, web)",
      "SVG + PNG files with transparent backgrounds",
      "Source files (Figma/Adobe XD/Illustrator)",
      "Color palette and font recommendations",
      "Brand usage guidelines document",
    ],
    requirements: [
      "Proven experience in logo & brand design",
      "Strong understanding of modern design trends",
      "Experience with tech, SaaS, or startup brands (preferred)",
      "Ability to maintain brand consistency across multiple companies",
      "Comfortable with feedback and revisions",
      "Portfolio showcasing logo and brand identity work",
    ],
    tags: [
      "Logo Design",
      "Brand Identity",
      "Figma",
      "Illustrator",
      "SVG",
      "Icon Design",
      "UI/UX",
    ],
    budget: "$10 USD",
    duration: "Flexible (discuss with us)",
    status: "open",
    applicationType: "email",
    applicationContact: "careers@exyconn.com",
    postedDate: new Date('2026-01-08'),
    isUrgent: true,
  },
];
