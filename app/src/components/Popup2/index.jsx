import Popup from "components/Popup";

const Popup2 = ({
  buttonComponent = "button",
  modalProps = {},
  ...rest
}) => {
  const normalizedModalProps = {
    ...modalProps,
    style: {
      ...(modalProps?.style || {}),
      ...(modalProps?.width ? { width: modalProps.width } : {}),
    },
  };

  return (
    <Popup
      ButtonComponent={buttonComponent}
      modalProps={normalizedModalProps}
      {...rest}
    />
  );
};

export default Popup2;
