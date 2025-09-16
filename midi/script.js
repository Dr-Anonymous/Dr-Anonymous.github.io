document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const buttonsContainer = document.getElementById('buttons');
    const editModeToggle = document.getElementById('edit-mode-toggle');
    const exportBtn = document.getElementById('export-btn');
    const fileInput = document.getElementById('file-input');
    const editOverlay = document.getElementById('edit-overlay');
    const editTableBody = document.getElementById('edit-table-body');
    const addRowBtn = document.getElementById('add-row-btn');
    const saveTableBtn = document.getElementById('save-table-btn');
    const cancelTableBtn = document.getElementById('cancel-table-btn');

    // --- State ---
    let midiOutput = null;
    let patches = [];
    let isEditMode = false;

    // --- Default Data ---
    const defaultPatches = [
        { id: Date.now() + 1, name: "SQARE LEED", pc: 1, channel: 0, cc: { number: null, value: null }, color: "#ff6347" },
        { id: Date.now() + 2, name: "BAGPIPER", pc: 2, channel: 0, cc: { number: null, value: null }, color: "#ff47ab" },
        { id: Date.now() + 3, name: "BELLS", pc: 3, channel: 0, cc: { number: null, value: null }, color: "#ab47ff" },
        { id: Date.now() + 4, name: "SANTOOR", pc: 4, channel: 0, cc: { number: null, value: null }, color: "#477bff" },
        { id: Date.now() + 5, name: "VIENA STRINGS", pc: 5, channel: 0, cc: { number: null, value: null }, color: "#47d3ff" },
        { id: Date.now() + 6, name: "OLD FLUTE", pc: 6, channel: 0, cc: { number: null, value: null }, color: "#47ffad" },
        { id: Date.now() + 7, name: "SLOW STRING", pc: 7, channel: 0, cc: { number: null, value: null }, color: "#adff47" },
        { id: Date.now() + 8, name: "SYNTH PRASE", pc: 8, channel: 0, cc: { number: null, value: null }, color: "#ffd347" },
        { id: Date.now() + 9, name: "OCT STNG - GUITAR", pc: 9, channel: 0, cc: { number: null, value: null }, color: "#ff8c47" },
        { id: Date.now() + 10, name: "E. PIANO", pc: 10, channel: 0, cc: { number: null, value: null }, color: "#d8bfd8" },
        { id: Date.now() + 11, name: "STACCATO", pc: 11, channel: 0, cc: { number: null, value: null }, color: "#b0c4de" },
        { id: Date.now() + 12, name: "DIST. GUITAR", pc: 12, channel: 0, cc: { number: null, value: null }, color: "#20b2aa" },
        { id: Date.now() + 13, name: "SLOW - VIOLIN", pc: 13, channel: 0, cc: { number: null, value: null }, color: "#6a5acd" }
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
        const outputs = Array.from(midiAccess.outputs.values());
        if (outputs.length > 0) {
            midiOutput = outputs[0];
            console.log(`Connected to MIDI output: ${midiOutput.name}`);
        } else {
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
            console.log(`Sent PC ${patch.pc} on channel ${channel + 1}`);
        }
        // Send Control Change if defined
        if (patch.cc && patch.cc.number !== null && patch.cc.value !== null &&
            patch.cc.number >= 0 && patch.cc.number <= 127 &&
            patch.cc.value >= 0 && patch.cc.value <= 127) {
            const ccStatus = 0xB0 | (channel & 0x0F);
            midiOutput.send([ccStatus, patch.cc.number, patch.cc.value]);
            console.log(`Sent CC ${patch.cc.number}:${patch.cc.value} on channel ${channel + 1}`);
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
    }

    function savePatches() {
        localStorage.setItem('midiPatches', JSON.stringify(patches));
        renderButtons();
    }

    // --- Main UI Rendering ---
    function renderButtons() {
        buttonsContainer.innerHTML = '';
        patches.forEach(patch => {
            const btn = document.createElement('button');
            btn.innerText = patch.name;
            btn.dataset.id = patch.id;
            btn.style.backgroundColor = patch.color;
            btn.onclick = () => sendMidiMessages(patch);
            buttonsContainer.appendChild(btn);
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
    editModeToggle.addEventListener('change', toggleEditMode);
    saveTableBtn.addEventListener('click', saveTableChanges);
    cancelTableBtn.addEventListener('click', () => {
        editModeToggle.checked = false;
        toggleEditMode();
    });
    addRowBtn.addEventListener('click', addNewPatchRow);
    exportBtn.addEventListener('click', exportPatches);
    fileInput.addEventListener('change', importPatches);

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
