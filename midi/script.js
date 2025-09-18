document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const buttonsContainer = document.getElementById('buttons');
    const editModeToggle = document.getElementById('edit-mode-toggle');
    const exportBtn = document.getElementById('export-btn');
    const fileInput = document.getElementById('file-input');
    const midiOutputSelector = document.getElementById('midi-output-selector');
    const editOverlay = document.getElementById('edit-overlay');
    const editTableBody = document.getElementById('edit-table-body');
    const addRowBtn = document.getElementById('add-row-btn');
    const saveTableBtn = document.getElementById('save-table-btn');
    const cancelTableBtn = document.getElementById('cancel-table-btn');

    // --- State ---
    let midiOutput = null;
    let midiOutputs = [];
    let patches = [];
    let isEditMode = false;

    // --- Default Data ---
    const defaultPatches = [
        { "id": 1758043261163, "name": "Chorus", "color": "#ff6347", "pc": 94, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261164, "name": "Bells", "color": "#ff47ab", "pc": 49, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261165, "name": "Trumpet", "color": "#ab47ff", "pc": 42, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261166, "name": "Solid Guitar", "color": "#477bff", "pc": 33, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261167, "name": "Old Flute", "color": "#47d3ff", "pc": 23, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261168, "name": "Viola", "color": "#698c7c", "pc": 22, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261169, "name": "Alto Sax", "color": "#556048", "pc": 25, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261170, "name": "Dist. Guitar", "color": "#937d34", "pc": 78, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261171, "name": "Vienna Strings", "color": "#ff8c47", "pc": 73, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261172, "name": "Dulcimer", "color": "#795d79", "pc": 0, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261173, "name": "Shennai", "color": "#474533", "pc": 10, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261174, "name": "Piano Strings", "color": "#20b2aa", "pc": 1, "channel": 15, "cc": { "number": null, "value": null } },
        { "id": 1758043261175, "name": "Sqare Lead", "color": "#6a5acd", "pc": 11, "channel": 15, "cc": { "number": null, "value": null } }
    ];

    // --- MIDI Initialization & Sending ---
    function initMidi() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
        } else {
            alert("Web MIDI API is not supported in this browser.");
        }
    }

    function onMIDISuccess(midiAccess) {
        midiOutputs = Array.from(midiAccess.outputs.values());
        midiOutputSelector.innerHTML = ''; // Clear previous options

        if (midiOutputs.length > 0) {
            midiOutputs.forEach(output => {
                const option = document.createElement('option');
                option.value = output.id;
                option.textContent = output.name;
                midiOutputSelector.appendChild(option);
            });

            // Auto-select the first device
            midiOutput = midiOutputs[0];
            console.log(`Auto-connected to MIDI output: ${midiOutput.name}`);
        } else {
            const option = document.createElement('option');
            option.textContent = 'No MIDI devices found';
            midiOutputSelector.appendChild(option);
            console.warn("No MIDI output devices found.");
        }
    }

    function onMIDIFailure() {
        alert("Could not access your MIDI devices.");
    }

    function sendMidiMessages(patch) {
        if (!midiOutput) {
            alert("No MIDI device connected.");
            return;
        }
        const channel = patch.channel || 0;
        // Send Program Change if defined
        if (patch.pc !== null && patch.pc >= 0 && patch.pc <= 127) {
            const pcStatus = 0xC0 | (channel & 0x0F);
            midiOutput.send([pcStatus, patch.pc]);
            console.log(`Sent PC ${patch.pc} on channel ${channel + 1} to ${midiOutput.name}`);
        }
        // Send Control Change if defined
        if (patch.cc && patch.cc.number !== null && patch.cc.value !== null &&
            patch.cc.number >= 0 && patch.cc.number <= 127 &&
            patch.cc.value >= 0 && patch.cc.value <= 127) {
            const ccStatus = 0xB0 | (channel & 0x0F);
            midiOutput.send([ccStatus, patch.cc.number, patch.cc.value]);
            console.log(`Sent CC ${patch.cc.number}:${patch.cc.value} on channel ${channel + 1} to ${midiOutput.name}`);
        }
    }

    // --- Data Management ---
    function loadPatches() {
        const storedPatches = localStorage.getItem('midiPatches');
        let loadedPatches = storedPatches ? JSON.parse(storedPatches) : JSON.parse(JSON.stringify(defaultPatches));

        patches = loadedPatches.map(patch => ({
            id: patch.id,
            name: patch.name,
            pc: patch.pc,
            channel: patch.channel ?? 0,
            cc: patch.cc ?? { number: null, value: null },
            color: patch.color ?? `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
        }));
        renderButtons();
        highlightDuplicates();
    }

    function savePatches() {
        localStorage.setItem('midiPatches', JSON.stringify(patches));
        renderButtons();
        highlightDuplicates();
    }

    // --- Main UI Rendering ---
    function getContrastingTextColor(hex) {
        if (hex.startsWith('#')) {
            hex = hex.slice(1);
        }
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // http://www.w3.org/TR/AERT#color-contrast
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (brightness > 125) ? '#000000' : '#ffffff';
    }

    function renderButtons() {
        buttonsContainer.innerHTML = '';
        patches.forEach(patch => {
            const btn = document.createElement('button');
            btn.innerText = patch.name;
            btn.dataset.id = patch.id;
            btn.style.backgroundColor = patch.color;
            btn.style.color = getContrastingTextColor(patch.color);
            btn.onclick = () => sendMidiMessages(patch);
            buttonsContainer.appendChild(btn);
        });
    }

    function highlightDuplicates() {
        // First, clear any existing highlights
        document.querySelectorAll('.grid button').forEach(btn => btn.classList.remove('duplicate-highlight'));

        const pcCounts = new Map();
        const ccCounts = new Map();

        // Count occurrences of each PC and CC value
        patches.forEach(patch => {
            if (patch.pc !== null) {
                pcCounts.set(patch.pc, (pcCounts.get(patch.pc) || 0) + 1);
            }
            if (patch.cc && patch.cc.number !== null && patch.cc.value !== null) {
                const ccKey = `${patch.cc.number}-${patch.cc.value}`;
                ccCounts.set(ccKey, (ccCounts.get(ccKey) || 0) + 1);
            }
        });

        // Find which values are duplicates
        const duplicatePcs = [...pcCounts.keys()].filter(pc => pcCounts.get(pc) > 1);
        const duplicateCcs = [...ccCounts.keys()].filter(ccKey => ccCounts.get(ccKey) > 1);

        // Apply highlight class
        patches.forEach((patch, index) => {
            let isDuplicate = false;
            if (patch.pc !== null && duplicatePcs.includes(patch.pc)) {
                isDuplicate = true;
            }
            if (patch.cc && patch.cc.number !== null && patch.cc.value !== null) {
                const ccKey = `${patch.cc.number}-${patch.cc.value}`;
                if (duplicateCcs.includes(ccKey)) {
                    isDuplicate = true;
                }
            }

            if (isDuplicate) {
                const button = buttonsContainer.children[index];
                if (button) {
                    button.classList.add('duplicate-highlight');
                }
            }
        });
    }

    // --- Edit Mode Table Logic ---
    function toggleEditMode() {
        isEditMode = editModeToggle.checked;
        if (isEditMode) {
            renderEditTable();
            editOverlay.style.display = 'block';
        } else {
            editOverlay.style.display = 'none';
        }
    }

    function renderEditTable() {
        editTableBody.innerHTML = '';
        patches.forEach(patch => {
            const row = document.createElement('tr');
            row.dataset.id = patch.id;
            row.draggable = true;
            row.innerHTML = `
                <td><input type="text" class="patch-name" value="${patch.name}"></td>
                <td><input type="color" class="patch-color" value="${patch.color}"></td>
                <td><input type="number" class="patch-pc" min="0" max="127" value="${patch.pc ?? ''}" placeholder="0-127"></td>
                <td><input type="number" class="patch-channel" min="0" max="15" value="${patch.channel ?? ''}" placeholder="0-15"></td>
                <td><input type="number" class="patch-cc-num" min="0" max="127" value="${patch.cc?.number ?? ''}" placeholder="0-127"></td>
                <td><input type="number" class="patch-cc-val" min="0" max="127" value="${patch.cc?.value ?? ''}" placeholder="0-127"></td>
                <td><button class="delete-row-btn">Delete</button></td>
            `;
            editTableBody.appendChild(row);
        });
        // Add event listeners to new delete buttons
        editTableBody.querySelectorAll('.delete-row-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.target.closest('tr').remove();
            };
        });
    }

    function saveTableChanges() {
        const newPatches = [];
        const rows = editTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const id = parseInt(row.dataset.id, 10);
            const name = row.querySelector('.patch-name').value;
            const color = row.querySelector('.patch-color').value;
            const pc = row.querySelector('.patch-pc').value ? parseInt(row.querySelector('.patch-pc').value, 10) : null;
            const channel = row.querySelector('.patch-channel').value ? parseInt(row.querySelector('.patch-channel').value, 10) : 0;
            const ccNum = row.querySelector('.patch-cc-num').value ? parseInt(row.querySelector('.patch-cc-num').value, 10) : null;
            const ccVal = row.querySelector('.patch-cc-val').value ? parseInt(row.querySelector('.patch-cc-val').value, 10) : null;

            newPatches.push({
                id: id,
                name: name,
                color: color,
                pc: pc,
                channel: channel,
                cc: { number: ccNum, value: ccVal }
            });
        });
        patches = newPatches;
        savePatches();
        editModeToggle.checked = false;
        toggleEditMode();
    }

    function addNewPatchRow() {
        const newId = Date.now();
        const newColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
        const row = document.createElement('tr');
        row.dataset.id = newId;
        row.innerHTML = `
            <td><input type="text" class="patch-name" value="New Patch"></td>
            <td><input type="color" class="patch-color" value="${newColor}"></td>
            <td><input type="number" class="patch-pc" min="0" max="127" placeholder="0-127"></td>
            <td><input type="number" class="patch-channel" min="0" max="15" value="0" placeholder="0-15"></td>
            <td><input type="number" class="patch-cc-num" min="0" max="127" placeholder="0-127"></td>
            <td><input type="number" class="patch-cc-val" min="0" max="127" placeholder="0-127"></td>
            <td><button class="delete-row-btn">Delete</button></td>
        `;
        editTableBody.appendChild(row);
        row.querySelector('.delete-row-btn').onclick = (e) => {
            e.target.closest('tr').remove();
        };
    }

    // --- Import/Export Logic ---
    function exportPatches() {
        const dataStr = JSON.stringify(patches, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'midi-patches.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function importPatches(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedPatches = JSON.parse(e.target.result);
                // More robust validation for the new structure
                const isValid = Array.isArray(importedPatches) && importedPatches.every(p =>
                    typeof p === 'object' && p !== null && 'id' in p && 'name' in p
                );

                if (isValid) {
                    if (confirm('This will overwrite your current patch configuration. Are you sure?')) {
                        patches = importedPatches;
                        // savePatches and loadPatches will handle migration of potentially old formats
                        savePatches();
                        loadPatches();
                    }
                } else {
                    alert('Invalid or corrupted file format.');
                }
            } catch (error) {
                alert('Error reading or parsing the file.');
                console.error(error);
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    }

    // --- Event Listeners ---
    midiOutputSelector.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        midiOutput = midiOutputs.find(output => output.id === selectedId);
        console.log(`MIDI output changed to: ${midiOutput.name}`);
    });
    editModeToggle.addEventListener('change', toggleEditMode);
    saveTableBtn.addEventListener('click', saveTableChanges);
    cancelTableBtn.addEventListener('click', () => {
        editModeToggle.checked = false;
        toggleEditMode();
    });
    addRowBtn.addEventListener('click', addNewPatchRow);
    exportBtn.addEventListener('click', exportPatches);
    fileInput.addEventListener('change', importPatches);

    // --- Drag-and-Drop Logic for Table ---
    let draggedItem = null;

    editTableBody.addEventListener('dragstart', e => {
        draggedItem = e.target;
        // Use a class to signify dragging state
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    });

    editTableBody.addEventListener('dragend', e => {
        // Clean up dragging class
        e.target.classList.remove('dragging');
    });

    editTableBody.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(editTableBody, e.clientY);
        const allRows = [...editTableBody.querySelectorAll('tr')];
        allRows.forEach(row => row.classList.remove('drag-over'));

        if (afterElement == null) {
            // If dragging to the end, no specific element is "after"
        } else {
            afterElement.classList.add('drag-over');
        }
    });

    editTableBody.addEventListener('drop', e => {
        e.preventDefault();
        // Remove all visual indicators
        const allRows = [...editTableBody.querySelectorAll('tr')];
        allRows.forEach(row => row.classList.remove('drag-over'));

        const afterElement = getDragAfterElement(editTableBody, e.clientY);
        if (draggedItem) { // Ensure we have an item to drop
            if (afterElement == null) {
                editTableBody.appendChild(draggedItem);
            } else {
                editTableBody.insertBefore(draggedItem, afterElement);
            }
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }


    // --- Initial setup ---
    initMidi();
    loadPatches();

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }
});
