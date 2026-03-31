import { useFormikContext, getIn } from "formik";

const MAX_LENGTH = 5000;

const TextareaInput = ({ id, placeholder, size, span, wrapperClassName }) => {
  const formikContext = useFormikContext();
  const value = getIn(formikContext.values, id);
  const error = getIn(formikContext.errors, id);
  const currentLength = String(value ?? "").length;
  const normalizedSize = size || "lg";
  const wrapperClassNames = [
    "textarea-input-wrapper",
    `field-size-${normalizedSize}`,
    span ? `field-span-${span}` : "",
    wrapperClassName || "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleChange = (e) => {
    formikContext.setFieldValue(id, e.target.value);
  };

  return (
    <div className={wrapperClassNames}>
      <label htmlFor={id}>{placeholder}</label>
      <textarea
        id={id}
        maxLength={MAX_LENGTH}
        rows={4}
        onChange={handleChange}
        value={value ?? ""}
      />
      <div className="textarea-counter">{`${currentLength}/${MAX_LENGTH}`}</div>
      {error && (
        <span className="validation-error-description">
          {error}
        </span>
      )}
    </div>
  );
};

export default TextareaInput;
