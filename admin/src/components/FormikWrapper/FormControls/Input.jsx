import { useFormikContext, getIn } from "formik";
import { sanitizeQuantity } from "./utils";

const TextInput = ({
  id,
  placeholder,
  type,
  wrapperStyle,
  size,
  span,
  wrapperClassName,
  ...props
}) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);
  const inputType = type === "decimal" ? "text" : type || "text";
  const error = getIn(formikContext.errors, id);
  const normalizedSize = size || "lg";
  const wrapperClassNames = [
    "text-input-wrapper",
    `field-size-${normalizedSize}`,
    span ? `field-span-${span}` : "",
    wrapperClassName || "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleChange = (e) => {
    if (type === "decimal") {
      const newNumber = sanitizeQuantity(e.target.value);
      formikContext.setFieldValue(id, newNumber);
      return;
    }
    formikContext.setFieldValue(id, e.target.value);
  };

  return (
    <div className={wrapperClassNames} style={wrapperStyle}>
      <label htmlFor={id}>{placeholder}</label>
      <input id={id} type={inputType} onChange={handleChange} value={value ?? ""} {...props} />
      {error && (
        <span className="validation-error-description">
          {error}
        </span>
      )}
    </div>
  );
};

export default TextInput;
