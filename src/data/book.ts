export type VocabularyItem = {
  word: string;
  translation: string;
  translationKk?: string;
};

export type Chapter = {
  id: number;
  roman: string;
  title: string;
  titleRu: string;
  paragraphs: string[];
  vocabulary: VocabularyItem[];
};

/**
 * Original educational summaries of the book's themes and story.
 * These are not excerpts from, or a translation of, the novel.
 */
export const chapters: Chapter[] = [
  {
    id: 1,
    roman: "I",
    title: "A different way to see",
    titleRu: "Другой взгляд на мир",
    paragraphs: [
      "Childhood gives people a special kind of attention. A child may notice a strange shape, ask an unexpected question, or imagine a story inside an ordinary object. In The Little Prince, this ability becomes an important way of understanding the world. The narrator remembers how difficult it was to share his imagination with adults.",
      "The adults around him prefer practical explanations. They want clear information and familiar answers. Their habits are useful in everyday life, but they can also make the world feel smaller. The narrator gradually learns to hide some of his ideas, even though those ideas still matter to him.",
      "This opening theme asks the reader to look again. Understanding another person takes more than collecting facts. It also takes curiosity, patience, and the courage to admit that our first impression may be wrong.",
    ],
    vocabulary: [
      {
        word: "childhood",
        translation: "детство",
        translationKk: "балалық шақ",
      },
      {
        word: "imagination",
        translation: "воображение",
        translationKk: "қиял",
      },
      {
        word: "curiosity",
        translation: "любознательность",
        translationKk: "білуге құмарлық",
      },
      { word: "ordinary", translation: "обычный", translationKk: "қарапайым" },
      { word: "courage", translation: "смелость", translationKk: "батылдық" },
    ],
  },
  {
    id: 2,
    roman: "II",
    title: "A meeting in the desert",
    titleRu: "Встреча в пустыне",
    paragraphs: [
      "A problem with his aircraft leaves the narrator alone in a desert. He has little water and a difficult repair ahead of him. This place seems empty, yet it creates space for a surprising meeting. A young traveler appears, and his questions lead the narrator away from the usual concerns of adult life.",
      "The traveler speaks about a very small home and the things he cares for there. His story arrives slowly, through questions and brief memories. The narrator cannot understand everything immediately. Instead, he must listen carefully and allow the conversation to move at its own pace.",
      "The desert brings two different needs together. One person needs to repair a machine; the other wants to understand people and relationships. Their friendship suggests that a lonely place can become meaningful when someone is willing to listen.",
    ],
    vocabulary: [
      { word: "desert", translation: "пустыня", translationKk: "шөл" },
      { word: "aircraft", translation: "самолёт", translationKk: "ұшақ" },
      {
        word: "traveler",
        translation: "путешественник",
        translationKk: "саяхатшы",
      },
      {
        word: "repair",
        translation: "ремонтировать; ремонт",
        translationKk: "жөндеу",
      },
      {
        word: "meaningful",
        translation: "наполненный смыслом",
        translationKk: "мағыналы",
      },
    ],
  },
  {
    id: 3,
    roman: "III",
    title: "Learning to care",
    titleRu: "Учиться заботиться",
    paragraphs: [
      "On his small planet, the prince looks after a flower. She is beautiful, proud, and sometimes difficult to understand. He wants to help her, but her words and behavior often confuse him. Neither of them knows how to express affection clearly, so small misunderstandings begin to feel like serious problems.",
      "Distance changes the way he thinks about their relationship. He starts to notice the difference between a demanding sentence and a real need. A person may sound confident while feeling vulnerable. Caring for someone requires attention to both what they say and what they struggle to say.",
      "The flower becomes a lesson about imperfect love. A relationship does not become valuable because every conversation is easy. Its value grows through time, care, and a willingness to understand. The prince begins to recognize this only after leaving home.",
    ],
    vocabulary: [
      {
        word: "affection",
        translation: "нежность; привязанность",
        translationKk: "мейірім; жақындық",
      },
      { word: "vulnerable", translation: "уязвимый", translationKk: "осал" },
      {
        word: "relationship",
        translation: "отношения",
        translationKk: "қарым-қатынас",
      },
      {
        word: "misunderstandings",
        translation: "недопонимания",
        translationKk: "түсінбеушіліктер",
      },
      { word: "valuable", translation: "ценный", translationKk: "құнды" },
    ],
  },
  {
    id: 4,
    roman: "IV",
    title: "The worlds of adults",
    titleRu: "Миры взрослых",
    paragraphs: [
      "During his journey, the prince visits several tiny planets. Each one shows a different adult habit. Some people want authority, some want admiration, and others are occupied with counting or owning things. Their interests fill their whole world, leaving very little room for a visitor or a new question.",
      "The prince tries to understand these people without sharing their priorities. He notices that power is less impressive when there is nobody to guide. Praise feels empty when it is the only reason for a conversation. Possessions cannot replace the pleasure of actually experiencing something.",
      "These encounters use humor to explore serious questions. What makes an activity worthwhile? How can a habit become a prison? The prince does not offer a complete answer, but his simple questions reveal the distance between being busy and living with purpose.",
    ],
    vocabulary: [
      {
        word: "authority",
        translation: "власть; авторитет",
        translationKk: "билік; бедел",
      },
      {
        word: "admiration",
        translation: "восхищение",
        translationKk: "таңдану",
      },
      {
        word: "possessions",
        translation: "имущество; вещи",
        translationKk: "мүлік; заттар",
      },
      {
        word: "worthwhile",
        translation: "стоящий; полезный",
        translationKk: "пайдалы; құнды",
      },
      {
        word: "purpose",
        translation: "смысл; цель",
        translationKk: "мақсат; мән",
      },
    ],
  },
  {
    id: 5,
    roman: "V",
    title: "Work, maps, and discovery",
    titleRu: "Работа, карты и открытия",
    paragraphs: [
      "One person the prince meets has a task that helps others: caring for a lamp. The work is repetitive, and its rules no longer fit the changing world around him. Even so, the prince respects the effort because it serves something beyond the worker himself. This encounter introduces a gentler view of responsibility.",
      "Another meeting raises questions about knowledge. A map can describe mountains, rivers, and distant places, but a description is different from an experience. Someone may know many facts about a journey without ever feeling its difficulties or discovering its surprises.",
      "Together, these themes invite the reader to connect learning with action. Useful knowledge grows when we test ideas, observe carefully, and stay open to change. Rules and information can guide us, but they need attention to the living world they are meant to serve.",
    ],
    vocabulary: [
      {
        word: "responsibility",
        translation: "ответственность",
        translationKk: "жауапкершілік",
      },
      {
        word: "repetitive",
        translation: "повторяющийся",
        translationKk: "қайталанатын",
      },
      { word: "knowledge", translation: "знания", translationKk: "білім" },
      {
        word: "discovery",
        translation: "открытие",
        translationKk: "жаңалық; ашылу",
      },
      { word: "observe", translation: "наблюдать", translationKk: "бақылау" },
    ],
  },
  {
    id: 6,
    roman: "VI",
    title: "What makes something unique?",
    titleRu: "Что делает что-то уникальным?",
    paragraphs: [
      "On Earth, the prince discovers that his flower is not the only flower of her kind. At first, this seems to make his home less special. He has confused being rare with being important. Seeing many similar flowers forces him to question the story he has told himself about his own small world.",
      "Yet appearance is only one part of a relationship. Two objects can look alike while carrying very different memories. A familiar cup, a worn book, or a quiet place may matter because of the time and attention connected to it. Its importance cannot be measured by comparing its surface with another.",
      "The prince is beginning to learn this distinction. His flower has a shared history with him. That history does not make other flowers worthless; it gives their particular relationship a meaning that comparison alone cannot explain.",
    ],
    vocabulary: [
      { word: "unique", translation: "уникальный", translationKk: "бірегей" },
      {
        word: "appearance",
        translation: "внешний вид",
        translationKk: "сыртқы көрініс",
      },
      { word: "familiar", translation: "знакомый", translationKk: "таныс" },
      {
        word: "distinction",
        translation: "различие",
        translationKk: "айырмашылық",
      },
      {
        word: "comparison",
        translation: "сравнение",
        translationKk: "салыстыру",
      },
    ],
  },
  {
    id: 7,
    roman: "VII",
    title: "The patience of friendship",
    titleRu: "Терпение дружбы",
    paragraphs: [
      "A meeting with a fox gives the prince a new understanding of friendship. Trust cannot be demanded or completed in a single moment. It develops through patient attention, repeated meetings, and respect for another creature’s comfort. Small routines help both sides feel safe enough to become closer.",
      "As the friendship grows, ordinary details gain new meaning. A sound, a color, or a certain time of day can remind someone of a person they love. The outside world becomes connected to a private experience. This is why a relationship can change how we notice things even when the things themselves stay the same.",
      "Friendship also brings the possibility of sadness. Being close to someone makes separation difficult. The story accepts this cost while showing why the connection remains valuable. Care is a practice, and the time we give to it shapes our lives.",
    ],
    vocabulary: [
      { word: "trust", translation: "доверие", translationKk: "сенім" },
      {
        word: "patience",
        translation: "терпение",
        translationKk: "шыдамдылық",
      },
      {
        word: "creature",
        translation: "живое существо",
        translationKk: "тіршілік иесі",
      },
      {
        word: "separation",
        translation: "расставание",
        translationKk: "айырылысу",
      },
      { word: "connection", translation: "связь", translationKk: "байланыс" },
    ],
  },
  {
    id: 8,
    roman: "VIII",
    title: "Carrying a story home",
    titleRu: "История, которая остаётся с нами",
    paragraphs: [
      "Near the end of the journey, the prince thinks about returning to his flower. The narrator must also return to his own life. Their shared days in the desert have changed them, but they cannot keep that moment forever. The ending leaves room for uncertainty, memory, and different ways of understanding a goodbye.",
      "For the narrator, the world now contains reminders of his friend. The night sky becomes connected to conversations, laughter, and care. He has learned to take a child’s questions seriously and to recognize forms of value that practical explanations cannot fully describe.",
      "The lasting invitation of the story is to remain attentive. We can make time for people, ask better questions, and notice what a familiar routine hides. Growing older does not have to mean losing imagination. A meaningful life can hold both everyday responsibilities and the ability to wonder.",
    ],
    vocabulary: [
      {
        word: "uncertainty",
        translation: "неопределённость",
        translationKk: "белгісіздік",
      },
      {
        word: "reminders",
        translation: "напоминания",
        translationKk: "еске салатын белгілер",
      },
      {
        word: "attentive",
        translation: "внимательный",
        translationKk: "зейінді",
      },
      {
        word: "wonder",
        translation: "удивляться; изумление",
        translationKk: "таңдану",
      },
      {
        word: "lasting",
        translation: "долговечный; сохраняющийся",
        translationKk: "ұзақ сақталатын",
      },
    ],
  },
];

export const book = {
  id: "little-prince-study",
  title: "The Little Prince",
  titleRu: "Маленький принц",
  author: "Antoine de Saint-Exupéry",
  authorRu: "Антуан де Сент-Экзюпери",
  level: "B1",
  language: "English",
  description:
    "Английский через историю о дружбе, заботе и умении видеть главное.",
  contentNote:
    "В демоверсии — 8 авторских учебных пересказов на английском по мотивам тем книги. Это не оригинал и не перевод произведения. Можно загрузить свой текст, на использование которого у вас есть право.",
  chapters,
};

export const totalWords = chapters.reduce(
  (total, chapter) =>
    total + chapter.paragraphs.join(" ").split(/\s+/).filter(Boolean).length,
  0,
);
