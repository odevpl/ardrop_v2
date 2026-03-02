import { useFormikContext, getIn } from "formik";

const SelectInput = ({ id, placeholder, config }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);

  const parseOptionValue = (rawValue) => {
    if (rawValue === "") return "";
    return /^-?\d+(\.\d+)?$/.test(rawValue) ? Number(rawValue) : rawValue;
  };

  const handleChange = (value) => {
    formikContext.setFieldValue(id, value);
  };

  return (
    <div className="select-input-wrapper">
      <label htmlFor={id}>{placeholder}</label>
      <select
        id={id}
        onChange={(e) => handleChange(parseOptionValue(e.target.value))}
        value={value ?? ""}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {Object.entries(config).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {formikContext.errors[id] && (
        <span className="validation-error-description">
          {formikContext.errors[id]}
        </span>
      )}
    </div>
  );
};

export default SelectInput;
