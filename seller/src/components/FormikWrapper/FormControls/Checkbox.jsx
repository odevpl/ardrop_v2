import { useFormikContext, getIn } from "formik";

const TextInput = ({ id, placeholder, wrapperStyle, onChange, checked, ...props }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);
  const error = getIn(formikContext.errors, id);

  const handleChange = (e) => {
    if (typeof onChange === "function") {
      onChange(e);
      return;
    }
    formikContext.setFieldValue(id, e.target.checked);
  };

  return (
    <div className="checkbox-input-wrapper" style={wrapperStyle}>
      <input
        id={id}
        type="checkbox"
        onChange={handleChange}
        checked={checked !== undefined ? Boolean(checked) : Boolean(value)}
        {...props}
      />
      <label htmlFor={id}>{placeholder}</label>
      {error && (
        <span className="validation-error-description">
          {error}
        </span>
      )}
    </div>
  );
};

export default TextInput;
