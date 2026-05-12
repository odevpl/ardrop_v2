import { Formik, Form } from "formik";
import "./FormikWrapper.scss";

const FormikWrapper = ({
  initialValues = {},
  children,
  onSubmit,
  className,
  onChange,
  onReset,
  validationSchema,
  validateOnChange,
  validateOnBlur,
}) => {
  return (
    <div className={className}>
      <Formik
        validationSchema={validationSchema}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onChange={onChange}
        onReset={onReset}
        validateOnChange={validateOnChange}
        validateOnBlur={validateOnBlur}
      >
        <Form>{children}</Form>
      </Formik>
    </div>
  );
};

export default FormikWrapper;
