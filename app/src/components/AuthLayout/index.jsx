import "./AuthLayout.scss";

const AuthLayout = ({
  title,
  subtitle,
  children,
  visualImageSrc = "/logo.png",
  visualAlt = "Ilustracja logowania",
}) => {
  return (
    <main className="authPage">
      <section className="authShell">
        <aside className="authVisual" aria-hidden="true">
          <div className="authVisualMedia">
            <img src={visualImageSrc} alt={visualAlt} />
          </div>
        </aside>
        <div className="authPanel">
          <div className="authCard">
            <header className="authCardHeader">
              <h1 className="authTitle">{title}</h1>
              {subtitle ? <p className="authSubtitle">{subtitle}</p> : null}
            </header>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthLayout;
