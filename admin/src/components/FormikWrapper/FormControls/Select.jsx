import { useFormikContext, getIn } from "formik";

const SelectInput = ({ id, placeholder, config }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);
  const allKeysAreNumeric = Object.keys(config || {}).every((key) =>
    /^-?\d+(\.\d+)?$/.test(String(key)),
  );

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
    <div className="select-input-wrapper">
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
      {formikContext.errors[id] && (
        <span className="validation-error-description">
          {formikContext.errors[id]}
        </span>
      )}
    </div>
  );
};

export default SelectInput;
