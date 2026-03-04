import { useFormikContext, getIn } from "formik";

const TextareaInput = ({ id, placeholder }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);

  const handleChange = (e) => {
    formikContext.setFieldValue(id, e.target.value);
  };

  return (
    <div className="textarea-input-wrapper">
      <label htmlFor={id}>{placeholder}</label>
      <textarea
        id={id}
        maxLength={200}
        rows={4}
        onChange={handleChange}
        value={value ?? ""}
      />
      {formikContext.errors[id] && (
        <span className="validation-error-description">
          {formikContext.errors[id]}
        </span>
      )}
    </div>
  );
};

export default TextareaInput;
