import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { TripForm } from "@/components/home/trip-form";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <TripForm />
      </main>
      <Footer />
    </>
  );
}
