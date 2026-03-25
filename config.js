// Config file for shared strings
const SITE_TITLE = "文渊阁 - Văn Uyên Các";
const SITE_HEADER = "Vaên Uyeân Caùc";

// Function to set title and header
function setSiteStrings() {
    document.title = SITE_TITLE;
    const header = document.querySelector('h1');
    if (header) {
        header.textContent = SITE_HEADER;
    }
}