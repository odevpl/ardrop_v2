import { useFormikContext, getIn } from "formik";
import dayjs from "dayjs";

const DateInput = ({ id, placeholder }) => {
  const formikContext = useFormikContext();

  const value = getIn(formikContext.values, id) || "";

  const handleChange = (e) => {
    const date = e.target.value;
    formikContext.setFieldValue(
      id,
      date ? dayjs(date).format("YYYY-MM-DD") : null,
    );
  };

  return (
    <div className="date-input-wrapper">
      <label htmlFor={id}>{placeholder}</label>
      <input id={id} type="date" onChange={handleChange} value={value} />
      {formikContext.errors[id] && (
        <span className="validation-error-description">
          {formikContext.errors[id]}
        </span>
      )}
    </div>
  );
};

export default DateInput;
