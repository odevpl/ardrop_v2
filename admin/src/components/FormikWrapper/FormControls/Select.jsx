import { useFormikContext, getIn } from "formik";

const SelectInput = ({ id, placeholder, config, size, span, wrapperClassName }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);
  const error = getIn(formikContext.errors, id);
  const normalizedSize = size || "lg";
  const allKeysAreNumeric = Object.keys(config || {}).every((key) =>
    /^-?\d+(\.\d+)?$/.test(String(key)),
  );
  const wrapperClassNames = [
    "select-input-wrapper",
    `field-size-${normalizedSize}`,
    span ? `field-span-${span}` : "",
    wrapperClassName || "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleChange = (nextValue) => {
    if (nextValue === "") {
      formikContext.setFieldValue(id, "");
      return;
    }

    if (allKeysAreNumeric) {
      formikContext.setFieldValue(id, Number(nextValue));
      return;
    }

    formikContext.setFieldValue(id, nextValue);
  };

  return (
    <div className={wrapperClassNames}>
      <label htmlFor={id}>{placeholder}</label>
      <select id={id} onChange={(e) => handleChange(e.target.value)} value={value ?? ""}>
        <option value="" disabled>
          {placeholder}
        </option>
        {Object.entries(config).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {error && (
        <span className="validation-error-description">
          {error}
        </span>
      )}
    </div>
  );
};

export default SelectInput;
