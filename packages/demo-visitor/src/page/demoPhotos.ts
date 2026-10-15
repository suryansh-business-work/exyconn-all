import callerPhoto from '../assets/demo-caller.jpg';
import chatPhoto from '../assets/demo-chat.jpg';
import teamPhoto from '../assets/demo-team.jpg';

/** A Pexels photo on a demo page, bundled with the app, with the page it came from. */
export interface DemoPhoto {
  src: string;
  alt: string;
  /** The photo's page on Pexels, credited under it. */
  sourceUrl: string;
}

/** The photos the demo pages use (Pexels licence: free to use, credit given as courtesy). */
export const DEMO_PHOTOS = {
  team: {
    src: teamPhoto,
    alt: 'A team reviewing a product demo together on a laptop',
    sourceUrl: 'https://www.pexels.com/photo/3862094/',
  },
  caller: {
    src: callerPhoto,
    alt: 'A smiling customer talking on her phone',
    sourceUrl: 'https://www.pexels.com/photo/3767367/',
  },
  chat: {
    src: chatPhoto,
    alt: 'A customer chatting with a business on a smartphone',
    sourceUrl: 'https://www.pexels.com/photo/7343000/',
  },
} as const satisfies Record<string, DemoPhoto>;
