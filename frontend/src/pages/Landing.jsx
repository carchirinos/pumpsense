import Header from '../components/LandingPage/Header';
import Hero from '../components/LandingPage/Hero';
import FailureCategories from '../components/LandingPage/FailureCategories';
import Testimonials from '../components/LandingPage/Testimonials';
import Footer from '../components/LandingPage/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main>
        <Hero />
        <FailureCategories />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
