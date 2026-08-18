"use client";

import { useState, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style"> & {
  style?: React.CSSProperties;
};

export default function PasswordInput({ style, ...rest }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={wrap}>
      <input {...rest} type={visible ? "text" : "password"} style={{ ...style, paddingRight: "2.5rem" }} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        style={toggleBtn}
        tabIndex={-1}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

const wrap: React.CSSProperties = { position: "relative", width: "100%" };
const toggleBtn: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "0.6rem",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9ca3af",
  cursor: "pointer",
};
