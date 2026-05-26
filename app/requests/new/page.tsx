"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRequests } from "@/hooks/useRequests";
import { useAuth } from "@/hooks/useAuth";
import styles from "./NewRequests.module.scss";
import Link from "next/link";


// Схема валидации
const requestSchema = z.object({
  title: z
    .string()
    .min(5, "Заголовок должен быть минимум 5 символов")
    .max(40, "Заголовок не должен превышать 40 символов"),
  description: z
    .string()
    .min(60, "Опишите задачу подробнее (минимум 60 символов)")
    .max(1500, "Описание не должно превышать 1500 символов"),
  address: z
    .string()
    .min(8, "Укажите адрес или район")
    .max(30, "Адрес не должен превышать 30 символов")
    .refine(
      (val) => !/^[0-9\s\-_]+$/.test(val),
      { message: "Укажите реальный адрес, а не только цифры" }
    )
    .refine(
      (val) => !/(здесь|тут|там|дом|улица)\s*(пиши|пишите|надо)?$/i.test(val),
      { message: "Укажите конкретный адрес или район" }
    ),
  budget: z.string().optional(),
  deadline: z.string().min(1, "Выберите срок"),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Вы должны согласиться с условиями",
  }),
});

type RequestFormData = z.infer<typeof requestSchema>;

export default function NewRequestPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { createRequest, isLoading } = useRequests();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      budget: "",
      deadline: "7",
    },
  });

  const watchTitle = watch("title");
  const watchDescription = watch("description");
  const watchAddress = watch("address");


  // Проверка авторизации
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading) {
    return (
      <>
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.card}>
              <p>Загрузка...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const onSubmit = async (data: RequestFormData) => {
    const requestData = {
      title: data.title,
      description: data.description,
      address: data.address,
      budget: data.budget ? parseInt(data.budget, 10) : undefined,
      deadline: parseInt(data.deadline, 10),
    };

    try {
      await createRequest.mutateAsync(requestData);
      router.push("/requests");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.title}>Создать заявку</h1>
            <p className={styles.subtitle}>
              Расскажите, какая помощь нужна, и соседи откликнутся
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="title">Заголовок</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Например: Нужно починить стиральную машину"
                  className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
                  maxLength={40}
                  {...register("title")}
                />
                  <span className={styles.charCount}>
                    {watchTitle?.length || 0}/40 символов
                  </span>
                {errors.title && (
                  <span className={styles.error}>{errors.title.message}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="description">Описание</label>
                <textarea
                  id="description"
                  rows={5}
                  placeholder="Подробно опишите проблему: что случилось, какой инструмент нужен и т.д."
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
                  maxLength={1500}
                  {...register("description")}
                />
                <span className={styles.charCount}>
                  {watchDescription?.length || 0}/1500 символов
                </span>
                {errors.description && (
                  <span className={styles.error}>{errors.description.message}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="address">Адрес или район</label>
                <input
                  id="address"
                  type="text"
                  placeholder="Например: ул. Ленина, д. 5 или район Солнечный"
                  className={`${styles.input} ${errors.address ? styles.inputError : ""}`}
                  maxLength={30}
                  {...register("address")}
                />
                <span className={styles.charCount}>
                  {watchAddress?.length || 0}/30 символов
                </span>
                {errors.address && (
                  <span className={styles.error}>{errors.address.message}</span>
                )}
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="budget">Бюджет (₽)</label>
                  <input
                    id="budget"
                    type="number"
                    placeholder="Например: 1000"
                    className={styles.input}
                    {...register("budget")}
                  />
                  <span className={styles.hint}>
                    Необязательно. Укажите, сколько готовы заплатить
                  </span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="deadline">Срок выполнения</label>
                  <select
                    id="deadline"
                    className={styles.select}
                    {...register("deadline")}
                  >
                    <option value="3">3 дня</option>
                    <option value="7">7 дней</option>
                    <option value="30">30 дней</option>
                  </select>
                </div>
              </div>

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
                    </Link>{" "}
                    и даю согласие на обработку персональных данных
                  </span>
                </label>
                {errors.termsAccepted && (
                  <span className={styles.error}>{errors.termsAccepted.message}</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={isLoading}
              >
                {isLoading ? "Публикация..." : "Опубликовать заявку"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}