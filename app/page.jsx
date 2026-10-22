import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Pipeline from "@/components/Pipeline";
import Workspace from "@/components/Workspace";
import { Coverage, Evaluation, Footer } from "@/components/Sections";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Pipeline />
      <Workspace />
      <Coverage />
      <Evaluation />
      <Footer />
    </main>
  );
}
