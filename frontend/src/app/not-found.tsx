import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NotFoundContent from "@/components/NotFoundContent";

/** Global 404 for unmatched URLs — outside the (site) group, so it renders its own chrome. */
export default function GlobalNotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
    </div>
  );
}
