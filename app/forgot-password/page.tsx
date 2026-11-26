"use client";

import Link from "next/link";
import { SUPPORT_CONTACT, supportHref } from "@/lib/support";
import styles from "./page.module.scss";

export default function ForgotPasswordPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Восстановление пароля</h1>
          <p className={styles.subtitle}>
            Самостоятельного сброса нет. Аккаунт создаётся по телефону, почта при
            регистрации не спрашивается, письма сейчас не отправляются.
          </p>
          <p className={styles.subtitle}>
            Напишите в поддержку с номера, на который регистрировались. Поможем вручную.
          </p>
          <p className={styles.subtitle}>
            {SUPPORT_CONTACT ? (
              <a href={supportHref()}>{SUPPORT_CONTACT}</a>
            ) : (
              "Контакт поддержки задаётся в SUPPORT_CONTACT."
            )}
          </p>
          <p>
            <Link href="/login" className={styles.link}>
              Вернуться ко входу
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
