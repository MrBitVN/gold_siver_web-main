import { createPortal } from "react-dom";

export default function TooltipPortal({ visible, x, y, children }) {
    if (!visible) return null;

    return createPortal(
        <div
            className="custom-tooltip show"
            style={{
                top: y,
                left: x,
            }}
        >
            {children}
        </div>,
        document.body
    );
}
