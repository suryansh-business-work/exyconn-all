import { createContext, useContext } from "react";

/** The site's brand mark (Admin > Branding favicon, else the bundled one), for the avatars. */
export const BrandMarkContext = createContext("");

export const useBrandMark = (): string => useContext(BrandMarkContext);
