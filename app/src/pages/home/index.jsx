import HeroBanner from "modules/HeroBanner";
import SuggestedProducts from "modules/SuggestedProducts";
import AllProducts from "modules/AllProducts";

const HomePage = () => {
  return (
    <section className="homePage">
      {/* <HeroBanner imageUrl="hero.png" /> */}
      {/* <SuggestedProducts /> */}
      <AllProducts />
    </section>
  );
};

export default HomePage;
