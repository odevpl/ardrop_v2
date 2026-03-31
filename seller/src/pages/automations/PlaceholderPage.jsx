const PlaceholderPage = ({ title, description, items = [] }) => (
  <section className="sellerPageSection">
    <div className="sellerToolbar">
      <h2>{title}</h2>
    </div>

    <div className="sellerConfigPlaceholder">
      <p>{description}</p>

      {items.length > 0 && (
        <ul className="sellerConfigPlaceholderList">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  </section>
)

export default PlaceholderPage
