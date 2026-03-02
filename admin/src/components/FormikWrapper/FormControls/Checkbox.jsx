import { useFormikContext, getIn } from "formik";

const TextInput = ({ id, placeholder, wrapperStyle, ...props }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);

  const handleChange = (e) => {
    formikContext.setFieldValue(id, e.target.checked);
  };

  return (
    <div className="checkbox-input-wrapper" style={wrapperStyle}>
      <input
        id={id}
        type="checkbox"
        onChange={handleChange}
        checked={Boolean(value)}
        {...props}
      />
      <label htmlFor={id}>{placeholder}</label>
      {formikContext.errors[id] && (
        <span className="validation-error-description">
          {formikContext.errors[id]}
        </span>
      )}
    </div>
  );
};

export default TextInput;
