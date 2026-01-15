import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Verification from "@/components/landing/Verification";
import AITools from "@/components/landing/AITools";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Verification />
        <AITools />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
