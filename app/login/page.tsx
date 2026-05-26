"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { usePhoneMask } from "@/hooks/usePhoneMask";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Login.module.scss";
import PasswordInput from "../components/PasswordInput/PasswordInput";

const loginSchema = z.object({
  phone: z.string().min(10, "Введите полный номер телефона"),
  password: z.string().min(1, "Введите пароль"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const { value: phoneValue, handleChange: handlePhoneChange, getRawValue } = usePhoneMask();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  useEffect(() => {
    setValue("phone", phoneValue);
  }, [phoneValue, setValue]);

  const loginMutation = useMutation({
    mutationFn: async (data: { phone: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Ошибка входа");
      }

      return result;
    },
    onSuccess: async () => {
      // Ждём, пока cookie установится, и перезапрашиваем профиль
      await new Promise(resolve => setTimeout(resolve, 100));
      await refetch();
      router.push("/profile");
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    const rawPhone = getRawValue();
    if (!rawPhone || rawPhone.length < 10) {
      alert("Введите полный номер телефона");
      return;
    }

    loginMutation.mutate({
      phone: rawPhone,
      password: data.password,
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
            <h1 className={styles.title}>Вход</h1>
            <p className={styles.subtitle}>Войдите, чтобы продолжить</p>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
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

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Вход..." : "Войти"}
              </button>
            </form>

            <div className={styles.forgotPassword}>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Забыли пароль?
              </Link>
            </div>

            <p className={styles.footer}>
              Нет аккаунта?{" "}
              <Link href="/register" className={styles.link}>
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}