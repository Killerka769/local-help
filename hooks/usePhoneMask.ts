import { useState, useCallback } from "react";

export const usePhoneMask = () => {
  const [value, setValue] = useState("");

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ""); // убираем всё, кроме цифр

    // Удаляем первую 7 или 8, если она есть
    if (input.startsWith("7") || input.startsWith("8")) {
      input = input.slice(1);
    }

    // Ограничиваем 10 цифрами (после +7)
    if (input.length > 10) input = input.slice(0, 10);

    // Форматируем
    let formatted = "+7";
    if (input.length > 0) {
      formatted += ` (${input.slice(0, 3)}`;
    }
    if (input.length > 3) {
      formatted += `) ${input.slice(3, 6)}`;
    }
    if (input.length > 6) {
      formatted += `-${input.slice(6, 8)}`;
    }
    if (input.length > 8) {
      formatted += `-${input.slice(8, 10)}`;
    }

    setValue(formatted);
  }, []);

  const getRawValue = useCallback(() => {
    const digits = value.replace(/\D/g, "");
    // Если номер начинается с 7, оставляем как есть (уже 11 цифр)
    if (digits.startsWith("7")) {
      return digits; // возвращаем +7XXXXXXXXXX (11 цифр)
    }
    // Если начинается с 8, заменяем на 7
    if (digits.startsWith("8")) {
      return "7" + digits.slice(1);
    }
    // Иначе просто возвращаем цифры (скорее всего ошибка)
    return digits;
  }, [value]);

  const setValueRaw = useCallback((raw: string) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.length > 10) digits = digits.slice(0, 10);

    let formatted = "+7";
    if (digits.length > 0) {
      formatted += ` (${digits.slice(0, 3)}`;
    }
    if (digits.length > 3) {
      formatted += `) ${digits.slice(3, 6)}`;
    }
    if (digits.length > 6) {
      formatted += `-${digits.slice(6, 8)}`;
    }
    if (digits.length > 8) {
      formatted += `-${digits.slice(8, 10)}`;
    }
    setValue(formatted);
  }, []);

  // Добавляем setValue для совместимости с react-hook-form
  const setValueFromForm = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return { 
    value, 
    handleChange, 
    getRawValue, 
    setValueRaw,
    setValue: setValueFromForm  // ← добавляем setValue
  };
};