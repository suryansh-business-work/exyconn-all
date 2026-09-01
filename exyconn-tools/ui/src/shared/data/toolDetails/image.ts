import type { ToolDetailsMap } from './types';

/** Detail content for the "image" tool category. Keyed by tool id from toolsData. */
export const imageToolDetails: ToolDetailsMap = {
  'compress-image': {
    longDescription: [
      'Compress Image shrinks JPG, PNG, SVG, and GIF files directly in your browser so they load faster on websites, fit inside email attachment limits, and take up less storage. You drop in one or more images, pick a quality level with the slider, and the tool re-encodes each file using the Canvas API on your own device — the compressed result appears with a before/after size comparison so you can see exactly how many kilobytes you saved.',
      'Because every byte of processing happens client-side, your photos never leave your computer: there is no upload, no server queue, and no account required. That makes it safe for private photos, client work, and internal documents. Web developers use it to hit Lighthouse performance budgets, bloggers use it to keep pages under CMS upload limits, and anyone emailing photos uses it to squeeze a 8 MB camera shot down to a fraction of its size without visible quality loss.',
    ],
    features: [
      'Compress JPG, PNG, SVG, and GIF files',
      'Adjustable quality slider with live output-size preview',
      'Before/after file-size comparison for every image',
      'Batch compression — drop multiple files at once',
      '100% client-side processing; images never leave your device',
      'No signup, no watermark, no file-count limits',
    ],
    useCases: [
      'Shrink hero and product images before publishing them on a website',
      'Fit a batch of photos under an email provider’s 25 MB attachment cap',
      'Reduce app or repository size by compressing bundled image assets',
      'Speed up page load times to improve Core Web Vitals scores',
      'Free up phone or laptop storage by re-saving oversized camera photos',
    ],
    howTo: [
      'Drag and drop your images onto the upload area, or click to browse.',
      'Move the quality slider to balance file size against visual quality.',
      'Check the before/after size shown for each image.',
      'Click Compress, then download images individually or all at once.',
    ],
    faqs: [
      {
        question: 'Are my images uploaded to a server?',
        answer: 'No. Compression runs entirely in your browser using the Canvas API. The files never leave your device, so nothing is stored or transmitted.',
      },
      {
        question: 'How much smaller will my images get?',
        answer: 'Typical JPG photos shrink 50–80% at the default quality setting. PNGs with large flat-color areas can shrink even more; results depend on the source image and the quality you choose.',
      },
      {
        question: 'Does compressing reduce image quality?',
        answer: 'Lossy compression discards some detail, but at moderate settings the difference is invisible at normal viewing sizes. Use the slider and preview to find the point where quality still looks right to you.',
      },
      {
        question: 'Can I compress multiple images at once?',
        answer: 'Yes. Drop as many files as you like — each one is compressed with the same quality setting and can be downloaded individually or together.',
      },
      {
        question: 'Is there a file size limit?',
        answer: 'There is no hard limit because processing happens on your machine. Very large images (50 MP and up) simply take a few extra seconds depending on your device.',
      },
    ],
    keywords: [
      'compress image online',
      'image compressor free',
      'reduce image file size',
      'compress jpg',
      'compress png',
      'shrink image for email',
      'optimize images for web',
      'image size reducer',
    ],
    metaDescription:
      'Compress JPG, PNG, SVG, and GIF images free in your browser. Shrink file sizes up to 80% with no upload, no signup, and no quality surprises.',
  },

  'resize-image': {
    longDescription: [
      'Resize Image changes the dimensions of your pictures by exact pixel values or by a percentage of the original size. Enter a target width or height and the tool keeps the aspect ratio locked so photos never look stretched — or unlock it when you need an exact canvas size for a thumbnail, banner, or avatar. Everything runs in your browser with the Canvas API, so resizing is instant and your files stay on your device.',
      'The tool is built for the everyday jobs where dimensions actually matter: profile pictures that must be exactly 400×400, marketplace listings capped at 2000 px, email signatures that need a 150 px logo, or forms that reject anything wider than 1024 px. Because you can drop several images at once and apply the same rule to all of them — for example “scale everything to 50%” — it also works as a quick batch resizer for photographers and sellers preparing galleries.',
    ],
    features: [
      'Resize by exact pixel dimensions or by percentage',
      'Aspect-ratio lock to prevent stretching and distortion',
      'Batch mode — apply one size rule to many images',
      'Live preview of the output dimensions before downloading',
      'Supports JPG, PNG, WEBP, and GIF input',
      'Client-side only: images are never uploaded anywhere',
    ],
    useCases: [
      'Create exact-size profile pictures and avatars for social platforms',
      'Scale product photos to a marketplace’s maximum dimensions',
      'Downscale 4K screenshots to fit into documentation and blog posts',
      'Prepare a batch of gallery photos at 50% size for faster web loading',
      'Make a small logo variant for an email signature',
    ],
    howTo: [
      'Upload one or more images by dragging them onto the page.',
      'Choose pixel mode for exact dimensions or percent mode for scaling.',
      'Enter the target width, height, or percentage; keep the aspect-ratio lock on unless you need an exact canvas.',
      'Click Resize and download the finished images.',
    ],
    faqs: [
      {
        question: 'Will resizing distort my image?',
        answer: 'Not if the aspect-ratio lock is on — the tool calculates the matching height for any width you enter. Unlock it only when you intentionally need a fixed canvas like 400×400.',
      },
      {
        question: 'Can I make an image larger with this tool?',
        answer: 'You can, but plain upscaling spreads existing pixels and looks soft. For enlargements that stay sharp, use the Upscale Image tool, which uses AI to add detail.',
      },
      {
        question: 'Do my images get uploaded?',
        answer: 'No. Resizing happens entirely in your browser, so files never leave your computer.',
      },
      {
        question: 'Does resizing change the file size too?',
        answer: 'Yes — fewer pixels means a smaller file. A photo resized to 50% typically drops to roughly a quarter of its original file size.',
      },
      {
        question: 'Can I resize several images to the same dimensions at once?',
        answer: 'Yes. Drop multiple files and the same pixel or percentage rule is applied to every image in the batch.',
      },
    ],
    keywords: [
      'resize image online',
      'image resizer free',
      'resize image to specific size',
      'resize photo in pixels',
      'batch image resize',
      'change image dimensions',
      'resize image without losing quality',
    ],
    metaDescription:
      'Resize images free by pixels or percentage, right in your browser. Lock aspect ratio, batch resize, and download instantly — no upload needed.',
  },

  'crop-image': {
    longDescription: [
      'Crop Image cuts your JPG, PNG, or GIF down to exactly the part that matters. Drag the corner handles to frame the area you want, or pick a preset aspect ratio — square 1:1 for profile photos, 16:9 for video thumbnails, 4:3 or 3:2 for prints — and the selection snaps to those proportions while you position it. The pixel dimensions of the crop are shown live so you always know the output size before you commit.',
      'The whole operation happens in your browser: the image is drawn to a canvas on your device, the selected region is extracted, and the result downloads straight from memory. Nothing is uploaded, which makes it fine to crop ID scans, screenshots with private data, or unreleased design work. It is the quickest way to tighten a composition, cut a person out of the edge of a group photo, or trim dead space from a screenshot before pasting it into a doc.',
    ],
    features: [
      'Freeform crop with draggable corner and edge handles',
      'Preset aspect ratios: 1:1, 4:3, 3:2, 16:9, and original',
      'Live readout of the crop’s pixel dimensions',
      'Works with JPG, PNG, and GIF images',
      'Client-side processing — nothing is uploaded',
      'Instant download of the cropped result',
    ],
    useCases: [
      'Crop a photo to a perfect square for a profile picture',
      'Frame a 16:9 thumbnail for a YouTube video from a full screenshot',
      'Trim toolbars and empty margins off a screenshot before sharing it',
      'Cut one product out of a multi-item photo for a listing',
      'Remove a photobomber from the edge of a group shot',
    ],
    howTo: [
      'Upload the image you want to crop.',
      'Drag the handles to frame your selection, or choose a preset aspect ratio first.',
      'Check the live pixel dimensions of the selected area.',
      'Click Crop, preview the result, and download it.',
    ],
    faqs: [
      {
        question: 'Is my image uploaded when I crop it?',
        answer: 'No. The crop is computed on a canvas in your browser and the file never leaves your device.',
      },
      {
        question: 'Can I crop to an exact aspect ratio?',
        answer: 'Yes — pick a preset like 1:1 or 16:9 and the selection stays locked to that ratio while you move and resize it.',
      },
      {
        question: 'Does cropping reduce image quality?',
        answer: 'No. Cropping only removes pixels outside the selection; the pixels you keep are copied unchanged.',
      },
      {
        question: 'What formats can I crop?',
        answer: 'JPG, PNG, and GIF files are supported. The cropped image downloads in a matching web-friendly format.',
      },
      {
        question: 'Can I undo a crop?',
        answer: 'Your original file on disk is never modified, so you can simply re-upload it and crop again if the first attempt was not right.',
      },
    ],
    keywords: [
      'crop image online',
      'free image cropper',
      'crop photo to square',
      'crop image 16:9',
      'crop png online',
      'crop picture for profile photo',
      'trim image edges',
    ],
    metaDescription:
      'Crop JPG, PNG, or GIF images free in your browser. Drag to frame, snap to preset ratios like 1:1 and 16:9, and download instantly — no upload.',
  },

  'convert-to-jpg': {
    longDescription: [
      'Convert to JPG turns PNG, GIF, SVG, WEBP, and HEIC images into standard JPG files that open everywhere — old software, government portals, print shops, and upload forms that only accept .jpg. The conversion is done in your browser: each file is decoded, drawn to a canvas, and re-encoded as JPG on your own device, so even sensitive documents and iPhone HEIC photos never touch a server.',
      'Because JPG has no transparency, the tool fills transparent regions with a background color of your choice (white by default), so logos and PNG cutouts convert cleanly instead of turning black. You can also set the JPG quality to trade file size against detail. It is the fastest fix when an iPhone photo in HEIC format is rejected by a website, when a designer sends you an SVG your CMS cannot use, or when a form insists on “JPG only”.',
    ],
    features: [
      'Convert PNG, GIF, SVG, WEBP, and HEIC to JPG',
      'Selectable background color for transparent areas',
      'Adjustable JPG quality setting',
      'Batch conversion of multiple files in one go',
      'Runs fully in your browser — no upload, no queue',
      'Free with no watermark or signup',
    ],
    useCases: [
      'Convert iPhone HEIC photos so any website or Windows PC can open them',
      'Turn a transparent PNG logo into a white-background JPG for a form upload',
      'Flatten an SVG illustration into a JPG for a CMS that rejects vectors',
      'Convert WEBP images saved from the web into JPGs for older software',
      'Prepare a mixed folder of formats as uniform JPGs for a photo book',
    ],
    howTo: [
      'Drop your PNG, GIF, SVG, WEBP, or HEIC files onto the upload area.',
      'Pick a background color for any transparent regions (white is the default).',
      'Set the JPG quality if you want smaller files or maximum detail.',
      'Click Convert and download your JPGs individually or all together.',
    ],
    faqs: [
      {
        question: 'Do my photos get uploaded during conversion?',
        answer: 'No. Files are decoded and re-encoded entirely in your browser, so HEIC photos and private documents never leave your device.',
      },
      {
        question: 'What happens to transparent backgrounds?',
        answer: 'JPG does not support transparency, so transparent pixels are filled with the background color you choose — white by default.',
      },
      {
        question: 'Can I convert HEIC photos from an iPhone?',
        answer: 'Yes. HEIC files are decoded in the browser and saved as standard JPGs that open on any device or website.',
      },
      {
        question: 'Will converting to JPG lose quality?',
        answer: 'JPG is a lossy format, but at high quality settings the difference is imperceptible for photos. Sharp-edged graphics like screenshots keep more crispness as PNG, so only convert those when JPG is required.',
      },
      {
        question: 'Can I convert an animated GIF?',
        answer: 'Yes, but JPG is a still-image format, so the first frame of the animation is converted.',
      },
    ],
    keywords: [
      'convert to jpg online',
      'png to jpg',
      'heic to jpg',
      'webp to jpg',
      'svg to jpg converter',
      'image to jpg free',
      'gif to jpg',
      'change image format to jpg',
    ],
    metaDescription:
      'Convert PNG, GIF, SVG, WEBP, and HEIC images to JPG free in your browser. Choose a background for transparency — no upload, no signup.',
  },

  'convert-from-jpg': {
    longDescription: [
      'Convert from JPG changes your JPG photos into PNG or GIF, the two formats you need when a workflow refuses JPGs or when you want lossless storage going forward. Pick the output format, drop in your files, and each one is re-encoded in your browser using the Canvas API — the images stay on your machine from start to finish, with no upload and no server processing.',
      'Converting to PNG is the common case: many design tools, print pipelines, and app stores expect PNG assets, and PNG re-saves without generational quality loss, so it is the safer format for images you plan to edit repeatedly. The GIF output is useful for legacy systems and platforms that only accept .gif files. Note that conversion cannot restore detail a JPG has already discarded — it changes the container, not the history.',
    ],
    features: [
      'Convert JPG to PNG or GIF',
      'Lossless PNG output — no further quality degradation on re-saves',
      'Batch conversion of multiple JPGs at once',
      'Preview each converted image before downloading',
      'Entirely client-side; your photos never leave your device',
      'No signup, no watermark, no limits',
    ],
    useCases: [
      'Deliver PNG assets to a design tool or app store that rejects JPG',
      'Switch working copies to PNG so repeated edits stop compounding JPG artifacts',
      'Produce a GIF version of an image for a legacy system that only accepts .gif',
      'Standardize a mixed batch of JPG photos as PNGs for an archive',
    ],
    howTo: [
      'Upload one or more JPG images.',
      'Choose PNG or GIF as the output format.',
      'Click Convert and watch each file process in your browser.',
      'Download the converted images individually or as a batch.',
    ],
    faqs: [
      {
        question: 'Will converting JPG to PNG improve the quality?',
        answer: 'No — detail the JPG already discarded cannot be recovered. What PNG gives you is lossless storage from this point on, so future edits and re-saves stop degrading the image.',
      },
      {
        question: 'Why is my PNG bigger than the original JPG?',
        answer: 'PNG is lossless, so it stores photographic detail without compression artifacts, which usually costs more bytes than JPG’s lossy encoding. That is normal and expected.',
      },
      {
        question: 'Are my images uploaded anywhere?',
        answer: 'No. The conversion runs in your browser and the files never leave your computer.',
      },
      {
        question: 'Does the PNG output support transparency?',
        answer: 'PNG supports transparency, but a JPG source has no transparent pixels to carry over. To remove a background and get a transparent PNG, use the Remove Background tool.',
      },
      {
        question: 'Can I convert many JPGs at once?',
        answer: 'Yes. Drop a whole batch and every file is converted to your chosen format in one pass.',
      },
    ],
    keywords: [
      'jpg to png',
      'convert jpg to png online free',
      'jpg to gif',
      'jpg converter',
      'change jpg format',
      'jpg to png transparent',
      'convert photo to png',
    ],
    metaDescription:
      'Convert JPG images to PNG or GIF free in your browser. Lossless PNG output, batch support, and no uploads — your photos stay on your device.',
  },

  'photo-editor': {
    longDescription: [
      'Photo Editor is a quick, in-browser editor for the finishing touches that don’t need Photoshop: add a text caption, apply a filter, drop on a sticker, or wrap the image in a frame. Adjustment sliders cover brightness, contrast, and saturation, and one-click effects like grayscale and sepia restyle a photo instantly. Every change renders live on a canvas so you see exactly what you will download.',
      'All editing happens on your device — the photo is loaded into the browser canvas, your edits are composited there, and the result is exported straight to a download. Nothing is uploaded, so personal photos stay private. It suits anyone who needs a fast annotated screenshot for a bug report, a captioned photo for social media, or a styled product shot without installing software or creating an account.',
    ],
    features: [
      'Add text with adjustable font size, color, and position',
      'Brightness, contrast, and saturation sliders',
      'One-click effects: grayscale, sepia, invert, and blur',
      'Sticker and emoji overlays you can drag into place',
      'Frames and borders with adjustable thickness and color',
      'Live canvas preview of every edit',
      'Client-side only — photos never leave your device',
    ],
    useCases: [
      'Annotate a screenshot with text before attaching it to a bug report',
      'Add a caption and sticker to a photo for a social media post',
      'Brighten and boost contrast on a dim product photo',
      'Apply a sepia or grayscale look for a themed design',
      'Put a clean border around an image for a blog or newsletter',
    ],
    howTo: [
      'Upload the photo you want to edit.',
      'Use the sliders to adjust brightness, contrast, and saturation, or apply an effect.',
      'Add text, stickers, or a frame and drag elements where you want them.',
      'Preview the live result on the canvas.',
      'Click Download to save the edited image.',
    ],
    faqs: [
      {
        question: 'Is this editor really free?',
        answer: 'Yes — every feature is free, with no watermark on the output and no account required.',
      },
      {
        question: 'Are my photos uploaded to a server?',
        answer: 'No. All editing is composited on a canvas in your browser, so your photos never leave your device.',
      },
      {
        question: 'Can I undo a change?',
        answer: 'Yes, edits can be stepped back before you export. Your original file on disk is never touched, so you can always start over by re-uploading it.',
      },
      {
        question: 'What image formats can I edit?',
        answer: 'JPG, PNG, and WEBP images are supported, and you can export the edited result as JPG or PNG.',
      },
      {
        question: 'Does editing reduce my photo’s quality?',
        answer: 'Adjustments are applied once at export. Choose PNG output for lossless quality or JPG for a smaller file.',
      },
    ],
    keywords: [
      'photo editor online free',
      'add text to photo',
      'edit image online',
      'photo filters online',
      'add stickers to photo',
      'add frame to photo',
      'brightness contrast editor',
      'annotate screenshot',
    ],
    metaDescription:
      'Edit photos free in your browser: add text, filters, frames, and stickers with live preview. No upload, no signup, no watermark.',
  },

  'upscale-image': {
    longDescription: [
      'Upscale Image enlarges photos with AI so they gain real detail instead of the soft blur you get from ordinary resizing. Choose 2x or 4x, upload your image, and the Exyconn server runs it through an AI upscaling model that reconstructs edges, textures, and fine features while it multiplies the pixel count. A small 500 px web image can come back as a crisp 2000 px file suitable for print or a hero banner.',
      'This is the one image tool (along with Remove Background) that processes on our servers, because AI models are too heavy to run well in a browser. Your image is uploaded over HTTPS, processed, returned to you, and deleted — nothing is kept or reused. Typical users are sellers rescuing low-resolution product shots, designers who only have a small copy of a logo or artwork, and anyone printing an old photo that is too small at native size.',
    ],
    features: [
      'AI upscaling at 2x or 4x the original resolution',
      'Reconstructs edges and textures instead of just stretching pixels',
      'Handles JPG, PNG, and WEBP input',
      'Side-by-side comparison of original and upscaled result',
      'Secure HTTPS upload; files are deleted after processing',
      'Free to use with no watermark',
    ],
    useCases: [
      'Enlarge a low-resolution product photo for a marketplace listing',
      'Upscale an old scanned family photo for printing',
      'Recover a usable logo from the only small copy you have left',
      'Turn a small web image into a sharp hero banner',
      'Prepare game or design assets at higher resolutions',
    ],
    howTo: [
      'Upload the image you want to enlarge.',
      'Choose the upscale factor — 2x or 4x.',
      'Click Upscale and wait a few seconds while the AI processes it on the server.',
      'Compare the result with the original, then download the upscaled image.',
    ],
    faqs: [
      {
        question: 'Where is my image processed?',
        answer: 'On the Exyconn server — AI upscaling models are too heavy for a browser. The file is uploaded over HTTPS, processed, returned to you, and then deleted from the server.',
      },
      {
        question: 'How is this different from just resizing larger?',
        answer: 'Plain resizing spreads the same pixels over a bigger area, which looks blurry. AI upscaling predicts and reconstructs detail — edges, textures, and patterns — so the enlarged image stays sharp.',
      },
      {
        question: 'How long does upscaling take?',
        answer: 'Usually a few seconds. Large images at 4x take longer because the output can be tens of megapixels.',
      },
      {
        question: 'Can it fix a badly blurry or pixelated photo?',
        answer: 'It substantially improves soft or small images, but it cannot invent information that was never captured — extreme blur or heavy compression limits what any upscaler can recover.',
      },
      {
        question: 'What is the maximum upload size?',
        answer: 'Standard photos up to typical camera resolutions work fine. If a file is rejected for size, compress or downscale it slightly first — the AI will restore the detail on the way back up.',
      },
    ],
    keywords: [
      'ai image upscaler',
      'upscale image online free',
      'increase image resolution',
      'enlarge image without losing quality',
      'image enhancer 4x',
      'make picture higher resolution',
      'upscale photo for print',
    ],
    metaDescription:
      'Upscale images 2x or 4x with AI, free. Enlarge photos and logos with real detail instead of blur — files deleted after processing.',
  },

  'remove-background': {
    longDescription: [
      'Remove Background erases the background from any photo automatically and returns a clean cutout on a transparent PNG. Upload a picture and an AI segmentation model on the Exyconn server detects the subject — a person, product, animal, or object — and separates it from everything behind it, keeping fine edges like hair and fabric intact. No manual tracing, no green screen, no design skills needed.',
      'This tool and Upscale Image are the two image tools that process server-side, because segmentation models need more compute than a browser can offer. Your photo is sent over HTTPS, processed, returned as a transparent PNG, and deleted from the server afterwards. E-commerce sellers use it to produce white-background product shots, marketers drop cutouts into banners and decks, and anyone can turn a snapshot into a sticker or a clean profile photo.',
    ],
    features: [
      'One-click AI background removal — no manual tracing',
      'Transparent PNG output ready for any design',
      'Preserves fine edges like hair, fur, and fabric',
      'Works on people, products, animals, and objects',
      'Secure HTTPS upload; photos are deleted after processing',
      'Free with no watermark on the result',
    ],
    useCases: [
      'Create white- or transparent-background product photos for online stores',
      'Cut yourself out of a snapshot for a clean profile picture',
      'Extract a subject to place into banners, ads, or presentations',
      'Make stickers and thumbnails from ordinary photos',
      'Prepare team headshots with a consistent background',
    ],
    howTo: [
      'Upload the photo whose background you want removed.',
      'Wait a few seconds while the AI segments the subject on the server.',
      'Preview the cutout over a checkered transparency background.',
      'Download the result as a transparent PNG.',
    ],
    faqs: [
      {
        question: 'Is my photo stored after processing?',
        answer: 'No. The image is uploaded over HTTPS to the Exyconn server, processed by the AI model, returned to you, and deleted. It is not kept, shared, or used for training.',
      },
      {
        question: 'What format is the output?',
        answer: 'A PNG with a transparent background, so you can place the cutout onto any color or design without a white box around it.',
      },
      {
        question: 'How well does it handle hair and fuzzy edges?',
        answer: 'The segmentation model is trained to preserve fine detail, so hair, fur, and fabric edges come out cleanly in most photos. Strong subject/background contrast gives the best results.',
      },
      {
        question: 'Can it process product photos as well as people?',
        answer: 'Yes — it detects the main subject whether that is a person, a product, a vehicle, or a pet.',
      },
      {
        question: 'Why does this tool need an upload when other image tools do not?',
        answer: 'AI segmentation requires a model too large to run in the browser, so this tool processes on our server. All the simpler image tools on Exyconn run fully client-side.',
      },
      {
        question: 'Is there a limit on how many images I can process?',
        answer: 'The tool is free for normal use. Process images one at a time and download each transparent PNG as it finishes.',
      },
    ],
    keywords: [
      'remove background from image',
      'background remover free',
      'transparent background maker',
      'remove bg online',
      'product photo background removal',
      'cut out image background',
      'png transparent background',
    ],
    metaDescription:
      'Remove image backgrounds instantly with AI, free. Get clean transparent PNG cutouts of people and products — photos deleted after processing.',
  },

  'watermark-image': {
    longDescription: [
      'Watermark Image stamps text or a logo over your photos so they stay credited when shared. Type a watermark like your name or site URL, or upload a logo image, then set its position with a nine-point grid, tune the opacity so it protects without overpowering, and scale it to fit. A tiled mode repeats the watermark across the whole image for stronger protection on valuable work.',
      'Watermarking runs entirely in your browser — each photo is composited on a canvas on your own device and downloaded directly, so unpublished work never leaves your machine. Batch support means you can stamp an entire shoot in one pass with identical settings. Photographers watermark client proofs, artists protect portfolio pieces before posting, and businesses keep their logo on every image that goes out.',
    ],
    features: [
      'Text watermarks with font size, color, and opacity controls',
      'Image watermarks — upload your own logo as an overlay',
      'Nine-point position grid plus tiled repeat mode',
      'Adjustable opacity and scale for subtle or strong marks',
      'Batch watermarking with identical settings across all photos',
      'Fully client-side — originals never leave your device',
    ],
    useCases: [
      'Stamp a studio name across client proof galleries',
      'Add a logo to product photos before publishing a catalog',
      'Protect artwork and portfolio images posted on social media',
      'Mark internal screenshots as “Confidential” before circulating them',
      'Brand event photos with a sponsor logo in the corner',
    ],
    howTo: [
      'Upload one or more photos to watermark.',
      'Choose a text watermark or upload a logo image.',
      'Pick a position on the grid — or enable tiling — and adjust opacity and size.',
      'Preview the result, then click Apply and download the watermarked images.',
    ],
    faqs: [
      {
        question: 'Are my photos uploaded when I watermark them?',
        answer: 'No. The watermark is composited on a canvas in your browser, so your original photos stay on your device throughout.',
      },
      {
        question: 'Can I use my own logo as the watermark?',
        answer: 'Yes. Upload a PNG of your logo — one with a transparent background works best — and place and scale it like any other watermark.',
      },
      {
        question: 'What opacity should I use?',
        answer: 'Around 30–50% is a good balance: clearly visible but not distracting. Use higher opacity plus tiling for proofs you actively want to prevent from being reused.',
      },
      {
        question: 'Can I watermark many photos at once?',
        answer: 'Yes. Drop a whole batch and the same watermark, position, and opacity settings are applied to every image.',
      },
      {
        question: 'Does the watermark reduce photo quality?',
        answer: 'No. The photo is re-exported at full resolution with the watermark layered on top; the underlying image detail is unchanged.',
      },
    ],
    keywords: [
      'watermark image online',
      'add watermark to photo free',
      'add logo to photo',
      'batch watermark photos',
      'text watermark maker',
      'protect photos with watermark',
      'copyright watermark tool',
    ],
    metaDescription:
      'Add text or logo watermarks to photos free in your browser. Position, opacity, tiling, and batch support — originals never leave your device.',
  },

  'meme-generator': {
    longDescription: [
      'Meme Generator puts classic top-and-bottom captions on any picture in the traditional meme style: bold white Impact-style lettering with a black outline that stays readable on any background. Upload your own image, type the top and bottom text, and tweak the font size until it fits. The preview updates live as you type, so what you see is exactly the PNG you download.',
      'Everything is rendered on a canvas in your browser — no upload, no account, no watermark added to your meme. That means inside jokes from a group chat or work Slack never leave your machine. Beyond captions you can adjust the text size and placement so long punchlines wrap cleanly. It works just as well for reaction images, motivational-poster parodies, and quick joke images for a team channel.',
    ],
    features: [
      'Classic top and bottom captions in bold outlined meme lettering',
      'Upload any image as the meme template',
      'Live preview that updates as you type',
      'Adjustable font size and text placement',
      'Downloads as a clean PNG with no added watermark',
      'Runs fully in your browser — images stay private',
    ],
    useCases: [
      'Caption a screenshot for a running joke in a team chat',
      'Turn a pet photo into a reaction meme for social media',
      'Make a quick joke slide for a presentation or newsletter',
      'Create event or community memes with your own photos',
    ],
    howTo: [
      'Upload the image you want to turn into a meme.',
      'Type the top text and bottom text — the preview updates as you type.',
      'Adjust the font size so long lines wrap cleanly.',
      'Click Download to save the finished meme as a PNG.',
    ],
    faqs: [
      {
        question: 'Can I use my own picture as the template?',
        answer: 'Yes — any JPG, PNG, or WEBP you upload becomes the meme background, so you are not limited to stock templates.',
      },
      {
        question: 'Does the tool add its own watermark to my meme?',
        answer: 'No. The downloaded PNG contains only your image and your captions.',
      },
      {
        question: 'Is my image uploaded anywhere?',
        answer: 'No. The meme is drawn on a canvas in your browser and downloaded straight from memory, so the image never leaves your device.',
      },
      {
        question: 'Why is meme text usually white with a black outline?',
        answer: 'The outline keeps the text readable over both light and dark parts of the photo — the tool applies that classic style automatically.',
      },
      {
        question: 'What format does the meme download in?',
        answer: 'PNG, which keeps the text edges crisp and is accepted by every social platform and chat app.',
      },
    ],
    keywords: [
      'meme generator free',
      'make a meme online',
      'meme maker no watermark',
      'add text to meme',
      'custom meme with own image',
      'top bottom text meme',
      'meme caption generator',
    ],
    metaDescription:
      'Make memes free with classic top and bottom captions on your own images. Live preview, no watermark, no upload — download as PNG instantly.',
  },

  'rotate-image': {
    longDescription: [
      'Rotate Image fixes photos that came out sideways or upside down — and does it in bulk. Drop in a whole batch, then rotate each image in 90-degree steps or apply one rotation to everything at once. Horizontal and vertical flips handle mirrored selfies and scans. Every thumbnail shows its current orientation so you can see at a glance which photos still need fixing.',
      'Rotation happens on a canvas in your browser, so nothing is uploaded and even hundreds of photos process in seconds on your own device. This matters for the classic bulk jobs: a camera import where every portrait shot is lying on its side, a stack of scanned documents fed in upside down, or phone photos whose orientation metadata gets ignored by some websites and email clients.',
    ],
    features: [
      'Rotate left or right in 90-degree steps',
      'Horizontal and vertical flip for mirrored images',
      'Bulk mode — rotate an entire batch in one click',
      'Per-image controls with live orientation thumbnails',
      'Supports JPG, PNG, WEBP, and GIF',
      'Client-side only; photos never leave your device',
    ],
    useCases: [
      'Fix a camera import where every portrait photo is sideways',
      'Straighten a stack of scanned documents fed in upside down',
      'Un-mirror a selfie taken with a front camera',
      'Correct phone photos that display sideways on a website that ignores EXIF orientation',
    ],
    howTo: [
      'Upload one or more images that need rotating.',
      'Click rotate left or rotate right on an image — each click turns it 90 degrees — or use flip for mirrored shots.',
      'Use the batch control to apply the same rotation to every image at once.',
      'Download the corrected images individually or all together.',
    ],
    faqs: [
      {
        question: 'Does rotating reduce image quality?',
        answer: 'A 90-degree rotation rearranges pixels without resampling, so no detail is lost. The image is simply re-exported in its new orientation.',
      },
      {
        question: 'Why do my photos show sideways in the first place?',
        answer: 'Cameras record orientation as EXIF metadata rather than rotating the pixels. Software that ignores EXIF shows the raw sideways image — this tool bakes the correct orientation into the pixels so it displays right everywhere.',
      },
      {
        question: 'Can I rotate many photos at the same time?',
        answer: 'Yes. Upload a batch and either rotate images individually or apply one rotation to all of them in a single click.',
      },
      {
        question: 'Are my photos uploaded to a server?',
        answer: 'No. Rotation runs on a canvas in your browser, so your photos stay on your device.',
      },
      {
        question: 'What is the difference between rotate and flip?',
        answer: 'Rotate turns the image in 90-degree steps; flip mirrors it left-right or top-bottom. Use flip for selfies or scans that appear as mirror images.',
      },
    ],
    keywords: [
      'rotate image online',
      'rotate photo free',
      'bulk rotate images',
      'flip image horizontally',
      'fix sideways photo',
      'rotate picture 90 degrees',
      'mirror image online',
    ],
    metaDescription:
      'Rotate and flip images free in your browser — fix sideways photos one at a time or in bulk with 90-degree steps. No upload, no signup.',
  },

  'html-to-image': {
    longDescription: [
      'HTML to Image renders HTML and CSS into a downloadable picture. Paste your markup — a styled div, an email button, a social card, a code snippet with syntax colors — and the tool renders it live in your browser, then captures the rendered result as a JPG, PNG, or SVG. What you download is exactly what the browser painted, fonts and gradients included.',
      'The rendering and capture both happen client-side using the browser’s own engine, so your markup is never sent to a server. That makes it ideal for developers generating preview images of components, marketers turning coded email blocks into shareable screenshots, and anyone who needs a pixel-perfect image of a piece of web design without cropping a full-screen screenshot by hand.',
    ],
    features: [
      'Paste HTML and CSS, see it rendered live',
      'Export as JPG, PNG, or SVG',
      'Captures exactly what the browser renders — gradients, fonts, shadows',
      'Adjustable output scale for sharp high-resolution captures',
      'Client-side rendering and capture; markup never leaves your browser',
      'Free with no signup',
    ],
    useCases: [
      'Generate a preview image of a coded UI component for documentation',
      'Turn a styled HTML email block into a screenshot for approval',
      'Create social sharing cards from an HTML template',
      'Capture a syntax-highlighted code snippet as a crisp image',
      'Produce banner images from HTML instead of a design tool',
    ],
    howTo: [
      'Paste your HTML (with inline or embedded CSS) into the editor.',
      'Check the live preview to confirm it renders the way you want.',
      'Choose the output format — JPG, PNG, or SVG — and the scale.',
      'Click Capture and download the image.',
    ],
    faqs: [
      {
        question: 'Is my HTML sent to a server to be rendered?',
        answer: 'No. Your browser renders the markup itself and the capture is taken client-side, so the code never leaves your machine.',
      },
      {
        question: 'Which output format should I choose?',
        answer: 'PNG for sharp UI captures and transparency, JPG for photographic content and smaller files, SVG when you want a scalable vector wrapper around the rendered output.',
      },
      {
        question: 'Can I capture an external website by its URL?',
        answer: 'The tool captures HTML you paste into the editor. To capture a live page, copy the relevant markup and styles in, or take the section of HTML you control.',
      },
      {
        question: 'Why do external images or fonts sometimes not appear?',
        answer: 'Resources loaded from other domains can be blocked by CORS during capture. Inline your images as data URIs and embed fonts locally for reliable results.',
      },
      {
        question: 'How do I get a higher-resolution capture?',
        answer: 'Increase the scale setting — 2x or 3x renders the same layout at double or triple the pixel density, ideal for retina displays and print.',
      },
    ],
    keywords: [
      'html to image converter',
      'html to png',
      'html to jpg online',
      'render html as image',
      'html css to image free',
      'convert code to image',
      'html snippet screenshot',
    ],
    metaDescription:
      'Convert HTML and CSS to JPG, PNG, or SVG images free. Live in-browser rendering with pixel-perfect capture — your code never leaves your device.',
  },

  'blur-face': {
    longDescription: [
      'Blur Face hides faces, license plates, screens, and other sensitive details in a photo before you share it. Drag a box over each area you want obscured and choose blur or pixelation, with a strength slider that goes from soft anonymization to complete obliteration. You can add as many regions as the photo needs and adjust each one independently before exporting.',
      'The entire process runs in your browser: the photo is loaded onto a canvas on your device, the selected regions are blurred there, and the censored copy downloads directly. The unblurred original is never uploaded anywhere — which is the whole point of a privacy tool. Use it to anonymize bystanders in street photos, hide a child’s face before posting publicly, or redact names and addresses in a screenshot.',
    ],
    features: [
      'Drag to select any number of regions to obscure',
      'Choose Gaussian blur or pixelation per region',
      'Adjustable strength from soft blur to full obliteration',
      'Move, resize, or remove regions before exporting',
      'Works on faces, plates, screens, documents — anything in the frame',
      'Fully client-side; the unblurred original never leaves your device',
    ],
    useCases: [
      'Anonymize bystanders’ faces in a street or event photo',
      'Hide children’s faces before posting family photos publicly',
      'Blur license plates in car photos for a listing or forum',
      'Redact names, addresses, and account numbers in screenshots',
      'Prepare incident photos for reports without exposing identities',
    ],
    howTo: [
      'Upload the photo containing faces or details you want to hide.',
      'Drag a box over each face or region — add as many as you need.',
      'Choose blur or pixelation and set the strength for each region.',
      'Preview the result, then click Apply and download the censored image.',
    ],
    faqs: [
      {
        question: 'Is the original photo uploaded anywhere?',
        answer: 'No. Blurring happens on a canvas in your browser, so the unblurred original never leaves your device — nothing is transmitted or stored.',
      },
      {
        question: 'Can the blur be reversed by someone else?',
        answer: 'The exported image contains only the blurred pixels; the original data is not embedded. For maximum safety on highly sensitive content, use pixelation or blur at high strength, which destroys the underlying detail.',
      },
      {
        question: 'Should I use blur or pixelation?',
        answer: 'Both anonymize effectively. Pixelation reads clearly as deliberate censoring, while blur looks more natural in the photo — pick whichever suits the context.',
      },
      {
        question: 'Can I blur several faces in one photo?',
        answer: 'Yes. Add a separate region for each face or detail; every region has its own effect and strength.',
      },
      {
        question: 'Does blurring affect the rest of the photo?',
        answer: 'No. Only the regions you select are altered — everything outside them is exported at original quality.',
      },
    ],
    keywords: [
      'blur face in photo',
      'blur faces online free',
      'pixelate face in picture',
      'hide face in photo',
      'blur license plate',
      'censor photo online',
      'redact image online',
      'anonymize photo',
    ],
    metaDescription:
      'Blur or pixelate faces, plates, and sensitive details in photos free. Runs entirely in your browser — the original image never leaves your device.',
  },
};
