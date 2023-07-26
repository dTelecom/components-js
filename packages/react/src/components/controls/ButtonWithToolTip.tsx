import type {ReactNode} from "react";
import * as React from "react";

interface ButtonWithToolTip {
  onClick: () => void;
  text: string;
  icon: ReactNode;
}

const ButtonWithToolTip = ({onClick, text, icon}: ButtonWithToolTip) => {
  return (
    <button
      onClick={onClick}
      style={{position: "initial"}}
      className={"lk-tooltip lk-button lk-participant-metadata-item lk-focus-toggle-button"}
    >
      <div className="lk-tooltiptext">{text}</div>
      {icon}
    </button>
  );
};

export default ButtonWithToolTip;
