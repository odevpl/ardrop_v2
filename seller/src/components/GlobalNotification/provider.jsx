import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NotificationContext } from "./context";
import "./GlobalNotification.scss";

const AUTO_HIDE_MS = {
  success: 2500,
  info: 2500,
  warning: 4500,
  error: 0,
};

const normalizeType = (type) => {
  const safeType = String(type || "info").toLowerCase();
  if (
    safeType === "success" ||
    safeType === "warning" ||
    safeType === "error"
  ) {
    return safeType;
  }
  return "info";
};

const NotificationViewport = ({ items, onClose, onPause, onResume }) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="notificationContainer"
      aria-live="polite"
      aria-atomic="true"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`globalNotification globalNotification${item.type}`}
          role={item.type === "error" ? "alert" : "status"}
          onMouseEnter={() => onPause(item.id)}
          onMouseLeave={() => onResume(item.id)}
        >
          <span>{item.message}</span>
          <button
            type="button"
            onClick={() => onClose(item.id)}
            aria-label="Zamknij"
          >
            x
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
};

export const NotificationProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const timersRef = useRef({});

  const clearTimer = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const closeNotification = useCallback(
    (id) => {
      clearTimer(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [clearTimer],
  );

  const startAutoHide = useCallback(
    (id, type) => {
      clearTimer(id);
      const timeout = AUTO_HIDE_MS[type];
      if (!timeout) return;
      timersRef.current[id] = setTimeout(() => {
        closeNotification(id);
      }, timeout);
    },
    [clearTimer, closeNotification],
  );

  const notify = useCallback(
    ({ message, type = "info" }) => {
      const normalizedType = normalizeType(type);
      const normalizedMessage = String(message || "").trim();
      if (!normalizedMessage) return null;

      const id = Date.now() + Math.floor(Math.random() * 10000);
      setItems((prev) => [
        ...prev,
        { id, message: normalizedMessage, type: normalizedType },
      ]);
      startAutoHide(id, normalizedType);
      return id;
    },
    [startAutoHide],
  );

  const value = useMemo(
    () => ({
      notify,
      success: (message) => notify({ message, type: "success" }),
      error: (message) => notify({ message, type: "error" }),
      info: (message) => notify({ message, type: "info" }),
      warning: (message) => notify({ message, type: "warning" }),
      close: closeNotification,
    }),
    [notify, closeNotification],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationViewport
        items={items}
        onClose={closeNotification}
        onPause={(id) => clearTimer(id)}
        onResume={(id) => {
          const item = items.find((current) => current.id === id);
          if (!item) return;
          startAutoHide(id, item.type);
        }}
      />
    </NotificationContext.Provider>
  );
};
