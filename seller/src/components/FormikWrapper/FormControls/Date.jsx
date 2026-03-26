import { useFormikContext, getIn } from "formik";
import dayjs from "dayjs";

const DateInput = ({ id, placeholder }) => {
  const formikContext = useFormikContext();
  const error = getIn(formikContext.errors, id);

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
      {error && (
        <span className="validation-error-description">
          {error}
        </span>
      )}
    </div>
  );
};

export default DateInput;
