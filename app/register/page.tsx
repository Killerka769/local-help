"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePhoneMask } from "@/hooks/usePhoneMask";
import { useCities } from "@/hooks/useCities";
import styles from "./Register.module.scss";
import PasswordInput from "../components/PasswordInput/PasswordInput";

const registerSchema = z
  .object({
    name: z.string().min(2, "Имя должно быть минимум 2 символа"),
    phone: z.string().min(10, "Введите полный номер телефона"),
    password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
    confirmPassword: z.string(),
    cityId: z.string().min(1, "Выберите город"),
    termsAccepted: z.boolean().refine(val => val === true, {
      message: "Вы должны принять пользовательское соглашение",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { cities, isLoading: citiesLoading } = useCities();
  const { value: phoneValue, handleChange: handlePhoneChange, getRawValue, setValue } = usePhoneMask();

  const {
    register,
    handleSubmit,
    setValue: setFormValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
      cityId: "",
      termsAccepted: false,
    },
  });

  useEffect(() => {
    setFormValue("phone", phoneValue);
  }, [phoneValue, setFormValue]);

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterFormData, "confirmPassword" | "termsAccepted">) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Ошибка регистрации");
      }

      return result;
    },
    onSuccess: () => {
      alert("Регистрация успешна! Теперь войдите.");
      router.push("/login");
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    const rawPhone = getRawValue();
    if (!rawPhone || rawPhone.length < 10) {
      alert("Введите полный номер телефона");
      return;
    }

    registerMutation.mutate({
      name: data.name,
      phone: rawPhone,
      password: data.password,
      cityId: data.cityId,
    });
  };

  const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePhoneChange(e);
  };

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>Регистрация</h1>
            <p className={styles.subtitle}>
              Создайте аккаунт, чтобы пользоваться сервисом
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="name">Имя</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Как к вам обращаться"
                  className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                  {...register("name")}
                />
                {errors.name && (
                  <span className={styles.error}>{errors.name.message}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="phone">Телефон</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 999-99-99"
                  value={phoneValue}
                  onChange={onPhoneChange}
                  className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                />
                {errors.phone && (
                  <span className={styles.error}>{errors.phone.message}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="cityId">Город</label>
                <select
                  id="cityId"
                  className={styles.select}
                  {...register("cityId")}
                  disabled={citiesLoading}
                >
                  <option value="">Выберите город</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors.cityId && (
                  <span className={styles.error}>{errors.cityId.message}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="password">Пароль</label>
                <PasswordInput
                  id="password"
                  register={register}
                  error={!!errors.password}
                />
                {errors.password && (
                  <span className={styles.error}>{errors.password.message}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">Подтвердите пароль</label>
                <PasswordInput
                  id="confirmPassword"
                  register={register}
                  error={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <span className={styles.error}>{errors.confirmPassword.message}</span>
                )}
              </div>

              {/* ЧЕКБОКС СОГЛАСИЯ */}
              <div className={styles.checkboxField}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    {...register("termsAccepted")}
                  />
                  <span>
                    Я принимаю{" "}
                    <Link href="/terms" target="_blank" className={styles.termsLink}>
                      пользовательское соглашение
                    </Link>
                  </span>
                </label>
                {errors.termsAccepted && (
                  <span className={styles.error}>{errors.termsAccepted.message}</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={isSubmitting || registerMutation.isPending || citiesLoading}
              >
                {registerMutation.isPending ? "Регистрация..." : "Зарегистрироваться"}
              </button>
            </form>

            <p className={styles.footer}>
              Уже есть аккаунт?{" "}
              <Link href="/login" className={styles.link}>
                Войти
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}