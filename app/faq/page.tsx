"use client";

import { useState } from "react";
import Link from "next/link";
import { SUPPORT_CONTACT, supportHref } from "@/lib/support";
import styles from "./page.module.scss";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Что такое Local Help?",
    answer:
      "Local Help — площадка соседской помощи в городах Дагестана. Можно оставить заявку на бытовую задачу или откликнуться на чужую. Платформа не является стороной сделки и не берёт комиссию.",
  },
  {
    question: "Сколько стоит использование платформы?",
    answer:
      "Бесплатно. Оплата исполнителю — напрямую, на месте, после того как договорились. Мы деньги не принимаем и не возвращаем.",
  },
  {
    question: "Как зарегистрироваться?",
    answer:
      "Нужны телефон, имя, пароль (от 8 символов) и город. Email не обязателен. Нужно принять соглашение, политику конфиденциальности и подтвердить, что вам есть 18 лет.",
  },
  {
    question: "Как создать заявку?",
    answer:
      "После входа откройте «Мои заявки» → «Создать заявку». Укажите заголовок, подробное описание, район или ориентир, бюджет (по желанию) и срок. В ленте видны город и район, без дома и квартиры.",
  },
  {
    question: "Увидят ли соседи мой адрес и телефон?",
    answer:
      "Район виден всем в ленте. Дом и квартиру мы не собираем. Телефон открывается только вам и выбранному помощнику после одобрения отклика. Точный адрес обсуждаете по телефону.",
  },
  {
    question: "Нужно ли пускать помощника в квартиру?",
    answer:
      "Нет. Договоритесь встретиться у подъезда, во дворе или в другом удобном месте. Платформа этого не требует.",
  },
  {
    question: "Как я узнаю, что на мою заявку откликнулись?",
    answer:
      "Уведомление в колокольчике на сайте. Писем на почту нет. Отклики также видны на странице заявки.",
  },
  {
    question: "Как закрывается заявка и откуда рейтинг?",
    answer:
      "Исполнитель отмечает «Я выполнил работу», заказчик подтверждает. После закрытия обе стороны могут оставить отзыв. Рейтинг — среднее по отзывам, не +1 за каждую заявку.",
  },
  {
    question: "Что делать, если исполнитель не пришёл или сделал плохо?",
    answer:
      "Оставьте отзыв и нажмите «Пожаловаться». Администрация рассмотрит жалобу и может заблокировать аккаунт. Деньги платформа не возвращает — их мы не держим.",
  },
  {
    question: "Можно ли отменить заявку?",
    answer:
      "Да, пока исполнитель не выбран. Если уже одобрили отклик — свяжитесь с человеком и договоритесь.",
  },
  {
    question: "Что делать, если я забыл пароль?",
    answer:
      "Самостоятельного восстановления нет: аккаунт привязан к телефону, а почта при регистрации не спрашивается. Напишите в поддержку — поможем вручную.",
  },
  {
    question: "Как связаться с поддержкой?",
    answer: SUPPORT_CONTACT
      ? `Напишите в поддержку: ${SUPPORT_CONTACT}. Обычно отвечаем в течение суток.`
      : "Контакт поддержки задаётся в переменной SUPPORT_CONTACT.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Часто задаваемые вопросы</h1>
          <p className={styles.subtitle}>
            Ответы на самые популярные вопросы о Local Help
          </p>

          <div className={styles.faqList}>
            {faqItems.map((item, index) => (
              <div
                key={index}
                className={`${styles.faqItem} ${openIndex === index ? styles.open : ""}`}
              >
                <button
                  className={styles.question}
                  onClick={() => toggleItem(index)}
                >
                  <span className={styles.questionIcon}>
                    {openIndex === index ? "−" : "+"}
                  </span>
                  <span>{item.question}</span>
                </button>
                <div className={styles.answer}>
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.contact}>
            <p>Не нашли ответ на свой вопрос?</p>
            <div className={styles.contactButtons}>
              {SUPPORT_CONTACT ? (
                <a
                  href={supportHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactBtnEmail}
                >
                  Написать в поддержку
                </a>
              ) : null}
            </div>
            <p className={styles.contactHint}>Обычно отвечаем в течение суток</p>
          </div>

          <div className={styles.back}>
            <Link href="/" className={styles.backLink}>← Вернуться на главную</Link>
          </div>
        </div>
      </main>
    </>
  );
}
