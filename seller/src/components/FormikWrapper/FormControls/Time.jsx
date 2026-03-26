import { useFormikContext, getIn } from "formik";
import dayjs from "dayjs";

const TimeInput = ({ id, placeholder }) => {
  const formikContext = useFormikContext();
  const error = getIn(formikContext.errors, id);

  const currentValue = getIn(formikContext.values, id);
  const value = currentValue
    ? dayjs(currentValue, "H:mm:ss").isValid()
      ? dayjs(currentValue, "H:mm:ss").format("HH:mm")
      : dayjs(currentValue, "H:mm").format("HH:mm")
    : "";

  const handleChange = (e) => {
    formikContext.setFieldValue(id, e.target.value || null);
  };

  return (
    <div className="time-input-wrapper">
      <label htmlFor={id}>{placeholder}</label>
      <input id={id} type="time" step={300} onChange={handleChange} value={value} />
      {error && (
        <span className="validation-error-description">
          {error}
        </span>
      )}
    </div>
  );
};

export default TimeInput;
