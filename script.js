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
    const roleGroup = document.getElementById("roleGroup");

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

    // 3. Personal Comment: Everyone gets it EXCEPT Rebel BNW and Fotomasters
    if (commentGroup && commentGroup2) { 
        if (gallery === 'rebel_bnw' || gallery === 'fotomasters') {
            commentGroup.style.display = "none";
            commentGroup2.style.display = "none";
        } else {
            commentGroup.style.display = "block";
            commentGroup2.style.display = "block";
        }
    }
    // 4. Membership Level: Hide for Rebel BNW and Fotomasters
        if (gallery === 'rebel_bnw' || gallery === 'fotomasters') {
            levelGroup.style.display = "none";
        } else {
            levelGroup.style.display = "block";
        }
        if (roleGroup) {
        if (gallery === 'fotomasters') {
            roleGroup.style.display = "none";
        } else {
            roleGroup.style.display = "block";
        }
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
    }
    
    const snapGalleryName = gallery.replace('snap_', ''); 

    // Fetch all three templates using our new folders
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
        const response = await fetch(`/api/photo?url=${encodeURIComponent(fullUrl)}`);
        const data = await response.json();

        if (!data.images || data.images.length === 0) throw new Error("No images found");

        let found = false;

        // Create or clear the preview box at the bottom of Page 3
        let previewBox = document.getElementById('carouselPreviewBox');
        if (!previewBox) {
            previewBox = document.createElement('div');
            previewBox.id = 'carouselPreviewBox';
            previewBox.style.marginTop = '16px';
            btn.closest('.page-section').appendChild(previewBox);
        }
        previewBox.innerHTML = '';
        previewBox.style.display = 'none';

        for (const imgUrl of data.images) {
            if (found) break;

            const tempImg = new Image();
            tempImg.onload = async () => {
                if (found) return;

                // Pass anything 400px or larger
                if (tempImg.naturalWidth >= 400 || tempImg.naturalHeight >= 400) {
                    found = true;
                    btn.innerText = "Processing...";

                    const proxyResp = await fetch(`/api/photo?targetImage=${encodeURIComponent(imgUrl)}`);
                    const blob = await proxyResp.blob();
                    const img = new Image();

                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);

                        const pngUrl = canvas.toDataURL('image/png');
                        
                        previewBox.style.display = 'block'; 
                        previewBox.style.textAlign = 'center';
                        previewBox.innerHTML = `
                            <p style="color: #10b981; font-size: 0.8rem; margin-bottom: 8px; font-weight: 600;">
                                👆 Long-press to save, tap photo to close
                            </p>
                            <img id="finalFetchImage" src="${pngUrl}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor: pointer;">
                        `;

                        // 1. Grab both main buttons
                        const allBtns = btn.closest('.page-section').querySelectorAll('button');
                        const btn1 = allBtns[0]; // The Single Photo button
                        const btn2 = allBtns[1]; // The Carousel button
                        
                        // 2. Save their original state
                        const origBtn1Click = btn1.onclick;
                        const origBtn2Click = btn2.onclick;
                        const origBtn2Text = btn2.innerText; 
                        
                        // 3. Morph buttons
                        btn1.innerText = "TinEye";
                        btn1.disabled = false;
                        btn1.onclick = (e) => {
                            e.preventDefault();
                            window.open(`https://tineye.com/search?url=${encodeURIComponent(imgUrl)}`, '_blank');
                        };
                        
                        btn2.innerText = "Google Lens";
                        btn2.disabled = false;
                        btn2.onclick = (e) => {
                            e.preventDefault();
                            window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imgUrl)}`, '_blank');
                        };
                        
                        // 4. Restore everything when the photo is tapped
                        document.getElementById('finalFetchImage').onclick = () => {
                            previewBox.innerHTML = '';
                            previewBox.style.display = 'none';
                            
                            btn1.innerText = "Fetch Single Photo 🖼️";
                            btn1.onclick = origBtn1Click;
                            
                            btn2.innerText = origBtn2Text;
                            btn2.onclick = origBtn2Click;
                        };
                    };

                    img.src = URL.createObjectURL(blob);
                }
            };
            tempImg.src = imgUrl;
        }

        setTimeout(() => {
            if (!found) {
                alert("Could not find a high-res photo. This might be a private profile.");
                btn.innerText = "Fetch Single Photo 🖼️";
                btn.disabled = false;
            }
        }, 3000);

    } catch (err) {
        alert("Error extracting photo. Make sure the post link is valid.");
        btn.innerText = "Fetch Single Photo 🖼️";
        btn.disabled = false;
    }
}


async function fetchAndDownloadPhoto(btn) {
    // 1. Check if it's already open, act as a Close button
    if (btn.innerText.includes("Close Carousel")) {
        const previewBox = document.getElementById('carouselPreviewBox');
        if (previewBox) {
            previewBox.innerHTML = '';
            previewBox.style.display = 'none';
        }
        btn.innerText = "Fetch Carousel 🎠";
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
        const response = await fetch(`/api/photo?url=${encodeURIComponent(fullUrl)}`);
        const data = await response.json();

        if (!data.images || data.images.length === 0) throw new Error("No images found");

        let previewBox = document.getElementById('carouselPreviewBox');
        if (!previewBox) {
            previewBox = document.createElement('div');
            previewBox.id = 'carouselPreviewBox';
            previewBox.style.marginTop = '16px';
            btn.closest('.page-section').appendChild(previewBox);
        }
        
        previewBox.innerHTML = ''; // Clear previous searches
        previewBox.style.display = 'flex'; 
        previewBox.style.flexDirection = 'column';
        
        // 2. Create a dedicated container for the high-res image ABOVE the carousel
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
        scrollContainer.style.gap = '12px';
        scrollContainer.style.width = '100%';
        scrollContainer.style.overflowX = 'auto';
        scrollContainer.style.paddingBottom = '8px';
        previewBox.appendChild(scrollContainer);

        data.images.forEach(imgUrl => {
            const thumb = document.createElement('img');
            
            thumb.onload = () => {
                if (thumb.naturalWidth < 400 && thumb.naturalHeight < 400) return;

                thumb.style.height = '140px';
                thumb.style.width = 'auto';
                thumb.style.borderRadius = '8px';
                thumb.style.cursor = 'pointer';
                thumb.style.border = '2px solid #334155';
                
                thumb.onclick = async () => {
                    btn.innerText = "Processing...";
                    
                    const proxyResp = await fetch(`/api/photo?targetImage=${encodeURIComponent(imgUrl)}`);
                    const blob = await proxyResp.blob();
                    const img = new Image();
                    
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        
                        const pngUrl = canvas.toDataURL('image/png');
                        
                        activePreviewArea.style.textAlign = 'center';
                        activePreviewArea.style.marginBottom = '16px';
                        activePreviewArea.innerHTML = `
                            <p style="color: #10b981; font-size: 0.8rem; margin-bottom: 8px; font-weight: 600;">
                                👆 Long-press to save, tap photo to close
                            </p>
                            <img id="finalFetchImage" src="${pngUrl}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.3); cursor: pointer;">
                        `;
                        
                        activePreviewArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        
                        // 1. Grab both main buttons
                        const allBtns = btn.closest('.page-section').querySelectorAll('button');
                        const btn1 = allBtns[0]; // The Single Photo button
                        const btn2 = allBtns[1]; // The Carousel button
                        
                        // 2. Save their original state
                        const origBtn1Click = btn1.onclick;
                        const origBtn2Click = btn2.onclick;
                        
                        // 3. Morph buttons
                        btn1.innerText = "TinEye";
                        btn1.disabled = false;
                        btn1.onclick = (e) => {
                            e.preventDefault();
                            window.open(`https://tineye.com/search?url=${encodeURIComponent(imgUrl)}`, '_blank');
                        };
                        
                        btn2.innerText = "Google Lens";
                        btn2.disabled = false;
                        btn2.onclick = (e) => {
                            e.preventDefault();
                            window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imgUrl)}`, '_blank');
                        };
                        
                        // 4. Restore everything when the big photo is tapped
                        document.getElementById('finalFetchImage').onclick = () => {
                            activePreviewArea.innerHTML = '';
                            
                            btn1.innerText = "Fetch Single Photo 🖼️";
                            btn1.onclick = origBtn1Click;
                            
                            btn2.innerText = "Close Carousel ❌";
                            btn2.onclick = origBtn2Click;
                        };
                    };
                    
                    img.src = URL.createObjectURL(blob);
                };
                
                scrollContainer.appendChild(thumb);
            };
            
            thumb.src = imgUrl; 
        });

        // Change the button to act as a close toggle
        btn.innerText = "Close Carousel ❌";
        btn.disabled = false;

    } catch (err) {
        alert("Error extracting photos. Make sure the post link is valid.");
        btn.innerText = "Fetch Carousel 🎠";
        btn.disabled = false;
    }
}
