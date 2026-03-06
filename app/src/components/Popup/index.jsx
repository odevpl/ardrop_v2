import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./Popup.scss";

const Popup = ({
  buttonProps = {},
  openCondition = false,
  openButtonText = "Otworz popup",
  ButtonComponent = "button",
  component: Component,
  componentProps = {},
  afterClose,
  children,
  modalProps = {},
  isAutoForget = false,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(Boolean(openCondition));
  const [initialized, setInitialized] = useState(false);
  const [componentKey, setComponentKey] = useState(0);

  const portalRoot = useMemo(() => {
    if (typeof document === "undefined") return null;
    const node = document.createElement("div");
    node.className = "popupPortalRoot";
    document.body.appendChild(node);
    return node;
  }, []);

  const closePopup = () => {
    setIsOpen(false);
  };

  const openPopup = () => {
    setIsOpen(true);
    setInitialized(true);
    if (isAutoForget) {
      setComponentKey((prev) => prev + 1);
    }
  };

  const togglePopup = () => {
    if (isOpen) {
      closePopup();
      return;
    }
    openPopup();
  };

  useEffect(() => {
    if (openCondition) {
      openPopup();
    } else {
      closePopup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCondition]);

  useEffect(() => {
    if (!initialized) return;
    if (!isOpen && typeof afterClose === "function") {
      afterClose();
    }
  }, [isOpen, initialized, afterClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape" && closeOnEsc) {
        closePopup();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeOnEsc]);

  useEffect(() => {
    return () => {
      if (portalRoot?.parentNode) {
        portalRoot.parentNode.removeChild(portalRoot);
      }
    };
  }, [portalRoot]);

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      closePopup();
    }
  };

  const handleButtonClick = (event) => {
    if (typeof buttonProps?.onClick === "function") {
      buttonProps.onClick(event);
    }
    if (!event.defaultPrevented) {
      togglePopup();
    }
  };

  const popupContent = isOpen ? (
    <div className={`popupOverlay ${modalProps.overlayClassName || ""}`} onClick={handleOverlayClick}>
      <div
        className={`popupDialog ${modalProps.className || ""}`}
        style={modalProps.style}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {showCloseButton ? (
          <button type="button" className="popupCloseButton" onClick={closePopup} aria-label="Zamknij popup">
            x
          </button>
        ) : null}

        {Component ? (
          <Component
            key={componentKey}
            onClose={closePopup}
            {...componentProps}
            {...rest}
          />
        ) : null}
        {children}
      </div>
    </div>
  ) : null;

  return (
    <>
      <ButtonComponent {...buttonProps} onClick={handleButtonClick}>
        {openButtonText}
      </ButtonComponent>
      {portalRoot ? createPortal(popupContent, portalRoot) : null}
    </>
  );
};

export default Popup;
