"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import styles from "./EmailWarning.module.scss";

export default function EmailWarning() {
  const { user, isLoading } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || !user) return null;
  if (user.emailVerified) return null;
  if (dismissed) return null;

  return (
    <div className={styles.warning}>
      <div className={styles.warningContent}>
        <span className={styles.warningIcon}>⚠️</span>
        <div className={styles.warningText}>
          <strong>Email не подтверждён</strong>
          <p>
            Укажите и подтвердите email в{" "}
            <Link href="/settings" className={styles.link}>
              настройках
            </Link>
            . Это позволит восстановить пароль в случае его утери.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={styles.dismissBtn}
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
    </div>
  );
}