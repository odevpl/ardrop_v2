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
}) => {
  return (
    <div className={className}>
      <Formik
        validationSchema={validationSchema}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onChange={onChange}
        onReset={onReset}
      >
        <Form>{children}</Form>
      </Formik>
    </div>
  );
};

export default FormikWrapper;
