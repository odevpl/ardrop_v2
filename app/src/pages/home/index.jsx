import MarketingBanner from "modules/MarketingBanner";
import SuggestedProducts from "modules/SuggestedProducts";
import AllProducts from "modules/AllProducts";

const HomePage = () => {
  return (
    <section className="homePage">
      <MarketingBanner />
      <SuggestedProducts />
      <AllProducts />
    </section>
  );
};

export default HomePage;
