// Copyright (c) Said Borna. All rights reserved.
import { Hero } from "@/components/marketing/hero";
import { TrustLogos } from "@/components/marketing/trust-logos";
import { FeaturesSection } from "@/components/marketing/features-section";

/**
 * Public marketing landing page — accessible without auth.
 * Sections: Hero → Trust Logos → Features (checkpoint).
 * Remaining sections added after design review.
 */
export default function LandingPage() {
    return (
        <>
            <Hero />
            <TrustLogos />
            <FeaturesSection />
        </>
    );
}
