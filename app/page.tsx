import { AboutSection } from "@/components/landing/about-section";
import { AiKnowledgeSection } from "@/components/landing/ai-knowledge-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { BusinessMatchingSection } from "@/components/landing/business-matching-section";
import { CertificationSection } from "@/components/landing/certification-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FaqSection } from "@/components/landing/faq-section";
import { Footer } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { Navbar } from "@/components/landing/navbar";
import { ProcessSection } from "@/components/landing/process-section";
import { ServiceSection } from "@/components/landing/service-section";
import { StatisticsSection } from "@/components/landing/statistics-section";
import { TestimonialSection } from "@/components/landing/testimonial-section";
import { TestingWorkflowSection } from "@/components/landing/testing-workflow-section";
import { TrustedServices } from "@/components/landing/trusted-services";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TrustedServices />
        <AboutSection />
        <ServiceSection />
        <TestingWorkflowSection />
        <CertificationSection />
        <BenefitsSection />
        <StatisticsSection />
        <ProcessSection />
        <AiKnowledgeSection />
        <BusinessMatchingSection />
        <TestimonialSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
