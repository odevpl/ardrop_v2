import { useFormikContext, getIn } from "formik";
import { sanitizeQuantity } from "./utils";

const TextInput = ({ id, placeholder, type, wrapperStyle, ...props }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);
  const error = getIn(formikContext.errors, id);

  const handleChange = (e) => {
    if (type === "decimal") {
      const newNumber = sanitizeQuantity(e.target.value);
      formikContext.setFieldValue(id, newNumber);
      return;
    }
    formikContext.setFieldValue(id, e.target.value);
  };

  return (
    <div className="text-input-wrapper" style={wrapperStyle}>
      <label htmlFor={id}>{placeholder}</label>
      <input id={id} onChange={handleChange} value={value ?? ""} {...props} />
      {error && (
        <span className="validation-error-description">
          {error}
        </span>
      )}
    </div>
  );
};

export default TextInput;
