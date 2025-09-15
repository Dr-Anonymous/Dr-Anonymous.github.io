document.addEventListener('DOMContentLoaded', () => {
    const buttonsContainer = document.getElementById('buttons');
    const editModeToggle = document.getElementById('edit-mode-toggle');
    const addBtn = document.getElementById('add-btn');
    const exportBtn = document.getElementById('export-btn');
    const fileInput = document.getElementById('file-input');
    const modal = document.getElementById('edit-modal');
    const savePatchBtn = document.getElementById('save-patch-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const patchNameInput = document.getElementById('patch-name');
    const programChangeInput = document.getElementById('program-change');

    let midiOutput = null;
    let patches = [];
    let isEditMode = false;
    let currentlyEditingPatchId = null;

    const defaultPatches = [
        { id: Date.now() + 1, name: "SQARE LEED", pc: 1 },
        { id: Date.now() + 2, name: "BAGPIPER", pc: 2 },
        { id: Date.now() + 3, name: "BELLS", pc: 3 },
        { id: Date.now() + 4, name: "SANTOOR", pc: 4 },
        { id: Date.now() + 5, name: "VIENA STRINGS", pc: 5 },
        { id: Date.now() + 6, name: "OLD FLUTE", pc: 6 },
        { id: Date.now() + 7, name: "SLOW STRING", pc: 7 },
        { id: Date.now() + 8, name: "SYNTH PRASE", pc: 8 },
        { id: Date.now() + 9, name: "OCT STNG - GUITAR", pc: 9 },
        { id: Date.now() + 10, name: "E. PIANO", pc: 10 },
        { id: Date.now() + 11, name: "STACCATO", pc: 11 },
        { id: Date.now() + 12, name: "DIST. GUITAR", pc: 12 },
        { id: Date.now() + 13, name: "SLOW - VIOLIN", pc: 13 }
    ];

    // --- MIDI Initialization ---
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

    function sendProgramChange(program, channel = 0) {
        if (!midiOutput) {
            alert("No MIDI device connected.");
            return;
        }
        const status = 0xC0 | (channel & 0x0F);
        midiOutput.send([status, program]);
        console.log(`Sent Program Change ${program} on channel ${channel + 1}`);
    }

    // --- Data Management ---
    function loadPatches() {
        const storedPatches = localStorage.getItem('midiPatches');
        patches = storedPatches ? JSON.parse(storedPatches) : defaultPatches;
        renderButtons();
    }

    function savePatches() {
        localStorage.setItem('midiPatches', JSON.stringify(patches));
        renderButtons();
    }

    // --- UI Rendering & Event Handling ---
    function renderButtons() {
        buttonsContainer.innerHTML = '';
        patches.forEach(patch => {
            const btn = document.createElement('button');
            btn.innerText = patch.name;
            btn.dataset.pc = patch.pc;
            btn.dataset.id = patch.id;

            btn.onclick = () => {
                if (isEditMode) {
                    openEditModal(patch.id);
                } else {
                    sendProgramChange(patch.pc);
                }
            };

            if (isEditMode) {
                const deleteBtn = document.createElement('span');
                deleteBtn.innerText = 'X';
                deleteBtn.className = 'delete-btn';
                deleteBtn.style.display = 'block';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${patch.name}"?`)) {
                        deletePatch(patch.id);
                    }
                };
                btn.appendChild(deleteBtn);
            }

            buttonsContainer.appendChild(btn);
        });
    }

    // --- Edit Mode Logic ---
    function toggleEditMode() {
        isEditMode = editModeToggle.checked;
        addBtn.style.display = isEditMode ? 'inline-block' : 'none';
        renderButtons();
    }

    function openEditModal(id = null) {
        currentlyEditingPatchId = id;
        if (id) {
            const patch = patches.find(p => p.id === id);
            patchNameInput.value = patch.name;
            programChangeInput.value = patch.pc;
        } else {
            patchNameInput.value = 'New Patch';
            const nextPc = patches.length > 0 ? Math.max(...patches.map(p => p.pc)) + 1 : 0;
            programChangeInput.value = Math.min(nextPc, 127);
        }
        modal.style.display = 'block';
    }

    function closeEditModal() {
        modal.style.display = 'none';
        patchNameInput.value = '';
        programChangeInput.value = '';
        currentlyEditingPatchId = null;
    }

    function savePatch() {
        const name = patchNameInput.value.trim();
        const pc = parseInt(programChangeInput.value, 10);

        if (!name || isNaN(pc) || pc < 0 || pc > 127) {
            alert('Invalid input. Please provide a valid name and a Program Change value between 0 and 127.');
            return;
        }

        if (currentlyEditingPatchId) {
            const patch = patches.find(p => p.id === currentlyEditingPatchId);
            patch.name = name;
            patch.pc = pc;
        } else {
            patches.push({ id: Date.now(), name, pc });
        }

        savePatches();
        closeEditModal();
    }

    function deletePatch(id) {
        patches = patches.filter(p => p.id !== id);
        savePatches();
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
                // Basic validation
                if (Array.isArray(importedPatches) && importedPatches.every(p => 'id' in p && 'name' in p && 'pc' in p)) {
                    if (confirm('This will overwrite your current patch configuration. Are you sure?')) {
                        patches = importedPatches;
                        savePatches();
                    }
                } else {
                    alert('Invalid file format.');
                }
            } catch (error) {
                alert('Error reading or parsing the file.');
                console.error(error);
            }
        };
        reader.readAsText(file);
        // Reset file input to allow importing the same file again
        event.target.value = null;
    }

    // --- Event Listeners ---
    editModeToggle.addEventListener('change', toggleEditMode);
    addBtn.addEventListener('click', () => openEditModal());
    savePatchBtn.addEventListener('click', savePatch);
    cancelEditBtn.addEventListener('click', closeEditModal);
    exportBtn.addEventListener('click', exportPatches);
    fileInput.addEventListener('change', importPatches);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeEditModal();
        }
    });

    // Initial setup
    initMidi();
    loadPatches();
});
