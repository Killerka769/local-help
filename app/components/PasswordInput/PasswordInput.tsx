"use client";

import { useState } from "react";
import styles from "./PasswordInput.module.scss";

interface PasswordInputProps {
  id: string;
  placeholder?: string;
  className?: string;
  register: any;
  error?: boolean;
}

export default function PasswordInput({ 
  id, 
  placeholder = "••••••••", 
  className, 
  register, 
  error 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`${styles.wrapper} ${className || ""}`}>
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className={`${styles.input} ${error ? styles.inputError : ""}`}
        {...register(id)}
      />
      <button
        type="button"
        className={styles.eyeBtn}
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
        aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
      >
        {showPassword ? "👁️" : "👁️‍🗨️"}
      </button>
    </div>
  );
}