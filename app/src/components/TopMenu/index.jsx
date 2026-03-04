import { NavLink } from "react-router-dom";
import "./TopMenu.scss";

const defaultRenderItem = ({ item, className, isActive, content }) => {
  if (typeof item.onClick === "function") {
    return (
      <button
        type="button"
        className={className}
        onClick={item.onClick}
        aria-label={item.ariaLabel}
        aria-current={isActive ? "page" : undefined}
      >
        {content}
      </button>
    );
  }

  if (item.path) {
    return (
      <NavLink
        to={item.path}
        className={className}
        aria-label={item.ariaLabel}
      >
        {content}
      </NavLink>
    );
  }

  return null;
};

const TopMenu = ({ config = [], renderItem }) => {
  const leftItems = config.filter((item) => item.align !== "right");
  const rightItems = config.filter((item) => item.align === "right");

  const renderMenuItem = (item) => {
    const key = item.key || item.path || item.label || item.ariaLabel;
    const className = `topMenuItem${item.isActive ? " topMenuItemActive" : ""}`;
    const content = (
      <>
        {item.icon ? <span className="topMenuIcon">{item.icon}</span> : null}
        {item.label ? <span className="topMenuLabel">{item.label}</span> : null}
      </>
    );

    if (typeof renderItem === "function") {
      return renderItem({ item, key, className, content });
    }

    return (
      <div key={key} className="topMenuItemWrap">
        {defaultRenderItem({
          item,
          className,
          isActive: item.isActive,
          content,
        })}
      </div>
    );
  };

  return (
    <nav className="topMenu" aria-label="Menu gorne">
      <div className="topMenuGroup topMenuGroupLeft">{leftItems.map(renderMenuItem)}</div>
      <div className="topMenuGroup topMenuGroupRight">
        {rightItems.map(renderMenuItem)}
      </div>
    </nav>
  );
};

export default TopMenu;
