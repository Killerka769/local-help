"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.scss";

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: "Что такое Local Help?",
    answer: "Local Help — это платформа для поиска помощи в городе. Вы можете создать заявку на ремонт, переезд или другими делами, а также откликнуться на чужие заявки и заработать.",
  },
  {
    question: "Сколько стоит использование платформы?",
    answer: "Local Help полностью бесплатен. Мы не берём комиссию с заказов. Вы платите исполнителю напрямую после выполнения работы.",
  },
  {
    question: "Как зарегистрироваться?",
    answer: "Нажмите на кнопку «Регистрация» на странице входа, введите номер телефона, имя, пароль и выберите ваш город. После регистрации вы сможете создавать заявки и откликаться на помощь.",
  },
  {
    question: "Как создать заявку?",
    answer: "После регистрации перейдите в раздел «Мои заявки» и нажмите кнопку «Создать заявку». Укажите заголовок, описание, адрес, бюджет и срок выполнения.",
  },
  {
    question: "Как я узнаю, что на мою заявку откликнулись?",
    answer: "Вы получите уведомление в интерфейсе (колокольчик) и на email (в разработке). Также вы можете видеть отклики на странице вашей заявки.",
  },
  {
    question: "Как я могу доверять исполнителю?",
    answer: "Платформа показывает рейтинг исполнителя, отзывы других пользователей и дату регистрации. Вы также можете связаться с исполнителем и обсудить детали до начала работы.",
  },
  {
    question: "Что делать, если исполнитель не пришёл или сделал плохо?",
    answer: "Вы можете оставить негативный отзыв, а также пожаловаться на исполнителя, нажав кнопку жалобы. Администрация рассмотрит жалобу и примет меры.",
  },
  {
    question: "Можно ли отменить заявку?",
    answer: "Да, автор заявки может отменить её до того, как выбран исполнитель. Если исполнитель уже выбран, свяжитесь с ним для отмены.",
  },
  {
    question: "Как я могу заработать на Local Help?",
    answer: "Зарегистрируйтесь, заполните профиль и начните откликаться на заявки в вашем городе. Когда автор заявки одобрит ваш отклик, вы сможете выполнить работу и получить оплату.",
  },
  {
    question: "Что делать, если я забыл пароль?",
    answer: "В ближайшее время мы добавим функцию восстановления пароля. Пока вы можете обратиться в поддержку: gaydar.666@mail.ru",
  },
  {
    question: "Как связаться с поддержкой?",
    answer: "Напишите нам в Telegram: @KillerkaXD или на почту: gaydar.666@mail.ru. Мы постараемся ответить в течение 24 часов.",
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
              <a
                href="https://t.me/KillerkaXD"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactBtnTelegram}
              >
                📱 Написать в Telegram
              </a>
              <a
                href="mailto:gaydar.666@mail.ru"
                className={styles.contactBtnEmail}
              >
                📧 Написать на почту
              </a>
            </div>
            <p className={styles.contactHint}>Обычно отвечаем в течение нескольких часов</p>
          </div>

          <div className={styles.back}>
            <Link href="/" className={styles.backLink}>← Вернуться на главную</Link>
          </div>
        </div>
      </main>
    </>
  );
}