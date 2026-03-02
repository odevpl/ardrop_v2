import { useEffect, useState } from "react";
import ClientsTable from "modules/ClientsTable";
import ProductsTable from "modules/ProductsTable";
import InvoicesTable from "modules/InvoicesTable";
import {
  getClientById,
  getLocationById,
  getProductById,
  getDriverById,
  getCategoryById,
  getInvoiceById,
} from "connector";
import Popup2 from "components/Popup2";
import { useFormikContext, getIn } from "formik";
import LocationsTable from "modules/LocationsTable";
import DriversTable from "modules/DriversTable";
import CategoriesTable from "modules/CategoriesTable";

const config = {
  invoices: () => ({
    id: "invoiceId",
    placeholder: "Faktura",
    listComponent: (props) => InvoicesTable({ ...props }),
    connector: getInvoiceById,
    onSelect: ({ formikContext, data, setButtonName }) => {
      formikContext.setFieldValue("invoiceId", data.id);
      setButtonName(data.number);
    },
    nameRender: (data) => data.number,
  }),
  products: (_, { id }) => ({
    id: id ? id : "productId",
    placeholder: "Produkt",
    listComponent: (props) => ProductsTable({ ...props }),
    connector: getProductById,
    onSelect: ({ formikContext, data, setButtonName }) => {
      formikContext.setFieldValue("productId", data.id);
      setButtonName(data.name);
    },
    nameRender: (data) => data.name,
  }),
  clients: () => ({
    id: "clientId",
    placeholder: "Klient",
    listComponent: (props) => ClientsTable({ ...props }),
    connector: getClientById,
    onSelect: ({ formikContext, data, setButtonName }) => {
      formikContext.setFieldValue("clientId", data.id);
      formikContext.setFieldValue("locationId", null);
      setButtonName(data.name);
    },
    nameRender: (data) => data.name,
  }),
  locations: (data) => ({
    id: "locationId",
    placeholder: "Lokalizacja",
    listComponent: (props) =>
      LocationsTable({ clientId: data.clientId, ...props }),
    connector: getLocationById,
    onSelect: ({ formikContext, data, setButtonName }) => {
      formikContext.setFieldValue("locationId", data.id);
      setButtonName(data.name);
    },
    nameRender: (data) => data.name,
  }),
  drivers: () => ({
    id: "driverId",
    placeholder: "Kierowca",
    listComponent: (props) => DriversTable({ ...props }),
    connector: getDriverById,
    onSelect: ({ formikContext, data, setButtonName }) => {
      formikContext.setFieldValue("driverId", data.id);
      setButtonName(data.name);
    },
    nameRender: (data) => `${data.firstName} ${data.lastName}`,
  }),
  categories: (data) => ({
    id: "categoryId",
    placeholder: "Kategoria",
    listComponent: (props) => CategoriesTable({ ...props }),
    connector: getCategoryById,
    onSelect: ({ formikContext, data, setButtonName }) => {
      formikContext.setFieldValue("categoryId", data.id);
      setButtonName(data.name);
    },
    nameRender: (data) => data.name,
  }),
};

const Popup = ({ listComponent: ListComponent, onSelect, onClose }) => (
  <div>
    <ListComponent
      onActionRender={(data) => (
        <button
          type="button"
          onClick={() => {
            onSelect(data);
            onClose();
          }}
        >
          Wybierz
        </button>
      )}
    />
  </div>
);

const FetchListInput = ({ configKey, configProps }) => {
  const formikContext = useFormikContext();
  const { id, placeholder, listComponent, connector, nameRender, onSelect } =
    config[configKey](formikContext.values, configProps);

  const value = getIn(formikContext.values, id);
  const [buttonName, setButtonName] = useState("(brak)");

  useEffect(() => {
    if (value) {
      connector({ id: value }).then((data) => {
        const buttonName = nameRender(data);
        setButtonName(buttonName);
      });
    }
    if (!value) {
      setButtonName("(brak)");
    }
  }, [value]);

  return (
    <div className="fetch-list-input-wrapper">
      <label htmlFor={id}>{placeholder}</label>
      <Popup2
        openButtonText={buttonName}
        buttonComponent="button"
        component={Popup}
        componentProps={{
          listComponent,
          listComponentContext: formikContext.values,
          onSelect: (data) => onSelect({ data, formikContext, setButtonName }),
        }}
        modalProps={{ width: 930 }}
      />
    </div>
  );
};

export default FetchListInput;
