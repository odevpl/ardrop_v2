import "./Footer.scss";

const Footer = () => {
  return (
    <footer className="clientFooter">
      <div className="clientFooterTop">
        <section className="clientFooterCol clientFooterBrand">
          <img className="clientFooterLogoImage" src="/logo.png" alt="Ardrop" />
          <p>
            Projekt Ardrop zasila Aromatycznie sp. z o.o. Zapraszamy do kontaktu
            w sprawie wspolpracy i wdrozen e-commerce.
          </p>
        </section>

        <section className="clientFooterCol clientFooterCompany">
          <h4>Dane firmy</h4>
          <ul>
            <li>Aromatycznie sp. z o.o.</li>
            <li>Różana 3</li>
            <li>Nakło Śląskie, 42-620</li>
            <li>NIP: 6452597821</li>
            <li>REGON: 543843086</li>
          </ul>
        </section>
      </div>

      <div className="clientFooterBottom">
        <p className="clientFooterContact">
          Tel: 509 043 258
          <br />
          kontakt@ardrop.pl
        </p>
        <p className="clientFooterRights">
          Copyright:{" "}
          <a href="https://odev.pl" target="_blank">
            Odev.pl
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
