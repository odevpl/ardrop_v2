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
  validate,
}) => {
  return (
    <div className={className}>
      <Formik
        validationSchema={validationSchema}
        validate={validate}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onChange={onChange}
        onReset={onReset}
      >
        {(formikProps) => (
          <Form>{typeof children === "function" ? children(formikProps) : children}</Form>
        )}
      </Formik>
    </div>
  );
};

export default FormikWrapper;
