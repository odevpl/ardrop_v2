import HeroBanner from "modules/HeroBanner";
import SuggestedProducts from "modules/SuggestedProducts";

const HomePage = () => {
  return (
    <section className="homePage">
      <HeroBanner imageUrl="hero.png" />
      <SuggestedProducts />
    </section>
  );
};

export default HomePage;
