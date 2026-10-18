import type { ExperienceKind, Language, ProjectStatus } from '../api/types'

interface SectionCopy {
  eyebrow: string
  title: string
}

export interface Dictionary {
  skipToContent: string
  nav: Record<'about' | 'skills' | 'experience' | 'projects' | 'contact' | 'menu' | 'close', string>
  theme: { toLight: string; toDark: string }
  hero: { viewProjects: string; contact: string; resume: string; scroll: string; localTime: string }
  sections: Record<
    | 'about'
    | 'services'
    | 'skills'
    | 'experience'
    | 'projects'
    | 'certificates'
    | 'testimonials'
    | 'contact',
    SectionCopy
  >
  skills: { levels: [string, string, string, string, string]; other: string; legend: string }
  experience: {
    tabs: { work: string; education: string }
    present: string
    kinds: Record<ExperienceKind, string>
  }
  projects: {
    all: string
    details: string
    live: string
    code: string
    status: Record<ProjectStatus, string>
    role: string
    year: string
    highlights: string
    stack: string
    close: string
    prev: string
    next: string
  }
  certificates: { view: string }
  contact: {
    write: string
    copy: string
    copied: string
    socials: string
    form: {
      name: string
      email: string
      subject: string
      message: string
      namePlaceholder: string
      emailPlaceholder: string
      subjectPlaceholder: string
      messagePlaceholder: string
      send: string
      sending: string
      successTitle: string
      successText: string
      again: string
      error: string
      throttled: string
    }
  }
  footer: { top: string; rights: string }
  loading: string
  error: { title: string; text: string; retry: string }
  setup: { title: string; text: string; cta: string }
  duration: { years: (n: number) => string; months: (n: number) => string }
}

const uk: Dictionary = {
  skipToContent: 'Перейти до змісту',
  nav: {
    about: 'Про мене',
    skills: 'Навички',
    experience: 'Досвід',
    projects: 'Проєкти',
    contact: 'Контакти',
    menu: 'Меню',
    close: 'Закрити',
  },
  theme: { toLight: 'Увімкнути світлу тему', toDark: 'Увімкнути темну тему' },
  hero: {
    viewProjects: 'Переглянути роботи',
    contact: "Зв'язатися",
    resume: 'Резюме',
    scroll: 'Гортайте',
    localTime: 'Місцевий час',
  },
  sections: {
    about: { eyebrow: 'Про мене', title: 'Код, дизайн і *місячне* світло' },
    services: { eyebrow: 'Послуги', title: 'Чим я можу *допомогти*' },
    skills: { eyebrow: 'Навички', title: 'Інструменти, якими я *творю*' },
    experience: { eyebrow: 'Досвід', title: 'Шлях, що привів *сюди*' },
    projects: { eyebrow: 'Проєкти', title: 'Обрані *роботи*' },
    certificates: { eyebrow: 'Сертифікати', title: 'Підтверджені *знання*' },
    testimonials: { eyebrow: 'Відгуки', title: 'Що кажуть *люди*' },
    contact: { eyebrow: 'Контакти', title: 'Створімо щось *неймовірне*' },
  },
  skills: {
    levels: ['Вивчаю', 'Базовий', 'Впевнений', 'Просунутий', 'Експерт'],
    other: 'Інше',
    legend: 'Фаза місяця — рівень володіння',
  },
  experience: {
    tabs: { work: 'Робота', education: 'Освіта' },
    present: 'досі',
    kinds: { work: 'Робота', freelance: 'Фриланс', education: 'Освіта', volunteer: 'Волонтерство' },
  },
  projects: {
    all: 'Усі',
    details: 'Детальніше',
    live: 'Сайт',
    code: 'Код',
    status: { live: 'Live', in_progress: 'В розробці', completed: 'Завершено', archived: 'Архів' },
    role: 'Роль',
    year: 'Рік',
    highlights: 'Ключові моменти',
    stack: 'Технології',
    close: 'Закрити',
    prev: 'Попереднє зображення',
    next: 'Наступне зображення',
  },
  certificates: { view: 'Переглянути' },
  contact: {
    write: 'Напишіть мені',
    copy: 'Копіювати email',
    copied: 'Скопійовано',
    socials: 'Де мене знайти',
    form: {
      name: "Ім'я",
      email: 'Email',
      subject: 'Тема',
      message: 'Повідомлення',
      namePlaceholder: 'Як до вас звертатися?',
      emailPlaceholder: 'you@example.com',
      subjectPlaceholder: 'Про що поговоримо?',
      messagePlaceholder: 'Розкажіть про ідею чи проєкт…',
      send: 'Надіслати',
      sending: 'Надсилаю…',
      successTitle: 'Повідомлення летить до місяця',
      successText: 'Дякую! Відповім найближчим часом.',
      again: 'Написати ще',
      error: 'Щось пішло не так. Спробуйте ще раз або напишіть на email.',
      throttled: 'Забагато повідомлень. Спробуйте трохи пізніше.',
    },
  },
  footer: { top: 'Нагору', rights: 'Усі права захищено' },
  loading: 'Сходить місяць…',
  error: {
    title: 'Місяць сховався за хмарами',
    text: 'Не вдалося завантажити дані. Перевірте з’єднання та спробуйте ще раз.',
    retry: 'Спробувати ще',
  },
  setup: {
    title: 'Портфоліо майже готове',
    text: 'Заповніть профіль в адмінці — і сайт оживе.',
    cta: 'Відкрити адмінку',
  },
  duration: { years: (n) => `${n} р.`, months: (n) => `${n} міс.` },
}

const en: Dictionary = {
  skipToContent: 'Skip to content',
  nav: {
    about: 'About',
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Work',
    contact: 'Contact',
    menu: 'Menu',
    close: 'Close',
  },
  theme: { toLight: 'Switch to light theme', toDark: 'Switch to dark theme' },
  hero: {
    viewProjects: 'View my work',
    contact: 'Get in touch',
    resume: 'Resume',
    scroll: 'Scroll',
    localTime: 'Local time',
  },
  sections: {
    about: { eyebrow: 'About', title: 'Code, design & *moonlight*' },
    services: { eyebrow: 'Services', title: 'How I can *help*' },
    skills: { eyebrow: 'Skills', title: 'Tools I *craft* with' },
    experience: { eyebrow: 'Experience', title: 'The path that led *here*' },
    projects: { eyebrow: 'Work', title: 'Selected *projects*' },
    certificates: { eyebrow: 'Certificates', title: 'Proven *knowledge*' },
    testimonials: { eyebrow: 'Testimonials', title: 'Kind *words*' },
    contact: { eyebrow: 'Contact', title: "Let's build something *stellar*" },
  },
  skills: {
    levels: ['Learning', 'Basic', 'Confident', 'Advanced', 'Expert'],
    other: 'Other',
    legend: 'Moon phase — proficiency',
  },
  experience: {
    tabs: { work: 'Work', education: 'Education' },
    present: 'present',
    kinds: { work: 'Work', freelance: 'Freelance', education: 'Education', volunteer: 'Volunteering' },
  },
  projects: {
    all: 'All',
    details: 'Details',
    live: 'Live',
    code: 'Code',
    status: { live: 'Live', in_progress: 'In progress', completed: 'Completed', archived: 'Archived' },
    role: 'Role',
    year: 'Year',
    highlights: 'Highlights',
    stack: 'Stack',
    close: 'Close',
    prev: 'Previous image',
    next: 'Next image',
  },
  certificates: { view: 'View' },
  contact: {
    write: 'Write to me',
    copy: 'Copy email',
    copied: 'Copied',
    socials: 'Find me on',
    form: {
      name: 'Name',
      email: 'Email',
      subject: 'Subject',
      message: 'Message',
      namePlaceholder: 'How should I call you?',
      emailPlaceholder: 'you@example.com',
      subjectPlaceholder: 'What is it about?',
      messagePlaceholder: 'Tell me about your idea or project…',
      send: 'Send message',
      sending: 'Sending…',
      successTitle: 'Your message is flying to the moon',
      successText: 'Thank you! I will get back to you soon.',
      again: 'Send another',
      error: 'Something went wrong. Please try again or email me directly.',
      throttled: 'Too many messages. Please try again a bit later.',
    },
  },
  footer: { top: 'Back to top', rights: 'All rights reserved' },
  loading: 'The moon is rising…',
  error: {
    title: 'The moon is hiding behind the clouds',
    text: 'Could not load the data. Check your connection and try again.',
    retry: 'Try again',
  },
  setup: {
    title: 'The portfolio is almost ready',
    text: 'Fill in your profile in the admin panel to bring the site to life.',
    cta: 'Open admin',
  },
  duration: { years: (n) => `${n} yr`, months: (n) => `${n} mo` },
}

export const dictionaries: Record<Language, Dictionary> = { en, uk }
