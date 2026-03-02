import { SuccessButton, WarningButton } from "components/Buttons";

const ButtonsFooter = ({ onClose, children }) => (
  <div className="button-container">
    <SuccessButton htmlType="submit">Zapisz</SuccessButton>
    <WarningButton htmlType="reset" onClick={onClose}>
      Anuluj
    </WarningButton>
    {children}
  </div>
);

export default ButtonsFooter;
