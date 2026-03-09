import { useFormikContext, getIn } from "formik";
import { sanitizeQuantity } from "./utils";

const TextInput = ({ id, placeholder, type, wrapperStyle, ...props }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);
  const inputType = type === "decimal" ? "text" : type || "text";

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
      <input id={id} type={inputType} onChange={handleChange} value={value ?? ""} {...props} />
      {formikContext.errors[id] && (
        <span className="validation-error-description">
          {formikContext.errors[id]}
        </span>
      )}
    </div>
  );
};

export default TextInput;
