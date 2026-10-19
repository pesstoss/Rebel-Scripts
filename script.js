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
    const locationGroup = document.getElementById("locationWrapper");

    // 1. Artist Name: Only for Rebel BNW, Snap Allnature, and Snap Wildlife
    if (gallery === 'rebel_bnw' || gallery === 'snap_allnature' || gallery === 'snap_wildlife' || gallery === 'pictasmacro') {
        nameGroup.style.display = "block";
    } else {
        nameGroup.style.display = "none";
    }

    // 2. Curator First Name: Only for Snap and Pictas galleries
    if (gallery.startsWith('snap_') || gallery.startsWith('pictas')) {
        firstNameGroup.style.display = "block";
    } else {
        firstNameGroup.style.display = "none";
    }

    // 3. Personal Comment: Everyone gets it EXCEPT Rebel BNW and Fotomasters
    if (commentGroup && commentGroup2) { 
        if (gallery === 'rebel_bnw' || gallery === 'fotomasters' || gallery === 'pictasmacro') {
            commentGroup.style.display = "none";
            commentGroup2.style.display = "none";
        } else if (gallery.startsWith('snap_')) {
            commentGroup.style.display = "block";
            commentGroup2.style.display = "block";
        } else if (gallery === 'monomoods') {
            commentGroup.style.display = "block";
        }
    }

    // 4. Membership Level: Hide for Rebel BNW and Fotomasters
        if (gallery === 'rebel_bnw' || gallery === 'fotomasters' || gallery === 'pictasmacro'  || gallery === 'monomoods') {
            levelGroup.style.display = "none";
        } else {
            levelGroup.style.display = "block";
        }

    // 5. Role Selection: Hide for Fotomasters, Pictas and Monomoods    
        if (roleGroup) {
        if (gallery === 'fotomasters' || gallery === 'pictasmacro' || gallery === 'monomoods') {
            roleGroup.style.display = "none";
        } else {
            roleGroup.style.display = "block";
        }
    }

    // 6. Location: Only for some galleries
    if (locationGroup) {
    if (gallery === 'snap_germany' || gallery === 'snap_waters') {
        locationGroup.style.display = "block";
    } else {
        locationGroup.style.display = "none";
        // Clear the fields if they switch to a gallery that doesn't use locations
        const searchInput = document.getElementById('locationSearchInput');
        const finalOutput = document.getElementById('finalLocationOutput');
        if (searchInput) searchInput.value = '';
        if (finalOutput) finalOutput.value = '';
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
    const locationOutput = document.getElementById('finalLocationOutput');
    const locationText = locationOutput ? locationOutput.value : '';    
    
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
    } else if (gallery === 'pictasmacro') {
        commentFileName = 'pictas';
    } else if (gallery === 'monomoods') {
        commentFileName = 'monomoods';
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
            .replace(/{snapGallery}/g, snapGalleryName)
            .replace('{location}', locationText ? `${locationText}\n` : '');
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
            
            previewBox.innerHTML = `
                <button id="nativeDownloadBtn" style="display: block; background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-size: 1rem; font-weight: bold; margin-bottom: 12px; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.2); cursor: pointer; transition: background 0.3s;">
                    ⬇️ Download Photo
                </button>
                <br>
                <img src="${img.src}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <div id="closeFetchPreview" style="margin-top: 12px; color: #ef4444; font-weight: bold; cursor: pointer; padding: 8px;">
                    ✖ Tap here to close
                </div>
            `;

            document.getElementById('nativeDownloadBtn').onclick = (e) => {
                const btn = e.target;
                const originalText = btn.innerHTML;
                btn.innerHTML = "✅ Downloaded!";
                btn.style.background = "#059669"; 

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
                    btn.style.background = "#10b981";
                }, 2000);
            };

            const allBtns = btn.closest('.page-section').querySelectorAll('button');
            const btn1 = allBtns[0]; 
            const btn2 = allBtns[1]; 
            const origBtn1Click = btn1.onclick;
            const origBtn2Click = btn2.onclick;
            const origBtn2Text = btn2.innerText; 
            
            btn1.innerText = "TinEye Check 🔍";
            btn1.disabled = false;
            btn1.onclick = (e) => {
                e.preventDefault();
                window.open(`https://tineye.com/search?url=${encodeURIComponent(targetUrl)}`, '_blank');
            };
            
            btn2.innerText = "Google Lens Check 🔍";
            btn2.disabled = false;
            btn2.onclick = (e) => {
                e.preventDefault();
                window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(targetUrl)}`, '_blank');
            };
            
            document.getElementById('closeFetchPreview').onclick = () => {
                previewBox.innerHTML = '';
                previewBox.style.display = 'none';
                
                btn1.innerText = "Fetch Single Photo 🖼️";
                btn1.onclick = origBtn1Click;
                
                btn2.innerText = origBtn2Text;
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
                hiveBtn.innerText = "Hive Check 🤖";
                hiveBtn.onclick = (e) => {
                    e.preventDefault();
                    hiveBtn.style.display = 'none';
                    window.open('https://hivedetect.ai/', '_blank');
                };
            };
        };

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
        scrollContainer.style.gap = '12px';
        scrollContainer.style.width = '100%';
        scrollContainer.style.overflowX = 'auto';
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
            thumb.style.height = '140px';
            thumb.style.width = 'auto';
            thumb.style.borderRadius = '8px';
            thumb.style.cursor = 'pointer';
            thumb.style.border = '2px solid #334155';
            
            fetch(`/api/photo?targetImage=${encodeURIComponent(imgUrl)}&t=${Date.now()}`)
                .then(res => res.blob())
                .then(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    thumb.src = blobUrl;

                    thumb.onclick = () => {
                        btn.innerText = "Processing...";
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
                            
                            activePreviewArea.innerHTML = `
                                <button id="nativeCarouselDownloadBtn" style="display: block; background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-size: 1rem; font-weight: bold; margin-bottom: 12px; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.2); cursor: pointer; transition: background 0.3s;">
                                    ⬇️ Download Photo
                                </button>
                                <br>
                                <img src="${img.src}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #334155; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                                <div id="closeFetchPreview" style="margin-top: 12px; color: #ef4444; font-weight: bold; cursor: pointer; padding: 8px;">
                                    ✖ Tap here to close
                                </div>
                            `;
                            
                            activePreviewArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                            document.getElementById('nativeCarouselDownloadBtn').onclick = (e) => {
                                const btn = e.target;
                                const originalText = btn.innerHTML;
                                btn.innerHTML = "✅ Downloaded!";
                                btn.style.background = "#059669"; 

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
                                    btn.style.background = "#10b981";
                                }, 2000);
                            };
                            
                            btn1.innerText = "TinEye Check 🔍";
                            btn1.disabled = false;
                            btn1.onclick = (e) => {
                                e.preventDefault();
                                window.open(`https://tineye.com/search?url=${encodeURIComponent(imgUrl)}`, '_blank');
                            };
                            
                            btn2.innerText = "Google Lens Check 🔍";
                            btn2.disabled = false;
                            btn2.onclick = (e) => {
                                e.preventDefault();
                                window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imgUrl)}`, '_blank');
                            };
                            
                            document.getElementById('closeFetchPreview').onclick = () => {
                                activePreviewArea.innerHTML = '';
                                
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
