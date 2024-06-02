const scriptURL = 'https://script.google.com/macros/s/AKfycbyL6CIjCMpo4QiTK20NtmiNQ_TzbpmhDwHbSsO6AAs-3lq2-24oOKahMoEovUm7tzeJ/exec';

let totalFamilienGewinn = 0;

function showSection(sectionId) {
    document.querySelectorAll('.container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

async function fetchMitarbeiterData() {
    try {
        const response = await fetch(scriptURL + '?action=getEmployees');
        const data = await response.json();
        const mitarbeiterSelect = document.getElementById('mitarbeiter');
        const mitarbeiterListe = document.getElementById('familie-mitarbeiterliste');
        mitarbeiterSelect.innerHTML = '';
        mitarbeiterListe.innerHTML = '';

        data.forEach(row => {
            const { UUID, Name, TotalPayout } = row;
            const option = document.createElement('option');
            option.value = UUID;
            option.innerText = Name;
            mitarbeiterSelect.appendChild(option);

            const mitarbeiterRow = mitarbeiterListe.insertRow();
            mitarbeiterRow.setAttribute('data-uuid', UUID);
            mitarbeiterRow.insertCell(0).innerText = UUID;
            mitarbeiterRow.insertCell(1).innerText = Name;
            const auszahlungCell = mitarbeiterRow.insertCell(2);
            auszahlungCell.classList.add('auszahlung');
            auszahlungCell.innerText = `$${parseFloat(TotalPayout).toFixed(2)}`;
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Mitarbeiterdaten:', error);
    }
}

async function addAuftrag() {
    const auftrag = document.getElementById('auftrag').value;
    const gewinn = parseFloat(document.getElementById('gewinn').value);
    const kosten = parseFloat(document.getElementById('kosten').value);
    const mitarbeiterAnzahl = parseInt(document.getElementById('mitarbeiter-anzahl').value, 10);
    const mitarbeiterSelect = document.getElementById('mitarbeiter');
    const selectedMitarbeiter = Array.from(mitarbeiterSelect.selectedOptions).map(option => option.value);

    const auszahlungProMitarbeiter = (gewinn * 0.7) / mitarbeiterAnzahl;

    const auftragsliste = document.getElementById('auftragsliste');
    const row = auftragsliste.insertRow();
    row.insertCell(0).innerText = auftrag;
    row.insertCell(1).innerText = gewinn.toFixed(2);
    row.insertCell(2).innerText = kosten.toFixed(2);
    const mitarbeiterNames = selectedMitarbeiter.map(uuid => {
        const mitarbeiterOption = document.querySelector(`#mitarbeiter option[value='${uuid}']`);
        return mitarbeiterOption ? mitarbeiterOption.innerText : '';
    }).join(', ');
    row.insertCell(3).innerText = mitarbeiterNames;
    row.insertCell(4).innerText = auszahlungProMitarbeiter.toFixed(2);

    selectedMitarbeiter.forEach(mitarbeiterUUID => {
        const mitarbeiterRow = document.querySelector(`#familie-mitarbeiterliste tr[data-uuid='${mitarbeiterUUID}']`);
        if (mitarbeiterRow) {
            const auszahlungCell = mitarbeiterRow.querySelector('.auszahlung');
            const aktuelleAuszahlung = parseFloat(auszahlungCell.innerText.slice(1)); // Entferne das $-Zeichen vor dem Parsen
            auszahlungCell.innerText = `$${(aktuelleAuszahlung + auszahlungProMitarbeiter).toFixed(2)}`;
            updateMitarbeiterInGoogleSheet(mitarbeiterUUID, (aktuelleAuszahlung + auszahlungProMitarbeiter).toFixed(2));
        }
    });

    const familienGewinn = gewinn * 0.3;
    totalFamilienGewinn += familienGewinn;
    document.getElementById('familien-gewinn').innerText = `Gesamtgewinn der Familie: $${totalFamilienGewinn.toFixed(2)}`;

    document.getElementById('auftrag-form').reset();
    mitarbeiterSelect.selectedIndex = -1;
}

async function addMitarbeiterFromFamilie() {
    const uuid = document.getElementById('familie-uuid').value;
    const name = document.getElementById('familie-name').value;

    const mitarbeiterliste = document.getElementById('familie-mitarbeiterliste');
    const mitarbeiterRow = mitarbeiterliste.insertRow();
    mitarbeiterRow.setAttribute('data-uuid', uuid);
    mitarbeiterRow.insertCell(0).innerText = uuid;
    mitarbeiterRow.insertCell(1).innerText = name;
    const auszahlungCell = mitarbeiterRow.insertCell(2);
    auszahlungCell.classList.add('auszahlung');
    auszahlungCell.innerText = '$0.00';

    const mitarbeiterSelect = document.getElementById('mitarbeiter');
    const option = document.createElement('option');
    option.value = uuid;
    option.innerText = name;
    mitarbeiterSelect.appendChild(option);

    await addMitarbeiterToGoogleSheet(uuid, name, 0);

    document.getElementById('familie-form').reset();
}

async function addMitarbeiterToGoogleSheet(uuid, name, auszahlung) {
    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'addEmployee',
                uuid,
                name,
                totalPayout: auszahlung
            })
        });
        const data = await response.text();
        console.log('Mitarbeiter hinzugefügt:', data);
        fetchMitarbeiterData();
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Mitarbeiters:', error);
    }
}

async function updateMitarbeiterInGoogleSheet(uuid, auszahlung) {
    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'updateEmployee',
                uuid,
                totalPayout: auszahlung
            })
        });
        const data = await response.text();
        console.log('Mitarbeiter aktualisiert:', data);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Mitarbeiters:', error);
    }
}

// Initiales Laden der Mitarbeiterdaten beim Start
document.addEventListener('DOMContentLoaded', fetchMitarbeiterData);
