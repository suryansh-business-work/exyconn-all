import type { MaLanguage } from './ma.enums';

/**
 * What the bot posts in the meeting chat as it joins, so everyone in the call knows it is
 * recording, in the meeting's language (Hinglish in Roman letters, as it is typed in chat).
 */
const CONSENT: Record<MaLanguage, (bot: string, owner: string) => string> = {
  ENGLISH: (bot, owner) =>
    `Hi, I'm ${bot}, joining for ${owner}. I'm recording and transcribing this call to share notes and action items afterwards. If you'd rather not be recorded, please tell ${owner} or remove me from the call.`,
  HINDI: (bot, owner) =>
    `नमस्ते, मैं ${bot} हूँ, ${owner} की ओर से जुड़ा हूँ। मीटिंग के बाद नोट्स और एक्शन आइटम भेजने के लिए मैं यह कॉल रिकॉर्ड और ट्रांसक्राइब कर रहा हूँ। अगर आप रिकॉर्ड नहीं होना चाहते, तो ${owner} को बताइए या मुझे कॉल से हटा दीजिए।`,
  HINGLISH: (bot, owner) =>
    `Hi, main ${bot} hoon, ${owner} ki taraf se join kiya hai. Meeting ke baad notes aur action items share karne ke liye main ye call record aur transcribe kar raha hoon. Agar aap record nahi hona chahte, to ${owner} ko bata dijiye ya mujhe call se remove kar dijiye.`,
  AUTO: (bot, owner) =>
    `Hi, I'm ${bot}, joining for ${owner}. I'm recording this call to share notes afterwards. / Main ye call notes ke liye record kar raha hoon; record nahi hona chahte to ${owner} ko bataiye ya mujhe remove kar dijiye.`,
};

export const botConsentMessage = (language: MaLanguage, bot: string, owner: string): string =>
  CONSENT[language](bot, owner);
