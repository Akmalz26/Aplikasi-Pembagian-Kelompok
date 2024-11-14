
// Tab functions
function showTab(tabName) {
    document.getElementById('generatorTab').classList.remove('active');
    document.getElementById('historyTab').classList.remove('active');
    document.getElementById('generatorSection').style.display = 'none';
    document.getElementById('historySection').style.display = 'none';

    if (tabName === 'generator') {
        document.getElementById('generatorTab').classList.add('active');
        document.getElementById('generatorSection').style.display = 'block';
    } else {
        document.getElementById('historyTab').classList.add('active');
        document.getElementById('historySection').style.display = 'block';
    }
}

function addParticipant() {
    const nameInput = document.getElementById('name');
    const genderSelect = document.getElementById('gender');
    
    if (nameInput.value.trim() === '') {
        alert('Nama tidak boleh kosong!');
        return;
    }

    const participant = {
        id: Date.now(),
        name: nameInput.value.trim(),
        gender: genderSelect.value
    };

    window.participants.push(participant);
    saveToFirebase();
    updateParticipantList();
    
    nameInput.value = '';
}

function deleteParticipant(id) {
    window.participants = window.participants.filter(p => p.id !== id);
    saveToFirebase();
    updateParticipantList();
}

function updateParticipantList() {
    const list = document.getElementById('participantList');
    list.innerHTML = '';
    
    window.participants.forEach(p => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <span>${p.name} (${p.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
            <div>
            <button class="delete-btn" onclick="deleteParticipant(${p.id})">Hapus</button>
            <dib>
        `;
        list.appendChild(item);
    });
}

function generateGroups() {
    const groupCount = parseInt(document.getElementById('groupCount').value);
    const minMale = parseInt(document.getElementById('minMale').value);
    const minFemale = parseInt(document.getElementById('minFemale').value);
    const groupTitle = document.getElementById('groupTitle').value.trim();
    
    if (!groupTitle) {
        alert('Mohon isi judul pembagian kelompok!');
        return;
    }

    if (window.participants.length < groupCount) {
        alert('Jumlah peserta harus lebih banyak dari jumlah kelompok!');
        return;
    }

    const males = window.participants.filter(p => p.gender === 'L');
    const females = window.participants.filter(p => p.gender === 'P');

    if (males.length < minMale * groupCount || females.length < minFemale * groupCount) {
        alert('Jumlah peserta tidak mencukupi untuk memenuhi syarat minimal gender per kelompok!');
        return;
    }

    const shuffledParticipants = [...window.participants].sort(() => Math.random() - 0.5);
    const groups = Array.from({ length: groupCount }, () => []);
    let currentGroup = 0;

    males.slice(0, minMale * groupCount).forEach(male => {
        groups[currentGroup].push(male);
        currentGroup = (currentGroup + 1) % groupCount;
    });

    females.slice(0, minFemale * groupCount).forEach(female => {
        groups[currentGroup].push(female);
        currentGroup = (currentGroup + 1) % groupCount;
    });

    shuffledParticipants
        .filter(p => !groups.flat().includes(p))
        .forEach(p => {
            groups[currentGroup].push(p);
            currentGroup = (currentGroup + 1) % groupCount;
        });

    const historyEntry = {
        title: groupTitle,
        date: new Date().toISOString(),
        groups: groups,
        settings: {
            groupCount,
            minMale,
            minFemale
        }
    };

    saveGroupsToHistory(historyEntry);
    displayGroups(groups);
}

function displayGroups(groups) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    groups.forEach((group, index) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        
        const maleCount = group.filter(p => p.gender === 'L').length;
        const femaleCount = group.filter(p => p.gender === 'P').length;

        groupDiv.innerHTML = `
            <h3>Kelompok ${index + 1}</h3>
            <p>Jumlah: ${group.length} (L: ${maleCount}, P: ${femaleCount})</p>
            <ul>
                ${group.map(p => `<li>${p.name} (${p.gender})</li>`).join('')}
            </ul>
        `;
        resultsDiv.appendChild(groupDiv);
    });
}

function saveToFirebase() {
    const participantsRef = window.dbRef(window.database, 'participants');
    window.dbSet(participantsRef, window.participants);
}

function saveGroupsToHistory(historyEntry) {
    const historyRef = window.dbRef(window.database, 'history');
    const newHistoryRef = window.dbPush(historyRef);
    window.dbSet(newHistoryRef, historyEntry);
    window.groupHistory.unshift(historyEntry);
    displayHistory();
}

function displayHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    window.groupHistory.forEach((entry, index) => {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const historyCard = document.createElement('div');
        historyCard.className = 'history-card';
        historyCard.innerHTML = `
            <h3>
                ${entry.title}
                <span class="history-date">${formattedDate}</span>
            </h3>
            <p>Jumlah Kelompok: ${entry.settings.groupCount}</p>
            <p>Minimal L/P: ${entry.settings.minMale}/${entry.settings.minFemale}</p>
            ${entry.groups.map((group, groupIndex) => `
                <div class="group">
                    <h4>Kelompok ${groupIndex + 1}</h4>
                    <ul>
                        ${group.map(p => `<li>${p.name} (${p.gender})</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        `;
        historyList.appendChild(historyCard);
    });
}