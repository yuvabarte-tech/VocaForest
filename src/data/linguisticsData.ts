export interface LinguisticsQuestion {
  id: string;
  type: 'synonym' | 'antonym' | 'homophone';
  word?: string; // Target word for synonym/antonym
  sentence?: string; // For homophones, e.g. "Please stand ___."
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export const linguisticsQuestions: LinguisticsQuestion[] = [
  // --- SYNONYMS ---
  {
    id: 'syn_01',
    type: 'synonym',
    word: 'Happy',
    questionText: 'Which word has the SAME meaning as "Happy"?',
    options: ['Sad', 'Cheerful', 'Angry', 'Tired'],
    correctAnswer: 'Cheerful',
    explanation: 'Cheerful means full of happiness and good spirits!'
  },
  {
    id: 'syn_02',
    type: 'synonym',
    word: 'Big',
    questionText: 'Which word has the SAME meaning as "Big"?',
    options: ['Tiny', 'Narrow', 'Huge', 'Short'],
    correctAnswer: 'Huge',
    explanation: 'Huge and big both describe something of very large size.'
  },
  {
    id: 'syn_03',
    type: 'synonym',
    word: 'Quick',
    questionText: 'Which word has the SAME meaning as "Quick"?',
    options: ['Slow', 'Fast', 'Quiet', 'Sleepy'],
    correctAnswer: 'Fast',
    explanation: 'Quick and fast both describe high speed or rapid movement.'
  },
  {
    id: 'syn_04',
    type: 'synonym',
    word: 'Begin',
    questionText: 'Which word has the SAME meaning as "Begin"?',
    options: ['Finish', 'Stop', 'Start', 'Wait'],
    correctAnswer: 'Start',
    explanation: 'To begin or start is to take the first step in an activity.'
  },
  {
    id: 'syn_05',
    type: 'synonym',
    word: 'Smart',
    questionText: 'Which word has the SAME meaning as "Smart"?',
    options: ['Foolish', 'Intelligent', 'Weak', 'Loud'],
    correctAnswer: 'Intelligent',
    explanation: 'An intelligent person is smart, quick to learn and understand.'
  },
  {
    id: 'syn_06',
    type: 'synonym',
    word: 'Difficult',
    questionText: 'Which word has the SAME meaning as "Difficult"?',
    options: ['Easy', 'Hard', 'Soft', 'Smooth'],
    correctAnswer: 'Hard',
    explanation: 'Something difficult or hard requires a lot of effort to solve.'
  },
  {
    id: 'syn_07',
    type: 'synonym',
    word: 'Silent',
    questionText: 'Which word has the SAME meaning as "Silent"?',
    options: ['Loud', 'Noisy', 'Quiet', 'Heavy'],
    correctAnswer: 'Quiet',
    explanation: 'Silent and quiet both mean making little or no sound.'
  },
  {
    id: 'syn_08',
    type: 'synonym',
    word: 'Beautiful',
    questionText: 'Which word has the SAME meaning as "Beautiful"?',
    options: ['Ugly', 'Dirty', 'Pretty', 'Rough'],
    correctAnswer: 'Pretty',
    explanation: 'Beautiful and pretty describe someone or something very attractive.'
  },
  {
    id: 'syn_09',
    type: 'synonym',
    word: 'Tired',
    questionText: 'Which word has the SAME meaning as "Tired"?',
    options: ['Active', 'Sleepy', 'Energetic', 'Brave'],
    correctAnswer: 'Sleepy',
    explanation: 'Being tired or sleepy means you need rest or sleep.'
  },
  {
    id: 'syn_10',
    type: 'synonym',
    word: 'Angry',
    questionText: 'Which word has the SAME meaning as "Angry"?',
    options: ['Calm', 'Mad', 'Happy', 'Scared'],
    correctAnswer: 'Mad',
    explanation: 'Mad is an informal synonym for feeling angry.'
  },

  // --- ANTONYMS ---
  {
    id: 'ant_01',
    type: 'antonym',
    word: 'Hot',
    questionText: 'Which word has the OPPOSITE meaning of "Hot"?',
    options: ['Warm', 'Spicy', 'Cold', 'Wet'],
    correctAnswer: 'Cold',
    explanation: 'Cold is the polar opposite of hot on the temperature scale.'
  },
  {
    id: 'ant_02',
    type: 'antonym',
    word: 'Heavy',
    questionText: 'Which word has the OPPOSITE meaning of "Heavy"?',
    options: ['Weighty', 'Light', 'Hard', 'Thick'],
    correctAnswer: 'Light',
    explanation: 'Something light weighs very little, whereas heavy weighs a lot.'
  },
  {
    id: 'ant_03',
    type: 'antonym',
    word: 'Clean',
    questionText: 'Which word has the OPPOSITE meaning of "Clean"?',
    options: ['Pure', 'Fresh', 'Dirty', 'Shiny'],
    correctAnswer: 'Dirty',
    explanation: 'Dirty is the opposite of clean, meaning marked with dirt or grime.'
  },
  {
    id: 'ant_04',
    type: 'antonym',
    word: 'Arrive',
    questionText: 'Which word has the OPPOSITE meaning of "Arrive"?',
    options: ['Reach', 'Stay', 'Enter', 'Leave'],
    correctAnswer: 'Leave',
    explanation: 'To arrive is to reach a destination; to leave is to go away from it.'
  },
  {
    id: 'ant_05',
    type: 'antonym',
    word: 'Buy',
    questionText: 'Which word has the OPPOSITE meaning of "Buy"?',
    options: ['Shop', 'Pay', 'Sell', 'Get'],
    correctAnswer: 'Sell',
    explanation: 'Buying is obtaining something by paying; selling is giving it away for payment.'
  },
  {
    id: 'ant_06',
    type: 'antonym',
    word: 'Strong',
    questionText: 'Which word has the OPPOSITE meaning of "Strong"?',
    options: ['Tough', 'Weak', 'Brave', 'Tall'],
    correctAnswer: 'Weak',
    explanation: 'Weak is the opposite of strong, representing low physical power.'
  },
  {
    id: 'ant_07',
    type: 'antonym',
    word: 'First',
    questionText: 'Which word has the OPPOSITE meaning of "First"?',
    options: ['Front', 'Middle', 'Last', 'Next'],
    correctAnswer: 'Last',
    explanation: 'Last is the opposite of first, representing the end of a sequence.'
  },
  {
    id: 'ant_08',
    type: 'antonym',
    word: 'Noisy',
    questionText: 'Which word has the OPPOSITE meaning of "Noisy"?',
    options: ['Loud', 'Quiet', 'Sweet', 'Bright'],
    correctAnswer: 'Quiet',
    explanation: 'Quiet means making very little noise, which is the opposite of noisy.'
  },
  {
    id: 'ant_09',
    type: 'antonym',
    word: 'Cheap',
    questionText: 'Which word has the OPPOSITE meaning of "Cheap"?',
    options: ['Low', 'Free', 'Expensive', 'Costly'],
    correctAnswer: 'Expensive',
    explanation: 'Expensive means costing a lot of money, which is the opposite of cheap.'
  },
  {
    id: 'ant_10',
    type: 'antonym',
    word: 'Rough',
    questionText: 'Which word has the OPPOSITE meaning of "Rough"?',
    options: ['Hard', 'Smooth', 'Wild', 'Dry'],
    correctAnswer: 'Smooth',
    explanation: 'Smooth is the opposite of rough, meaning flat and free of bumps.'
  },

  // --- HOMOPHONES ---
  {
    id: 'hom_01',
    type: 'homophone',
    sentence: 'Please stand over ___.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['there', 'their', 'they\'re'],
    correctAnswer: 'there',
    explanation: '"There" refers to a place, whereas "their" shows ownership.'
  },
  {
    id: 'hom_02',
    type: 'homophone',
    sentence: 'I can ___ the ocean waves.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['here', 'hear'],
    correctAnswer: 'hear',
    explanation: '"Hear" is the act of listening, whereas "here" refers to this location.'
  },
  {
    id: 'hom_03',
    type: 'homophone',
    sentence: 'The sky is a beautiful shade of ___.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['blue', 'blew'],
    correctAnswer: 'blue',
    explanation: '"Blue" is the color, while "blew" is the past tense of the verb blow.'
  },
  {
    id: 'hom_04',
    type: 'homophone',
    sentence: 'My dog wagged its ___ happily.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['tail', 'tale'],
    correctAnswer: 'tail',
    explanation: 'A "tail" is the back part of an animal, while a "tale" is an exciting story.'
  },
  {
    id: 'hom_05',
    type: 'homophone',
    sentence: 'There are ___ apples left on the plate.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['to', 'too', 'two'],
    correctAnswer: 'two',
    explanation: '"Two" represents the number 2, while "too" means also or excessive.'
  },
  {
    id: 'hom_06',
    type: 'homophone',
    sentence: 'The boat was sailing on the deep blue ___.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['sea', 'see'],
    correctAnswer: 'sea',
    explanation: '"Sea" is the body of saltwater, while "see" is viewing with your eyes.'
  },
  {
    id: 'hom_07',
    type: 'homophone',
    sentence: 'I am eating a sweet and juicy ___.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['pair', 'pear'],
    correctAnswer: 'pear',
    explanation: '"Pear" is the delicious fruit, while "pair" means two of something.'
  },
  {
    id: 'hom_08',
    type: 'homophone',
    sentence: 'He ___ a long letter to his grandmother.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['wrote', 'rote'],
    correctAnswer: 'wrote',
    explanation: '"Wrote" is the past tense of write, whereas "rote" means repetition.'
  },
  {
    id: 'hom_09',
    type: 'homophone',
    sentence: 'The wind ___ the balloon away.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['blue', 'blew'],
    correctAnswer: 'blew',
    explanation: '"Blew" is the past tense of blow, representing air movement.'
  },
  {
    id: 'hom_10',
    type: 'homophone',
    sentence: 'We walked ___ the main entrance.',
    questionText: 'Choose the correct word to complete the sentence:',
    options: ['through', 'threw'],
    correctAnswer: 'through',
    explanation: '"Through" means moving in one side and out of the other; "threw" is past tense of throw.'
  }
];
