import { useFormikContext, getIn } from "formik";
import dayjs from "dayjs";

const TimeInput = ({ id, placeholder }) => {
  const formikContext = useFormikContext();

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
      {formikContext.errors[id] && (
        <span className="validation-error-description">
          {formikContext.errors[id]}
        </span>
      )}
    </div>
  );
};

export default TimeInput;
