import { useEffect, useMemo, useState } from "react";
import MarketingService from "services/marketing";
import "./marketing.scss";

const DEFAULT_CAMPAIGN_FORM = {
  name: "",
  slug: "",
  status: "draft",
  layoutMode: "auto",
  priority: 100,
  maxItems: 6,
};

const DEFAULT_ITEM_FORM = {
  title: "",
  subtitle: "",
  imageAlt: "",
  targetType: "url",
  targetValue: "",
  position: 0,
  isActive: true,
};

const MarketingPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignForm, setCampaignForm] = useState(DEFAULT_CAMPAIGN_FORM);
  const [itemForm, setItemForm] = useState(DEFAULT_ITEM_FORM);
  const [itemFile, setItemFile] = useState(null);
  const [error, setError] = useState("");

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => Number(campaign.id) === Number(selectedCampaignId)) || null,
    [campaigns, selectedCampaignId],
  );

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const response = await MarketingService.getCampaigns({
      page: 1,
      limit: 100,
      placement: "home_hero",
    });
    setIsLoading(false);

    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie pobrac kampanii.");
      return;
    }

    const list = Array.isArray(response?.data) ? response.data : [];
    setCampaigns(list);
    if (!selectedCampaignId && list.length > 0) {
      setSelectedCampaignId(list[0].id);
    }
  };

  const fetchItems = async (campaignId) => {
    if (!campaignId) {
      setItems([]);
      return;
    }

    const response = await MarketingService.getCampaignItems(campaignId);
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie pobrac elementow kampanii.");
      return;
    }
    setItems(Array.isArray(response?.data) ? response.data : []);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchItems(selectedCampaignId);
  }, [selectedCampaignId]);

  const handleCreateCampaign = async (event) => {
    event.preventDefault();
    setError("");
    const response = await MarketingService.createCampaign({
      ...campaignForm,
      placement: "home_hero",
    });
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie utworzyc kampanii.");
      return;
    }

    setCampaignForm(DEFAULT_CAMPAIGN_FORM);
    await fetchCampaigns();
  };

  const handleCampaignStatusChange = async (campaign, nextStatus) => {
    const response = await MarketingService.updateCampaign({
      id: campaign.id,
      payload: { status: nextStatus },
    });

    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie zapisac statusu.");
      return;
    }

    await fetchCampaigns();
  };

  const handleCreateItem = async (event) => {
    event.preventDefault();
    if (!selectedCampaignId) return;
    if (!itemFile) {
      setError("Dodaj obraz do elementu kampanii.");
      return;
    }

    const response = await MarketingService.createCampaignItem({
      campaignId: selectedCampaignId,
      payload: itemForm,
      file: itemFile,
    });

    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie dodac elementu kampanii.");
      return;
    }

    setItemForm(DEFAULT_ITEM_FORM);
    setItemFile(null);
    await fetchItems(selectedCampaignId);
  };

  const handleDeleteCampaign = async (campaign) => {
    const response = await MarketingService.deleteCampaign(campaign.id);
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie usunac kampanii.");
      return;
    }

    if (Number(selectedCampaignId) === Number(campaign.id)) {
      setSelectedCampaignId(null);
      setItems([]);
    }
    await fetchCampaigns();
  };

  const handleToggleItem = async (item) => {
    const response = await MarketingService.updateCampaignItem({
      id: item.id,
      payload: { isActive: !item.isActive },
    });
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie zmienic statusu elementu.");
      return;
    }
    await fetchItems(selectedCampaignId);
  };

  const handleDeleteItem = async (item) => {
    const response = await MarketingService.deleteCampaignItem(item.id);
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie usunac elementu.");
      return;
    }
    await fetchItems(selectedCampaignId);
  };

  return (
    <section className="adminPageSection marketingSection">
      <div className="adminToolbar">
        <h2>Reklama</h2>
      </div>

      {error ? <p className="adminFormError">{error}</p> : null}
      {isLoading ? <p>Ladowanie...</p> : null}

      <div className="marketingLayout">
        <article className="marketingCard">
          <h3>Kampanie home_hero</h3>
          <form className="marketingForm" onSubmit={handleCreateCampaign}>
            <input
              type="text"
              placeholder="Nazwa kampanii"
              value={campaignForm.name}
              onChange={(event) => setCampaignForm({ ...campaignForm, name: event.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Slug"
              value={campaignForm.slug}
              onChange={(event) => setCampaignForm({ ...campaignForm, slug: event.target.value })}
              required
            />
            <select
              value={campaignForm.layoutMode}
              onChange={(event) => setCampaignForm({ ...campaignForm, layoutMode: event.target.value })}
            >
              <option value="auto">Auto</option>
              <option value="hero">Hero</option>
              <option value="tiles">Tiles</option>
            </select>
            <select
              value={campaignForm.status}
              onChange={(event) => setCampaignForm({ ...campaignForm, status: event.target.value })}
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
            <button type="submit" className="adminPrimaryButton">
              Dodaj kampanie
            </button>
          </form>

          <div className="marketingList">
            {campaigns.map((campaign) => (
              <button
                type="button"
                key={campaign.id}
                className={`marketingListItem${
                  Number(selectedCampaignId) === Number(campaign.id) ? " marketingListItemActive" : ""
                }`}
                onClick={() => setSelectedCampaignId(campaign.id)}
              >
                <span>{campaign.name}</span>
                <span className="marketingListMeta">
                  {campaign.layoutMode} / {campaign.status}
                </span>
              </button>
            ))}
          </div>

          {selectedCampaign ? (
            <div className="marketingActions">
              <button
                type="button"
                onClick={() => handleCampaignStatusChange(selectedCampaign, "active")}
                className="adminPrimaryButton"
              >
                Ustaw jako active
              </button>
              <button
                type="button"
                onClick={() => handleCampaignStatusChange(selectedCampaign, "draft")}
              >
                Ustaw jako draft
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCampaign(selectedCampaign)}
              >
                Usun kampanie
              </button>
            </div>
          ) : null}
        </article>

        <article className="marketingCard">
          <h3>Elementy kampanii</h3>
          {!selectedCampaignId ? <p>Wybierz kampanie.</p> : null}
          {selectedCampaignId ? (
            <>
              <form className="marketingForm" onSubmit={handleCreateItem}>
                <input
                  type="text"
                  placeholder="Tytul"
                  value={itemForm.title}
                  onChange={(event) => setItemForm({ ...itemForm, title: event.target.value })}
                />
                <input
                  type="text"
                  placeholder="Podtytul"
                  value={itemForm.subtitle}
                  onChange={(event) => setItemForm({ ...itemForm, subtitle: event.target.value })}
                />
                <select
                  value={itemForm.targetType}
                  onChange={(event) => setItemForm({ ...itemForm, targetType: event.target.value })}
                >
                  <option value="url">url</option>
                  <option value="product">product</option>
                  <option value="custom">custom</option>
                </select>
                <input
                  type="text"
                  placeholder="Target value"
                  value={itemForm.targetValue}
                  onChange={(event) => setItemForm({ ...itemForm, targetValue: event.target.value })}
                  required
                />
                <input type="file" accept="image/*" onChange={(event) => setItemFile(event.target.files?.[0] || null)} />
                <button type="submit" className="adminPrimaryButton">
                  Dodaj element
                </button>
              </form>

              <div className="marketingItemsGrid">
                {items.map((item) => (
                  <article className="marketingItemCard" key={item.id}>
                    <img src={item.imageUrl} alt={item.imageAlt || item.title || "Baner"} />
                    <h4>{item.title || "Bez tytulu"}</h4>
                    <p>{item.targetType}: {item.targetValue}</p>
                    <div className="marketingItemActions">
                      <button type="button" onClick={() => handleToggleItem(item)}>
                        {item.isActive ? "Dezaktywuj" : "Aktywuj"}
                      </button>
                      <button type="button" onClick={() => handleDeleteItem(item)}>
                        Usun
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
};

export default MarketingPage;
