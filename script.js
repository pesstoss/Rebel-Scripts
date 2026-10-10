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
                nameInput.value = data.name; // Insert the scraped name!
            } else {
                nameInput.value = originalName; // Revert if name wasn't found
                nameInput.placeholder = "Name not found, enter manually";
            }
        } catch (error) {
            nameInput.value = originalName;
        }
        
        // 4. Update the console to show the final generated script
        updateConsoles();
    } else {
        updateConsoles(); 
    }
});

function loadSettings() {
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
}

function updateVisibility() {
    const gallery = document.getElementById("gallerySelect").value;
    
    const nameGroup = document.getElementById("nameGroup");
    const firstNameGroup = document.getElementById("firstNameGroup");
    const commentGroup = document.getElementById("commentGroup");
    const commentGroup2 = document.getElementById("commentGroup2");
    const levelGroup = document.getElementById("levelGroup");

    // 1. Artist Name: Only for Rebel BNW, Snap Allnature, and Snap Wildlife
    if (gallery === 'rebel_bnw' || gallery === 'snap_allnature' || gallery === 'snap_wildlife') {
        nameGroup.style.display = "block";
    } else {
        nameGroup.style.display = "none";
    }

    // 2. Curator First Name: Only for Snap galleries
    if (gallery.startsWith('snap_')) {
        firstNameGroup.style.display = "block";
    } else {
        firstNameGroup.style.display = "none";
    }

    // 3. Personal Comment: Everyone gets it EXCEPT Rebel BNW
    if (commentGroup && commentGroup2) { 
        if (gallery !== 'rebel_bnw') {
            commentGroup.style.display = "block";
            commentGroup2.style.display = "block";
        } else {
            commentGroup.style.display = "none";
            commentGroup2.style.display = "none";
        }
    }
    // 4. Membership Level: Hide for Rebel BNW
        if (gallery === 'rebel_bnw') {
            levelGroup.style.display = "none";
        } else {
            levelGroup.style.display = "block";
        }
}

// 1. Usernames from the caution list (must be all lowercase!)
    const cautionList = [
    "anacvitoria",
    "ashishkumar",
    "ashley1313",
    "augenxblick",
    "barrystone",
    "beegabe",
    "droneaboveireland",
    "deeweeuavp",
    "etoile6",
    "marieo0",
    "photoamateur05",
    "cathy00",
    "countrymansam",
    "elatedsoul",
    "elias sairafi",
    "frapan8475",
    "hobbyfotograf_robert",
    "jackdav",
    "lucyh",
    "marcoaurelioantonioaugusto",
    "marleen2024",
    "miss_interpols_world",
    "najmcphotography",
    "nathaliejessart",
    "palatina",
    "retrograyde",
    "roni001",
    "sakipix_",
    "sergeyyy",
    "streetsoul",
    "trondtopstad",
    "volwitt51",
    "wao82",
    "wayneb"
    ];

    // 2. Real-time scanner for the handle input box
    document.getElementById("handleInput").addEventListener("input", function() {
        const warningMsg = document.getElementById("cautionWarning");
        const typedText = this.value.toLowerCase(); 
        
        // Check if the typed text contains any username from the caution list
        // This works whether they type just the handle or paste a full Vero link
        const isOnList = cautionList.some(badUser => typedText.includes(badUser));

        // Show the warning if there is a match, otherwise keep it hidden
        if (isOnList && typedText.trim() !== "") {
            warningMsg.style.display = "block";
        } else {
            warningMsg.style.display = "none";
        }
    });

// Fetch the template text file from the specific subfolder
async function fetchTemplate(folder, fileName) {
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
    const gallery = document.getElementById('gallerySelect').value;
    const role = document.getElementById('roleSelect').value;
    const name = document.getElementById('nameInput').value || '[name]';
    const handle = document.getElementById('handleInput').value || '[handle]';
    const mod = document.getElementById('modInput').value || '[username]';
    const levelSelect = document.getElementById('levelSelect');
    const level = levelSelect ? levelSelect.value : 'Artist';
    
    // Grab the new inputs
    const firstName = document.getElementById('firstNameInput') ? document.getElementById('firstNameInput').value : '[FirstName]';
    
    let comment = document.getElementById('commentInput') ? document.getElementById('commentInput').value : '';
    if (comment.trim() !== '') comment = '\n' + comment.trim() + '\n'; 

    let comment2 = document.getElementById('commentInput2') ? document.getElementById('commentInput2').value : '';
    if (comment2.trim() !== '') comment2 = '\n' + comment2.trim() + '\n';

    // Determine the comment file to load (snap or rebel) and extract the snap gallery name
    const commentFileName = gallery.startsWith('snap_') ? 'snap' : 'rebel';
    const snapGalleryName = gallery.replace('snap_', ''); // Turns 'snap_asia' into 'asia'

    // Fetch all three templates using our new folders!
    let scriptText = await fetchTemplate('feature scripts', gallery);
    let featureCommentText = await fetchTemplate('feature comments', commentFileName);
    let postCommentText = await fetchTemplate('post comments', commentFileName);

    // A helper function to swap all placeholders in the text
    const replaceTags = (text) => {
        return text
            .replace(/{level}/g, level)
            .replace(/{name}/g, name)
            .replace(/{handle}/g, handle)
            .replace(/{role}/g, role)
            .replace(/{mod}/g, mod)
            .replace(/{modName}/g, firstName)
            .replace(/{personalComment}/g, comment)
            .replace(/{personalComment2}/g, comment2)
            .replace(/{snapGallery}/g, snapGalleryName);
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
    
    // Clear the personal comments
    const commentInput = document.getElementById('commentInput');
    if (commentInput) commentInput.value = '';
    
    const commentInput2 = document.getElementById('commentInput2');
    if (commentInput2) commentInput2.value = '';

    const photoPreview = document.getElementById('iosPhotoFallback');
    if (photoPreview) {
        photoPreview.remove(); 
    }

    if (document.getElementById('nameGroup').style.display === 'none') {
        document.getElementById('handleInput').focus();
    } else {
        document.getElementById('nameInput').focus();
    }
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

async function fetchAndDownloadPhoto(btn) {
        const fullUrl = document.getElementById('handleInput').dataset.fullUrl;
        
        if (!fullUrl || !fullUrl.includes('vero.co')) {
            alert("Please paste a full Vero post link to fetch the photo.");
            return;
        }

        if (!localStorage.getItem('rebel_photo_consent')) {
            const agreed = confirm("LEGAL AGREEMENT:\n\nBy clicking OK, you agree that this photo will ONLY be used for feature purposes and must be permanently deleted from your device immediately after posting. Do you agree?");
            if (!agreed) return;
            localStorage.setItem('rebel_photo_consent', 'true');
        }

        const originalText = btn.innerText;
        btn.innerText = "Fetching... ⏳";
        btn.disabled = true;

        try {
            const response = await fetch(`/api/photo?url=${encodeURIComponent(fullUrl)}`);
            if (!response.ok) throw new Error("Could not fetch photo");
            
            const blob = await response.blob();
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                const pngUrl = canvas.toDataURL('image/png');
                
               // 1. Trigger the standard auto-download for Android/Mac/Windows
                const dateTimeString = new Date().toISOString().replace(/:/g, '-').slice(0, 16);
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `featured_photo_${dateTimeString}.png`;
                link.click();
                
                // 2. The iOS Fix: Display the photo directly on the screen so you can long-press it
                let previewBox = document.getElementById('iosPhotoFallback');
                if (!previewBox) {
                    previewBox = document.createElement('div');
                    previewBox.id = 'iosPhotoFallback';
                    previewBox.style.marginTop = '8px';
                    previewBox.style.marginBottom = '16px';
                    previewBox.style.textAlign = 'center';
                    // Insert the image box right below the Fetch Photo button
                    btn.parentNode.insertBefore(previewBox, btn.nextSibling);
                }
                
                // Inject the image and instructions
                previewBox.innerHTML = `
                    <p style="color: #10b981; font-size: 0.8rem; margin-bottom: 8px; font-weight: 600;">
                        📸 If it didn't auto-download, long-press the image below and "Save to Photos"
                    </p>
                    <img src="${pngUrl}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                `;

                btn.innerText = "✓ Photo Ready!";
                btn.classList.add('success');
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.remove('success');
                    btn.disabled = false;
                }, 2000);
            };
            img.src = URL.createObjectURL(blob);
        } catch (err) {
            alert("Error fetching photo. Make sure the post link is valid.");
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
