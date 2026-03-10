import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FetchWrapper from "components/FetchWrapper";
import MarketingService from "services/marketing";
import "./MarketingBanner.scss";

const resolveLayout = (layoutMode, count) => {
  if (layoutMode === "hero") return "hero";
  if (layoutMode === "tiles") return "tiles";
  return count <= 1 ? "hero" : "tiles";
};

const getItemTargetPath = (item) => {
  const value = String(item?.targetValue || "").trim();
  if (!value) return null;

  if (item?.targetType === "product") {
    return `/products/${value}`;
  }

  return value;
};

const MarketingBannerView = ({ payload }) => {
  const navigate = useNavigate();
  const campaign = payload?.data?.campaign || null;
  const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];

  const visibleItems = useMemo(() => {
    const maxItems = Number(campaign?.maxItems || 6);
    return items.slice(0, Math.max(1, maxItems));
  }, [campaign?.maxItems, items]);

  if (!campaign || visibleItems.length === 0) {
    return null;
  }

  const layout = resolveLayout(campaign.layoutMode, visibleItems.length);

  const handleItemClick = (item) => {
    const target = getItemTargetPath(item);
    if (!target) return;

    if (/^https?:\/\//i.test(target)) {
      window.location.href = target;
      return;
    }

    navigate(target);
  };

  return (
    <section className={`marketingBanner marketingBanner-${layout}`} aria-label="Banery marketingowe">
      {visibleItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className="marketingBannerItem"
          onClick={() => handleItemClick(item)}
          aria-label={item.title || item.imageAlt || "Baner"}
        >
          <img
            src={item.imageUrl}
            alt={item.imageAlt || item.title || "Baner marketingowy"}
            loading="lazy"
          />
          {(item.title || item.subtitle) && (
            <span className="marketingBannerCaption">
              {item.title ? <strong>{item.title}</strong> : null}
              {item.subtitle ? <small>{item.subtitle}</small> : null}
            </span>
          )}
        </button>
      ))}
    </section>
  );
};

const MarketingBanner = () => {
  return (
    <FetchWrapper
      name="MarketingBanner"
      component={MarketingBannerView}
      connector={MarketingService.getHomeHeroCampaign}
      filters={{}}
    />
  );
};

export default MarketingBanner;

