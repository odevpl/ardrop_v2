const PlaceholderPage = ({ title, description, items = [] }) => (
  <section className="sellerPageSection">
    <div className="sellerToolbar">
      <h2>{title}</h2>
    </div>

    <div className="sellerConfigPlaceholder">
      <p>{description}</p>
      <div className="sellerConfigPlaceholderList">
        {items.map((item) => (
          <div key={item} className="sellerConfigPlaceholderItem">
            {item}
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default PlaceholderPage
