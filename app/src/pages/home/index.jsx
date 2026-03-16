import MarketingBanner from "modules/MarketingBanner";
import CategoriesView from "modules/CategoriesView";
import SuggestedProducts from "modules/SuggestedProducts";
import AllProducts from "modules/AllProducts";

const HomePage = () => {
  return (
    <section className="homePage">
      <MarketingBanner />
      {/* <CategoriesView /> */}
      {/* <SuggestedProducts /> */}
      <AllProducts />
    </section>
  );
};

export default HomePage;
