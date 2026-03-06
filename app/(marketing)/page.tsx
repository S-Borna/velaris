// Copyright (c) Said Borna. All rights reserved.
import { Hero } from "@/components/marketing/hero";
import { TrustLogos } from "@/components/marketing/trust-logos";
import { FeaturesSection } from "@/components/marketing/features-section";
import { ContentSection } from "@/components/marketing/content-section";
import { IntegrationsSection } from "@/components/marketing/integrations-section";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { BlogSection } from "@/components/marketing/blog-section";
import { CtaSection } from "@/components/marketing/cta-section";

/**
 * Public marketing landing page — accessible without auth.
 * Full 12-section layout per CLAUDE.md Phase 10A spec.
 */
export default function LandingPage() {
    return (
        <>
            <Hero />
            <TrustLogos />
            <FeaturesSection />
            <ContentSection />
            <IntegrationsSection />
            <UseCasesSection />
            <PricingSection />
            <BlogSection />
            <CtaSection />
        </>
    );
}
