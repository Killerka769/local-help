"use client";

import { useState } from "react";
import styles from "./page.module.scss";

export default function AdvertisingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/advertising", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        setFormData({ name: "", email: "", company: "", message: "" });
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка отправки");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Реклама на Local Help</h1>
          <p className={styles.subtitle}>
            Разместите рекламу на платформе и получите доступ к активной аудитории
          </p>

          <div className={styles.grid}>
            <div className={styles.info}>
              <h2>Почему стоит разместить рекламу у нас?</h2>
              <ul>
                <li>📍 Целевая аудитория — жители Дагестана</li>
                <li>📈 Более 1000 активных пользователей в месяц</li>
                <li>🎯 Таргетинг по городу и категориям услуг</li>
                <li>💰 Доступные цены для локального бизнеса</li>
              </ul>

              <div className={styles.prices}>
                <h3>Цены</h3>
                <div className={styles.priceItem}>
                  <span>Баннер на главной</span>
                  <span>от 3000 ₽/мес</span>
                </div>
                <div className={styles.priceItem}>
                  <span>Продвижение заявки</span>
                  <span>от 500 ₽/заявка</span>
                </div>
                <div className={styles.priceItem}>
                  <span>Индивидуальный тариф</span>
                  <span>договорная</span>
                </div>
              </div>
            </div>

            <div className={styles.formCard}>
              <h2>Оставить заявку</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={styles.input}
                />
                <input
                  type="email"
                  placeholder="Email для связи"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Название компании (опционально)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={styles.input}
                />
                <textarea
                  placeholder="Расскажите о вашем предложении"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className={styles.textarea}
                />
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>✅ Заявка отправлена! Мы свяжемся с вами.</div>}
                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                  {isSubmitting ? "Отправка..." : "Отправить заявку"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}