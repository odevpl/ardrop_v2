import { useFormikContext, getIn } from "formik";

const MAX_LENGTH = 5000;

const TextareaInput = ({ id, placeholder }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);
  const currentLength = String(value ?? "").length;

  const handleChange = (e) => {
    formikContext.setFieldValue(id, e.target.value);
  };

  return (
    <div className="textarea-input-wrapper">
      <label htmlFor={id}>{placeholder}</label>
      <textarea
        id={id}
        maxLength={MAX_LENGTH}
        rows={4}
        onChange={handleChange}
        value={value ?? ""}
      />
      <div className="textarea-counter">{`${currentLength}/${MAX_LENGTH}`}</div>
      {formikContext.errors[id] && (
        <span className="validation-error-description">
          {formikContext.errors[id]}
        </span>
      )}
    </div>
  );
};

export default TextareaInput;
