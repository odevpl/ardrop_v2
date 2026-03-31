import { useFormikContext, getIn } from "formik";
import dayjs from "dayjs";

const DateInput = ({ id, placeholder, size, span, wrapperClassName }) => {
  const formikContext = useFormikContext();
  const error = getIn(formikContext.errors, id);
  const normalizedSize = size || "lg";
  const wrapperClassNames = [
    "date-input-wrapper",
    `field-size-${normalizedSize}`,
    span ? `field-span-${span}` : "",
    wrapperClassName || "",
  ]
    .filter(Boolean)
    .join(" ");

  const value = getIn(formikContext.values, id) || "";

  const handleChange = (e) => {
    const date = e.target.value;
    formikContext.setFieldValue(
      id,
      date ? dayjs(date).format("YYYY-MM-DD") : null,
    );
  };

  return (
    <div className={wrapperClassNames}>
      <label htmlFor={id}>{placeholder}</label>
      <input id={id} type="date" onChange={handleChange} value={value} />
      {error && (
        <span className="validation-error-description">
          {error}
        </span>
      )}
    </div>
  );
};

export default DateInput;
