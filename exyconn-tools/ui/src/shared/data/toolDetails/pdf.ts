import type { ToolDetailsMap } from './types';

/** Detail content for the "pdf" tool category. Keyed by tool id from toolsData. */
export const pdfToolDetails: ToolDetailsMap = {
  'merge-pdf': {
    longDescription: [
      'Merge PDF combines any number of PDF files into a single document, entirely inside your browser. Drag your files onto the upload area, arrange them with the up/down arrows so the chapters land in the right order, and click Merge. The tool copies every page from every file into one new PDF using the pdf-lib library, so nothing is uploaded to a server and your documents never leave your computer.',
      'Because the merge runs locally, it works offline once the page has loaded and there is no file-size cap imposed by an upload pipeline — large contracts, scanned books, and multi-hundred-page reports merge in seconds. The original files are untouched; you always download a brand-new merged.pdf while your sources stay exactly as they were.',
      'It is built for anyone who regularly assembles documents: accountants stitching invoices into a monthly bundle, students combining lecture notes, HR teams packaging offer letters with policy annexures, and lawyers compiling exhibits into one filing-ready PDF. If the combined file then needs its pages rearranged or trimmed, the companion Organize PDF and Split PDF tools pick up exactly where the merge leaves off.',
    ],
    features: [
      'Combine unlimited PDF files into one document',
      'Drag-and-drop upload plus a file browser fallback',
      'Reorder files with up/down arrows before merging',
      'Remove any file from the queue without starting over',
      'Live preview of the first PDF before you merge',
      '100% client-side processing with pdf-lib — no upload',
      'Shows each file name and size in the merge queue',
    ],
    useCases: [
      'Combine monthly invoices into a single PDF for your accountant',
      'Assemble a job application from CV, cover letter, and certificates',
      'Compile scanned chapters of a book into one readable file',
      'Package contract, annexures, and signature pages into one filing',
      'Merge multiple bank statements before a loan application',
    ],
    howTo: [
      'Drag and drop two or more PDF files onto the upload area, or click Browse Files.',
      'Reorder the files with the up and down arrows until the sequence is right.',
      'Remove any file you added by mistake using the delete icon.',
      'Click "Merge PDFs" and wait a moment while the pages are combined.',
      'Click "Download Merged PDF" to save the combined file as merged.pdf.',
    ],
    faqs: [
      {
        question: 'Are my PDF files uploaded to a server?',
        answer: 'No. The merge runs entirely in your browser using the pdf-lib library. Your files never leave your device, which makes the tool safe for contracts, financial records, and other confidential documents.',
      },
      {
        question: 'Is there a limit on the number or size of files?',
        answer: 'There is no fixed limit. Because processing happens locally, the practical ceiling is your device’s memory — merging dozens of files or several hundred pages works fine on a typical laptop.',
      },
      {
        question: 'Can I change the order of the PDFs before merging?',
        answer: 'Yes. Every file in the queue has up and down arrows, so you can arrange the documents in any order before clicking Merge.',
      },
      {
        question: 'Will merging reduce the quality of my PDFs?',
        answer: 'No. Pages are copied byte-for-byte into the new document, so text, images, and vector graphics keep their original quality.',
      },
      {
        question: 'Do merged files keep their bookmarks and form fields?',
        answer: 'Page content is preserved exactly, but document-level extras such as bookmarks and interactive form fields from the source files are not carried into the merged PDF.',
      },
    ],
    keywords: [
      'merge pdf',
      'combine pdf files',
      'pdf merger online',
      'join pdf files free',
      'merge pdf without upload',
      'combine pdf into one document',
      'pdf combiner no watermark',
      'merge pdf offline browser',
    ],
    metaDescription:
      'Merge multiple PDF files into one document for free, right in your browser. Reorder pages, no upload, no watermark, no sign-up required.',
  },

  'split-pdf': {
    longDescription: [
      'Split PDF breaks one PDF into separate files, either one PDF per page or by the exact page ranges you type in, such as "1-3, 5, 7-10". Each range becomes its own downloadable PDF, clearly named like pages-1-3.pdf or page-5.pdf so you can tell the parts apart at a glance. The tool reads the page count as soon as you drop a file, so you know the valid range before you split.',
      'All processing happens in your browser with the pdf-lib library — the document is never uploaded anywhere. That makes it safe to split bank statements, medical records, and signed agreements without worrying about where a copy might end up. Invalid ranges are caught with a clear error message instead of a silently wrong result.',
      'Use it whenever a single file is doing the job of many: extracting one chapter to share, separating a scanned batch into individual documents, or pulling just the signature page out of a long contract. Because each range becomes an independent file, you can split once and distribute different sections to different people — pages 1-4 to finance, 5-9 to legal — without anyone receiving more than they need.',
    ],
    features: [
      'Split into one PDF per page with a single click',
      'Custom ranges like "1-3, 5, 7-10" produce one file per group',
      'Automatic page count detection on upload',
      'Descriptive output names such as pages-1-3.pdf',
      'Individual download button for every generated file',
      'Client-side processing — the PDF never leaves your device',
      'Validates ranges and reports exactly which entry is wrong',
    ],
    useCases: [
      'Extract a single chapter from a long report to email separately',
      'Separate a bulk-scanned stack into individual documents',
      'Pull only the signature page out of a signed contract',
      'Break a large e-book into smaller files for easier reading',
      'Split combined statements into one file per month for filing',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Check the detected page count shown under the file name.',
      'Choose "All pages" for one PDF per page, or "Custom range" and type ranges like 1-3, 5, 7-10.',
      'Click "Split PDF" and wait for the file list to appear.',
      'Download each generated PDF with its download icon.',
    ],
    faqs: [
      {
        question: 'Is my PDF uploaded when I split it?',
        answer: 'No. Splitting runs completely in your browser via pdf-lib, so the document never touches a server. You can even split files while offline once the page is loaded.',
      },
      {
        question: 'How do I write a custom page range?',
        answer: 'Use commas to separate groups and hyphens for ranges, for example "1-3, 5, 7-10". Each group becomes its own PDF — that example produces three files.',
      },
      {
        question: 'Can I split every page into its own file?',
        answer: 'Yes. Leave the default "All pages" option selected and every page of the document becomes a separate single-page PDF.',
      },
      {
        question: 'What happens if I enter an invalid range?',
        answer: 'The tool validates every entry against the real page count and shows an error naming the exact invalid range, such as "Invalid range: 12-9", so nothing incorrect is generated.',
      },
      {
        question: 'Does splitting change the quality of the pages?',
        answer: 'No. Pages are copied unchanged into the new files, so text sharpness, images, and formatting are identical to the original.',
      },
    ],
    keywords: [
      'split pdf',
      'split pdf by page range',
      'extract pages from pdf',
      'pdf splitter online free',
      'separate pdf pages',
      'split pdf without upload',
      'pdf page extractor',
      'break pdf into multiple files',
    ],
    metaDescription:
      'Split a PDF into separate files for free — one per page or by custom ranges like 1-3, 5. Runs in your browser with no upload needed.',
  },

  'rotate-pdf': {
    longDescription: [
      'Rotate PDF fixes pages that were scanned sideways or upside down. Pick an angle of 90°, 180°, or 270°, apply it to every page or only to specific pages like "1-3, 5", and download the corrected file. Rotation is added to each page’s existing orientation, so a landscape scan inside a portrait document can be fixed without touching the pages that are already correct.',
      'The whole operation runs in your browser with pdf-lib — no upload, no queue, no server. The tool reads the page count when you drop the file so you can target pages precisely, and the built-in preview lets you confirm the current orientation before you rotate. The output downloads as rotated-<original-name>.pdf, leaving your source file untouched.',
      'It is a quick fix for anyone dealing with scanners and phone captures: office admins straightening scanned invoices, students fixing photographed homework, and legal teams normalizing exhibits before filing. Since the fix takes seconds and needs no software install, it is worth running on any document before you share it — a sideways page in an otherwise tidy file is the kind of detail recipients remember.',
    ],
    features: [
      'Rotate by exactly 90°, 180°, or 270°',
      'Apply to all pages or a specific list like "1-3, 5"',
      'Rotation stacks on each page’s current orientation',
      'Automatic page count detection with range validation',
      'Preview the document before rotating',
      'Fully client-side — the PDF never leaves your browser',
    ],
    useCases: [
      'Straighten a contract that was scanned upside down',
      'Fix a single landscape page inside a portrait report',
      'Correct phone-photographed documents saved as PDF',
      'Normalize a batch-scanned file where alternate pages are flipped',
    ],
    howTo: [
      'Drag and drop your PDF onto the upload area or click Browse Files.',
      'Choose the rotation angle: 90°, 180°, or 270°.',
      'Select "All pages" or "Specific pages" and enter page numbers like 1-3, 5.',
      'Click "Rotate PDF" to apply the rotation.',
      'Click "Download Rotated PDF" to save the corrected file.',
    ],
    faqs: [
      {
        question: 'Is the rotation lossless?',
        answer: 'Yes. Rotating only changes each page’s orientation flag — text, images, and layout are untouched, so there is zero quality loss.',
      },
      {
        question: 'Can I rotate only some pages?',
        answer: 'Yes. Choose "Specific pages" and enter numbers or ranges such as "1-3, 5". Only those pages are rotated; the rest keep their orientation.',
      },
      {
        question: 'Is my document uploaded anywhere?',
        answer: 'No. Rotation happens in your browser with the pdf-lib library, so the file stays on your device the entire time.',
      },
      {
        question: 'What if a page is already rotated in the original file?',
        answer: 'The chosen angle is added to the page’s existing rotation. A page already at 90° rotated by another 90° ends up at 180°, which is what you want for fixing mixed-orientation scans.',
      },
      {
        question: 'Which direction does the rotation go?',
        answer: 'Angles are applied clockwise. To turn a page 90° counter-clockwise, choose 270° clockwise — the result is identical.',
      },
    ],
    keywords: [
      'rotate pdf',
      'rotate pdf pages online',
      'fix upside down pdf',
      'rotate pdf 90 degrees free',
      'rotate specific pdf pages',
      'pdf rotation tool no upload',
      'turn pdf landscape to portrait',
    ],
    metaDescription:
      'Rotate PDF pages 90, 180 or 270 degrees for free — all pages or just the ones you pick. Lossless, in-browser, no upload required.',
  },

  'crop-pdf': {
    longDescription: [
      'Crop PDF trims unwanted margins off your pages by letting you enter top, bottom, left, and right values in points (1 point = 1/72 inch). You can apply the same crop to every page or target one specific page, which is handy when a single scan in the middle of a document has a black border the rest do not. The crop is set via the PDF’s crop box, the standard way viewers decide the visible page area.',
      'Everything runs client-side with pdf-lib: the file loads in your browser, the page count appears instantly, the built-in preview shows what you are working with, and the cropped result downloads as cropped-<name>.pdf without any server round-trip. Because the crop box is metadata rather than destructive pixel editing, the underlying page content is preserved and the operation is instant even on large files.',
      'Typical users include researchers tightening scanned papers for tablet reading, designers removing printer marks from proofs, and anyone whose scanner adds a dark edge around each page. Because the values are numeric, the same crop can be reproduced exactly across a whole batch of similar scans — note the four numbers once and apply them to every file that came off the same scanner.',
    ],
    features: [
      'Numeric top/bottom/left/right margins in PDF points',
      'Apply the crop to all pages or one specific page',
      'Non-destructive crop-box editing — content is preserved',
      'Instant page count and file size readout on upload',
      'Live preview of the loaded document',
      'Client-side processing, nothing is uploaded',
    ],
    useCases: [
      'Remove black scanner borders from a digitized document',
      'Trim wide margins so a paper reads better on an e-reader',
      'Cut crop marks and bleed off a print-ready proof',
      'Tighten one oversized page in an otherwise uniform file',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Enter the top, bottom, left, and right margins to remove, in points.',
      'Choose "All Pages" or "Specific Page" and set the page number.',
      'Click "Crop PDF" to apply the new visible area.',
      'Click "Download Cropped PDF" to save the result.',
    ],
    faqs: [
      {
        question: 'What unit are the crop margins in?',
        answer: 'PDF points, where 72 points equal one inch and roughly 28.35 points equal one centimeter. A typical A4 page is 595 × 842 points.',
      },
      {
        question: 'Is cropping destructive?',
        answer: 'No. The tool sets the page’s crop box, which controls what viewers display. The full original content stays in the file, and the crop can be undone later by resetting the crop box with another tool.',
      },
      {
        question: 'Can I crop just one page?',
        answer: 'Yes. Set "Apply to" to "Specific Page" and enter the page number — every other page keeps its original dimensions.',
      },
      {
        question: 'Does my PDF get uploaded for cropping?',
        answer: 'No. The crop is computed in your browser with pdf-lib; the document never leaves your machine.',
      },
      {
        question: 'Why does my PDF viewer still show the old size?',
        answer: 'A few viewers display the media box instead of the crop box. Mainstream viewers such as Adobe Acrobat, Chrome, and Firefox honor the crop box and will show the trimmed page.',
      },
    ],
    keywords: [
      'crop pdf',
      'crop pdf margins online',
      'trim pdf white space',
      'remove pdf borders free',
      'crop pdf pages',
      'pdf margin remover',
      'crop single pdf page',
    ],
    metaDescription:
      'Crop PDF margins for free by exact point values — all pages or a single page. Non-destructive, in-browser cropping with no upload.',
  },

  'organize-pdf': {
    longDescription: [
      'Organize PDF gives you a page-level view of your document so you can reorder and delete pages before saving a clean copy. Every page is listed with its position, original page number, and dimensions in points; move pages with the arrow buttons or remove them entirely, then click Reorganize to build a new PDF in exactly the order shown.',
      'The tool runs fully in your browser on pdf-lib. Your file is parsed locally, the page list is generated from the real document structure, and the reorganized copy is assembled on your device — nothing is uploaded. Deleting a page from the list only affects the output file; your original PDF stays intact, and the result downloads as organized-<name>.pdf.',
      'It is the fastest way to fix documents that were scanned in the wrong order, drop blank pages from a batch scan, or restructure a report so the executive summary comes first. The dimension readout doubles as a quick diagnostic: a page listed at odd dimensions among uniform A4 pages is usually the stray slip or receipt that got scanned into the middle of the stack, and you can delete it on the spot.',
    ],
    features: [
      'Visual list of every page with original position and size',
      'Move pages up or down with one click',
      'Delete unwanted pages from the output',
      'Shows each page’s dimensions in points',
      'Preview the loaded document before reorganizing',
      'Client-side rebuild with pdf-lib — no upload, no server',
    ],
    useCases: [
      'Fix a document scanned back-to-front into the correct order',
      'Delete blank pages left behind by a duplex scanner',
      'Move the summary section to the front of a report',
      'Strip advertising or cover pages from a downloaded PDF',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Review the page list — each row shows the current and original page number.',
      'Use the arrow buttons to move pages and the delete icon to remove them.',
      'Click "Reorganize PDF" to build the new document.',
      'Click "Download Organized PDF" to save it.',
    ],
    faqs: [
      {
        question: 'Does deleting a page here change my original file?',
        answer: 'No. Changes only apply to the new PDF the tool generates. Your original file on disk is never modified.',
      },
      {
        question: 'Is the reordering done on a server?',
        answer: 'No. The document is parsed and rebuilt entirely in your browser using pdf-lib, so the file never leaves your device.',
      },
      {
        question: 'Can I duplicate a page?',
        answer: 'Not currently — the tool supports reordering and deleting. To duplicate pages, merge the file with itself first using the Merge PDF tool, then organize the result.',
      },
      {
        question: 'How do I know which page is which after moving things around?',
        answer: 'Each row shows both its new position and its original page number, for example "Page 2 (original: 7)", plus the page dimensions, so you can always trace where a page came from.',
      },
      {
        question: 'Is there a page limit?',
        answer: 'No fixed limit. Documents with hundreds of pages work; very large files are only constrained by your device’s memory.',
      },
    ],
    keywords: [
      'organize pdf pages',
      'reorder pdf pages online',
      'rearrange pdf free',
      'delete pdf pages',
      'move pdf pages',
      'change pdf page order',
      'remove pages from pdf without upload',
    ],
    metaDescription:
      'Reorder and delete PDF pages for free. See every page, move it or remove it, and download a clean copy — all in your browser, no upload.',
  },

  'compress-pdf': {
    longDescription: [
      'Compress PDF reduces file size by rewriting the document with pdf-lib: the file is parsed, its internal structure is rebuilt, and unused objects, duplicate resources, and dead space left behind by previous editors are dropped. The result is a losslessly optimized PDF — text stays razor sharp and images are not recompressed or downsampled, so nothing you see on the page changes.',
      'The tool shows the original size, the compressed size, and the exact percentage saved, so you know immediately whether the optimization helped. Savings are biggest on files that have been edited many times or produced by inefficient generators; a PDF that is dominated by large photographs will shrink less, because image data is preserved as-is.',
      'Compression runs entirely in your browser — the PDF is never uploaded. That makes it a safe first step before emailing contracts, submitting forms to portals with size limits, or archiving reports, with zero risk of a copy sitting on someone else’s server. If the optimized file is still too large for a strict limit, splitting it into parts with the Split PDF tool is the natural next step.',
    ],
    features: [
      'Lossless structural optimization — no visual quality loss',
      'Removes unused objects and dead space from the file',
      'Before/after size comparison with percentage saved',
      'Preview of the document prior to compression',
      'One-click download of the compressed copy',
      '100% client-side processing, no upload',
    ],
    useCases: [
      'Shrink a contract below an email attachment limit',
      'Meet a government portal’s maximum upload size',
      'Slim down PDFs that grew after repeated editing',
      'Reduce storage used by archived reports',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Click "Compress PDF" to rebuild and optimize the file.',
      'Compare the original and compressed sizes shown on screen.',
      'Click "Download" to save the compressed PDF.',
    ],
    faqs: [
      {
        question: 'Will compression make my PDF look worse?',
        answer: 'No. The optimization is lossless — it restructures the file and removes unused data without recompressing images or altering text, so the pages render identically.',
      },
      {
        question: 'How much smaller will my file get?',
        answer: 'It depends on the file. PDFs bloated by repeated edits or inefficient generators can shrink noticeably, while image-heavy scans may only lose a little, since picture data is preserved unchanged.',
      },
      {
        question: 'Is my document uploaded during compression?',
        answer: 'No. The entire process runs in your browser with pdf-lib. Your file never leaves your device, so it is safe for confidential material.',
      },
      {
        question: 'Why did my file barely shrink?',
        answer: 'Your PDF was probably already well optimized, or its size is dominated by embedded images. Lossless optimization cannot reduce image data; that would require lossy recompression, which this tool deliberately avoids.',
      },
      {
        question: 'Does compression remove passwords or signatures?',
        answer: 'The tool is meant for regular, unencrypted PDFs. Digital signature appearances are kept, but cryptographic signatures may show as invalid after any modification — compress before signing, not after.',
      },
    ],
    keywords: [
      'compress pdf',
      'reduce pdf file size free',
      'pdf compressor online',
      'shrink pdf without losing quality',
      'compress pdf for email',
      'optimize pdf size',
      'lossless pdf compression',
    ],
    metaDescription:
      'Compress PDF files free with lossless optimization. See before/after sizes instantly — processing stays in your browser, no upload.',
  },

  'compare-pdf': {
    longDescription: [
      'Compare PDF puts two documents side by side and builds a property-by-property comparison table: page count, file size, title, author, creator, producer, and the exact dimensions of every page in both files. Rows where the two documents differ are flagged, so version discrepancies jump out instead of hiding in metadata panels you would have to open one file at a time to see.',
      'This is a structural and metadata comparison rather than a word-level text diff, which makes it ideal for quick integrity checks: confirming that a "final" copy has the same page count as the approved version, spotting that one file was regenerated by different software, or noticing that a page was quietly resized or added. Both files load in parallel and the report appears in seconds.',
      'Analysis happens entirely in your browser using pdf-lib — neither document is uploaded, so you can safely compare draft contracts, tender submissions, or client deliverables without either version leaving your machine. The comparison is symmetric and repeatable: swap in a third version against your baseline in seconds, which makes it practical to audit a whole folder of "final_v2_FINAL" files one pair at a time.',
    ],
    features: [
      'Side-by-side upload areas for the two documents',
      'Compares page count, file size, and core metadata',
      'Per-page dimension comparison for every page',
      'Differences are clearly flagged in the results table',
      'Handles documents with unequal page counts',
      'Fully client-side — neither PDF is uploaded',
    ],
    useCases: [
      'Verify a signed contract has the same page count as the draft',
      'Detect which of two similarly named files is the newer export',
      'Check whether a resubmitted document was regenerated or altered',
      'Confirm two print files use identical page sizes before production',
    ],
    howTo: [
      'Drop the first document into the "Upload PDF 1" area.',
      'Drop the second document into the "Upload PDF 2" area.',
      'Click "Compare PDFs" to analyze both files.',
      'Review the table — rows where the files differ are highlighted.',
    ],
    faqs: [
      {
        question: 'Does this compare the actual text of the PDFs?',
        answer: 'No — it compares structure and metadata: page counts, file sizes, titles, authors, creator/producer software, and per-page dimensions. That is usually enough to spot a changed or regenerated document quickly.',
      },
      {
        question: 'Are my documents uploaded for comparison?',
        answer: 'No. Both PDFs are parsed locally in your browser with pdf-lib, so confidential drafts and finals never leave your device.',
      },
      {
        question: 'What if the two PDFs have different page counts?',
        answer: 'The table still renders completely. Pages that exist in only one document show "N/A" on the other side, making added or removed pages easy to spot.',
      },
      {
        question: 'Why do two visually identical PDFs show different producers?',
        answer: 'The producer field records the software that generated the file. Two identical-looking documents exported by different apps (say, Word versus a print driver) will differ there — a useful clue about a file’s origin.',
      },
      {
        question: 'Can I compare a PDF against a Word document?',
        answer: 'No, both inputs must be PDFs. Convert the Word file to PDF first, then compare the two PDFs.',
      },
    ],
    keywords: [
      'compare pdf',
      'compare two pdf files online',
      'pdf difference checker free',
      'pdf version comparison',
      'check if two pdfs are the same',
      'compare pdf metadata',
      'pdf compare tool no upload',
    ],
    metaDescription:
      'Compare two PDFs free: page counts, sizes, metadata, and per-page dimensions side by side with differences flagged. No upload needed.',
  },

  'jpg-to-pdf': {
    longDescription: [
      'JPG to PDF turns your images into a single PDF document. Add any number of JPG or PNG files, arrange them with the arrow buttons, pick a page size — A4, US Letter, or "Fit to Image" — and convert. On A4 and Letter each photo is scaled to fit the page while keeping its aspect ratio; with Fit to Image every page takes the exact dimensions of its picture, ideal for screenshots and scans.',
      'Conversion happens completely in your browser: images are embedded into the PDF by pdf-lib without ever being uploaded. That keeps personal photos, ID scans, and receipts private, and it means even large batches convert quickly because there is no upload or download queue — just your device doing the work.',
      'It is the standard fix for "please send as a single PDF" requests: photographed receipts for expense reports, scanned ID documents for KYC, homework photos for submission portals, and multi-image portfolios that need to travel as one tidy file. One document also travels better than twelve attachments — it keeps its page order in every mail client, previews cleanly on phones, and cannot arrive with three photos missing.',
    ],
    features: [
      'Combine multiple JPG and PNG images into one PDF',
      'A4, US Letter, or exact Fit-to-Image page sizes',
      'Images scaled proportionally — no stretching or distortion',
      'Reorder images before converting; remove any with one click',
      'Thumbnail list of every image in the queue',
      'Fully client-side conversion — photos are never uploaded',
    ],
    useCases: [
      'Turn photographed receipts into one PDF for an expense claim',
      'Combine ID card scans into a single KYC document',
      'Submit photographed homework as one PDF file',
      'Package product photos into a shareable PDF sheet',
      'Convert screenshots of a chat thread into one document',
    ],
    howTo: [
      'Drag and drop your JPG or PNG images onto the upload area.',
      'Choose a page size: A4, Letter, or Fit to Image.',
      'Arrange the images with the arrow buttons — each becomes one page.',
      'Click "Convert to PDF" to build the document.',
      'Click "Download PDF" to save images.pdf.',
    ],
    faqs: [
      {
        question: 'Are my photos uploaded to a server?',
        answer: 'No. Images are embedded into the PDF locally in your browser using pdf-lib. Personal photos and document scans never leave your device.',
      },
      {
        question: 'Which image formats are supported?',
        answer: 'JPG and PNG. For other formats such as HEIC or WebP, convert them to JPG or PNG first — most phones and image editors can do this on export.',
      },
      {
        question: 'Will my images be stretched to fill the page?',
        answer: 'No. On A4 and Letter pages images are scaled down proportionally and centered, so the aspect ratio is always preserved. Choose Fit to Image if you want zero margins.',
      },
      {
        question: 'Can I control the order of the pages?',
        answer: 'Yes. Use the up and down arrows next to each image before converting — the list order is the page order.',
      },
      {
        question: 'Does converting reduce image quality?',
        answer: 'No re-encoding is applied — the original image data is embedded directly into the PDF, so quality is identical to your source files.',
      },
    ],
    keywords: [
      'jpg to pdf',
      'convert images to pdf free',
      'jpg to pdf converter online',
      'combine photos into one pdf',
      'png to pdf',
      'image to pdf no upload',
      'multiple jpg to single pdf',
    ],
    metaDescription:
      'Convert JPG and PNG images to a single PDF for free. Choose A4, Letter, or fit-to-image pages — private, in-browser, no upload.',
  },

  'pdf-to-jpg': {
    longDescription: [
      'PDF to JPG renders every page of your document as a high-quality JPG image. You control the output with two settings: a scale of 1x, 2x, or 3x resolution, and a JPEG quality slider from 50% to 100%. Pages are rendered with Mozilla’s PDF.js — the same engine Firefox uses to display PDFs — so fonts, vector graphics, and layouts come out exactly as they appear on screen. At 2x, a standard A4 page comes out around 1200 pixels wide — sharp enough for web pages, documents, and slides.',
      'Conversion runs page by page in your browser with a live progress bar, and nothing is uploaded. When it finishes you get a thumbnail grid of every page with individual download buttons plus a "Download All" button that saves the whole set, named page-1.jpg, page-2.jpg, and so on. Because the images are produced locally, a 30-page document takes only as long as your machine needs to draw 30 pages.',
      'Reach for it when you need PDF content somewhere images are required: slides for social media posts, a report page to drop into a presentation, a menu for a website, or previews of a document for an online store listing. JPG output is universally accepted, uploads anywhere a photo does, and — unlike the PDF it came from — can be cropped, annotated, and filtered by any image editor on your phone.',
    ],
    features: [
      'Converts every PDF page to a separate JPG',
      'Resolution scale of 1x, 2x, or 3x',
      'JPEG quality slider from 50% to 100%',
      'Rendering by PDF.js for accurate fonts and layout',
      'Per-page downloads plus a Download All button',
      'Live progress indicator during conversion',
      'Fully client-side — the PDF is never uploaded',
    ],
    useCases: [
      'Post individual slides from a PDF deck to social media',
      'Insert a PDF page into a PowerPoint or Word document as an image',
      'Publish a restaurant menu PDF as web-friendly images',
      'Create page previews for an e-book or template listing',
    ],
    howTo: [
      'Drop your PDF onto the upload area or click to browse.',
      'Pick a scale (1x–3x) and set the JPG quality with the slider.',
      'Click "Convert to JPG" and watch the per-page progress.',
      'Download single pages from the grid, or click "Download All".',
    ],
    faqs: [
      {
        question: 'What resolution should I choose?',
        answer: 'Use 1x for quick previews, 2x for crisp screen or web use, and 3x when you need print-quality images or plan to zoom in. Higher scales produce larger files and take a bit longer.',
      },
      {
        question: 'Is my PDF uploaded during conversion?',
        answer: 'No. Pages are rendered in your browser by PDF.js and encoded to JPG locally. The document never leaves your device.',
      },
      {
        question: 'Can I convert only certain pages?',
        answer: 'The tool converts every page, but each page gets its own download button — simply save only the ones you need from the results grid.',
      },
      {
        question: 'Why is my converted image blurry?',
        answer: 'Increase the scale to 2x or 3x and push the quality slider toward 100%. At 1x, a standard page renders around 600 pixels wide, which can look soft on modern screens.',
      },
      {
        question: 'Does it work with scanned PDFs?',
        answer: 'Yes. Scanned pages are images already, so they render exactly as stored. The output resolution follows your scale setting.',
      },
    ],
    keywords: [
      'pdf to jpg',
      'convert pdf to images free',
      'pdf to jpg converter online',
      'pdf pages to jpg',
      'extract images from pdf pages',
      'pdf to picture no upload',
      'high resolution pdf to jpg',
    ],
    metaDescription:
      'Convert PDF pages to JPG images free with adjustable resolution and quality. Rendered in your browser by PDF.js — no upload, no limits.',
  },

  'pdf-page-numbers': {
    longDescription: [
      'PDF Page Numbers stamps clean, professional page numbers onto every page of your document. Choose one of six positions (top or bottom, left, center, or right), pick a numbering format — plain "1, 2, 3", "Page 1", or "1 of N" — set the font size, and even start counting from a custom number, which is essential when your file is a chapter extracted from a longer work.',
      'Numbers are drawn in embedded Helvetica with pdf-lib, positioned precisely using real text-width measurements so centered numbers are actually centered. The whole process runs in your browser: the file is never uploaded, and the numbered copy downloads as numbered-<name>.pdf while your original stays untouched.',
      'It solves a common gap: scanned documents, merged files, and many exported reports arrive without printed page numbers. Add them before filing court documents, distributing meeting packets, printing a thesis, or sending any document people will need to reference by page. During review calls, "see page 14" only works when page 14 is printed on the page.',
    ],
    features: [
      'Six placement options: top/bottom × left/center/right',
      'Formats: "1", "Page 1", or "1 of N"',
      'Custom starting number for extracted chapters',
      'Adjustable font size',
      'Accurate centering using measured text width',
      'Client-side stamping — the PDF never leaves your browser',
    ],
    useCases: [
      'Number a scanned contract before filing or referencing it',
      'Add "1 of N" numbering to a merged meeting packet',
      'Continue numbering from page 47 on an extracted chapter',
      'Prepare a thesis or manuscript for print with bottom-center numbers',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Choose the position, numbering format, font size, and start number.',
      'Click "Add Page Numbers" to stamp every page.',
      'Click "Download" to save the numbered PDF.',
    ],
    faqs: [
      {
        question: 'Can numbering start from something other than 1?',
        answer: 'Yes. Set the Start Number field to any value — useful when the file is part of a larger document and needs to continue from, say, page 47.',
      },
      {
        question: 'What does the "1 of N" format show?',
        answer: 'Each page displays its number plus the final page number, for example "3 of 12". The total accounts for your starting number automatically.',
      },
      {
        question: 'Is my document uploaded to add the numbers?',
        answer: 'No. Numbers are drawn locally in your browser with pdf-lib, so the file stays on your device throughout.',
      },
      {
        question: 'Can I skip numbering the cover page?',
        answer: 'Not directly — numbers are applied to all pages. As a workaround, split off the cover with the Split PDF tool, number the body starting at 1, then merge them back together.',
      },
      {
        question: 'What font are the numbers printed in?',
        answer: 'Helvetica, embedded into the PDF so numbers display identically on every device and printer. You control the size; the color is black.',
      },
    ],
    keywords: [
      'add page numbers to pdf',
      'pdf page numbering online free',
      'insert page numbers pdf',
      'number pdf pages',
      'pdf bates numbering alternative',
      'page x of y pdf',
      'pdf page number position',
    ],
    metaDescription:
      'Add page numbers to any PDF free — six positions, three formats, custom start number. Stamped in your browser with no upload.',
  },

  'watermark-pdf': {
    longDescription: [
      'Watermark PDF stamps custom text diagonally across every page of your document. Type the watermark — "CONFIDENTIAL", "DRAFT", a client name, anything — then dial in the font size, opacity, color, and rotation angle. The default 45° tilt at 30% opacity produces the classic subtle diagonal stamp that labels a document without obscuring its content.',
      'The watermark is drawn into the page content itself using pdf-lib and embedded Helvetica, centered on each page, so it travels with the file and prints exactly as shown. Processing is fully client-side: your PDF is never uploaded, which matters precisely because the documents people watermark — drafts, proposals, confidential reports — are the ones they least want on someone else’s server.',
      'Use it to mark circulation status before review rounds, discourage reuse of proposals and quotations, or brand sample documents shared with prospects. A visible watermark changes behavior in a way file permissions cannot: reviewers know a DRAFT is not final, and a proposal carrying the client’s name is far less likely to be forwarded to their competitor. It also survives printing, which access controls never do.',
    ],
    features: [
      'Any custom watermark text',
      'Adjustable font size, opacity, color, and rotation',
      'Applied to every page, centered automatically',
      'Sensible defaults: 45° diagonal, 30% opacity gray',
      'Live document preview before stamping',
      'Client-side processing — the file is never uploaded',
    ],
    useCases: [
      'Mark a contract draft "DRAFT" before internal review',
      'Stamp "CONFIDENTIAL" on a report shared with a partner',
      'Label proposals with the client name to prevent reuse',
      'Watermark sample chapters sent to reviewers',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Type the watermark text, e.g. CONFIDENTIAL.',
      'Adjust font size, opacity, color, and rotation to taste.',
      'Click "Apply Watermark" and then download the watermarked PDF.',
    ],
    faqs: [
      {
        question: 'Can the watermark be removed later?',
        answer: 'The watermark is drawn into the page content, so it cannot be toggled off in a viewer. Determined editing tools can still remove content, so treat it as a strong deterrent and label rather than a security mechanism.',
      },
      {
        question: 'Is my document uploaded when I add a watermark?',
        answer: 'No. The watermark is drawn locally in your browser with pdf-lib. Confidential drafts stay on your device.',
      },
      {
        question: 'What opacity should I use?',
        answer: 'The 30% default keeps the underlying text easy to read while remaining clearly visible. Go lower (15–20%) for dense text documents, higher (50%+) when you want the mark to dominate.',
      },
      {
        question: 'Can I watermark only certain pages?',
        answer: 'The watermark is applied to all pages. To watermark part of a document, split it first, watermark the relevant section, and merge the parts back.',
      },
      {
        question: 'Can I use an image or logo as the watermark?',
        answer: 'This tool stamps text only. For an image overlay, convert your logo page with the Edit PDF workflow or use an image-capable editor.',
      },
    ],
    keywords: [
      'watermark pdf',
      'add watermark to pdf free',
      'confidential stamp pdf',
      'draft watermark pdf online',
      'pdf text watermark',
      'watermark pdf without upload',
      'stamp text on pdf',
    ],
    metaDescription:
      'Add a text watermark like CONFIDENTIAL or DRAFT to every PDF page free. Custom size, opacity, color, angle — in-browser, no upload.',
  },

  'sign-pdf': {
    longDescription: [
      'Sign PDF lets you draw your signature with a mouse, trackpad, or finger on a signature pad, then places it into your document as a crisp embedded image. Choose where it goes — bottom-left, bottom-right, or center — pick the target page (first, last, or every page), and select a size. The signature is captured as a PNG and drawn onto the page with pdf-lib, keeping its exact proportions.',
      'Everything happens in your browser. The document and your signature never leave your device, which is exactly what you want when signing offer letters, NDAs, rental agreements, or consent forms. There is no account, no ceremony emails, and no third party holding a copy of your autograph. The signed file downloads as signed-<name>.pdf.',
      'This produces a visual (electronic) signature — the kind used for everyday business paperwork — not a cryptographic digital certificate. For most contracts and forms where parties simply need a signed copy, that is precisely what is required. If a counterparty specifically requires certificate-backed digital signing with identity verification, use a dedicated signing service for that document — and this tool for everything else that just needs your signature on the line.',
    ],
    features: [
      'Draw your signature on a touch- and mouse-friendly pad',
      'Clear and redraw until it looks right',
      'Place on the first page, last page, or every page',
      'Position options: bottom-left, bottom-right, or center',
      'Three signature sizes',
      'Signature embedded as a sharp PNG image',
      'Fully client-side — document and signature stay private',
    ],
    useCases: [
      'Sign an offer letter or NDA without printing and scanning',
      'Initial every page of an agreement using the "all pages" option',
      'Sign rental agreements or school consent forms on a phone or tablet',
      'Countersign a contract received by email and return it in minutes',
    ],
    howTo: [
      'Drag and drop the PDF you need to sign, or click Browse Files.',
      'Draw your signature in the signature pad; click Clear to retry.',
      'Choose the position, the target page (first, last, or all), and the size.',
      'Click "Sign PDF" to embed the signature.',
      'Download the signed document.',
    ],
    faqs: [
      {
        question: 'Is this a legally binding signature?',
        answer: 'It creates an electronic signature image, which is widely accepted for everyday agreements in many jurisdictions (e.g., under ESIGN or eIDAS as a simple e-signature). For workflows requiring certificate-backed digital signatures, use a qualified signing service.',
      },
      {
        question: 'Is my signature or document uploaded anywhere?',
        answer: 'No. The signature is captured and embedded entirely in your browser. Neither the document nor your signature image ever leaves your device.',
      },
      {
        question: 'Can I sign on my phone?',
        answer: 'Yes. The signature pad supports touch input, so drawing with a finger or stylus on a phone or tablet works naturally — often better than a mouse.',
      },
      {
        question: 'Can I put my signature on every page?',
        answer: 'Yes. Set the page target to "All pages" and the signature is placed at your chosen position on each page — handy for initialing agreements.',
      },
      {
        question: 'Can I position the signature anywhere on the page?',
        answer: 'You choose from preset positions: bottom-left, bottom-right, or center. For pixel-precise placement of text near the signature line, pair it with the Edit PDF tool.',
      },
    ],
    keywords: [
      'sign pdf',
      'sign pdf online free',
      'draw signature on pdf',
      'esign pdf without account',
      'add signature to pdf',
      'sign pdf on phone',
      'electronic signature pdf free',
    ],
    metaDescription:
      'Sign a PDF free: draw your signature, choose page and position, download instantly. Everything stays in your browser — no upload, no account.',
  },

  'edit-pdf': {
    longDescription: [
      'Edit PDF adds text exactly where you want it on any page of your document. The page renders in the browser via PDF.js; click the spot where text should appear, type your content, set the font size and color, and add the annotation. Navigate between pages with the arrow controls and build up as many annotations as you need — each one is listed with its page, position, and size so you can review and delete before saving.',
      'When you save, every annotation is drawn permanently into the PDF with pdf-lib at the precise coordinates you clicked, in embedded Helvetica. The entire edit session is client-side: the document never leaves your browser, making it safe for filling out forms with personal data, correcting invoices, or annotating contracts.',
      'It is the quickest way to handle PDFs that were never meant to be edited: fill in a flat (non-interactive) form, add a date next to a signature, insert a missing reference number, or drop a short note onto a drawing. Because you see the real rendered page while you work, what you position is exactly what prints — no guessing at coordinates and no round-tripping through a converter that mangles the layout.',
    ],
    features: [
      'Click directly on the rendered page to position text',
      'Custom font size (6–120pt) and any color',
      'Add annotations across multiple pages in one session',
      'Annotation list with page, coordinates, and size',
      'Delete any annotation before saving',
      'Accurate page rendering via PDF.js',
      'Client-side editing — the PDF is never uploaded',
    ],
    useCases: [
      'Fill out a flat PDF form that has no interactive fields',
      'Add the date and place next to your signature',
      'Insert a missing invoice or reference number',
      'Annotate a floor plan or drawing with short labels',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Navigate to the page you want to edit with the arrows.',
      'Click the exact spot on the preview where the text should go.',
      'Type the text and set its font size and color, then click Add.',
      'Repeat for other spots or pages, then save and download the edited PDF.',
    ],
    faqs: [
      {
        question: 'Can I edit or delete text that is already in the PDF?',
        answer: 'No — this tool adds new text on top of the existing content; it does not modify the original text layer. To visually replace text, you can cover it (e.g., with the Redact PDF tool) and type the correction over it.',
      },
      {
        question: 'Is my document uploaded while I edit?',
        answer: 'No. Rendering (PDF.js) and saving (pdf-lib) both run in your browser, so forms with personal data never leave your device.',
      },
      {
        question: 'Are the added texts permanent?',
        answer: 'Yes. On save, annotations are drawn into the page content itself, so they display and print in every PDF viewer and cannot be toggled off.',
      },
      {
        question: 'Can I use a different font?',
        answer: 'Text is written in embedded Helvetica, which renders consistently everywhere. You control size and color; alternative font families are not currently supported.',
      },
      {
        question: 'I clicked the wrong spot — how do I fix it?',
        answer: 'Every annotation appears in the list with its page and coordinates. Delete the misplaced one, click the correct position, and add it again before saving.',
      },
    ],
    keywords: [
      'edit pdf',
      'add text to pdf free',
      'write on pdf online',
      'fill pdf form without acrobat',
      'pdf text editor browser',
      'type on pdf no upload',
      'annotate pdf free',
    ],
    metaDescription:
      'Add text to any PDF free: click where it goes, set size and color, save. Fill flat forms and annotate — all in your browser, no upload.',
  },

  'redact-pdf': {
    longDescription: [
      'Redact PDF places solid black boxes over sensitive areas of your document. Define each redaction by page number and position — x, y, width, and height in PDF points — and build a list covering every spot that must be hidden: account numbers, names, salaries, addresses. When you apply, each box is drawn as opaque black ink directly into the page content with pdf-lib.',
      'The whole process is client-side, which is exactly what redaction demands: a document containing information sensitive enough to redact should not be uploaded to a stranger’s server first. Your file stays in the browser from upload to download, and the result saves as redacted-<name>.pdf, leaving the original untouched.',
      'One honest caveat: the black boxes are permanent page content, but the text underneath may still exist in the file’s text layer. For maximum-security redaction of extremely sensitive documents, convert the redacted file to images (PDF to JPG, then JPG to PDF) so no text layer survives — and always verify with select-all before sharing.',
    ],
    features: [
      'Unlimited redaction boxes across any pages',
      'Precise placement via page, x, y, width, and height',
      'Review list of all planned redactions before applying',
      'Remove any redaction from the list before committing',
      'Boxes drawn permanently into the page content',
      'Fully client-side — the sensitive file is never uploaded',
    ],
    useCases: [
      'Black out account numbers on a bank statement before sharing',
      'Hide employee salaries in a report sent outside HR',
      'Redact personal data from documents used in training material',
      'Mask names and addresses in files attached to public records requests',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'For each area to hide, enter the page number and the x, y, width, and height in points, then click Add.',
      'Review the redaction list and delete any mistakes.',
      'Click "Apply Redactions" to draw the black boxes into the pages.',
      'Download the redacted PDF and verify it before sharing.',
    ],
    faqs: [
      {
        question: 'Is the hidden text actually removed from the file?',
        answer: 'The black boxes are drawn permanently into the page image, but the underlying text objects can remain in the file and may be selectable. For total removal, convert the redacted PDF to images and back (PDF to JPG, then JPG to PDF), which destroys the text layer.',
      },
      {
        question: 'Is my document uploaded during redaction?',
        answer: 'No — and that is the point. Redaction runs entirely in your browser with pdf-lib, so the sensitive file never leaves your device.',
      },
      {
        question: 'How do the coordinates work?',
        answer: 'Positions are in PDF points (72 per inch) measured from the bottom-left corner of the page. An A4 page is 595 × 842 points, so x:50, y:750 is near the top-left area.',
      },
      {
        question: 'Can I preview where a box will land before applying?',
        answer: 'Use the document preview alongside the coordinate fields to judge placement, add the box, apply, and check the result. If a box is off, re-run the tool on the original with adjusted values.',
      },
      {
        question: 'Can I undo a redaction after downloading?',
        answer: 'Not on the redacted copy — the boxes are baked into the page content. Your original file is unmodified though, so simply start again from it.',
      },
    ],
    keywords: [
      'redact pdf',
      'black out text in pdf free',
      'hide sensitive information pdf',
      'pdf redaction tool online',
      'censor pdf content',
      'redact pdf without upload',
      'remove personal data from pdf',
    ],
    metaDescription:
      'Redact PDFs free by drawing permanent black boxes over sensitive content. Processing stays in your browser — nothing is ever uploaded.',
  },

  'ocr-pdf': {
    longDescription: [
      'OCR PDF extracts text from scanned documents using optical character recognition, entirely in your browser. Each page is rendered by PDF.js, then read by Tesseract.js — the WebAssembly port of the Tesseract OCR engine — with support for English, Hindi, Spanish, French, German, and Chinese. A progress indicator tracks the recognition page by page, and the recognized text appears in an editable output area.',
      'Because both rendering and recognition run locally, scanned contracts, medical records, and ID documents are never uploaded. When recognition finishes you can copy the full text to the clipboard with one click or download it as a .txt file named after your document, ready to paste into Word, a translation tool, or a search index.',
      'It is the answer to "this PDF is just a picture": recover text from scanned books and letters, make photographed receipts searchable, digitize archived paperwork, or lift a paragraph out of a scan someone sent you as a flat image. Once the text is out, the rest of your toolchain opens up — paste it into a translator, index it in your notes app, or drop it into Word for editing.',
    ],
    features: [
      'True OCR via Tesseract.js running in your browser',
      'Six languages: English, Hindi, Spanish, French, German, Chinese',
      'Per-page progress indicator on long documents',
      'Editable extracted-text view',
      'One-click copy to clipboard',
      'Download the text as a .txt file',
      'No upload — scans stay on your device',
    ],
    useCases: [
      'Recover editable text from a scanned contract',
      'Digitize old letters or archived paperwork',
      'Extract a quotation from a book page photographed as PDF',
      'Pull text from a scanned invoice for record keeping',
      'Convert Hindi or Chinese scans that most free tools cannot read',
    ],
    howTo: [
      'Drop a scanned PDF onto the upload area or click to browse.',
      'Select the document language from the OCR Language menu.',
      'Click "Extract Text" and watch the per-page progress.',
      'Review the recognized text, then copy it or download it as .txt.',
    ],
    faqs: [
      {
        question: 'Is my scanned document uploaded for OCR?',
        answer: 'No. Recognition runs in your browser via Tesseract.js compiled to WebAssembly. The scan never leaves your device — only the language data files are fetched.',
      },
      {
        question: 'How accurate is the recognition?',
        answer: 'On clean, well-lit scans of printed text, accuracy is typically very high. Skewed pages, low resolution, and handwriting reduce it — rescanning at 300 DPI in good contrast makes the biggest difference.',
      },
      {
        question: 'Which languages are supported?',
        answer: 'English, Hindi, Spanish, French, German, and Simplified Chinese. Pick the language that matches the document — running English OCR on Hindi text produces garbage.',
      },
      {
        question: 'Does it produce a searchable PDF?',
        answer: 'The tool outputs the extracted text itself, which you can copy or download as .txt. It does not currently re-embed an invisible text layer into the PDF.',
      },
      {
        question: 'Why is OCR slow on my document?',
        answer: 'Recognition is CPU-intensive and runs on your own machine — expect a few seconds per page, longer at high page counts or on older hardware. The progress bar shows exactly where it is.',
      },
    ],
    keywords: [
      'ocr pdf',
      'extract text from scanned pdf free',
      'pdf ocr online no upload',
      'scanned pdf to text',
      'image pdf to text converter',
      'tesseract ocr browser',
      'hindi ocr pdf',
      'convert scan to editable text',
    ],
    metaDescription:
      'Free OCR for scanned PDFs in 6 languages. Extract, copy, or download text — recognition runs in your browser, files are never uploaded.',
  },

  'repair-pdf': {
    longDescription: [
      'Repair PDF attempts to rescue documents that other programs refuse to open. It parses the damaged file with pdf-lib’s tolerant loader, reconstructs the internal object tree, and re-serializes everything into a clean, standards-compliant PDF. Structural problems this fixes include truncated cross-reference tables, dangling objects left by crashed editors, and malformed trailers from interrupted downloads.',
      'The tool is transparent about the outcome: on success you see a confirmation with the recovered page count and the document’s metadata (title, author, producer); if the file is too far gone to parse, it says so plainly instead of producing a broken output. The repaired copy downloads as repaired-<name>.pdf.',
      'Recovery runs entirely in your browser — the corrupt file is never uploaded. Try it first whenever a PDF fails with "file is damaged", came out of an interrupted email download, or was produced by a crashing export before you resort to re-requesting or re-scanning the document. Even when a file opens fine in one viewer but fails in another, running it through the repair pass produces a cleanly serialized copy that behaves consistently everywhere.',
    ],
    features: [
      'Rebuilds the PDF object structure and cross-reference table',
      'Clear success/failure status after the attempt',
      'Shows recovered page count and document metadata',
      'Re-serializes into a clean, standards-compliant file',
      'Preview of the recovered document',
      'Client-side recovery — the file is never uploaded',
    ],
    useCases: [
      'Open an invoice that Adobe Reader reports as damaged',
      'Fix a PDF truncated by an interrupted download',
      'Rescue a report from an export that crashed halfway',
      'Clean a file that opens in one viewer but not another',
    ],
    howTo: [
      'Drag and drop the damaged PDF onto the upload area.',
      'Wait for the repair attempt — the status appears within seconds.',
      'Check the recovered page count and metadata shown on success.',
      'Click "Download Repaired PDF" to save the fixed file.',
    ],
    faqs: [
      {
        question: 'Can every corrupt PDF be repaired?',
        answer: 'No. If the underlying page data is destroyed or the file is severely truncated, no tool can reconstruct what is missing. This tool fixes structural corruption — broken cross-references, malformed trailers, orphaned objects — which covers many real-world failures.',
      },
      {
        question: 'Is my broken file uploaded for repair?',
        answer: 'No. The recovery runs in your browser with pdf-lib, so even damaged confidential documents stay on your device.',
      },
      {
        question: 'How do I know whether the repair worked?',
        answer: 'The tool shows an explicit status: a green confirmation with the page count and metadata on success, or a clear failure message if the file could not be parsed at all.',
      },
      {
        question: 'Will the repaired file look different from the original?',
        answer: 'No — repair rebuilds the file’s internal structure, not its visible content. Pages that could be recovered render exactly as they did before the corruption.',
      },
      {
        question: 'The repair failed. What can I try next?',
        answer: 'Re-download or re-request the file first, since truncation during transfer is the most common cause. If you have the source document, re-export it; a fresh export always beats deep forensic recovery.',
      },
    ],
    keywords: [
      'repair pdf',
      'fix corrupt pdf free',
      'pdf recovery online',
      'damaged pdf repair tool',
      'pdf wont open fix',
      'restore broken pdf',
      'repair pdf without upload',
    ],
    metaDescription:
      'Repair corrupt PDF files free: rebuilds broken structure and recovers pages in your browser. Clear success status, no upload needed.',
  },

  'pdf-to-pdfa': {
    longDescription: [
      'PDF to PDF/A prepares documents for long-term archiving by normalizing them toward the PDF/A archival profile. The tool loads your file, completes the document information dictionary — title, author, creator, and producer fields that archives and records systems expect to be present — and re-serializes the whole document into a clean, self-contained structure with a before/after metadata comparison so you can see exactly what changed.',
      'PDF/A is the ISO 19005 standard used by courts, government archives, and records-management systems because it forbids the fragile parts of ordinary PDFs — external dependencies and missing metadata — so files remain readable decades from now. This tool handles the normalization and re-serialization step in your browser; for submissions that demand certified conformance, validate the output with a checker such as veraPDF.',
      'Everything runs client-side with pdf-lib: your document is never uploaded, and the archival copy downloads as pdfa-<name>.pdf alongside a table comparing the original and updated metadata. That before/after table doubles as a lightweight audit trail — screenshot or save it if your records process asks you to document what changed during normalization.',
    ],
    features: [
      'Normalizes title, author, creator, and producer metadata',
      'Re-serializes the file into a clean, self-contained structure',
      'Before/after metadata comparison table',
      'Preserves all page content exactly',
      'Preview of the loaded document',
      'Client-side conversion — no upload',
    ],
    useCases: [
      'Prepare invoices for a records system that requires complete metadata',
      'Normalize documents before ingest into a digital archive',
      'Clean up files exported by tools that leave metadata blank',
      'Create archival copies of company records for long-term storage',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Review the document’s current metadata shown after loading.',
      'Click "Convert" to normalize the metadata and re-serialize the file.',
      'Compare the before/after table, then download the archival copy.',
    ],
    faqs: [
      {
        question: 'What is PDF/A and why does it matter?',
        answer: 'PDF/A (ISO 19005) is the archival profile of PDF used by courts, governments, and archives. It requires self-contained files with complete metadata so documents stay renderable for decades, independent of any particular software.',
      },
      {
        question: 'Is the output guaranteed to pass strict PDF/A validators?',
        answer: 'The tool normalizes metadata and rebuilds the file cleanly, which resolves common archival objections. Full conformance also depends on the source file’s fonts and color spaces, so for certified submissions verify the result with a validator like veraPDF.',
      },
      {
        question: 'Does the conversion change how my document looks?',
        answer: 'No. Page content is preserved exactly — only document-level metadata and internal structure are updated.',
      },
      {
        question: 'Is my file uploaded during conversion?',
        answer: 'No. Loading, normalization, and re-serialization all happen in your browser with pdf-lib.',
      },
      {
        question: 'What metadata does the tool fill in?',
        answer: 'Missing titles default to the file name, a missing author is filled in, and the creator/producer fields are set — you can see every value in the before/after comparison table.',
      },
    ],
    keywords: [
      'pdf to pdfa',
      'convert pdf to pdf/a free',
      'pdf archival format converter',
      'iso 19005 pdf',
      'pdf a for court filing',
      'archive pdf long term',
      'pdf metadata normalization',
    ],
    metaDescription:
      'Convert PDF toward the PDF/A archival standard free: metadata normalized, structure rebuilt, before/after comparison — all in your browser.',
  },

  'protect-pdf': {
    longDescription: [
      'Protect PDF encrypts your document with real AES-256 password protection. Set a user password (required to open the file), an owner password (required to change permissions), or both, and the Exyconn server applies the encryption using qpdf — the same open-source engine trusted in professional PDF pipelines. The result is a genuinely locked file that Adobe Reader, Chrome, and every standards-compliant viewer will refuse to open without the password.',
      'Because browsers cannot perform standards-compliant PDF encryption on their own, this tool uploads your file over HTTPS to the Exyconn server, encrypts it there, streams the protected copy back, and deletes the transient files immediately after processing — nothing is stored, logged, or reused. Your chosen passwords are used solely to perform the encryption.',
      'Use it before sending salary letters, financial statements, medical reports, or any document that should not be readable by whoever happens to open the email. Remember the golden rule of encryption: there is no recovery — a forgotten password means a permanently locked file. Send the password through a different channel than the file — text the password if you emailed the PDF — so intercepting one never exposes both.',
    ],
    features: [
      'Genuine AES-256 encryption via qpdf',
      'Separate user (open) and owner (permissions) passwords',
      'Output opens only with the password, in every compliant viewer',
      'Secure HTTPS upload; files deleted right after processing',
      'No account or email required',
      'Document preview before protecting',
    ],
    useCases: [
      'Password-protect a salary or offer letter before emailing it',
      'Encrypt financial statements shared with external accountants',
      'Lock medical reports so only the patient can open them',
      'Protect board documents distributed to a wide mailing list',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Enter a user password (to open) and/or an owner password (to edit permissions).',
      'Click "Protect PDF" — the file is encrypted with AES-256 on the server.',
      'Download the protected PDF and share the password over a separate channel.',
    ],
    faqs: [
      {
        question: 'How strong is the encryption?',
        answer: 'The file is encrypted with AES-256 using qpdf, the current strongest encryption defined by the PDF standard. With a good password, brute-forcing it is not practical.',
      },
      {
        question: 'Is my file stored on your server?',
        answer: 'No. The PDF is uploaded over HTTPS, encrypted, returned to you, and the temporary files are deleted immediately after processing. Nothing is retained or logged.',
      },
      {
        question: 'What is the difference between the user and owner passwords?',
        answer: 'The user password is needed to open and read the document. The owner password controls permissions such as printing and editing. You can set either one or both.',
      },
      {
        question: 'What happens if I forget the password?',
        answer: 'There is no backdoor or recovery — AES-256 encryption cannot be bypassed. Store the password in a password manager and always keep an unencrypted copy somewhere safe.',
      },
      {
        question: 'Will the protected file open on phones and older readers?',
        answer: 'Any standards-compliant viewer that supports AES-256 (Adobe Reader 9+, all modern browsers, iOS and Android viewers) will prompt for the password and open the file normally.',
      },
    ],
    keywords: [
      'protect pdf with password',
      'encrypt pdf free',
      'password protect pdf online',
      'pdf aes 256 encryption',
      'lock pdf file',
      'secure pdf before emailing',
      'add password to pdf',
    ],
    metaDescription:
      'Password-protect PDFs free with real AES-256 encryption via qpdf. Files are processed securely and deleted immediately — no account needed.',
  },

  'unlock-pdf': {
    longDescription: [
      'Unlock PDF removes password protection from documents you have the password for, giving you back a copy that opens instantly without prompts. Upload the protected file, enter its password, and the Exyconn server decrypts it with qpdf — the professional-grade engine that handles every standard PDF encryption scheme, including AES-256 — then returns a fully unlocked copy named unlocked-<name>.pdf.',
      'The file travels over HTTPS, is decrypted in an isolated temporary workspace, and both the upload and the output are deleted from the server the moment your download is served. The password you enter is used only to perform the decryption and is never stored. This tool is for documents you legitimately own or are authorized to open — it removes protection using the correct password; it does not crack unknown ones.',
      'It ends the daily friction of protected files: bank statements that demand your birth date on every open, salary slips you must archive, and reports you need to merge, print, or search — operations many tools refuse on encrypted PDFs. Once unlocked, the copy behaves like any ordinary PDF: it indexes in desktop search, opens instantly on your phone, and feeds cleanly into the merge, watermark, and page-number tools on this site.',
    ],
    features: [
      'Removes open passwords and permission restrictions',
      'Handles all standard PDF encryption, including AES-256, via qpdf',
      'Works with the correct password you provide',
      'Secure HTTPS transfer; files deleted right after processing',
      'Clear error message when the password is wrong',
      'Unlocked copy behaves like a normal PDF everywhere',
    ],
    useCases: [
      'Stop typing a password every time you open your bank statement',
      'Archive salary slips as normal, searchable PDFs',
      'Unlock a report so it can be merged or watermarked',
      'Remove print/copy restrictions from your own documents',
    ],
    howTo: [
      'Drag and drop the protected PDF onto the upload area.',
      'Enter the document’s password in the password field.',
      'Click "Unlock PDF" — the encryption is removed on the server via qpdf.',
      'Download the unlocked copy, which opens without any prompt.',
    ],
    faqs: [
      {
        question: 'Can this crack a PDF whose password I do not know?',
        answer: 'No. The tool decrypts documents using the correct password you supply — that is what makes it fast, reliable, and legitimate. It does not guess or brute-force passwords.',
      },
      {
        question: 'What happens to my file and password on the server?',
        answer: 'The file is sent over HTTPS, decrypted in a temporary workspace, and deleted immediately after your download is served. The password is used only for the decryption and is never stored or logged.',
      },
      {
        question: 'Which encryption types can be removed?',
        answer: 'All standard PDF schemes — RC4 40/128-bit and AES-128/256 — thanks to the qpdf engine. If a correct password opens the file in a reader, this tool can unlock it.',
      },
      {
        question: 'I entered the password but unlocking failed. Why?',
        answer: 'Double-check for typos, keyboard layout, and caps lock; bank PDFs often use specific formats like DDMMYYYY. If the password is genuinely correct and it still fails, the file may be corrupted — try the Repair PDF tool first.',
      },
      {
        question: 'Is it legal to unlock a PDF?',
        answer: 'Unlocking documents you own or are authorized to access — your statements, your payslips, files shared with you along with their password — is normal use. Do not use it on documents you have no right to open.',
      },
    ],
    keywords: [
      'unlock pdf',
      'remove pdf password free',
      'decrypt pdf online',
      'unlock bank statement pdf',
      'remove pdf restrictions',
      'pdf password remover with password',
      'open protected pdf without prompt',
    ],
    metaDescription:
      'Unlock password-protected PDFs free using your password. Server-side qpdf decryption, files deleted immediately after processing.',
  },

  'word-to-pdf': {
    longDescription: [
      'Word to PDF converts .doc and .docx documents into polished, universally readable PDFs. Upload your file and the Exyconn server converts it with LibreOffice — a full office suite engine, not a simplified parser — so headers and footers, tables, images, page breaks, numbered lists, and embedded fonts come through as they appear in Word. The finished PDF streams straight back to your browser.',
      'The conversion happens over HTTPS in an isolated workspace on the server, and both your upload and the generated PDF are deleted as soon as the download is delivered — nothing is retained. There is no account, no email gate, and no watermark stamped on your output. The LibreOffice engine runs headless on the server, so conversion quality does not depend on what software — if any — is installed on your own machine.',
      'Convert before you share: a PDF freezes your layout so a CV, contract, or proposal looks identical on every device, cannot be casually edited, and prints predictably — none of which a raw Word file guarantees once it leaves your machine. It also strips away the awkward moments Word files carry: tracked changes you forgot to accept, comments meant for a colleague, and fonts that silently substitute on the recipient’s laptop.',
    ],
    features: [
      'Supports both .doc and .docx input',
      'LibreOffice engine preserves layout, tables, images, and lists',
      'Headers, footers, and page numbering carried over',
      'No watermark on the output',
      'Secure HTTPS upload; files deleted after conversion',
      'No sign-up or email required',
    ],
    useCases: [
      'Convert a CV to PDF so its formatting survives every recruiter’s device',
      'Turn a contract into an uneditable, print-ready file',
      'Produce PDF versions of proposals for client delivery',
      'Convert reports for uploading to portals that only accept PDF',
    ],
    howTo: [
      'Drag and drop your .doc or .docx file onto the upload area.',
      'Click "Convert to PDF" — the document is converted on the server by LibreOffice.',
      'Wait a few seconds while the conversion completes.',
      'Download the finished PDF.',
    ],
    faqs: [
      {
        question: 'Will my document look exactly like it does in Word?',
        answer: 'LibreOffice renders Word formats with high fidelity — layout, tables, images, headers, and footers convert accurately in the vast majority of documents. Files relying on rare fonts or exotic Word features may show minor spacing differences.',
      },
      {
        question: 'What happens to my file on the server?',
        answer: 'It is uploaded over HTTPS, converted in an isolated temporary workspace, and deleted along with the output as soon as your download is served. Nothing is stored or reused.',
      },
      {
        question: 'Are .doc files from older Word versions supported?',
        answer: 'Yes. LibreOffice reads both the legacy .doc binary format and modern .docx files.',
      },
      {
        question: 'Is there a watermark or page limit?',
        answer: 'No watermark, ever. Typical documents of any normal length convert fine; extremely large files are only bounded by the upload size limit.',
      },
      {
        question: 'Can the PDF be edited after conversion?',
        answer: 'The output is a standard PDF: readable and printable everywhere, and much harder to alter casually than a Word file. For small additions afterwards, use the Edit PDF tool.',
      },
    ],
    keywords: [
      'word to pdf',
      'docx to pdf converter free',
      'convert word document to pdf online',
      'doc to pdf no watermark',
      'word to pdf keep formatting',
      'cv word to pdf',
      'free docx to pdf',
    ],
    metaDescription:
      'Convert Word (.doc/.docx) to PDF free with LibreOffice-grade fidelity. No watermark, no sign-up — files deleted right after conversion.',
  },

  'excel-to-pdf': {
    longDescription: [
      'Excel to PDF converts .xls and .xlsx spreadsheets into clean, shareable PDF documents. The conversion runs on the Exyconn server using LibreOffice, which understands real spreadsheet semantics: cell formatting, merged cells, borders, number formats, and multi-sheet workbooks are rendered onto PDF pages the way the spreadsheet’s own print layout defines them.',
      'Your workbook is uploaded over HTTPS, converted in an isolated workspace, and deleted together with the output the moment your download completes — the server keeps nothing. There is no watermark, no account, and no email harvesting in exchange for the file. Because the rendering happens server-side in LibreOffice, the output is identical whether you convert from a workstation with Excel installed or from a phone with nothing at all.',
      'Converting to PDF is the right move whenever a spreadsheet leaves your team: recipients see the numbers you approved, formulas and hidden columns stop being one click away, and the file prints identically everywhere — critical for invoices, price lists, and financial summaries. A PDF invoice also cannot be "accidentally" edited before it reaches accounts payable, which is reason enough for many businesses to convert every outgoing sheet.',
    ],
    features: [
      'Supports .xls and .xlsx workbooks',
      'LibreOffice rendering preserves formatting, borders, and merged cells',
      'Multi-sheet workbooks convert in sheet order',
      'Respects the spreadsheet’s print areas and page setup',
      'Secure HTTPS upload; files deleted after conversion',
      'No watermark, no sign-up',
    ],
    useCases: [
      'Send an invoice as PDF so totals cannot be quietly edited',
      'Share a price list that renders identically on every device',
      'Deliver monthly financial summaries to management as PDF',
      'Archive completed budget sheets in a fixed, printable format',
    ],
    howTo: [
      'Drag and drop your .xls or .xlsx file onto the upload area.',
      'Click "Convert to PDF" to run the LibreOffice conversion on the server.',
      'Wait a few seconds while the workbook is rendered.',
      'Download the resulting PDF.',
    ],
    faqs: [
      {
        question: 'How are wide spreadsheets handled?',
        answer: 'The conversion follows the workbook’s print setup — page size, orientation, and print areas. Sheets wider than a page paginate across multiple pages, so setting the print area and orientation in Excel before converting gives the best result.',
      },
      {
        question: 'Do formulas remain in the PDF?',
        answer: 'The PDF shows the calculated values, not the formulas — which is usually the point when sharing. Your original workbook keeps its formulas untouched.',
      },
      {
        question: 'Is my spreadsheet stored on the server?',
        answer: 'No. It is converted in an isolated temporary workspace and deleted together with the PDF as soon as your download is served. Nothing is retained.',
      },
      {
        question: 'Are all sheets in the workbook converted?',
        answer: 'Yes, sheets are rendered in workbook order. To convert only one sheet, delete or hide the others in a copy of the file before uploading.',
      },
      {
        question: 'Will charts and cell colors be preserved?',
        answer: 'Yes. LibreOffice renders charts, fills, borders, and conditional-formatting results into the PDF as they appear in the spreadsheet.',
      },
    ],
    keywords: [
      'excel to pdf',
      'xlsx to pdf converter free',
      'convert spreadsheet to pdf online',
      'xls to pdf no watermark',
      'invoice excel to pdf',
      'excel to pdf keep formatting',
      'multi sheet excel to pdf',
    ],
    metaDescription:
      'Convert Excel (.xls/.xlsx) to PDF free via LibreOffice — formatting, charts and multi-sheet support. Files deleted after conversion.',
  },

  'powerpoint-to-pdf': {
    longDescription: [
      'PowerPoint to PDF turns .ppt and .pptx presentations into PDFs with one slide per page. Conversion runs on the Exyconn server through LibreOffice, so slide layouts, images, charts, text styling, and backgrounds are rendered faithfully — what you designed is what lands on the page. The result is a deck anyone can open without PowerPoint, on any device.',
      'Files travel over HTTPS, are converted in an isolated workspace, and are deleted along with the output as soon as your download is served. No account, no watermark, no copy of your deck lingering on a server. Conversion takes seconds for typical decks, and because the rendering runs on the server, even a modest laptop or a phone can convert a heavy, image-laden presentation.',
      'A PDF deck is the professional way to distribute slides after a talk: fonts cannot go missing on the recipient’s machine, animations collapse into their final state so nothing looks half-finished, the file is far smaller than most .pptx exports, and nobody can accidentally nudge a title box while scrolling.',
    ],
    features: [
      'Supports .ppt and .pptx presentations',
      'One slide per PDF page, in order',
      'LibreOffice rendering preserves layouts, images, and charts',
      'Animations resolve to their final visible state',
      'Secure HTTPS upload; files deleted after conversion',
      'No watermark, no sign-up',
    ],
    useCases: [
      'Share slides with attendees after a presentation',
      'Submit a pitch deck to investors who may not have PowerPoint',
      'Publish lecture slides for students on any device',
      'Archive final versions of decks in a fixed format',
    ],
    howTo: [
      'Drag and drop your .ppt or .pptx file onto the upload area.',
      'Click "Convert to PDF" — the deck is rendered slide by slide on the server.',
      'Wait a few seconds while the conversion runs.',
      'Download the PDF version of your presentation.',
    ],
    faqs: [
      {
        question: 'What happens to animations and transitions?',
        answer: 'PDF is a static format, so each slide is rendered in its final state with all build steps completed. Content never disappears — it simply appears fully revealed.',
      },
      {
        question: 'Is my presentation kept on the server?',
        answer: 'No. The deck is converted in an isolated temporary workspace and deleted with its output right after your download is delivered.',
      },
      {
        question: 'Will my fonts look right in the PDF?',
        answer: 'Fonts are embedded during rendering, so the PDF displays consistently even on machines without the original fonts. Very unusual fonts may be substituted with a close match if unavailable to the converter.',
      },
      {
        question: 'Are speaker notes included?',
        answer: 'No — the standard conversion renders slides only, one per page, which is what audiences should receive. Keep your notes in the original .pptx.',
      },
      {
        question: 'Does it handle widescreen (16:9) slides?',
        answer: 'Yes. PDF pages take the deck’s own slide dimensions, so 16:9, 4:3, and custom sizes all convert without cropping or letterboxing.',
      },
    ],
    keywords: [
      'powerpoint to pdf',
      'pptx to pdf converter free',
      'convert presentation to pdf online',
      'ppt to pdf no watermark',
      'slides to pdf',
      'share powerpoint as pdf',
      'pitch deck to pdf',
    ],
    metaDescription:
      'Convert PowerPoint (.ppt/.pptx) to PDF free — one slide per page, layouts preserved via LibreOffice. Files deleted after conversion.',
  },

  'pdf-to-word': {
    longDescription: [
      'PDF to Word converts your PDF into an editable .docx document, directly in your browser. The tool reads the PDF’s text layer with PDF.js, reconstructs the content paragraph by paragraph, and generates a genuine Word file with the docx library — a real .docx that opens in Microsoft Word, Google Docs, and LibreOffice, ready for editing rather than a locked image of the page.',
      'Because extraction and document generation both run client-side, your PDF is never uploaded: contracts, reports, and manuscripts stay on your device from start to finish. The conversion is text-focused — paragraphs and reading order are rebuilt so you can immediately edit, restyle, and reuse the content, which is exactly what people converting to Word need to do.',
      'One requirement: the PDF must contain actual text. Scanned documents are pictures of text and have nothing to extract — run those through the OCR PDF tool first, then bring the recognized text into Word. A quick way to check: try selecting text in any PDF viewer. If you can highlight words, this tool can extract them; if the cursor drags a box instead, you are looking at a scan.',
    ],
    features: [
      'Outputs a genuine .docx file, not a renamed copy',
      'Text extracted page by page with PDF.js',
      'Paragraphs and reading order reconstructed for easy editing',
      'Opens in Word, Google Docs, and LibreOffice',
      'Fully client-side — the PDF is never uploaded',
      'No watermark, no sign-up',
    ],
    useCases: [
      'Edit a contract that was only shared as a PDF',
      'Reuse paragraphs from a PDF report in a new document',
      'Update an old manuscript whose source file was lost',
      'Turn a PDF policy document into an editable template',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Click "Convert to Word" — text is extracted and a .docx is built in your browser.',
      'Download the .docx file and open it in Word or Google Docs.',
    ],
    faqs: [
      {
        question: 'Is my PDF uploaded during conversion?',
        answer: 'No. Text extraction (PDF.js) and .docx generation (the docx library) both run in your browser, so the document never leaves your device.',
      },
      {
        question: 'Will the Word file look identical to the PDF?',
        answer: 'The conversion prioritizes clean, editable text: paragraphs and reading order are rebuilt faithfully, while complex visual layouts such as multi-column designs and floating images may be simplified. For pixel-perfect copies, keep the PDF; for editing, this is what you want.',
      },
      {
        question: 'Why is my converted document empty?',
        answer: 'Your PDF is almost certainly a scan — an image of text with no text layer. Run it through the OCR PDF tool first to recognize the text, then use that output.',
      },
      {
        question: 'Which programs open the converted file?',
        answer: 'Any .docx-compatible editor: Microsoft Word 2007 or newer, Google Docs, LibreOffice Writer, and Pages.',
      },
      {
        question: 'Are tables and images carried over?',
        answer: 'The converter focuses on textual content. Table text is extracted, though grid formatting may need touch-up in Word; embedded images are not transferred.',
      },
    ],
    keywords: [
      'pdf to word',
      'pdf to docx converter free',
      'convert pdf to editable word',
      'pdf to word online no upload',
      'pdf to word without email',
      'edit pdf in word',
      'pdf to doc free',
    ],
    metaDescription:
      'Convert PDF to editable Word (.docx) free, right in your browser. Text and paragraphs rebuilt for editing — no upload, no watermark.',
  },

  'pdf-to-excel': {
    longDescription: [
      'PDF to Excel pulls tabular data out of your PDF and delivers it as a real .xlsx workbook. The tool reads each page’s text with PDF.js, groups items into rows by their positions on the page, and writes them into a spreadsheet with ExcelJS — so numbers land in individual cells you can sum, sort, and chart, instead of one giant text column you would spend an hour splitting by hand.',
      'The entire conversion runs in your browser. Bank statements, invoices, and price lists — exactly the documents people convert to Excel — never leave your device, because nothing is uploaded. The output is a standard workbook that opens in Excel, Google Sheets, and LibreOffice Calc. For financial data, that privacy property is not a nicety: it is the difference between analyzing your accounts and handing a copy of them to an unknown server operator.',
      'It works on PDFs with a text layer; scanned tables are images and must go through the OCR PDF tool first. Rows are reconstructed from text positions, so cleanly laid-out tables convert best, and a quick scan of column alignment after conversion is always worth the ten seconds. Even when a complex layout needs touch-up, correcting a few cells in Excel beats retyping three hundred transactions by hand.',
    ],
    features: [
      'Outputs a genuine .xlsx workbook via ExcelJS',
      'Rows reconstructed from text positions on each page',
      'Values land in separate cells, ready to sum and sort',
      'Opens in Excel, Google Sheets, and LibreOffice Calc',
      'Fully client-side — the PDF is never uploaded',
      'No watermark, no sign-up',
    ],
    useCases: [
      'Turn a PDF bank statement into rows you can categorize and sum',
      'Extract an invoice’s line items into a spreadsheet',
      'Convert a supplier’s PDF price list for comparison in Excel',
      'Pull data tables out of a PDF report for further analysis',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Click "Convert to Excel" — rows are extracted and the workbook is built in your browser.',
      'Download the .xlsx file and open it in Excel or Google Sheets.',
      'Spot-check column alignment before relying on the numbers.',
    ],
    faqs: [
      {
        question: 'Is my financial document uploaded anywhere?',
        answer: 'No. Extraction and workbook generation run entirely in your browser, so statements and invoices stay on your device — no server ever sees them.',
      },
      {
        question: 'How accurate is the table extraction?',
        answer: 'Cleanly formatted tables with consistent columns convert very well. Tables with merged headers, wrapped cell text, or irregular spacing may need minor cleanup in Excel — still far faster than retyping.',
      },
      {
        question: 'Can it convert a scanned statement?',
        answer: 'Not directly — a scan has no text layer to read. Run the document through the OCR PDF tool first, then work from the recognized text.',
      },
      {
        question: 'Are the extracted numbers usable in formulas?',
        answer: 'Yes. Values are written into individual cells of a real .xlsx workbook, so SUM, sorting, filtering, and charts work immediately.',
      },
      {
        question: 'Does it handle multi-page tables?',
        answer: 'Yes. Every page is processed in order and the rows continue down the sheet, so a 12-page statement becomes one continuous table.',
      },
    ],
    keywords: [
      'pdf to excel',
      'pdf to xlsx converter free',
      'extract table from pdf to excel',
      'bank statement pdf to excel',
      'convert pdf data to spreadsheet',
      'pdf to excel no upload',
      'pdf invoice to excel',
    ],
    metaDescription:
      'Convert PDF tables to Excel (.xlsx) free in your browser. Rows and cells rebuilt for sorting and sums — no upload, no sign-up.',
  },

  'pdf-to-powerpoint': {
    longDescription: [
      'PDF to PowerPoint converts your document into an editable .pptx presentation, one PDF page per slide. The tool renders each page in the browser with PDF.js and assembles the deck with PptxGenJS, producing a genuine PowerPoint file that opens in Microsoft PowerPoint, Google Slides, and LibreOffice Impress — where you can reorder slides, add new ones, and present with your usual tools.',
      'Everything runs client-side: rendering, deck assembly, and download all happen in your browser, so the PDF is never uploaded. That makes it safe for internal decks, client proposals, and anything else you would rather not push through an anonymous conversion server. There is no queue and no per-file limit either — convert as many documents as you like, back to back, at the speed of your own machine.',
      'It is the fastest route back to a presentable deck when all you have is the PDF export: revive a deck whose original .pptx was lost, fold pages from a PDF report into your slides, or turn a PDF one-pager into the opening slide of a pitch. Combine it with the Split PDF tool to convert only the pages you need, and your next deck inherits exactly the sections worth presenting.',
    ],
    features: [
      'One PDF page per slide, in document order',
      'Outputs a genuine .pptx via PptxGenJS',
      'Pages rendered faithfully with PDF.js',
      'Opens in PowerPoint, Google Slides, and LibreOffice Impress',
      'Fully client-side — the PDF is never uploaded',
      'No watermark, no sign-up',
    ],
    useCases: [
      'Recover a presentable deck when only the PDF export survives',
      'Include pages from a PDF report in a new presentation',
      'Turn a PDF brochure into slides for a sales meeting',
      'Convert lecture handouts back into projectable slides',
    ],
    howTo: [
      'Drag and drop a PDF onto the upload area or click Browse Files.',
      'Click "Convert to PowerPoint" — each page is rendered and placed on a slide.',
      'Download the .pptx file and open it in PowerPoint or Google Slides.',
    ],
    faqs: [
      {
        question: 'Is my PDF uploaded during the conversion?',
        answer: 'No. Page rendering and .pptx assembly happen entirely in your browser, so the document never leaves your device.',
      },
      {
        question: 'Can I edit the text on the converted slides?',
        answer: 'Each PDF page arrives on its slide as rendered page content, so the layout is preserved exactly. You can freely add text boxes, shapes, and new slides around it; reflowing the original paragraph text works best via the PDF to Word tool.',
      },
      {
        question: 'What slide size does the deck use?',
        answer: 'Slides follow the PDF’s page proportions, so the content fills each slide without stretching or cropping — portrait reports and widescreen exports both convert cleanly.',
      },
      {
        question: 'Which apps open the converted file?',
        answer: 'Any .pptx-compatible app: Microsoft PowerPoint 2007 or newer, Google Slides, LibreOffice Impress, and Keynote.',
      },
      {
        question: 'How long does conversion take?',
        answer: 'A few seconds for typical decks. Time grows with page count since every page is rendered at slide quality on your own machine — the progress indicator keeps you posted.',
      },
    ],
    keywords: [
      'pdf to powerpoint',
      'pdf to pptx converter free',
      'convert pdf to slides',
      'pdf to ppt online no upload',
      'turn pdf into presentation',
      'pdf pages to slides',
      'pdf to google slides',
    ],
    metaDescription:
      'Convert PDF to PowerPoint (.pptx) free — one page per slide, built in your browser with no upload, no watermark, no sign-up.',
  },
};
