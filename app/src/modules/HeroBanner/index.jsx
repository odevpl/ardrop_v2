import "./HeroBanner.scss";

const HeroBanner = ({ imageUrl = "", alt = "Grafika reklamowa" }) => {
  return (
    <section className="heroBanner" aria-label="Baner reklamowy">
      <div className="heroBannerTrack">
        <img className="heroBannerImage" src={imageUrl} alt={alt} />
      </div>
    </section>
  );
};

export default HeroBanner;
