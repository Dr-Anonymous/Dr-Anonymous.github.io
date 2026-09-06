/**
 * MIDI Patch Changer - Stage Controller
 * Professional Web MIDI Live Performance Utility
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // DOM Element References
    // ==========================================================================
    const buttonsContainer = document.getElementById('buttons');
    const noResultsMsg = document.getElementById('no-results-msg');
    const resetSearchBtn = document.getElementById('reset-search-btn');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    // Hardware & Status Controls
    const midiOutputSelector = document.getElementById('midi-output-selector');
    const connectionStatusDot = document.getElementById('connection-status-dot');
    const txLed = document.getElementById('tx-led');
    const panicBtn = document.getElementById('panic-btn');
    const wakeBtn = document.getElementById('wake-btn');
    const wakeLabel = document.getElementById('wake-label');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    // Setlist Controls
    const setlistTabs = document.getElementById('setlist-tabs');
    const newSetlistBtn = document.getElementById('new-setlist-btn');
    const manageSetlistBtn = document.getElementById('manage-setlist-btn');

    // Tools & Action Controls
    const reorderToggleBtn = document.getElementById('reorder-toggle-btn');
    const editBtn = document.getElementById('edit-btn');
    const backupMenuBtn = document.getElementById('backup-menu-btn');
    const fileInput = document.getElementById('file-input');

    // Live Readout Bar
    const activePatchNameEl = document.getElementById('active-patch-name');
    const activePatchMetaEl = document.getElementById('active-patch-meta');

    // Full Library Editor Dialog & Elements
    const editDialog = document.getElementById('edit-dialog');
    const editTableBody = document.getElementById('edit-table-body');
    const addRowBtn = document.getElementById('add-row-btn');
    const saveTableBtn = document.getElementById('save-table-btn');
    const cancelTableBtn = document.getElementById('cancel-table-btn');
    const modalCloseIconBtn = document.getElementById('modal-close-icon-btn');
    const duplicateWarningInfo = document.getElementById('duplicate-warning-info');

    // Quick Edit Dialog Elements
    const quickEditDialog = document.getElementById('quick-edit-dialog');
    const quickEditForm = document.getElementById('quick-edit-form');
    const quickPatchId = document.getElementById('quick-patch-id');
    const quickName = document.getElementById('quick-name');
    const quickColor = document.getElementById('quick-color');
    const quickChannel = document.getElementById('quick-channel');
    const quickPc = document.getElementById('quick-pc');
    const quickBankMsb = document.getElementById('quick-bank-msb');
    const quickBankLsb = document.getElementById('quick-bank-lsb');
    const quickCcNum = document.getElementById('quick-cc-num');
    const quickCcVal = document.getElementById('quick-cc-val');
    const quickColorPresets = document.getElementById('quick-color-presets');
    const quickCancelBtn = document.getElementById('quick-cancel-btn');
    const quickCancelIconBtn = document.getElementById('quick-cancel-icon-btn');
    const quickDeleteBtn = document.getElementById('quick-delete-btn');

    // Setlist Modal Elements
    const setlistDialog = document.getElementById('setlist-dialog');
    const setlistRenameInput = document.getElementById('setlist-rename-input');
    const setlistRenameBtn = document.getElementById('setlist-rename-btn');
    const setlistDuplicateBtn = document.getElementById('setlist-duplicate-btn');
    const setlistDeleteBtn = document.getElementById('setlist-delete-btn');
    const setlistCloseIconBtn = document.getElementById('setlist-close-icon-btn');
    const setlistDoneBtn = document.getElementById('setlist-done-btn');

    // Backup & Data Dialog Elements
    const backupDialog = document.getElementById('backup-dialog');
    const exportActiveBtn = document.getElementById('export-active-btn');
    const exportAllBtn = document.getElementById('export-all-btn');
    const importTriggerBtn = document.getElementById('import-trigger-btn');
    const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
    const backupCloseIconBtn = document.getElementById('backup-close-icon-btn');
    const backupDoneBtn = document.getElementById('backup-done-btn');

    // ==========================================================================
    // State
    // ==========================================================================
    let midiAccess = null;
    let midiOutputs = [];
    let midiOutput = null;
    let wakeLock = null;

    let setlists = [];
    let activeSetlistId = 'default';
    let activePatchId = null;
    let isReorderMode = false;
    let searchQuery = '';

    // Standard stage palette for quick color selection
    const STAGE_COLORS = [
        '#e63946', '#ff6b6b', '#f77f00', '#ffb703',
        '#2a9d8f', '#00b4d8', '#4361ee', '#7209b7',
        '#f72585', '#495057'
    ];

    // Factory presets calibrated for Roland XPS-10 keyboard (Control Channel 16 / wire 0xCF)
    const FACTORY_PRESETS = [
        { id: 1, name: "Chorus", color: "#ff6347", pc: 94, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 2, name: "Bells", color: "#ff47ab", pc: 49, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 3, name: "Trumpet", color: "#ab47ff", pc: 42, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 4, name: "Solid Guitar", color: "#477bff", pc: 33, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 5, name: "Old Flute", color: "#47d3ff", pc: 23, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 6, name: "Viola", color: "#698c7c", pc: 22, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 7, name: "Alto Sax", color: "#556048", pc: 25, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 8, name: "Dist. Guitar", color: "#937d34", pc: 78, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 9, name: "Vienna Strings", color: "#ff8c47", pc: 73, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 10, name: "Dulcimer", color: "#795d79", pc: 0, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 11, name: "Shennai", color: "#474533", pc: 10, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 12, name: "Piano Strings", color: "#20b2aa", pc: 1, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 13, name: "Sqare Lead", color: "#6a5acd", pc: 11, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 14, name: "Accordin", color: "#5864b7", pc: 9, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 15, name: "Brass", color: "#3f01c8", pc: 11, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 16, name: "Saxophone", color: "#3914b8", pc: 48, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 17, name: "Slow Strings", color: "#5a72cc", pc: 39, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 18, name: "Bul Bul", color: "#4b2930", pc: 16, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 19, name: "Pluck", color: "#80644c", pc: 7, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 20, name: "Santoor", color: "#afc7e0", pc: 4, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 21, name: "Harmony", color: "#a76042", pc: 3, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 22, name: "Clarinet", color: "#251b06", pc: 6, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 23, name: "Piano Fairy", color: "#6308e3", pc: 60, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 24, name: "Synth Prase", color: "#0b02fe", pc: 30, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 25, name: "Sharp Strings", color: "#1b353e", pc: 74, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 26, name: "Soprano Sax", color: "#35b798", pc: 66, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 27, name: "Slow Violin", color: "#ba697c", pc: 81, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 28, name: "Jupiter Lead", color: "#1e3ff9", pc: 68, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 29, name: "Flute Vibro", color: "#5f0b37", pc: 76, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 30, name: "Staccato", color: "#23e1e4", pc: 88, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 31, name: "Power Chords", color: "#e288a8", pc: 93, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 32, name: "Choir", color: "#34d76b", pc: 94, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 33, name: "Oct Stng GTR", color: "#4f5efa", pc: 78, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 34, name: "Lead Flute", color: "#9a3762", pc: 77, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 35, name: "Piano GTR", color: "#3f70aa", pc: 95, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 36, name: "Trance", color: "#930277", pc: 89, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 37, name: "Trumpet", color: "#b071e3", pc: 55, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 38, name: "Slow Sax", color: "#7be24b", pc: 47, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 39, name: "Jazz Guitar", color: "#5d8982", pc: 46, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 40, name: "E Piano", color: "#92cedd", pc: 96, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 41, name: "Tenor Sax", color: "#26c57f", pc: 45, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 42, name: "Nylon GTR", color: "#c29ead", pc: 44, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 43, name: "Banjo", color: "#6108ee", pc: 12, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 44, name: "Bagpiper", color: "#0cc383", pc: 26, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 45, name: "Shennai 2", color: "#a28fd8", pc: 24, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 46, name: "Vibraphone", color: "#731415", pc: 19, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } },
        { id: 47, name: "Carnatic", color: "#f9797f", pc: 38, channel: 16, bank: { msb: null, lsb: null }, cc: { number: null, value: null } }
    ];

    // ==========================================================================
    // 1. Web MIDI Engine & Hot-Plugging
    // ==========================================================================
    function initMidi() {
        if (!navigator.requestMIDIAccess) {
            updateMidiStatus(false, "Web MIDI API not supported in this browser");
            return;
        }

        navigator.requestMIDIAccess({ sysex: false })
            .then(access => {
                midiAccess = access;
                refreshMidiOutputs();

                // Listen for hot-plugging USB devices
                midiAccess.onstatechange = (event) => {
                    console.log(`MIDI port state change: ${event.port.name} (${event.port.state})`);
                    refreshMidiOutputs();
                };
            })
            .catch(err => {
                console.warn("Web MIDI access denied or unavailable:", err);
                updateMidiStatus(false, "MIDI permission denied or unavailable");
            });
    }

    function refreshMidiOutputs() {
        if (!midiAccess) return;
        midiOutputs = Array.from(midiAccess.outputs.values());
        midiOutputSelector.innerHTML = '';

        if (midiOutputs.length > 0) {
            const savedDeviceId = localStorage.getItem('last_midi_output_id');
            let matchedOutput = null;

            midiOutputs.forEach((output) => {
                const opt = document.createElement('option');
                opt.value = output.id;
                opt.textContent = output.name || `MIDI Output (${output.id})`;
                midiOutputSelector.appendChild(opt);

                if (savedDeviceId && output.id === savedDeviceId) {
                    matchedOutput = output;
                }
            });

            // Select previously remembered device, or the first available
            midiOutput = matchedOutput || midiOutputs[0];
            midiOutputSelector.value = midiOutput.id;
            updateMidiStatus(true, `Connected: ${midiOutput.name}`);
        } else {
            midiOutput = null;
            const opt = document.createElement('option');
            opt.textContent = 'No MIDI output devices found';
            opt.value = '';
            midiOutputSelector.appendChild(opt);
            updateMidiStatus(false, "No MIDI hardware detected");
        }
    }

    function updateMidiStatus(connected, message) {
        if (connected) {
            connectionStatusDot.classList.remove('disconnected');
            connectionStatusDot.classList.add('connected');
            connectionStatusDot.title = message;
        } else {
            connectionStatusDot.classList.remove('connected');
            connectionStatusDot.classList.add('disconnected');
            connectionStatusDot.title = message;
        }
    }

    function flashTxLed() {
        txLed.classList.add('active');
        setTimeout(() => txLed.classList.remove('active'), 100);
    }

    function sendMidiMessages(patch) {
        if (!midiOutput) {
            alert("No MIDI device connected. Please connect a MIDI interface or synth.");
            return;
        }

        // Standard MIDI Channel Mapping: UI uses 1-16, wire protocol requires 0-15
        const userChannel = (typeof patch.channel === 'number') ? patch.channel : 1;
        const wireChannel = Math.max(0, Math.min(15, userChannel - 1));

        const ccStatus = 0xB0 | wireChannel;
        const pcStatus = 0xC0 | wireChannel;

        let sentSummary = [];

        try {
            // 1. Send Bank Select MSB (CC#0) if specified
            if (patch.bank && patch.bank.msb !== null && patch.bank.msb !== '' && !isNaN(patch.bank.msb)) {
                const msb = parseInt(patch.bank.msb, 10);
                if (msb >= 0 && msb <= 127) {
                    midiOutput.send([ccStatus, 0, msb]);
                    sentSummary.push(`Bank MSB ${msb}`);
                }
            }

            // 2. Send Bank Select LSB (CC#32) if specified
            if (patch.bank && patch.bank.lsb !== null && patch.bank.lsb !== '' && !isNaN(patch.bank.lsb)) {
                const lsb = parseInt(patch.bank.lsb, 10);
                if (lsb >= 0 && lsb <= 127) {
                    midiOutput.send([ccStatus, 32, lsb]);
                    sentSummary.push(`Bank LSB ${lsb}`);
                }
            }

            // 3. Send Program Change (PC) if specified
            if (patch.pc !== null && patch.pc !== '' && !isNaN(patch.pc)) {
                const pc = parseInt(patch.pc, 10);
                if (pc >= 0 && pc <= 127) {
                    midiOutput.send([pcStatus, pc]);
                    sentSummary.push(`PC ${pc}`);
                }
            }

            // 4. Send Control Change (CC) if specified
            if (patch.cc && patch.cc.number !== null && patch.cc.number !== '' &&
                patch.cc.value !== null && patch.cc.value !== '') {
                const ccNum = parseInt(patch.cc.number, 10);
                const ccVal = parseInt(patch.cc.value, 10);
                if (ccNum >= 0 && ccNum <= 127 && ccVal >= 0 && ccVal <= 127) {
                    midiOutput.send([ccStatus, ccNum, ccVal]);
                    sentSummary.push(`CC ${ccNum}:${ccVal}`);
                }
            }

            flashTxLed();

            // Haptic trigger for stage touch screens
            if (navigator.vibrate) {
                navigator.vibrate(25);
            }

            // Update Active UI
            activePatchId = patch.id;
            updateActivePatchDisplay(patch, sentSummary.join(' • '));
            highlightActiveButton();

        } catch (err) {
            console.error("Error transmitting MIDI packet:", err);
        }
    }

    // Panic / All Notes Off Broadcast
    function triggerPanic() {
        if (!midiOutput) {
            alert("No MIDI device connected.");
            return;
        }

        panicBtn.classList.add('pulsing');
        setTimeout(() => panicBtn.classList.remove('pulsing'), 300);

        try {
            // Broadcast All Notes Off & Reset Controllers across all 16 MIDI channels
            for (let ch = 0; ch < 16; ch++) {
                const ccStatus = 0xB0 | ch;
                midiOutput.send([ccStatus, 120, 0]); // All Sound Off
                midiOutput.send([ccStatus, 123, 0]); // All Notes Off
                midiOutput.send([ccStatus, 121, 0]); // Reset All Controllers
            }

            flashTxLed();
            if (navigator.vibrate) navigator.vibrate([40, 30, 40]);

            activePatchNameEl.textContent = "PANIC SENT";
            activePatchMetaEl.textContent = "All Sound & Notes silenced across Ch 1-16";
        } catch (err) {
            console.error("Error broadcasting Panic:", err);
        }
    }

    // ==========================================================================
    // 2. Data Management & Migration (Setlists & Patches)
    // ==========================================================================
    function loadData() {
        const savedSetlists = localStorage.getItem('midi_setlists');
        const legacyPatches = localStorage.getItem('midiPatches');
        const presetsVersion = localStorage.getItem('presets_version');

        if (savedSetlists) {
            try {
                setlists = JSON.parse(savedSetlists);
            } catch (e) {
                console.error("Corrupted setlists in localStorage, initializing default:", e);
                setlists = [];
            }
        }

        // Seamlessly upgrade to the full Roland XPS-10 47-patch collection with clean IDs 1-47
        if (presetsVersion !== 'roland_xps10_v3') {
            const xps10Setlist = setlists.find(s => s.name === 'Roland XPS-10' || s.id === 'xps10');
            if (xps10Setlist) {
                // Update existing XPS-10 setlist with clean IDs
                xps10Setlist.patches = JSON.parse(JSON.stringify(FACTORY_PRESETS));
            } else {
                const isOldDemoSet = setlists.length === 1 && (setlists[0].patches.length <= 13);
                if (!setlists || setlists.length === 0 || isOldDemoSet) {
                    setlists = [
                        {
                            id: 'xps10',
                            name: 'Roland XPS-10',
                            patches: JSON.parse(JSON.stringify(FACTORY_PRESETS))
                        }
                    ];
                } else {
                    setlists.unshift({
                        id: 'xps10',
                        name: 'Roland XPS-10',
                        patches: JSON.parse(JSON.stringify(FACTORY_PRESETS))
                    });
                }
            }
            activeSetlistId = 'xps10';
            localStorage.setItem('presets_version', 'roland_xps10_v3');
            saveData();
        }

        const savedActiveSetlist = localStorage.getItem('active_setlist_id');
        if (savedActiveSetlist && setlists.some(s => s.id === savedActiveSetlist)) {
            activeSetlistId = savedActiveSetlist;
        } else {
            activeSetlistId = setlists[0].id;
        }

        renderSetlistTabs();
        renderButtons();
    }

    function saveData() {
        localStorage.setItem('midi_setlists', JSON.stringify(setlists));
        localStorage.setItem('active_setlist_id', activeSetlistId);
    }

    function getActiveSetlist() {
        return setlists.find(s => s.id === activeSetlistId) || setlists[0];
    }

    function renderSetlistTabs() {
        if (!setlistTabs) return;
        setlistTabs.innerHTML = '';
        setlists.forEach(setlist => {
            const tab = document.createElement('button');
            tab.className = 'setlist-tab';
            tab.type = 'button';
            tab.role = 'tab';
            tab.dataset.id = setlist.id;
            tab.setAttribute('aria-selected', setlist.id === activeSetlistId ? 'true' : 'false');
            if (setlist.id === activeSetlistId) {
                tab.classList.add('active-tab');
            }

            const titleSpan = document.createElement('span');
            titleSpan.textContent = setlist.name;
            tab.appendChild(titleSpan);

            const countSpan = document.createElement('span');
            countSpan.className = 'tab-count';
            countSpan.textContent = setlist.patches.length;
            tab.appendChild(countSpan);

            // One click changes to that set!
            tab.onclick = () => {
                if (activeSetlistId !== setlist.id) {
                    activeSetlistId = setlist.id;
                    saveData();
                    renderSetlistTabs();
                    renderButtons();
                }
            };

            setlistTabs.appendChild(tab);
        });
    }

    // ==========================================================================
    // 3. UI Rendering & Grid Management
    // ==========================================================================
    function getContrastingTextColor(hex) {
        if (!hex) return '#ffffff';
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(c => c + c).join('');
        }
        if (cleanHex.length !== 6) return '#ffffff';

        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (brightness > 135) ? '#0a0c10' : '#ffffff';
    }

    function findDuplicates(patches) {
        // Track duplicates by combination of Channel AND PC
        const counts = new Map();
        patches.forEach(p => {
            if (p.pc !== null && p.pc !== undefined && p.pc !== '') {
                const key = `${p.channel ?? 1}:${p.pc}`;
                counts.set(key, (counts.get(key) || 0) + 1);
            }
        });
        return counts;
    }

    function renderButtons() {
        buttonsContainer.innerHTML = '';
        const currentSetlist = getActiveSetlist();
        const patches = currentSetlist ? currentSetlist.patches : [];
        const duplicateCounts = findDuplicates(patches);

        // Filter patches based on search query
        const query = searchQuery.trim().toLowerCase();
        const filteredPatches = patches.filter(p => {
            if (!query) return true;
            const nameMatch = p.name && p.name.toLowerCase().includes(query);
            const pcMatch = p.pc !== null && p.pc.toString() === query;
            const chMatch = `ch ${p.channel}`.includes(query) || `ch${p.channel}`.includes(query);
            return nameMatch || pcMatch || chMatch;
        });

        if (filteredPatches.length === 0) {
            noResultsMsg.style.display = 'block';
        } else {
            noResultsMsg.style.display = 'none';
        }

        filteredPatches.forEach((patch, index) => {
            const pad = document.createElement('button');
            pad.className = 'patch-pad';
            pad.dataset.id = patch.id;
            pad.setAttribute('tabindex', '0');

            // Apply pad color
            const padColor = patch.color || '#4361ee';
            const textColor = getContrastingTextColor(padColor);
            pad.style.backgroundColor = padColor;
            pad.style.color = textColor;

            // Highlight if active
            if (patch.id === activePatchId) {
                pad.classList.add('active-patch');
            }

            // Flag duplicates (same channel AND same PC)
            const dupKey = `${patch.channel ?? 1}:${patch.pc}`;
            if (patch.pc !== null && duplicateCounts.get(dupKey) > 1) {
                pad.classList.add('duplicate-warning');
                pad.title = `Warning: Channel ${patch.channel}, PC ${patch.pc} is used by multiple patches`;
            }

            // Top row: Quick Edit Trigger
            const topRow = document.createElement('div');
            topRow.className = 'pad-top-row';

            const editTrigger = document.createElement('span');
            editTrigger.className = 'pad-edit-trigger';
            editTrigger.title = 'Quick Edit (or right-click)';
            editTrigger.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
            `;
            editTrigger.onclick = (e) => {
                e.stopPropagation();
                openQuickEditModal(patch);
            };
            topRow.appendChild(editTrigger);
            pad.appendChild(topRow);

            // Name
            const nameEl = document.createElement('div');
            nameEl.className = 'pad-name';
            nameEl.textContent = patch.name;
            pad.appendChild(nameEl);

            // Bottom metadata badges (Channel, PC, Bank MSB/LSB, CC)
            const metaRow = document.createElement('div');
            metaRow.className = 'pad-meta-row';

            const chChip = document.createElement('span');
            chChip.className = 'meta-chip';
            chChip.textContent = `CH ${patch.channel || 1}`;
            metaRow.appendChild(chChip);

            if (patch.pc !== null && patch.pc !== undefined && patch.pc !== '') {
                const pcChip = document.createElement('span');
                pcChip.className = 'meta-chip';
                pcChip.textContent = `PC ${patch.pc}`;
                metaRow.appendChild(pcChip);
            }

            if (patch.bank && (patch.bank.msb !== null || patch.bank.lsb !== null)) {
                const msb = patch.bank.msb ?? '-';
                const lsb = patch.bank.lsb ?? '-';
                const bankChip = document.createElement('span');
                bankChip.className = 'meta-chip';
                bankChip.textContent = `B ${msb}:${lsb}`;
                metaRow.appendChild(bankChip);
            }

            if (patch.cc && patch.cc.number !== null && patch.cc.value !== null) {
                const ccChip = document.createElement('span');
                ccChip.className = 'meta-chip';
                ccChip.textContent = `CC ${patch.cc.number}:${patch.cc.value}`;
                metaRow.appendChild(ccChip);
            }

            pad.appendChild(metaRow);

            // Touch Long-Press & Tap Management for Mobile (only when reorder is disabled)
            let touchTimer = null;
            let isLongPressTriggered = false;
            let touchStartX = 0;
            let touchStartY = 0;

            pad.addEventListener('touchstart', (e) => {
                if (isReorderMode) return;
                isLongPressTriggered = false;
                if (e.touches && e.touches.length > 0) {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                }

                touchTimer = setTimeout(() => {
                    isLongPressTriggered = true;
                    if (navigator.vibrate) navigator.vibrate(45);
                    openQuickEditModal(patch);
                }, 450); // Snappy 450ms long-press threshold
            }, { passive: true });

            pad.addEventListener('touchmove', (e) => {
                if (touchTimer && e.touches && e.touches.length > 0) {
                    const dx = e.touches[0].clientX - touchStartX;
                    const dy = e.touches[0].clientY - touchStartY;
                    // If user moves finger > 10px, they are scrolling; cancel long press
                    if (Math.hypot(dx, dy) > 10) {
                        clearTimeout(touchTimer);
                        touchTimer = null;
                    }
                }
            }, { passive: true });

            pad.addEventListener('touchend', (e) => {
                if (touchTimer) {
                    clearTimeout(touchTimer);
                    touchTimer = null;
                }
                if (isLongPressTriggered) {
                    // Suppress synthetic click that would otherwise trigger MIDI or close modal
                    e.preventDefault();
                }
            });

            pad.addEventListener('touchcancel', () => {
                if (touchTimer) {
                    clearTimeout(touchTimer);
                    touchTimer = null;
                }
            });

            // Click Handler -> Trigger MIDI (ignored if long press just fired)
            pad.onclick = () => {
                if (isLongPressTriggered) {
                    isLongPressTriggered = false;
                    return;
                }
                sendMidiMessages(patch);
            };

            // Right-click / Context Menu -> Quick Edit
            pad.oncontextmenu = (e) => {
                e.preventDefault();
                if (!isReorderMode) {
                    openQuickEditModal(patch);
                }
            };

            // Grid Drag & Drop Reordering Support
            if (isReorderMode) {
                pad.draggable = true;
                pad.addEventListener('dragstart', handleGridDragStart);
                pad.addEventListener('dragend', handleGridDragEnd);
                pad.addEventListener('dragover', handleGridDragOver);
                pad.addEventListener('drop', handleGridDrop);
            }

            buttonsContainer.appendChild(pad);
        });

        // Check duplicates for warning info
        const hasDups = Array.from(duplicateCounts.values()).some(count => count > 1);
        duplicateWarningInfo.style.display = hasDups ? 'inline-flex' : 'none';
    }

    function highlightActiveButton() {
        document.querySelectorAll('.patch-pad').forEach(btn => {
            if (btn.dataset.id === String(activePatchId)) {
                btn.classList.add('active-patch');
            } else {
                btn.classList.remove('active-patch');
            }
        });
    }

    function updateActivePatchDisplay(patch, metaText) {
        activePatchNameEl.textContent = patch.name;
        activePatchMetaEl.textContent = `Channel ${patch.channel || 1} • ${metaText || `PC ${patch.pc}`}`;
    }

    // ==========================================================================
    // 4. Grid Drag-and-Drop Reordering Logic
    // ==========================================================================
    let draggedGridPad = null;

    function handleGridDragStart(e) {
        draggedGridPad = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => draggedGridPad.classList.add('dragging-pad'), 0);
    }

    function handleGridDragEnd(e) {
        if (draggedGridPad) {
            draggedGridPad.classList.remove('dragging-pad');
        }
        document.querySelectorAll('.patch-pad').forEach(p => p.classList.remove('drag-over-pad'));
        draggedGridPad = null;
    }

    function handleGridDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const targetPad = e.currentTarget;
        if (targetPad && targetPad !== draggedGridPad) {
            targetPad.classList.add('drag-over-pad');
        }
    }

    function handleGridDrop(e) {
        e.preventDefault();
        const targetPad = e.currentTarget;
        targetPad.classList.remove('drag-over-pad');

        if (!draggedGridPad || draggedGridPad === targetPad) return;

        const currentSetlist = getActiveSetlist();
        const patches = currentSetlist.patches;

        const fromId = draggedGridPad.dataset.id;
        const toId = targetPad.dataset.id;

        const fromIndex = patches.findIndex(p => String(p.id) === fromId);
        const toIndex = patches.findIndex(p => String(p.id) === toId);

        if (fromIndex !== -1 && toIndex !== -1) {
            const [movedItem] = patches.splice(fromIndex, 1);
            patches.splice(toIndex, 0, movedItem);
            saveData();
            renderButtons();
        }
    }

    // ==========================================================================
    // 5. Full Library Editor (Table Modal)
    // ==========================================================================
    function openFullEditor() {
        renderEditTable();
        openModal(editDialog);
    }
    let currentDuplicateFocusIndex = -1;

    function updateTableDuplicateHighlights() {
        const rows = Array.from(editTableBody.querySelectorAll('tr'));
        const counts = new Map();

        // Count Channel:PC occurrences across all table rows
        rows.forEach(row => {
            const chanInput = row.querySelector('.patch-channel');
            const pcInput = row.querySelector('.patch-pc');
            const chan = parseInt(chanInput?.value, 10) || 1;
            const pcVal = pcInput?.value?.trim();

            if (pcVal !== '' && !isNaN(pcVal)) {
                const key = `${chan}:${parseInt(pcVal, 10)}`;
                counts.set(key, (counts.get(key) || 0) + 1);
            }
        });

        let duplicateRowCount = 0;

        rows.forEach(row => {
            const chanInput = row.querySelector('.patch-channel');
            const pcInput = row.querySelector('.patch-pc');
            const nameTd = row.querySelector('.col-name');
            const chan = parseInt(chanInput?.value, 10) || 1;
            const pcVal = pcInput?.value?.trim();

            let isDup = false;
            if (pcVal !== '' && !isNaN(pcVal)) {
                const key = `${chan}:${parseInt(pcVal, 10)}`;
                if ((counts.get(key) || 0) > 1) {
                    isDup = true;
                }
            }

            // Remove existing badge if present
            const existingBadge = nameTd?.querySelector('.dup-badge');
            if (existingBadge) existingBadge.remove();

            if (isDup) {
                row.classList.add('row-duplicate');
                duplicateRowCount++;

                if (nameTd) {
                    const badge = document.createElement('span');
                    badge.className = 'dup-badge';
                    badge.title = `Duplicate: Channel ${chan}, PC ${pcVal} is shared with another patch`;
                    badge.textContent = `⚠️ Ch${chan}:PC${pcVal}`;
                    nameTd.appendChild(badge);
                }
            } else {
                row.classList.remove('row-duplicate');
            }
        });

        // Update footer button
        if (duplicateRowCount > 0) {
            duplicateWarningInfo.style.display = 'inline-flex';
            duplicateWarningInfo.textContent = `⚠️ ${duplicateRowCount} Duplicates (Click to View)`;
            duplicateWarningInfo.title = 'Click to jump between duplicate patches';
        } else {
            duplicateWarningInfo.style.display = 'none';
        }
    }

    function renderEditTable() {
        editTableBody.innerHTML = '';
        const currentSetlist = getActiveSetlist();
        const patches = currentSetlist.patches;

        patches.forEach(patch => {
            const row = document.createElement('tr');
            row.dataset.id = patch.id;
            row.draggable = true;

            row.innerHTML = `
                <td class="col-drag drag-handle" title="Drag to reorder">☰</td>
                <td class="col-name"><input type="text" class="patch-name" value="${escapeHtml(patch.name)}"></td>
                <td class="col-color"><input type="color" class="patch-color" value="${patch.color || '#4361ee'}"></td>
                <td class="col-chan"><input type="number" class="patch-channel" min="1" max="16" value="${patch.channel ?? 1}"></td>
                <td class="col-pc"><input type="number" class="patch-pc" min="0" max="127" value="${patch.pc ?? ''}" placeholder="0-127"></td>
                <td class="col-bank"><input type="number" class="patch-bank-msb" min="0" max="127" value="${patch.bank?.msb ?? ''}" placeholder="MSB"></td>
                <td class="col-bank"><input type="number" class="patch-bank-lsb" min="0" max="127" value="${patch.bank?.lsb ?? ''}" placeholder="LSB"></td>
                <td class="col-cc"><input type="number" class="patch-cc-num" min="0" max="127" value="${patch.cc?.number ?? ''}" placeholder="CC #"></td>
                <td class="col-cc"><input type="number" class="patch-cc-val" min="0" max="127" value="${patch.cc?.value ?? ''}" placeholder="Val"></td>
                <td class="col-actions">
                    <div class="table-row-actions">
                        <button type="button" class="deck-btn sm dup-row-btn" title="Duplicate patch">Clone</button>
                        <button type="button" class="deck-btn sm danger del-row-btn" title="Delete patch">Del</button>
                    </div>
                </td>
            `;

            // Action listeners
            row.querySelector('.dup-row-btn').onclick = () => duplicateTableRow(row);
            row.querySelector('.del-row-btn').onclick = () => {
                row.remove();
                updateTableDuplicateHighlights();
            };

            // Drag-and-drop listeners for rows
            row.addEventListener('dragstart', handleTableDragStart);
            row.addEventListener('dragover', handleTableDragOver);
            row.addEventListener('drop', handleTableDrop);
            row.addEventListener('dragend', handleTableDragEnd);

            editTableBody.appendChild(row);
        });

        updateTableDuplicateHighlights();
    }

    function duplicateTableRow(sourceRow) {
        const clonedRow = sourceRow.cloneNode(true);
        clonedRow.dataset.id = Date.now() + Math.floor(Math.random() * 1000);
        const nameInput = clonedRow.querySelector('.patch-name');
        nameInput.value = `${nameInput.value} (Copy)`;

        // Remove any cloned dup-badge from the new row's name cell
        const clonedBadge = clonedRow.querySelector('.dup-badge');
        if (clonedBadge) clonedBadge.remove();

        // Wire event listeners on cloned elements
        clonedRow.querySelector('.dup-row-btn').onclick = () => duplicateTableRow(clonedRow);
        clonedRow.querySelector('.del-row-btn').onclick = () => {
            clonedRow.remove();
            updateTableDuplicateHighlights();
        };
        clonedRow.addEventListener('dragstart', handleTableDragStart);
        clonedRow.addEventListener('dragover', handleTableDragOver);
        clonedRow.addEventListener('drop', handleTableDrop);
        clonedRow.addEventListener('dragend', handleTableDragEnd);

        sourceRow.after(clonedRow);
        updateTableDuplicateHighlights();
    }

    function addNewPatchRow() {
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        const randomColor = STAGE_COLORS[Math.floor(Math.random() * STAGE_COLORS.length)];
        const row = document.createElement('tr');
        row.dataset.id = newId;
        row.draggable = true;

        row.innerHTML = `
            <td class="col-drag drag-handle" title="Drag to reorder">☰</td>
            <td class="col-name"><input type="text" class="patch-name" value="New Patch"></td>
            <td class="col-color"><input type="color" class="patch-color" value="${randomColor}"></td>
            <td class="col-chan"><input type="number" class="patch-channel" min="1" max="16" value="16"></td>
            <td class="col-pc"><input type="number" class="patch-pc" min="0" max="127" placeholder="0-127"></td>
            <td class="col-bank"><input type="number" class="patch-bank-msb" min="0" max="127" placeholder="MSB"></td>
            <td class="col-bank"><input type="number" class="patch-bank-lsb" min="0" max="127" placeholder="LSB"></td>
            <td class="col-cc"><input type="number" class="patch-cc-num" min="0" max="127" placeholder="CC #"></td>
            <td class="col-cc"><input type="number" class="patch-cc-val" min="0" max="127" placeholder="Val"></td>
            <td class="col-actions">
                <div class="table-row-actions">
                    <button type="button" class="deck-btn sm dup-row-btn" title="Duplicate patch">Clone</button>
                    <button type="button" class="deck-btn sm danger del-row-btn" title="Delete patch">Del</button>
                </div>
            </td>
        `;

        row.querySelector('.dup-row-btn').onclick = () => duplicateTableRow(row);
        row.querySelector('.del-row-btn').onclick = () => {
            row.remove();
            updateTableDuplicateHighlights();
        };
        row.addEventListener('dragstart', handleTableDragStart);
        row.addEventListener('dragover', handleTableDragOver);
        row.addEventListener('drop', handleTableDrop);
        row.addEventListener('dragend', handleTableDragEnd);

        editTableBody.appendChild(row);
        updateTableDuplicateHighlights();
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function saveTableChanges() {
        const rows = editTableBody.querySelectorAll('tr');
        const newPatches = [];

        rows.forEach(row => {
            const id = row.dataset.id ? (isNaN(row.dataset.id) ? row.dataset.id : parseInt(row.dataset.id, 10)) : Date.now();
            const name = row.querySelector('.patch-name').value.trim() || 'Untitled';
            const color = row.querySelector('.patch-color').value;

            const channelVal = parseInt(row.querySelector('.patch-channel').value, 10);
            const channel = (!isNaN(channelVal) && channelVal >= 1 && channelVal <= 16) ? channelVal : 1;

            const pcVal = row.querySelector('.patch-pc').value;
            const pc = (pcVal !== '' && !isNaN(pcVal)) ? parseInt(pcVal, 10) : null;

            const msbVal = row.querySelector('.patch-bank-msb').value;
            const msb = (msbVal !== '' && !isNaN(msbVal)) ? parseInt(msbVal, 10) : null;

            const lsbVal = row.querySelector('.patch-bank-lsb').value;
            const lsb = (lsbVal !== '' && !isNaN(lsbVal)) ? parseInt(lsbVal, 10) : null;

            const ccNumVal = row.querySelector('.patch-cc-num').value;
            const ccNum = (ccNumVal !== '' && !isNaN(ccNumVal)) ? parseInt(ccNumVal, 10) : null;

            const ccValVal = row.querySelector('.patch-cc-val').value;
            const ccVal = (ccValVal !== '' && !isNaN(ccValVal)) ? parseInt(ccValVal, 10) : null;

            newPatches.push({
                id: id,
                name: name,
                color: color,
                channel: channel,
                pc: pc,
                bank: { msb: msb, lsb: lsb },
                cc: { number: ccNum, value: ccVal }
            });
        });

        const currentSetlist = getActiveSetlist();
        currentSetlist.patches = newPatches;
        saveData();
        renderSetlistTabs();
        renderButtons();
        closeModal(editDialog);
    }

    // Table Drag & Drop
    let draggedTableRow = null;

    function handleTableDragStart(e) {
        draggedTableRow = e.currentTarget;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => draggedTableRow.classList.add('dragging'), 0);
    }

    function handleTableDragEnd() {
        if (draggedTableRow) draggedTableRow.classList.remove('dragging');
        editTableBody.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over'));
        draggedTableRow = null;
    }

    function handleTableDragOver(e) {
        e.preventDefault();
        const targetRow = e.currentTarget;
        if (targetRow && targetRow !== draggedTableRow) {
            targetRow.classList.add('drag-over');
        }
    }

    function handleTableDrop(e) {
        e.preventDefault();
        const targetRow = e.currentTarget;
        targetRow.classList.remove('drag-over');

        if (draggedTableRow && targetRow && draggedTableRow !== targetRow) {
            const rect = targetRow.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            if (e.clientY < midpoint) {
                editTableBody.insertBefore(draggedTableRow, targetRow);
            } else {
                editTableBody.insertBefore(draggedTableRow, targetRow.nextSibling);
            }
        }
    }

    // ==========================================================================
    // 6. Quick Single-Patch Edit Modal
    // ==========================================================================
    function initQuickColorPresets() {
        quickColorPresets.innerHTML = '';
        STAGE_COLORS.forEach(color => {
            const dot = document.createElement('span');
            dot.className = 'color-preset-dot';
            dot.style.backgroundColor = color;
            dot.onclick = () => {
                quickColor.value = color;
            };
            quickColorPresets.appendChild(dot);
        });
    }

    function openQuickEditModal(patch) {
        quickPatchId.value = patch.id;
        quickName.value = patch.name;
        quickColor.value = patch.color || '#4361ee';
        quickChannel.value = patch.channel || 1;
        quickPc.value = (patch.pc !== null && patch.pc !== undefined) ? patch.pc : '';
        quickBankMsb.value = (patch.bank?.msb !== null && patch.bank?.msb !== undefined) ? patch.bank.msb : '';
        quickBankLsb.value = (patch.bank?.lsb !== null && patch.bank?.lsb !== undefined) ? patch.bank.lsb : '';
        quickCcNum.value = (patch.cc?.number !== null && patch.cc?.number !== undefined) ? patch.cc.number : '';
        quickCcVal.value = (patch.cc?.value !== null && patch.cc?.value !== undefined) ? patch.cc.value : '';

        openModal(quickEditDialog);
    }

    quickEditForm.onsubmit = (e) => {
        e.preventDefault();
        const targetId = quickPatchId.value;
        const currentSetlist = getActiveSetlist();
        const patch = currentSetlist.patches.find(p => String(p.id) === targetId);

        if (patch) {
            patch.name = quickName.value.trim() || 'Untitled';
            patch.color = quickColor.value;
            patch.channel = parseInt(quickChannel.value, 10) || 1;
            patch.pc = (quickPc.value !== '') ? parseInt(quickPc.value, 10) : null;
            patch.bank = {
                msb: (quickBankMsb.value !== '') ? parseInt(quickBankMsb.value, 10) : null,
                lsb: (quickBankLsb.value !== '') ? parseInt(quickBankLsb.value, 10) : null
            };
            patch.cc = {
                number: (quickCcNum.value !== '') ? parseInt(quickCcNum.value, 10) : null,
                value: (quickCcVal.value !== '') ? parseInt(quickCcVal.value, 10) : null
            };

            saveData();
            renderButtons();
        }

        closeModal(quickEditDialog);
    };

    quickDeleteBtn.onclick = () => {
        const targetId = quickPatchId.value;
        if (confirm("Delete this patch?")) {
            const currentSetlist = getActiveSetlist();
            currentSetlist.patches = currentSetlist.patches.filter(p => String(p.id) !== targetId);
            saveData();
            renderButtons();
            closeModal(quickEditDialog);
        }
    };

    // ==========================================================================
    // 7. Setlist Management
    // ==========================================================================
    function createNewSetlist() {
        const name = prompt("Enter new setlist name:", `Setlist ${setlists.length + 1}`);
        if (!name || !name.trim()) return;

        const newId = `setlist_${Date.now()}`;
        setlists.push({
            id: newId,
            name: name.trim(),
            patches: []
        });

        activeSetlistId = newId;
        saveData();
        renderSetlistTabs();
        renderButtons();
    }

    function openManageSetlistModal() {
        const current = getActiveSetlist();
        setlistRenameInput.value = current.name;
        openModal(setlistDialog);
    }

    setlistRenameBtn.onclick = () => {
        const newName = setlistRenameInput.value.trim();
        if (newName) {
            const current = getActiveSetlist();
            current.name = newName;
            saveData();
            renderSetlistTabs();
        }
    };

    setlistDuplicateBtn.onclick = () => {
        const current = getActiveSetlist();
        const duplicatedPatches = JSON.parse(JSON.stringify(current.patches)).map(p => {
            p.id = Date.now() + Math.floor(Math.random() * 1000);
            return p;
        });

        const newId = `setlist_${Date.now()}`;
        setlists.push({
            id: newId,
            name: `${current.name} (Copy)`,
            patches: duplicatedPatches
        });

        activeSetlistId = newId;
        saveData();
        renderSetlistTabs();
        renderButtons();
        closeModal(setlistDialog);
    };

    setlistDeleteBtn.onclick = () => {
        if (setlists.length <= 1) {
            alert("Cannot delete the only remaining setlist.");
            return;
        }

        const current = getActiveSetlist();
        if (confirm(`Are you sure you want to delete setlist "${current.name}"?`)) {
            setlists = setlists.filter(s => s.id !== current.id);
            activeSetlistId = setlists[0].id;
            saveData();
            renderSetlistTabs();
            renderButtons();
            closeModal(setlistDialog);
        }
    };

    // ==========================================================================
    // 8. Import, Export & Factory Reset
    // ==========================================================================
    function exportActiveSetlist() {
        const current = getActiveSetlist();
        const dataStr = JSON.stringify(current, null, 2);
        downloadFile(`${slugify(current.name)}-patches.json`, dataStr);
    }

    function exportAllSetlists() {
        const payload = {
            version: 2,
            exportedAt: new Date().toISOString(),
            setlists: setlists
        };
        const dataStr = JSON.stringify(payload, null, 2);
        downloadFile('midi-all-setlists-backup.json', dataStr);
    }

    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Case 1: Backup of multiple setlists
                if (data.setlists && Array.isArray(data.setlists)) {
                    if (confirm(`Import ${data.setlists.length} setlist(s)? This will replace current setlists.`)) {
                        setlists = data.setlists;
                        activeSetlistId = setlists[0].id;
                        saveData();
                        renderSetlistTabs();
                        renderButtons();
                        closeModal(backupDialog);
                    }
                }
                // Case 2: Single Setlist format
                else if (data.patches && Array.isArray(data.patches)) {
                    if (confirm(`Import setlist "${data.name || 'Imported Set'}"?`)) {
                        const newSetlist = {
                            id: `setlist_${Date.now()}`,
                            name: data.name || 'Imported Set',
                            patches: data.patches
                        };
                        setlists.push(newSetlist);
                        activeSetlistId = newSetlist.id;
                        saveData();
                        renderSetlistTabs();
                        renderButtons();
                        closeModal(backupDialog);
                    }
                }
                // Case 3: Flat array of patches (Legacy export)
                else if (Array.isArray(data)) {
                    if (confirm(`Import ${data.length} patches as a new setlist?`)) {
                        const normalizedPatches = data.map(p => ({
                            id: p.id || Date.now() + Math.random(),
                            name: p.name || 'Untitled Patch',
                            color: p.color || '#4361ee',
                            channel: (typeof p.channel === 'number') ? (p.channel === 15 ? 16 : (p.channel <= 15 && !p.bank ? p.channel + 1 : p.channel)) : 16,
                            pc: p.pc ?? null,
                            bank: p.bank ?? { msb: null, lsb: null },
                            cc: p.cc ?? { number: null, value: null }
                        }));

                        const newSetlist = {
                            id: `setlist_${Date.now()}`,
                            name: 'Roland XPS-10',
                            patches: normalizedPatches
                        };
                        setlists.push(newSetlist);
                        activeSetlistId = newSetlist.id;
                        saveData();
                        renderSetlistTabs();
                        renderButtons();
                        closeModal(backupDialog);
                    }
                } else {
                    alert("Unrecognized MIDI patch file format.");
                }
            } catch (err) {
                alert("Error parsing imported JSON file.");
                console.error(err);
            }
        };
        reader.readAsText(file);
        event.target.value = null;
    }

    function resetToFactoryDefaults() {
        if (confirm("Reset to Roland XPS-10 presets? Your current patches will be overwritten.")) {
            setlists = [
                {
                    id: 'xps10',
                    name: 'Roland XPS-10',
                    patches: JSON.parse(JSON.stringify(FACTORY_PRESETS))
                }
            ];
            activeSetlistId = 'xps10';
            activePatchId = null;
            saveData();
            renderSetlistTabs();
            renderButtons();
            closeModal(backupDialog);
        }
    }

    // ==========================================================================
    // 9. Screen Wake Lock (Independent Stage Mode)
    // ==========================================================================
    async function toggleScreenWakeLock() {
        if (!('wakeLock' in navigator)) {
            alert("Screen Wake Lock API is not supported on this browser.");
            return;
        }

        try {
            if (!wakeLock) {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeBtn.classList.add('active');
                wakeLabel.textContent = 'AWAKE: ON';
                wakeLock.addEventListener('release', () => {
                    wakeLock = null;
                    wakeBtn.classList.remove('active');
                    wakeLabel.textContent = 'AWAKE';
                });
            } else {
                await wakeLock.release();
                wakeLock = null;
                wakeBtn.classList.remove('active');
                wakeLabel.textContent = 'AWAKE';
            }
        } catch (err) {
            console.error("Screen Wake Lock error:", err);
            wakeBtn.classList.remove('active');
            wakeLabel.textContent = 'AWAKE';
        }
    }

    // Re-acquire wake lock if returning to visibility while active
    document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
            } catch (e) {
                console.warn("Could not re-acquire wake lock on visibility change:", e);
            }
        }
    });

    // ==========================================================================
    // 10. Fullscreen Mode
    // ==========================================================================
    async function toggleFullscreen() {
        const docEl = document.documentElement;
        try {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (docEl.requestFullscreen) {
                    await docEl.requestFullscreen();
                } else if (docEl.webkitRequestFullscreen) {
                    await docEl.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                }
            }
        } catch (err) {
            console.error("Error toggling fullscreen:", err);
        }
    }

    // ==========================================================================
    // 11. Modal Dialog Helper with Light-Dismiss Fallback
    // ==========================================================================
    function openModal(dialogEl) {
        if (!dialogEl) return;
        if (typeof dialogEl.showModal === 'function') {
            dialogEl.showModal();
        } else {
            dialogEl.setAttribute('open', '');
        }
    }

    function closeModal(dialogEl) {
        if (!dialogEl) return;
        if (typeof dialogEl.close === 'function') {
            dialogEl.close();
        } else {
            dialogEl.removeAttribute('open');
        }
    }

    // Install light-dismiss fallback for all dialogs (clicking backdrop closes dialog)
    [editDialog, quickEditDialog, setlistDialog, backupDialog].forEach(dialog => {
        if (!dialog) return;

        dialog.addEventListener('click', (event) => {
            if (event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            const isInsideContent = (
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width
            );
            if (!isInsideContent) {
                closeModal(dialog);
            }
        });
    });

    // ==========================================================================
    // 12. Keyboard Navigation & Shortcuts
    // ==========================================================================
    document.addEventListener('keydown', (e) => {
        // Ignore if user is currently typing in an input or dialog is open
        const isEditingText = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
        const isAnyModalOpen = [editDialog, quickEditDialog, setlistDialog, backupDialog].some(d => d && d.open);

        if (isEditingText || isAnyModalOpen) {
            if (e.key === 'Escape') {
                [editDialog, quickEditDialog, setlistDialog, backupDialog].forEach(closeModal);
            }
            return;
        }

        const currentSetlist = getActiveSetlist();
        const patches = currentSetlist ? currentSetlist.patches : [];

        // Arrow navigation
        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            const pads = Array.from(buttonsContainer.querySelectorAll('.patch-pad'));
            if (pads.length === 0) return;

            let currentIndex = pads.findIndex(p => p.dataset.id === String(activePatchId));

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % pads.length;
                pads[nextIndex].focus();
                const patch = patches.find(p => String(p.id) === pads[nextIndex].dataset.id);
                if (patch) sendMidiMessages(patch);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + pads.length) % pads.length;
                pads[prevIndex].focus();
                const patch = patches.find(p => String(p.id) === pads[prevIndex].dataset.id);
                if (patch) sendMidiMessages(patch);
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (document.activeElement && document.activeElement.classList.contains('patch-pad')) {
                    e.preventDefault();
                    document.activeElement.click();
                }
            }
        }
    });

    // ==========================================================================
    // 13. Event Listeners & Wiring
    // ==========================================================================
    midiOutputSelector.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        midiOutput = midiOutputs.find(output => output.id === selectedId) || null;
        if (midiOutput) {
            localStorage.setItem('last_midi_output_id', midiOutput.id);
            updateMidiStatus(true, `Connected: ${midiOutput.name}`);
        } else {
            updateMidiStatus(false, "No MIDI device selected");
        }
    });

    newSetlistBtn.addEventListener('click', createNewSetlist);
    manageSetlistBtn.addEventListener('click', openManageSetlistModal);

    // Search filter
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        renderButtons();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderButtons();
        searchInput.focus();
    });

    resetSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderButtons();
    });

    // Reorder Toggle
    reorderToggleBtn.addEventListener('click', () => {
        isReorderMode = !isReorderMode;
        reorderToggleBtn.textContent = `Reorder: ${isReorderMode ? 'ON' : 'Off'}`;
        reorderToggleBtn.classList.toggle('accent', isReorderMode);
        renderButtons();
    });

    // Panic & Hardware Controls
    panicBtn.addEventListener('click', triggerPanic);
    wakeBtn.addEventListener('click', toggleScreenWakeLock);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Dialog buttons
    editBtn.addEventListener('click', openFullEditor);
    addRowBtn.addEventListener('click', addNewPatchRow);
    saveTableBtn.addEventListener('click', saveTableChanges);
    cancelTableBtn.addEventListener('click', () => closeModal(editDialog));
    modalCloseIconBtn.addEventListener('click', () => closeModal(editDialog));

    // Live duplicate check on table input change
    editTableBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('patch-channel') || e.target.classList.contains('patch-pc')) {
            updateTableDuplicateHighlights();
        }
    });

    // Click on Duplicate Warning badge to jump directly to duplicate row
    duplicateWarningInfo.addEventListener('click', () => {
        const dupRows = Array.from(editTableBody.querySelectorAll('tr.row-duplicate'));
        if (dupRows.length === 0) return;

        currentDuplicateFocusIndex = (currentDuplicateFocusIndex + 1) % dupRows.length;
        const targetRow = dupRows[currentDuplicateFocusIndex];

        editTableBody.querySelectorAll('tr').forEach(r => r.classList.remove('duplicate-focused'));
        targetRow.classList.add('duplicate-focused');

        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const pcInput = targetRow.querySelector('.patch-pc');
        if (pcInput) pcInput.focus();
    });

    quickCancelBtn.addEventListener('click', () => closeModal(quickEditDialog));
    quickCancelIconBtn.addEventListener('click', () => closeModal(quickEditDialog));

    setlistDoneBtn.addEventListener('click', () => closeModal(setlistDialog));
    setlistCloseIconBtn.addEventListener('click', () => closeModal(setlistDialog));

    backupMenuBtn.addEventListener('click', () => openModal(backupDialog));
    exportActiveBtn.addEventListener('click', exportActiveSetlist);
    exportAllBtn.addEventListener('click', exportAllSetlists);
    importTriggerBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImportFile);
    resetDefaultsBtn.addEventListener('click', resetToFactoryDefaults);
    backupCloseIconBtn.addEventListener('click', () => closeModal(backupDialog));
    backupDoneBtn.addEventListener('click', () => closeModal(backupDialog));

    // Utilities
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    // ==========================================================================
    // 14. Initial Boot
    // ==========================================================================
    initQuickColorPresets();
    loadData();
    initMidi();

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registered:', reg.scope))
                .catch(err => console.warn('Service Worker registration failed:', err));
        });
    }
});
