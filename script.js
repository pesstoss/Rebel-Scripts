    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    document.getElementById('handleInput').addEventListener('input', async function() {
    const inputVal = this.value;
    this.dataset.fullUrl = inputVal;
    const veroRegex = /vero\.(?:com|co)\/([^\/?#\s]+)/i;
    const match = inputVal.match(veroRegex);
    
    if (match && match[1]) {
        // 1. Instantly strip the URL to just the handle
        this.value = match[1];
        
        // 2. Temporarily show a loading message in the name field
        const nameInput = document.getElementById('nameInput');
        const originalName = nameInput.value;
        nameInput.value = "Fetching name...";
        updateConsoles(); 

        try {
            // 3. Send the full Vero URL to the Vercel backend
            const response = await fetch(`/api/scrape?url=${encodeURIComponent(inputVal)}`);
            const data = await response.json();
            
            if (data.name) {
                nameInput.value = data.name; 
            } else {
                nameInput.value = originalName; 
                nameInput.placeholder = "Name not found, enter manually";
            }

            // 4. Check the bio and auto-change the level dropdown (SNAP ONLY)
            const currentGallery = document.getElementById('gallerySelect').value;
            
            if (data.bio && currentGallery.startsWith('snap_')) {
                const bioText = data.bio.toLowerCase();
                const levelSelect = document.getElementById('levelSelect');
                let autoLevel = "Artist"; // Default

                const hasWord = (word) => new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, 'i').test(bioText);

                if (hasWord("diamond")) {
                    autoLevel = "Diamond Member";
                } else if (hasWord("hof") || hasWord("hall of fame")) {
                    autoLevel = "HOF Member";
                } else if (hasWord("elite")) {
                    autoLevel = "Elite Member";
                } else if (hasWord("platinum")) {
                    autoLevel = "Platinum Member";
                } else if (hasWord("gold")) {
                    autoLevel = "VIP Gold Member"; 
                } else if (hasWord("vip")) {
                    autoLevel = "VIP Member";
                } else if (hasWord("member") || bioText.includes("Ⓜ️ember") || bioText.includes("Ⓜ")) {
                    autoLevel = "Member";
                }

                if (levelSelect) {
            // Set the value (even if it is already Artist)
            levelSelect.value = autoLevel;
            
            // Always trigger the animation to confirm the bio was checked
            levelSelect.classList.remove("auto-updated");
            void levelSelect.offsetWidth; 
            levelSelect.classList.add("auto-updated");
        }
    }
            
        } catch (error) {
            nameInput.value = originalName;
        }
        
        // 5. Update the console to show the final generated script
        updateConsoles();
    } else {
        updateConsoles(); 
    }
});

function loadSettings() {
    renderFavoriteGalleries(); // Loads your custom dropdown first
    
    // Load standard text fields
    if (localStorage.getItem('rebel_mod_name')) {
        document.getElementById('modInput').value = localStorage.getItem('rebel_mod_name');
    }
    if (localStorage.getItem('rebel_first_name')) {
        document.getElementById('firstNameInput').value = localStorage.getItem('rebel_first_name');
    }
    
    // Load the last used gallery
    if (localStorage.getItem('rebel_gallery')) {
        document.getElementById('gallerySelect').value = localStorage.getItem('rebel_gallery');
    }
    
    // Load the specific role tied to that gallery
    loadRoleForGallery(); 
    
    // Refresh the screen and console
    updateVisibility(); 
    updateConsoles();
}

{
    if (localStorage.getItem('rebel_mod_name')) document.getElementById('modInput').value = localStorage.getItem('rebel_mod_name');
    if (localStorage.getItem('rebel_role')) document.getElementById('roleSelect').value = localStorage.getItem('rebel_role');
    if (localStorage.getItem('rebel_gallery')) document.getElementById('gallerySelect').value = localStorage.getItem('rebel_gallery');
    if (localStorage.getItem('rebel_first_name')) document.getElementById('firstNameInput').value = localStorage.getItem('rebel_first_name');
    
    updateVisibility(); // Call this on load to set the correct view
    updateConsoles(); 
}

function saveSettings() {
    localStorage.setItem('rebel_mod_name', document.getElementById('modInput').value);
    localStorage.setItem('rebel_role', document.getElementById('roleSelect').value);
    localStorage.setItem('rebel_gallery', document.getElementById('gallerySelect').value);
    localStorage.setItem('rebel_first_name', document.getElementById('firstNameInput').value);
    const currentGallery = document.getElementById('gallerySelect').value;
    const currentRole = document.getElementById('roleSelect').value;
    if (currentGallery) {
        localStorage.setItem('rebel_gallery', currentGallery); // Remembers the last picked gallery
        localStorage.setItem('rebel_role_' + currentGallery, currentRole); // Remembers the role for it
    }
}

function updateVisibility() {
    const gallery = document.getElementById("gallerySelect") ? document.getElementById("gallerySelect").value : '';
    const nameGroup = document.getElementById("nameGroup");
    const firstNameGroup = document.getElementById("firstNameGroup");
    const commentGroup = document.getElementById("commentGroup");
    const commentGroup2 = document.getElementById("commentGroup2");
    const levelGroup = document.getElementById("levelGroup");
    const roleGroup = document.getElementById("roleGroup");
    const locationGroup = document.getElementById("locationWrapper");
    
    // Grab the new elements safely
    const categoryGroup = document.getElementById('categoryGroup');
    const hashtagsGroup = document.getElementById('hashtagsGroup');

    // 1. Artist Name
    if (nameGroup) {
        if (gallery === 'rebel_bnw' || gallery === 'snap_allnature' || gallery === 'snap_wildlife' || gallery === 'pictasmacro') {
            nameGroup.style.display = "block";
        } else {
            nameGroup.style.display = "none";
        }
    }

    // 2. Curator First Name
    if (firstNameGroup) {
        if (gallery.startsWith('snap_') || gallery.startsWith('pictas')) {
            firstNameGroup.style.display = "block";
        } else {
            firstNameGroup.style.display = "none";
        }
    }

    // 3. Personal Comment: Custom routing for different galleries
    if (commentGroup && commentGroup2) { 
        if (gallery === 'rebel_bnw' || gallery === 'fotomasters') {
            // Hide both comments
            commentGroup.style.display = "none";
            commentGroup2.style.display = "none";
        } else if (gallery === 'photography_hub' || gallery === 'pictasmacro') {
            // Show FIRST comment only, hide SECOND comment
            commentGroup.style.display = "block";
            commentGroup2.style.display = "none";
        } else if (gallery.startsWith('snap_') || gallery === 'monomoods') {
            // Show both comments
            commentGroup.style.display = "block";
            commentGroup2.style.display = "block";
        } else {
            // Safe fallback to hide both if a gallery isn't listed above
            commentGroup.style.display = "none";
            commentGroup2.style.display = "none";
        }
    }

    // 4. Membership Level
    if (levelGroup) {
        if (gallery === 'rebel_bnw' || gallery === 'fotomasters' || gallery === 'photography_hub' || gallery === 'pictasmacro' || gallery === 'monomoods') {
            levelGroup.style.display = "none";
        } else {
            levelGroup.style.display = "block";
        }
    }

    // 5. Role Selection: Hide for Fotomasters, Pictas, Photography Hub, Rebel BnW andMonomoods    
    if (roleGroup) {
        if (gallery === 'fotomasters' || gallery === 'pictasmacro' || gallery === 'photography_hub' || gallery === 'monomoods' || gallery === 'rebel_bnw') {
            roleGroup.style.display = "none";
        } else {
            roleGroup.style.display = "block";
        }
    }

    // Define which galleries get which input boxes
    const locationGalleries = ['snap_waters', 'snap_landscape', 'snap_australia', 'snap_germany', 'snap_mountains', 'snap_nordic', 'snap_birds', 'snap_world', 'snap_cityscape'];
    const speciesGalleries = ['snap_butterflies', 'snap_birds', 'snap_herpetology'];

    // 6. Location
    if (locationGroup) {
        if (locationGalleries.includes(gallery)) {
            locationGroup.style.display = "block";
        } else {
            locationGroup.style.display = "none";
            const searchInput = document.getElementById('locationSearchInput');
            const finalOutput = document.getElementById('finalLocationOutput');
            if (searchInput) searchInput.value = '';
            if (finalOutput) finalOutput.value = '';
        }
    }

    // 7. Species / ID Routing
    const speciesGroup = document.getElementById("speciesGroup");
    if (speciesGroup) {
        if (speciesGalleries.includes(gallery)) {
            speciesGroup.style.display = "block";
        } else {
            speciesGroup.style.display = "none";
            const speciesInput = document.getElementById('speciesInput');
            if (speciesInput) speciesInput.value = '';
        }
    }

    // 8. Category and Hashtags
    if (categoryGroup && hashtagsGroup) {
        if (gallery === 'photography_hub') {
            categoryGroup.style.display = "block";
            hashtagsGroup.style.display = "block";
        } else if (gallery === 'pictasmacro') {
            hashtagsGroup.style.display = "block";
        } else {
            categoryGroup.style.display = "none";
            hashtagsGroup.style.display = "none";
            
            const categoryInput = document.getElementById('categoryInput');
            const hashtagsInput = document.getElementById('hashtagsInput');
            if (categoryInput) categoryInput.value = '';
            if (hashtagsInput) hashtagsInput.value = '';
        }
    }
}

// 1. Set up empty arrays for our lists
let cautionList = [];
let blockedList = [];
let snapHashtags = {};


// 2. Fetch the text files and load them into the arrays
async function loadModerationLists() {
    try {
        const cautionRes = await fetch('caution-list.txt');
        const cautionText = await cautionRes.text();
        // Splits by line break, removes extra spaces, makes lowercase, and ignores blank lines
        cautionList = cautionText.split('\n').map(name => name.trim().toLowerCase()).filter(Boolean);

        const blockedRes = await fetch('blocked-list.txt');
        const blockedText = await blockedRes.text();
        blockedList = blockedText.split('\n').map(name => name.trim().toLowerCase()).filter(Boolean);

        const hashtagsRes = await fetch('snap-hashtags.json');
        snapHashtags = await hashtagsRes.json();

    } catch (error) {
        console.error("Error loading moderation lists:", error);
    }
}

// Call the function immediately
loadModerationLists();

// 3. Real-time scanner for the handle input box
document.getElementById("handleInput").addEventListener("input", function() {
    const warningMsg = document.getElementById("cautionWarning");
    
    // Extract just the username if they pasted a full VERO URL, or just take the typed text
    const veroRegex = /vero\.co\/([^\/\?\#\s]+)/i;
    const match = this.value.match(veroRegex);
    const typedText = match ? match[1].toLowerCase().trim() : this.value.toLowerCase().trim();

    // Grab the currently selected gallery
    const currentGallery = document.getElementById('gallerySelect').value;

    // Skip if input is empty OR if the gallery is NOT a Snap gallery
    if (typedText === "" || !currentGallery.startsWith('snap_')) {
        warningMsg.style.display = "none";
        updateConsoles(); 
        return;
    }

    // Check Blocked List first
    if (blockedList.includes(typedText)) {
        warningMsg.innerHTML = "🚫 User is on the BLOCKED LIST: Feature is not allowed";
        warningMsg.style.color = "#ef4444"; // Bold Red
        warningMsg.style.display = "block";
        
        // Prevent them from being chosen by clearing the script output box
        const consoleMain = document.getElementById('consoleMain');
        if (consoleMain) {
            consoleMain.value = "ERROR: Cannot generate script for a blocked user.";
        }
        
    // Check Caution List second
    } else if (cautionList.includes(typedText)) {
        warningMsg.innerHTML = "⚠️ User is on the CAUTION LIST: Double-check before featuring.";
        warningMsg.style.color = "#f59e0b"; // Warning Orange
        warningMsg.style.display = "block";
        
        updateConsoles(); // Allow the script to generate, but keep the warning visible
        
    // Clear warnings if it's a safe user
    } else {
        warningMsg.style.display = "none";
        updateConsoles(); // Standard script generation
    }
});

// Fetch the template text file from the specific subfolder
async function fetchTemplate(folder, fileName) {
    if (!fileName || fileName === '') return '';

    try {
        const response = await fetch(`Templates/${folder}/${fileName}.txt`);
        if (!response.ok) {
            throw new Error(`File not found: Templates/${folder}/${fileName}.txt`);
        }
        return await response.text();
    } catch (error) {
        return `Error: Could not load template for ${fileName}. \nMake sure Templates/${folder}/${fileName}.txt exists.`;
    }
}

// Update text areas
async function updateConsoles() {
    // 1. Grab the current handle/URL being typed
    const rawHandle = document.getElementById("handleInput").value;
    const veroRegex = /vero\.co\/([^\/\?\#\s]+)/i;
    const match = rawHandle.match(veroRegex);
    const typedText = match ? match[1].toLowerCase().trim() : rawHandle.toLowerCase().trim();

    // Grab the currently selected gallery
    const currentGallery = document.getElementById('gallerySelect').value;

    // 2. The Bouncer: Stop generation ONLY if user is blocked AND it's a Snap gallery
    if (currentGallery.startsWith('snap_') && blockedList.includes(typedText)) {
        document.getElementById('consoleMain').value = "⛔️ ERROR: User is on the Blocked List.\nScripts will not be generated.";
        document.getElementById('consoleComment1').value = "⛔️ BLOCKED";
        document.getElementById('consoleComment2').value = "⛔️ BLOCKED";
        return; // Completely kills the function so templates don't load!
    }
    const gallery = document.getElementById('gallerySelect').value;
    const role = document.getElementById('roleSelect').value;
    const name = document.getElementById('nameInput').value || '[name]';
    const handle = document.getElementById('handleInput').value || '[handle]';
    const mod = document.getElementById('modInput').value || '[username]';
    const levelSelect = document.getElementById('levelSelect');
    const level = levelSelect ? levelSelect.value : 'Artist';
    const locationOutput = document.getElementById('finalLocationOutput');
    const locationText = locationOutput ? locationOutput.value : '';    
    
    // Grab the new inputs
    const firstName = document.getElementById('firstNameInput') ? document.getElementById('firstNameInput').value : '[FirstName]';
    const categoryValue = document.getElementById('categoryInput') ? document.getElementById('categoryInput').value : '';
    // Grab the hashtags input and magically format them
    let hashtagsValue = document.getElementById('hashtagsInput') ? document.getElementById('hashtagsInput').value : '';

    if (hashtagsValue.trim() !== '') {
        hashtagsValue = hashtagsValue
        .split(/[\s,]+/) // Splits the text by spaces or commas
        .filter(Boolean) // Removes any accidental blank spaces
        .map(tag => '#' + tag.replace(/^#+/, '')) // Strips existing '#' so they don't double up, then adds exactly one
        .join(' '); // Glues them all back together with a single space
    }
    
    // Add the smart spacing for comments
    let comment = document.getElementById('commentInput') ? document.getElementById('commentInput').value : '';
    if (comment.trim() !== '') comment = '\n' + comment.trim() + '\n'; 

    let comment2 = document.getElementById('commentInput2') ? document.getElementById('commentInput2').value : '';
    if (comment2.trim() !== '') comment2 = '\n' + comment2.trim() + '\n'; 

    // Determine the comment file to load (Route Fotomasters correctly!)
    let commentFileName = 'rebel';
    if (gallery.startsWith('snap_')) {
        commentFileName = 'snap';
    } else if (gallery === 'fotomasters') {
        commentFileName = 'fotomasters'; 
    } else if (gallery === 'pictasmacro') {
        commentFileName = 'pictas';
    } else if (gallery === 'monomoods') {
        commentFileName = 'monomoods';
    } else if (gallery === 'photography_hub') {
        commentFileName = 'photography_hub';
    }

    const snapGalleryName = gallery.replace('snap_', ''); 

    // Determine the feature script file to load
    let scriptFileName = gallery;
    if (gallery.startsWith('snap_')) {
        scriptFileName = 'snap'; // Forces ALL Snap galleries to use snap.txt
    }

    // Fetch all three templates using our new folders
    let scriptText = await fetchTemplate('feature scripts', scriptFileName);
    let featureCommentText = await fetchTemplate('feature comments', commentFileName);
    let postCommentText = await fetchTemplate('post comments', commentFileName);

    // Grab the species input value (add this right above replaceTags)
    const speciesInput = document.getElementById('speciesInput');
    const speciesText = speciesInput ? speciesInput.value.trim() : '';

    // A helper function to swap all placeholders in the text
    const replaceTags = (text) => {
        const specificGalleryHashtags = snapHashtags[gallery] || '';

        // Safely build the dynamic block and add a spacer dot ONLY if multiple fields exist
        let dynamicFields = [];
        
        if (locationText && locationText.trim() !== '') {
            dynamicFields.push('\uD83D\uDCCD ' + locationText.trim());
        }
        if (speciesText && speciesText.trim() !== '') {
            dynamicFields.push('Species : ' + speciesText.trim());
        }
        if (categoryValue && categoryValue.trim() !== '') {
            dynamicFields.push(categoryValue.trim());
        }
        
        let dynamicText = dynamicFields.join('\n.\n');

        return text
            .replace(/{level}/g, level)
            .replace(/{name}/g, name)
            .replace(/{handle}/g, handle)
            .replace(/{role}/g, role)
            .replace(/{mod}/g, mod)
            .replace(/{modName}/g, firstName)
            .replace(/{personalComment}/g, comment)
            .replace(/{personalComment2}/g, comment2)
            .replace(/{snapGallery}/g, snapGalleryName)
            .replace('{location}{species}{category}', dynamicText) 
            .replace(/{hashtags}/g, hashtagsValue)
            .replace(/{galleryHashtags}/g, specificGalleryHashtags)
            .replace('#snap_flatlays\n.', '#snap_flatlays & #snap_stilllife\n.');
    };

    // Output the final generated text to all three text boxes
    document.getElementById('consoleMain').value = replaceTags(scriptText);
    document.getElementById('consoleComment1').value = replaceTags(featureCommentText);
    document.getElementById('consoleComment2').value = replaceTags(postCommentText);
}

// Copy actions
function execCopy(text, btn) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    try {
        document.execCommand('copy');
        showFeedback(btn);
    } catch (err) {
        alert('Copy failed');
    }
    document.body.removeChild(textArea);
}

function copyMain() {
    const scriptToCopy = document.getElementById('consoleMain').value;
    execCopy(scriptToCopy, document.getElementById('mainBtn'));
}

function copyPersonal(btn) {
    const textToCopy = document.getElementById('consoleComment1').value;
    execCopy(textToCopy, btn);
}

function copyPost(btn) {
    const textToCopy = document.getElementById('consoleComment2').value;
    execCopy(textToCopy, btn);
}

function showFeedback(btn) {
    const oldText = btn.innerText;
    btn.innerText = "✓ Copied!";
    btn.classList.add('success');
    setTimeout(() => {
        btn.innerText = oldText;
        btn.classList.remove('success');
    }, 1200);
}

function clearArtistFields() {
    document.getElementById('nameInput').value = '';
    document.getElementById('handleInput').value = '';
    document.getElementById('handleInput').dataset.fullUrl = '';
    const warningMsg = document.getElementById("cautionWarning");
    if (warningMsg) warningMsg.style.display = "none";
    
    const levelSelect = document.getElementById('levelSelect');
    if (levelSelect) {
        levelSelect.value = 'Artist';
    }
    
    const commentInput = document.getElementById('commentInput');
    if (commentInput) commentInput.value = '';
    
    const commentInput2 = document.getElementById('commentInput2');
    if (commentInput2) commentInput2.value = '';

    const locationSearch = document.getElementById('locationSearchInput');
    if (locationSearch) locationSearch.value = '';

    const locationFinal = document.getElementById('finalLocationOutput');
    if (locationFinal) locationFinal.value = '';

    const photoPreview = document.getElementById('iosPhotoFallback');
    if (photoPreview) {
        photoPreview.remove(); 
    }

    if (document.getElementById('nameGroup').style.display === 'none') {
        document.getElementById('handleInput').focus();
    } else {
        document.getElementById('nameInput').focus();
    }

    const categoryInput = document.getElementById('categoryInput');
    if (categoryInput) categoryInput.value = '';

    const hashtagsInput = document.getElementById('hashtagsInput');
    if (hashtagsInput) hashtagsInput.value = '';

    const speciesInput = document.getElementById('speciesInput');
    if (speciesInput) speciesInput.value = '';

    updateConsoles(); 
}

async function pasteFromClipboard() {
    try {
        const handleInput = document.getElementById('handleInput');
        
        // 1. Explicitly ONLY read from clipboard. Never write to it!
        const text = await navigator.clipboard.readText();
        if (!text) return;

        handleInput.value = text;
        
        // 2. Trigger input event so the scraper fires
        handleInput.dispatchEvent(new Event('input', { bubbles: true }));
        
    } catch (err) {
        console.error('Clipboard read failed: ', err);
        // Fail silently so buttons never freeze up
    }
}

async function fetchSinglePhoto(btn) {
    const inputElement = document.getElementById('handleInput');
    const fullUrl = inputElement ? (inputElement.dataset.fullUrl || inputElement.value) : null;

    if (!fullUrl || !fullUrl.includes('vero.co')) {
        alert("Please paste a full Vero post link to fetch the photo.");
        btn.innerText = "Fetch Single Photo 🖼️"; 
        return;
    }

    if (!localStorage.getItem('rebel_photo_consent')) {
        const agreed = confirm("LEGAL AGREEMENT:\n\nBy clicking OK, you agree that this photo will ONLY be used for feature purposes and must be permanently deleted from your device immediately after posting.");
        if (!agreed) {
            btn.innerText = "Fetch Single Photo 🖼️"; 
            return;
        }
        localStorage.setItem('rebel_photo_consent', 'true');
    }

    btn.innerText = "Searching post...";
    btn.disabled = true;

    try {
        const response = await fetch(`/api/photo?url=${encodeURIComponent(fullUrl)}&t=${Date.now()}`);
        const data = await response.json();

        if (!data.images || data.images.length === 0) throw new Error("No images found");

        let previewBox = document.getElementById('carouselPreviewBox');
        if (!previewBox) {
            previewBox = document.createElement('div');
            previewBox.id = 'carouselPreviewBox';
            previewBox.style.marginTop = '16px';
            btn.closest('.page-section').appendChild(previewBox);
        }
        previewBox.innerHTML = '';
        previewBox.style.display = 'block';
        previewBox.style.textAlign = 'center';

        btn.innerText = "Processing...";

        // THE FIX: The backend already put the massive 1620px image at index 0. 
        // We skip the CloudFront WAF check entirely and feed it straight to the safe Proxy.
        const targetUrl = data.images[0];

        const proxyResp = await fetch(`/api/photo?targetImage=${encodeURIComponent(targetUrl)}&t=${Date.now()}`);
        const blob = await proxyResp.blob();
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const now = new Date();
            const timestamp = now.getFullYear() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') + "_" +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0') +
                String(now.getSeconds()).padStart(2, '0');
            const filename = `feature_${timestamp}.png`;
            
            // 1. Swap between the button and the iOS text
const downloadUI = isIOS 
    ? `<div class="ios-save-text">📱 Long press photo to save to gallery</div>`
    : `<button id="nativeDownloadBtn" class="download-photo-btn">⬇️ Download Photo</button>`;

previewBox.innerHTML = `
    ${downloadUI}
    <br>
    <img src="${img.src}" class="photo-preview-img">
    <div id="closeFetchPreview" class="close-preview-btn">
        ✖ Tap/click here to close
    </div>
`;

// 2. The Escape key listener
document.addEventListener('keydown', function escListener(e) {
    if (e.key === 'Escape') {
        const closeBtn = document.getElementById('closeFetchPreview');
        if (closeBtn) {
            closeBtn.click(); 
            document.removeEventListener('keydown', escListener); 
        }
    }
});

// 3. Protect the click event so it only runs on Android/Desktop
const singleDownloadBtn = document.getElementById('nativeDownloadBtn');
if (singleDownloadBtn) {
    singleDownloadBtn.onclick = (e) => {
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "✅ Downloaded!";
        btn.classList.add('downloaded');

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 'image/png');

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('downloaded');
        }, 2000);
    };
}

            const allBtns = btn.closest('.page-section').querySelectorAll('button');
            const btn1 = allBtns[0]; 
            const btn2 = allBtns[1]; 
            const origBtn1Click = btn1.onclick;
            const origBtn2Click = btn2.onclick;
            const origBtn2Text = btn2.innerText; 
            
// 1. TinEye Button Check
    btn1.innerText = "TinEye Check 🔍";
    btn1.disabled = false;
    btn1.onclick = (e) => {
        e.preventDefault();
        window.open(`https://tineye.com/search?url=${encodeURIComponent(targetUrl)}`, '_blank');
    };

    // 2. Google Lens Check
    btn2.innerText = "Google Lens Check 🔍";
    btn2.disabled = false;
    btn2.onclick = (e) => {
        e.preventDefault();
        window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(targetUrl)}`, '_blank');
    };

    // 3. Hive Check
    let hiveBtn = document.getElementById('hiveCheckBtn');
    if (!hiveBtn) {
        hiveBtn = document.createElement('button');
        hiveBtn.id = 'hiveCheckBtn';
        hiveBtn.className = btn1.className;
        hiveBtn.style.marginTop = '10px';
        btn2.insertAdjacentElement('afterend', hiveBtn);
    }
    hiveBtn.style.display = 'block';
    hiveBtn.innerText = "Hive Check 🤖";
    hiveBtn.onclick = (e) => {
        e.preventDefault();
        
        // Auto-copy the public web link (targetUrl), not the local blob image!
        navigator.clipboard.writeText(targetUrl);
        
        // Google Analytics tracking
        if (typeof gtag === 'function') {
            gtag('event', 'click', {
                'event_category': 'engagement',
                'event_label': 'Hive_Button_Clicked'
            });
        }
        
        window.open('https://hivedetect.ai/', '_blank');
    };
    // --- NOW OPEN THE CLOSE FUNCTION ---
    document.getElementById('closeFetchPreview').onclick = () => {
        previewBox.innerHTML = '';
        previewBox.style.display = 'none';

        btn1.innerText = "Fetch Single Photo 🖼️";
        btn1.onclick = origBtn1Click;
        
        btn2.innerText = origBtn2Text;
        btn2.onclick = origBtn2Click;
        
        // Hide the Hive button when closing the photo
        if (hiveBtn) {
            hiveBtn.style.display = 'none';
        }
    };        };

        img.src = URL.createObjectURL(blob);

    } catch (err) {
        alert("Error extracting photo. This profile is private.");
        btn.innerText = "Fetch Single Photo 🖼️";
        btn.disabled = false;
    }
}

async function fetchAndDownloadPhoto(btn) {
    if (btn.innerText.includes("Close Carousel")) {
        const previewBox = document.getElementById('carouselPreviewBox');
        if (previewBox) {
            previewBox.innerHTML = '';
            previewBox.style.display = 'none';
        }
        btn.innerText = "Fetch Carousel 🎠";

        let hiveBtn = document.getElementById('hiveCheckBtn');
        if (!hiveBtn) {
            hiveBtn = document.createElement('button');
            hiveBtn.id = 'hiveCheckBtn';
            hiveBtn.className = btn.className; 
            hiveBtn.style.marginTop = '10px';
            btn.insertAdjacentElement('afterend', hiveBtn);
        }
        hiveBtn.style.display = 'block';
        hiveBtn.innerText = "Hive Check 🤖";
        hiveBtn.onclick = (e) => {
            e.preventDefault();
            hiveBtn.style.display = 'none';
            window.open('https://hivedetect.ai/', '_blank');
        };
        return;
    }

    const inputElement = document.getElementById('handleInput');
    const fullUrl = inputElement ? (inputElement.dataset.fullUrl || inputElement.value) : null;

    if (!fullUrl || !fullUrl.includes('vero.co')) {
        alert("Please paste a full Vero post link to fetch the photo.");
        btn.innerText = "Fetch Carousel 🎠";
        return;
    }

    if (!localStorage.getItem('rebel_photo_consent')) {
        const agreed = confirm("LEGAL AGREEMENT:\n\nBy clicking OK, you agree that this photo will ONLY be used for feature purposes and must be permanently deleted from your device immediately after posting.");
        if (!agreed) {
            btn.innerText = "Fetch Carousel 🎠"; 
            return;
        }
        localStorage.setItem('rebel_photo_consent', 'true');
    }

    btn.innerText = "Searching post...";
    btn.disabled = true;

    try {
        const response = await fetch(`/api/photo?url=${encodeURIComponent(fullUrl)}&t=${Date.now()}`);
        const data = await response.json();

        if (!data.images || data.images.length === 0) throw new Error("No images found");

        let previewBox = document.getElementById('carouselPreviewBox');
        if (!previewBox) {
            previewBox = document.createElement('div');
            previewBox.id = 'carouselPreviewBox';
            previewBox.style.marginTop = '16px';
            btn.closest('.page-section').appendChild(previewBox);
        }
        
        previewBox.innerHTML = ''; 
        previewBox.style.display = 'flex'; 
        previewBox.style.flexDirection = 'column';
        
        const activePreviewArea = document.createElement('div');
        activePreviewArea.id = 'activePreviewArea';
        previewBox.appendChild(activePreviewArea);

        const instruction = document.createElement('span');
        instruction.style.width = '100%';
        instruction.style.display = 'block';
        instruction.style.textAlign = 'center';
        instruction.style.fontSize = '0.8rem';
        instruction.style.color = '#94a3b8';
        instruction.style.marginBottom = '8px';
        instruction.innerText = 'Tap photo to process & download';
        previewBox.appendChild(instruction);
        
        const scrollContainer = document.createElement('div');
        scrollContainer.style.display = 'flex';
        scrollContainer.style.flexWrap = 'wrap'; // Allows it to drop to the next line
        scrollContainer.style.justifyContent = 'center';
        scrollContainer.style.gap = '8px'; // Slightly tighter gap for the grid
        scrollContainer.style.width = '100%';
        scrollContainer.style.paddingBottom = '8px';
        previewBox.appendChild(scrollContainer);

        const allBtns = btn.closest('.page-section').querySelectorAll('button');
        const btn1 = allBtns[0]; 
        const btn2 = allBtns[1]; 
        const origBtn1Click = btn1.onclick;
        const origBtn2Click = btn2.onclick;

        // Route all carousel thumbnails through the proxy to bypass WAF
        data.images.forEach(imgUrl => {
            const thumb = document.createElement('img');
            // Calculate width to fit exactly 3 per row (minus the gaps)
            thumb.style.width = 'calc(33.33% - 6px)'; 
            thumb.style.aspectRatio = '1 / 1'; // Makes them perfect squares
            thumb.style.objectFit = 'cover'; // Crops beautifully without squishing
            thumb.style.borderRadius = '8px';
            thumb.style.cursor = 'pointer';
            thumb.style.border = '2px solid #334155';
            thumb.style.flexShrink = '0'; // Keeps their shape in single-row mode
            
            fetch(`/api/photo?targetImage=${encodeURIComponent(imgUrl)}&t=${Date.now()}`)
                .then(res => res.blob())
                .then(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    thumb.src = blobUrl;

                    thumb.onclick = () => {
                        btn.innerText = "Processing...";
                        
                        // Switch to horizontal scrolling row
                        scrollContainer.style.flexWrap = 'nowrap';
                        scrollContainer.style.overflowX = 'auto';
                        scrollContainer.style.justifyContent = 'flex-start';
                        Array.from(scrollContainer.children).forEach(t => {
                            t.style.width = '80px'; // Shrink them out of the way
                        });

        const img = new Image();
                        
    img.onload = () => {
        const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                            
        const now = new Date();
        const timestamp = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') + "_" +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');
        const filename = `feature_${timestamp}.png`;
                            
            activePreviewArea.style.textAlign = 'center';
            activePreviewArea.style.marginBottom = '16px';
                            
       // 1. Swap between the button and the iOS text
const downloadUI = isIOS 
    ? `<div class="ios-save-text">📱 Long press photo to save to gallery</div>`
    : `<button id="nativeCarouselDownloadBtn" class="download-photo-btn">⬇️ Download Photo</button>`;

activePreviewArea.innerHTML = `
    ${downloadUI}
    <br>
    <img src="${img.src}" class="photo-preview-img">
    <div id="closeFetchPreview" class="close-preview-btn">
        ✖ Tap/click here to close
    </div>
`;

// 2. The Escape key listener
document.addEventListener('keydown', function escListener(e) {
    if (e.key === 'Escape') {
        const closeBtn = document.getElementById('closeFetchPreview');
        if (closeBtn) {
            closeBtn.click(); 
            document.removeEventListener('keydown', escListener); 
        }
    }
});

activePreviewArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

// 3. Protect the click event so it only runs on Android/Desktop
const carouselDownloadBtn = document.getElementById('nativeCarouselDownloadBtn');
if (carouselDownloadBtn) {
    carouselDownloadBtn.onclick = (e) => {
        const btn = e.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = "✅ Downloaded!";
        btn.classList.add('downloaded');

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 'image/png');

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('downloaded');
        }, 2000);
    };
}
                            
// 1. TinEye Button
                            btn1.innerText = "TinEye Check 🔍";
                            btn1.disabled = false;
                            btn1.onclick = (e) => {
                                e.preventDefault();
                                window.open(`https://tineye.com/search?url=${encodeURIComponent(imgUrl)}`, '_blank');
                            };
                            
                            // 2. Google Lens Button
                            btn2.innerText = "Google Lens Check 🔍";
                            btn2.disabled = false;
                            btn2.onclick = (e) => {
                                e.preventDefault();
                                window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imgUrl)}`, '_blank');
                            };

                            // 3. Hive Button (Built BEFORE close function)
                            let hiveBtn = document.getElementById('hiveCheckBtn');
                            if (!hiveBtn) {
                                hiveBtn = document.createElement('button');
                                hiveBtn.id = 'hiveCheckBtn';
                                hiveBtn.className = btn1.className; 
                                hiveBtn.style.marginTop = '10px';
                                btn2.insertAdjacentElement('afterend', hiveBtn);
                            }
                            hiveBtn.style.display = 'block';
                            hiveBtn.innerText = "Hive Check 🤖";
                            hiveBtn.onclick = (e) => {
                                e.preventDefault();
                                
                                // Auto-copy the carousel link!
                                navigator.clipboard.writeText(imgUrl); 
                                
                                if (typeof gtag === 'function') {
                                    gtag('event', 'click', {
                                        'event_category': 'engagement',
                                        'event_label': 'Hive_Button_Clicked'
                                    });
                                }
                                window.open('https://hivedetect.ai/', '_blank');
                            };
                            
                            // 4. Close Button Logic
                            document.getElementById('closeFetchPreview').onclick = () => {
                                activePreviewArea.innerHTML = '';

                                // Switch back to the 3-column wrap grid
                                scrollContainer.style.flexWrap = 'wrap';
                                scrollContainer.style.overflowX = 'visible';
                                scrollContainer.style.justifyContent = 'center';
                                Array.from(scrollContainer.children).forEach(t => {
                                    t.style.width = 'calc(33.33% - 6px)'; // Restore square size
                                });
                                
                                btn1.innerText = "Fetch Single Photo 🖼️";
                                btn1.onclick = origBtn1Click;
                                
                                btn2.innerText = "Close Carousel ❌";
                                btn2.onclick = origBtn2Click;

                                // Hide Hive button
                                if (hiveBtn) hiveBtn.style.display = 'none';
                            };
                                                        
                            document.getElementById('closeFetchPreview').onclick = () => {
                                activePreviewArea.innerHTML = '';

                                // Switch back to the 3-column wrap grid
                                scrollContainer.style.flexWrap = 'wrap';
                                scrollContainer.style.overflowX = 'visible';
                                scrollContainer.style.justifyContent = 'center';
                                Array.from(scrollContainer.children).forEach(t => {
                                    t.style.width = 'calc(33.33% - 6px)'; // Restore square size
                                });
                                
                                btn1.innerText = "Fetch Single Photo 🖼️";
                                btn1.onclick = origBtn1Click;
                                
                                btn2.innerText = "Close Carousel ❌";
                                btn2.onclick = origBtn2Click;

                                let hiveBtn = document.getElementById('hiveCheckBtn');
                                if (!hiveBtn) {
                                    hiveBtn = document.createElement('button');
                                    hiveBtn.id = 'hiveCheckBtn';
                                    hiveBtn.className = btn1.className; 
                                    hiveBtn.style.marginTop = '10px';
                                    btn2.insertAdjacentElement('afterend', hiveBtn);
                                }
                                hiveBtn.style.display = 'block';
                                hiveBtn.innerText = "Hive Check ✨";
                                hiveBtn.onclick = (e) => {
                                    e.preventDefault();
                                    hiveBtn.style.display = 'none';
                                    window.open('https://hivedetect.ai/', '_blank');
                                };
                            };
                        };
                        
                        img.src = blobUrl;
                    };
                });
            scrollContainer.appendChild(thumb);
        });

        btn.innerText = "Close Carousel ❌";
        btn.disabled = false;

    } catch (err) {
        alert("Error extracting photos. This profile is private.");
        btn.innerText = "Fetch Carousel 🎠";
        btn.disabled = false;
    }
}

// --- OpenStreetMap Location Search Logic ---
const locationSearchInput = document.getElementById('locationSearchInput');
const locationDropdown = document.getElementById('locationDropdown');
const finalLocationOutput = document.getElementById('finalLocationOutput'); 

let typingTimer;

if (locationSearchInput) {
    locationSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(typingTimer);

        if (query.length < 3) {
            locationDropdown.style.display = 'none';
            return;
        }

        typingTimer = setTimeout(async () => {
            try {
                // Fetch from OSM, requiring country details
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=en`);
                const data = await response.json();
                
                locationDropdown.innerHTML = '';
                
                if (data.length > 0) {
                    data.forEach(place => {
                        const li = document.createElement('li');
                        li.style.padding = '10px';
                        li.style.cursor = 'pointer';
                        li.style.borderBottom = '1px solid #334155';
                        li.style.color = 'white';
                        
                        // Extract specific feature and country
                        const primaryFeature = place.display_name.split(',')[0].trim();
                        const country = place.address && place.address.country ? place.address.country : '';
                        
                        let cleanName = primaryFeature;
                        if (country && primaryFeature.toLowerCase() !== country.toLowerCase()) {
                            cleanName = `${primaryFeature}, ${country}`;
                        }
                        
                        li.innerText = cleanName;
                        
                        li.onmouseover = () => li.style.background = '#334155';
                        li.onmouseout = () => li.style.background = 'transparent';
                        
                        li.onclick = () => {
                            finalLocationOutput.value = ` ${cleanName}`;
                            locationSearchInput.value = ''; 
                            locationDropdown.style.display = 'none';
                            updateConsoles();
                            };
                        
                        locationDropdown.appendChild(li);
                    });
                    locationDropdown.style.display = 'block';
                } else {
                    locationDropdown.style.display = 'none';
                }
            } catch (err) {
                console.error("Map fetch failed:", err);
            }
        }, 500); // 500ms debounce
    });

    // Close the dropdown if clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== locationSearchInput) {
            locationDropdown.style.display = 'none';
        }
    });
}

// --- iNaturalist Species Search ---
const speciesSearchInput = document.getElementById('speciesSearchInput');
const speciesDropdown = document.getElementById('speciesDropdown');
const speciesInput = document.getElementById('speciesInput');
let speciesTimeout = null;

if (speciesSearchInput) {
    speciesSearchInput.addEventListener('input', function() {
        clearTimeout(speciesTimeout); // Prevents spamming the API on every single keystroke
        const query = this.value.trim();
        
        if (query.length < 3) {
            speciesDropdown.style.display = 'none';
            return;
        }

        // Wait 300ms after they stop typing before searching
        speciesTimeout = setTimeout(async () => {
            try {
                // locale=en forces English common names
                const response = await fetch(`https://api.inaturalist.org/v1/taxa?q=${query}&is_active=true&per_page=5&locale=en`);
                const data = await response.json();
                
                speciesDropdown.innerHTML = '';
                
                if (data.results && data.results.length > 0) {
                    data.results.forEach(taxon => {
                        const li = document.createElement('li');
                        // Styling for the dropdown items
                        li.style.padding = "10px";
                        li.style.cursor = "pointer";
                        li.style.borderBottom = "1px solid #444";
                        
                        const commonName = taxon.preferred_common_name || '';
                        const scientificName = taxon.name || '';
                        
                        // Format: English Name (Latin Name)
                        const displayName = commonName ? `${commonName} (${scientificName})` : scientificName;
                        
                        li.textContent = displayName;
                        
                        // Hover effect
                        li.onmouseover = () => li.style.background = "#3a3a3a";
                        li.onmouseout = () => li.style.background = "transparent";
                        
                        // When clicked: push to final input, hide dropdown, trigger template update
                        li.onclick = () => {
                            // Jana can manually add the 🦋 or 🐦 emojis here if needed!
                            speciesInput.value = displayName; 
                            speciesDropdown.style.display = 'none';
                            speciesSearchInput.value = ''; 
                            updateConsoles(); 
                        };
                        speciesDropdown.appendChild(li);
                    });
                    speciesDropdown.style.display = 'block';
                } else {
                    speciesDropdown.style.display = 'none';
                }
            } catch (error) {
                console.error("Error fetching species data:", error);
            }
        }, 300);
    });
}

// Hide dropdown if user clicks somewhere else on the page
document.addEventListener('click', function(e) {
    if (speciesSearchInput && !speciesSearchInput.contains(e.target) && !speciesDropdown.contains(e.target)) {
        speciesDropdown.style.display = 'none';
    }
});

// Master dictionary to map the backend values to display names
const galleryNames = {
    // Your Originals & Non-Snap Galleries
    "rebel_bnw": "Rebel BNW",
    "fotomasters": "Fotomasters",
    "pictasmacro": "Pictasmacro",
    "monomoods": "Monomoods",
    "photography_hub": "Photography Hub",

    // Snap Galleries
    "snap_skies": "Snap Skies",
    "snap_seasons": "Snap Seasons",
    "snap_australia": "Snap Australia",
    "snap_allpets": "Snap All Pets",
    "snap_canada": "Snap Canada",
    "snap_abandoned": "Snap Abandoned",
    "snap_silhouette": "Snap Silhouette",
    "snap_people": "Snap People",
    "snap_allwhite": "Snap Allwhite",
    "snap_butterflies": "Snap Butterflies",
    "snap_waters": "Snap Waters",
    "snap_allsports": "Snap Allsports",
    "snap_toys": "Snap Toys",
    "snap_insects": "Snap Insects",
    "snap_gardening": "Snap Gardening",
    "snap_middleeast": "Snap Middle East",
    "snap_fishing": "Snap Fishing",
    "snap_communityarts": "Snap Community Arts",
    "snap_newartist": "Snap New Artist",
    "snap_communitymember": "Snap Community Member",
    "snap_challenge": "Snap Challenge",
    "snap_artgallery": "Snap Artgallery",
    "snap_beaches": "Snap Beaches",
    "snap_hikes": "Snap Hikes",
    "snap_minimal": "Snap Minimal",
    "snap_transports": "Snap Transports",
    "snap_ai": "Snap AI",
    "snap_landscape": "Snap Landscape",
    "snap_depthoffield": "Snap Depthoffield",
    "snap_bnw": "Snap BNW",
    "snap_asia": "Snap Asia",
    "snap_mountains": "Snap Mountains",
    "snap_herpetology": "Snap Herpetology",
    "snap_birds": "Snap Birds",
    "snap_germany": "Snap Germany",
    "snap_allnature": "Snap Allnature",
    "snap_wildlife": "Snap Wildlife",
    "snap_potd": "Snap POTD",
    "snap_macro": "Snap Macro",
    "snap_nordic": "Snap Nordic",
    "snap_flowers": "Snap Flowers",
    "snap_colours": "Snap Colours",
    "snap_birds": "Snap Birds",
    "snap_longexposure": "Snap Longexposure",
    "snap_lighthouses": "Snap Lighthouses",
    "snap_mobile": "Snap Mobile",
    "snap_moody": "Snap Moody",
    "snap_nightshots": "Snap Nightshots",
    "snap_abstract": "Snap Abstract",
    "snap_coffee": "Snap Coffee",
    "snap_allblack": "Snap Allblack",
    "snap_country": "Snap Country",
    "snap_flatlays": "Snap Flatlays",
    "snap_numbers": "Snap Numbers",
    "snap_world": "Snap World",
    "snap_cityscape": "Snap Cityscape",
    "snap_street": "Snap Street"
};

function addGalleryToFavorites() {
    const searchInput = document.getElementById('gallerySearch');
    const selectedText = searchInput.value.trim();
    
    // Find the backend ID that matches the beautiful text they typed/selected
    const selectedValue = Object.keys(galleryNames).find(key => galleryNames[key] === selectedText);
    
    if (selectedValue) {
        let savedGalleries = JSON.parse(localStorage.getItem('rebel_my_galleries') || '[]');
        
        if (!savedGalleries.includes(selectedValue)) {
            savedGalleries.push(selectedValue);
            localStorage.setItem('rebel_my_galleries', JSON.stringify(savedGalleries));
            renderFavoriteGalleries();
            
            document.getElementById('gallerySelect').value = selectedValue;
            saveSettings();
            updateVisibility();
            updateConsoles();
        }
        searchInput.value = ''; // Clear the search box
    } else {
        alert("Please select a valid gallery from the dropdown list.");
    }
}

function removeGalleryFromFavorites() {
    const select = document.getElementById('gallerySelect');
    const valueToRemove = select.value;
    
    if (valueToRemove) {
        let savedGalleries = JSON.parse(localStorage.getItem('rebel_my_galleries') || '[]');
        savedGalleries = savedGalleries.filter(g => g !== valueToRemove);
        localStorage.setItem('rebel_my_galleries', JSON.stringify(savedGalleries));
        
        renderFavoriteGalleries();
        saveSettings();
        updateVisibility();
        updateConsoles();
    }
}

function renderFavoriteGalleries() {
    const select = document.getElementById('gallerySelect');
    const savedGalleries = JSON.parse(localStorage.getItem('rebel_my_galleries') || '[]');
    
    select.innerHTML = ''; // Clear current options
    
    if (savedGalleries.length === 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.text = "-- Add a gallery above --";
        select.appendChild(defaultOption);
    } else {
        savedGalleries.forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.text = galleryNames[val];
            select.appendChild(opt);
        });
    }
}

// --- Custom Searchable Dropdown Logic ---
const searchInput = document.getElementById('gallerySearch');
const customList = document.getElementById('customGalleryList');

function renderCustomDropdown(filterText = '') {
    if (!customList) return;
    customList.innerHTML = ''; // Clear current list
    
    // Grab all the display names (e.g., "Rebel BNW") from your dictionary
    const allGalleryDisplayNames = Object.values(galleryNames);
    
    // Filter based on what the user types
    const filtered = allGalleryDisplayNames.filter(name => 
        name.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        const noResult = document.createElement('div');
        noResult.className = 'custom-dropdown-item';
        noResult.textContent = 'No gallery found';
        customList.appendChild(noResult);
    } else {
        // Create a clickable item for each matching gallery
        filtered.forEach(name => {
            const div = document.createElement('div');
            div.className = 'custom-dropdown-item';
            div.textContent = name;
            div.onclick = function() {
                searchInput.value = name;
                customList.style.display = 'none'; // Hide list after selection
            };
            customList.appendChild(div);
        });
    }
}

// Event Listeners to open, filter, and close the custom list
if (searchInput && customList) {
    searchInput.addEventListener('focus', () => {
        renderCustomDropdown(searchInput.value);
        customList.style.display = 'block';
    });
    
    searchInput.addEventListener('click', () => {
        renderCustomDropdown(searchInput.value);
        customList.style.display = 'block';
    });

    searchInput.addEventListener('input', (e) => {
        renderCustomDropdown(e.target.value);
        customList.style.display = 'block';
    });
    
    // Hide the list if you click anywhere outside of it
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !customList.contains(e.target)) {
            customList.style.display = 'none';
        }
    });
}

function loadRoleForGallery() {
    const currentGallery = document.getElementById('gallerySelect').value;
    if (currentGallery) {
        // Look for a specifically saved role for this gallery
        const savedRole = localStorage.getItem('rebel_role_' + currentGallery);
        if (savedRole) {
            document.getElementById('roleSelect').value = savedRole;
        } else {
            // Default to 'Mod' if no role has been saved for this gallery yet
            document.getElementById('roleSelect').value = 'Mod';
        }
    }
}

document.getElementById('gallerySelect').addEventListener('change', function() {
    saveSettings();
    loadRoleForGallery();
    updateVisibility();
    updateConsoles();
});
