const forbiddenWords: string[] = [
  "блять", "бляд", "блядь", "бляхамуха",
  "хуй", "хуя", "хуе", "хуё", "хуило", "хуйло", "хуйня", "нахуй", "похуй",
  "пизд", "пезд", "пиздец", "пизда",
  "ебать", "ебал", "ёбаный", "ебануть", "ебанат",
  "мудак", "мудила", "мудило", "мудозвон",
  "гандон", "гондон", "говнюк",
  "дрочить", "дрочер", "дрочила",
  "пидор", "пидарас", "пидорас", "педераст", "пидрила",
  "сука", "сучка", "сукин", "сучара",
  "уебок", "уёбок", "уебан", "уёбан", "уебище",
  "залупа", "жопа",
  "шлюха", "шлюшка",
  "охуеть", "охуенный", "ахуеть", "заебать", "заебись",
  "fuck", "fucking", "fucker", "fucked",
  "shit", "shitting", "shitty",
  "bitch", "bitches",
  "asshole",
  "dickhead",
  "cunt",
  "whore",
  "nigger",
  "пидар",
  "нацист", "фашист",
  "чурка", "хачик", "жид", "хохол", "москаль", "кацап",
  "черножопый", "черномазый",
  "наркота", "наркотик", "мефедрон", "героин", "кокаин", "амфетамин",
  "педофил", "изнасилование",
];

const charMap: Record<string, string> = {
  a: "а",
  b: "б",
  c: "с",
  e: "е",
  h: "н",
  i: "и",
  k: "к",
  m: "м",
  o: "о",
  p: "п",
  t: "т",
  y: "у",
  x: "х",
  "@": "а",
};

function replaceSimilarChars(text: string): string {
  let result = "";
  for (const char of text) {
    const lower = char.toLowerCase();
    result += charMap[lower] || lower;
  }
  return result;
}

function compressRepeatedChars(text: string): string {
  return text.replace(/(.)\1+/g, "$1");
}

export function normalizeText(text: string): string {
  if (!text) return "";
  let normalized = text.toLowerCase();
  normalized = replaceSimilarChars(normalized);
  normalized = normalized.replace(/[^a-zа-яё]/g, "");
  normalized = compressRepeatedChars(normalized);
  return normalized;
}

export function normalizeForCheck(text: string): string {
  return normalizeText(text);
}

export const CONTACT_IN_TEXT_ERROR =
  "Уберите контакты из текста — они откроются после одобрения отклика";

const PHONE_RUN_RE = /(?:[78]\d{10}|9\d{9})/;

const MESSENGER_RE =
  /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp(?:\.com)?|t\.me|telegram\.me|www\.whatsapp\.com)(?:\/\S*)?/i;

const MESSENGER_WORD_RE =
  /(?:whats?app|вотс\s*апп?|ватс\s*апп?|вацап|телеграм\w*)/i;

const HANDLE_RE = /(?:^|[^\w.])@([A-Za-z][A-Za-z0-9_]{2,31})\b/;

const DIGIT_WORDS: [string, string][] = [
  ["девятьсот", "9"],
  ["восемьсот", "8"],
  ["семьсот", "7"],
  ["шестьсот", "6"],
  ["пятьсот", "5"],
  ["четыреста", "4"],
  ["триста", "3"],
  ["двести", "2"],
  ["девяносто", "9"],
  ["восемьдесят", "8"],
  ["семьдесят", "7"],
  ["шестьдесят", "6"],
  ["пятьдесят", "5"],
  ["двадцать", "2"],
  ["тридцать", "3"],
  ["двенадцать", "12"],
  ["тринадцать", "13"],
  ["четырнадцать", "14"],
  ["пятнадцать", "15"],
  ["шестнадцать", "16"],
  ["семнадцать", "17"],
  ["восемнадцать", "18"],
  ["девятнадцать", "19"],
  ["десять", "1"],
  ["сорок", "4"],
  ["восемь", "8"],
  ["девять", "9"],
  ["четыре", "4"],
  ["шесть", "6"],
  ["пять", "5"],
  ["семь", "7"],
  ["ноль", "0"],
  ["нуль", "0"],
  ["один", "1"],
  ["одна", "1"],
  ["одно", "1"],
  ["два", "2"],
  ["две", "2"],
  ["три", "3"],
  ["сто", "1"],
];

export function normalizeContactText(text: string): string {
  if (!text) return "";
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

function wordsToDigits(text: string): string {
  let lower = text.toLowerCase();
  for (const [word, digit] of DIGIT_WORDS) {
    lower = lower.split(word).join(digit);
  }
  return lower;
}

function hasPhoneRun(normalized: string): boolean {
  const runs = normalized.match(/\d+/g) ?? [];
  for (const run of runs) {
    if (run.length < 10) continue;
    if (PHONE_RUN_RE.test(run)) return true;
  }
  return false;
}

export function containsPhoneNumber(text: string): boolean {
  if (!text) return false;
  if (hasPhoneRun(normalizeContactText(text))) return true;
  if (hasPhoneRun(normalizeContactText(wordsToDigits(text)))) return true;
  return false;
}

export function containsContactBypass(text: string): boolean {
  if (!text) return false;
  if (MESSENGER_RE.test(text)) return true;
  if (MESSENGER_WORD_RE.test(text)) return true;
  const handle = HANDLE_RE.exec(text);
  if (handle && !text.includes(`@${handle[1]}.`)) return true;
  return false;
}

export function containsContacts(text: string): boolean {
  return containsPhoneNumber(text) || containsContactBypass(text);
}

export function containsBadWords(text: string): boolean {
  if (!text) return false;
  const normalized = normalizeText(text);
  if (!normalized) return false;

  for (const badWord of forbiddenWords) {
    const needle = normalizeText(badWord);
    if (needle.length < 3) continue;
    if (normalized.includes(needle)) {
      return true;
    }
  }
  return false;
}

export function isValidName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: "Имя должно содержать минимум 2 символа" };
  }
  if (name.trim().length > 50) {
    return { valid: false, error: "Имя не должно превышать 50 символов" };
  }

  const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s-]+$/;
  if (!nameRegex.test(name)) {
    return { valid: false, error: "Имя может содержать только буквы, пробелы и дефис" };
  }

  if (containsContacts(name)) {
    return { valid: false, error: CONTACT_IN_TEXT_ERROR };
  }

  if (containsBadWords(name)) {
    return { valid: false, error: "Имя содержит недопустимые слова" };
  }

  return { valid: true };
}

export function isValidText(
  text: string,
  fieldName: string = "Текст"
): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: `${fieldName} не может быть пустым` };
  }
  if (text.length > 5000) {
    return { valid: false, error: `${fieldName} не должен превышать 5000 символов` };
  }
  if (containsContacts(text)) {
    return {
      valid: false,
      error: CONTACT_IN_TEXT_ERROR,
    };
  }
  if (containsBadWords(text)) {
    return { valid: false, error: `${fieldName} содержит недопустимые слова` };
  }
  return { valid: true };
}
