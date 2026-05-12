import { useEffect, useState } from "react";
import Checkbox from "components/FormikWrapper/FormControls/Checkbox";
import Input from "components/FormikWrapper/FormControls/Input";
import FormikWrapper from "components/FormikWrapper";
import FetchWrapper from "components/FetchWrapper";
import { useNotification } from "components/GlobalNotification/useNotification";
import Popup2 from "components/Popup2";
import { useNavigate } from "react-router-dom";
import ProductsService from "services/products";
import SellerSettingsService from "services/sellerSettings";
import { initialValues } from "./initialValues";
import {
  DISCOUNT_RULE_TYPE_OPTIONS,
  getThresholdLabel,
  getRuleFieldVisibility,
  validateDiscountEditForm,
} from "./validation";

const getPayload = (response) => response?.data || response || {};
const buildRuleConfig = (values) => {
  const visibility = getRuleFieldVisibility(values.ruleType);

  return {
    thresholdValue: visibility.showThreshold
      ? values.thresholdValue === ""
        ? null
        : Number(values.thresholdValue)
      : null,
    discountPercent: visibility.showDiscountPercent
      ? Number(values.discountPercent)
      : null,
    couponCode: visibility.showCouponCode ? String(values.couponCode || "").trim().toUpperCase() : null,
    usageLimitPerClient: visibility.showUsageLimitPerClient
      ? Number(values.usageLimitPerClient || 0)
      : null,
    bonusLabel: visibility.showBonusLabel ? values.bonusLabel || null : null,
    selectedVariantIds: visibility.showVariantPicker
      ? Array.isArray(values.selectedVariantIds)
        ? values.selectedVariantIds
        : []
      : [],
  };
};
const normalizeRuleType = (value) => String(value || "").trim();
const getRuleTypeOptions = () => Object.entries(DISCOUNT_RULE_TYPE_OPTIONS);
const isSupportedRuleType = (ruleType) =>
  Object.prototype.hasOwnProperty.call(DISCOUNT_RULE_TYPE_OPTIONS, ruleType);
const getMainProductImage = (product) => {
  const images = Array.isArray(product?.images) ? product.images : [];
  return images.find((image) => Boolean(image?.isMain)) || images[0] || null;
};
const getVariantGroups = (products) =>
  (Array.isArray(products) ? products : []).map((product) => {
    const mainImage = getMainProductImage(product);
    const variants = Array.isArray(product?.variants) ? product.variants : [];

    return {
      id: Number(product.id),
      productName: product?.name || "Produkt",
      thumbUrl: mainImage?.thumbUrl || mainImage?.url || "",
      variants: variants.map((variant) => ({
        id: Number(variant.id),
        variantName: variant?.name || "Wariant",
      })),
    };
  });

const VariantPickerPopup = ({ values, setFieldValue, products, onClose }) => {
  const variantGroups = getVariantGroups(products);
  const searchValue = String(values.variantSearch || "").trim().toLowerCase();
  const selectedIds = Array.isArray(values.selectedVariantIds)
    ? values.selectedVariantIds
    : [];
  const filteredGroups = variantGroups
    .map((group) => {
      const filteredVariants = group.variants.filter((variant) => {
        const haystack = `${group.productName} ${variant.variantName}`.toLowerCase();
        return haystack.includes(searchValue);
      });

      if (filteredVariants.length === 0) {
        return null;
      }

      return {
        ...group,
        variants: filteredVariants,
      };
    })
    .filter(Boolean);
  const filteredIds = filteredGroups.flatMap((group) =>
    group.variants.map((variant) => Number(variant.id)),
  );
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  return (
    <div className="sellerVariantPickerPopup">
      <div className="sellerVariantPickerPopupHeader">
        <h3>Wybierz warianty</h3>
        <p>Promocja obejmie tylko zaznaczone warianty produktu.</p>
      </div>

      <div className="sellerVariantPickerPopupToolbar">
        <input
          type="search"
          value={values.variantSearch || ""}
          placeholder="Szukaj po produkcie lub wariancie"
          onChange={(event) => setFieldValue("variantSearch", event.target.value)}
        />
        <button
          type="button"
          className="sellerChoiceButton"
          onClick={() => {
            if (allFilteredSelected) {
              setFieldValue(
                "selectedVariantIds",
                selectedIds.filter((id) => !filteredIds.includes(id)),
              );
              return;
            }

            setFieldValue(
              "selectedVariantIds",
              [...new Set([...selectedIds, ...filteredIds])].sort((a, b) => a - b),
            );
          }}
        >
          {allFilteredSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
        </button>
      </div>

      <div className="sellerVariantPickerPopupList">
        {filteredGroups.length === 0 ? (
          <p className="sellerVariantPickerPopupEmpty">Brak wariantow.</p>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id} className="sellerVariantPickerProductCard">
              <div className="sellerVariantPickerProductInfo">
                {group.thumbUrl ? (
                  <img
                    src={group.thumbUrl}
                    alt={group.productName}
                    className="sellerVariantPickerThumb"
                  />
                ) : (
                  <div className="sellerVariantPickerThumb sellerVariantPickerThumbPlaceholder" />
                )}
                <div className="sellerVariantPickerMeta">
                  <strong>{group.productName}</strong>
                </div>
              </div>

              <div className="sellerVariantPickerVariantList">
                {group.variants.map((variant) => {
                  const isChecked = selectedIds.includes(Number(variant.id));

                  return (
                    <label
                      key={variant.id}
                      className={`sellerVariantPickerVariantOption${
                        isChecked ? " sellerVariantPickerVariantOptionActive" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const nextIds = isChecked
                            ? selectedIds.filter((id) => id !== Number(variant.id))
                            : [...selectedIds, Number(variant.id)].sort((a, b) => a - b);
                          setFieldValue("selectedVariantIds", nextIds);
                        }}
                      />
                      <span>{variant.variantName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="sellerVariantPickerPopupActions">
        <button type="button" className="sellerPrimaryButton" onClick={onClose}>
          Zatwierdz
        </button>
      </div>
    </div>
  );
};

const DiscountEditFormView = ({ payload, actualId = "new" }) => {
  const notification = useNotification();
  const navigate = useNavigate();
  const isNew = actualId === "new";
  const sellerSettings = getPayload(payload);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      const response = await ProductsService.getProducts({
        page: 1,
        limit: 100,
        sortBy: "name",
        sortOrder: "asc",
      });

      if (response?.status && response.status >= 400) {
        notification.error(
          response?.data?.error || "Nie udalo sie pobrac wariantow produktow",
        );
        return;
      }

      setProducts(
        Array.isArray(response?.data) ? response.data : response?.data?.data || [],
      );
    };

    loadProducts();
  }, [notification]);

  const handleSubmit = async (values, formikHelpers) => {
    const currentRules = Array.isArray(sellerSettings?.discountRules)
      ? sellerSettings.discountRules.filter((rule) => isSupportedRuleType(rule?.ruleType))
      : [];

    const nextRule = {
      id: values.id || null,
      ruleType: values.ruleType,
      name: values.name,
      isActive: Boolean(values.isActive),
      config: buildRuleConfig(values),
    };

    const nextRules = isNew
      ? [...currentRules, nextRule]
      : currentRules.map((rule) =>
          Number(rule.id) === Number(actualId) ? { ...rule, ...nextRule } : rule,
        );

    const response = await SellerSettingsService.updateSellerSettings({
      discountRules: nextRules.map((rule) => ({
        ruleType: rule.ruleType,
        name: rule.name,
        isActive: Boolean(rule.isActive),
        config: {
          thresholdValue:
            rule?.config?.thresholdValue === null || rule?.config?.thresholdValue === undefined
              ? null
              : Number(rule.config.thresholdValue),
          discountPercent:
            rule?.config?.discountPercent === null || rule?.config?.discountPercent === undefined
              ? null
              : Number(rule.config.discountPercent),
          couponCode: rule?.config?.couponCode
            ? String(rule.config.couponCode).trim().toUpperCase()
            : null,
          usageLimitPerClient:
            rule?.config?.usageLimitPerClient === null ||
            rule?.config?.usageLimitPerClient === undefined
              ? null
              : Number(rule.config.usageLimitPerClient),
          bonusLabel: rule?.config?.bonusLabel || null,
          selectedVariantIds: Array.isArray(rule?.config?.selectedVariantIds)
            ? rule.config.selectedVariantIds.map((item) => Number(item)).filter(Boolean)
            : [],
        },
      })),
    });

    if (response?.status && response.status >= 400) {
      notification.error(
        response?.data?.error || "Nie udalo sie zapisac ustawien rabatu",
      );
      formikHelpers.setSubmitting(false);
      return;
    }

    const responsePayload = getPayload(response);
    const savedRules = Array.isArray(responsePayload?.discountRules)
      ? responsePayload.discountRules
      : [];

    formikHelpers.setSubmitting(false);
    notification.success("Rabat zapisany");
    navigate("/discounts");
  };

  const handleDelete = async () => {
    if (isNew) {
      navigate("/discounts");
      return;
    }

    const currentRules = Array.isArray(sellerSettings?.discountRules)
      ? sellerSettings.discountRules.filter((rule) => isSupportedRuleType(rule?.ruleType))
      : [];
    const nextRules = currentRules.filter(
      (rule) => Number(rule.id) !== Number(actualId),
    );

    const response = await SellerSettingsService.updateSellerSettings({
      discountRules: nextRules.map((rule) => ({
        ruleType: rule.ruleType,
        name: rule.name,
        isActive: Boolean(rule.isActive),
        config: {
          thresholdValue:
            rule?.config?.thresholdValue === null || rule?.config?.thresholdValue === undefined
              ? null
              : Number(rule.config.thresholdValue),
          discountPercent:
            rule?.config?.discountPercent === null || rule?.config?.discountPercent === undefined
              ? null
              : Number(rule.config.discountPercent),
          couponCode: rule?.config?.couponCode
            ? String(rule.config.couponCode).trim().toUpperCase()
            : null,
          usageLimitPerClient:
            rule?.config?.usageLimitPerClient === null ||
            rule?.config?.usageLimitPerClient === undefined
              ? null
              : Number(rule.config.usageLimitPerClient),
          bonusLabel: rule?.config?.bonusLabel || null,
          selectedVariantIds: Array.isArray(rule?.config?.selectedVariantIds)
            ? rule.config.selectedVariantIds.map((item) => Number(item)).filter(Boolean)
            : [],
        },
      })),
    });

    if (response?.status && response.status >= 400) {
      notification.error(
        response?.data?.error || "Nie udalo sie usunac rabatu",
      );
      return;
    }

    notification.success("Rabat usuniety");
    navigate("/discounts");
  };

  return (
    <FormikWrapper
      initialValues={initialValues(sellerSettings, actualId)}
      onSubmit={handleSubmit}
      validate={validateDiscountEditForm}
    >
      {({ values, isSubmitting, setFieldValue, errors }) => (
        <div className="sellerSettingsForm sellerForm">
          <section className="sellerFormSection">
            <div className="sellerCheckboxRow">
              <Checkbox id="isActive" placeholder="Aktywna" size="md" />
            </div>

            <div className="sellerFormGrid">
              <div className="select-input-wrapper field-size-lg">
                <label htmlFor="ruleType">Typ reguly</label>
                <select
                  id="ruleType"
                  value={values.ruleType ?? ""}
                  onChange={(event) => {
                    const nextRuleType = normalizeRuleType(event.target.value);
                    setFieldValue("ruleType", nextRuleType);
                    setFieldValue("thresholdValue", "");
                    setFieldValue("discountPercent", "");
                    setFieldValue("couponCode", "");
                    setFieldValue("usageLimitPerClient", "0");
                    setFieldValue("bonusLabel", "");
                    setFieldValue("selectedVariantIds", []);
                    setFieldValue("variantSearch", "");
                  }}
                >
                  <option value="" disabled>
                    Typ reguly
                  </option>
                  {getRuleTypeOptions().map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <Input id="name" placeholder="Nazwa reguly" />
              {getRuleFieldVisibility(values.ruleType).showThreshold && (
                <Input
                  id="thresholdValue"
                  placeholder={getThresholdLabel(values.ruleType)}
                  type="number"
                  step="0.01"
                  min="0"
                />
              )}
              {getRuleFieldVisibility(values.ruleType).showDiscountPercent && (
                <Input
                  id="discountPercent"
                  placeholder="Rabat (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                />
              )}
              {getRuleFieldVisibility(values.ruleType).showCouponCode && (
                <Input id="couponCode" placeholder="Kod rabatowy" />
              )}
              {getRuleFieldVisibility(values.ruleType).showUsageLimitPerClient && (
                <Input
                  id="usageLimitPerClient"
                  placeholder="Liczba uzyc na konto (0 = bez limitu)"
                  type="number"
                  min="0"
                  step="1"
                />
              )}
              {getRuleFieldVisibility(values.ruleType).showBonusLabel && (
                <Input id="bonusLabel" placeholder="Gratis / bonus" />
              )}
            </div>

            {getRuleFieldVisibility(values.ruleType).showVariantPicker && (
              <div className="sellerVariantPickerBlock">
                <div className="sellerVariantPickerHeader">
                  <div>
                    <h4>Warianty objete promocja</h4>
                    <p>
                      Dla tego typu promocji wybierasz warianty, ktore biora udzial w progu
                      liczby sztuk.
                    </p>
                  </div>
                  <Popup2
                    openButtonText="Wybierz produkty"
                    buttonComponent="button"
                    buttonProps={{ type: "button", className: "sellerPrimaryButton" }}
                    component={VariantPickerPopup}
                    componentProps={{ values, setFieldValue, products }}
                    modalProps={{ width: 880 }}
                  />
                </div>

                {errors?.selectedVariantIds ? (
                  <span className="validation-error-description">
                    {errors.selectedVariantIds}
                  </span>
                ) : null}

                <div className="sellerVariantPickerSummary">
                  Wybrano wariantow:{" "}
                  <strong>
                    {Array.isArray(values.selectedVariantIds)
                      ? values.selectedVariantIds.length
                      : 0}
                  </strong>
                </div>
              </div>
            )}
          </section>

          <div className="sellerActions sellerFormActions">
            <button
              type="submit"
              className="sellerPrimaryButton"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz ustawienia"}
            </button>
            <button
              type="button"
              className={isNew ? "sellerSecondaryButton" : "sellerDangerButton"}
              onClick={handleDelete}
            >
              {isNew ? "Wroc do listy" : "Usun rabat"}
            </button>
          </div>
        </div>
      )}
    </FormikWrapper>
  );
};

const DiscountEditForm = ({ id = "new" }) => (
  <FetchWrapper
    component={DiscountEditFormView}
    id={id === "new" ? "create" : id}
    actualId={id}
    name="DiscountEditForm"
    connector={SellerSettingsService.getSellerSettings}
  />
);

export default DiscountEditForm;
