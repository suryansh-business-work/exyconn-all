/** Metro bundles an image import as an asset id, the value `expo-image`'s `source` takes. */
declare module '*.png' {
  const asset: number;
  export default asset;
}
