document.addEventListener('DOMContentLoaded', function() {
    const themeBtn = document.getElementById('themeBtn');
    themeBtn.addEventListener('click', toggleTheme);

    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            navLinks.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    fetchAndPopulateData();
    showSection('tenses');

    const searchTenses = document.getElementById('searchTenses');
    searchTenses.addEventListener('input', () => filterTenses(searchTenses.value.toLowerCase()));

    const contentForm = document.getElementById('contentForm');
    contentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addNewContent();
    });
});

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const themeBtn = document.getElementById('themeBtn');
    themeBtn.innerHTML = document.body.classList.contains('light-theme')
        ? '<i class="fas fa-sun"></i> Dark Mode'
        : '<i class="fas fa-moon"></i> Light Mode';
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

function filterTenses(searchTerm) {
    const tenseCards = document.querySelectorAll('#tensesContainer .grammar-card');
    tenseCards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        card.style.display = cardText.includes(searchTerm) ? 'flex' : 'none';
    });
}

async function fetchAndPopulateData() {
    try {
        const response = await fetch('http://localhost:5000/api/grammar');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const allContent = await response.json();
        
        const containers = {
            tense: document.getElementById('tensesContainer'),
            'part-of-speech': document.getElementById('partsContainer'),
            'be-verb': document.getElementById('beVerbsContainer'),
            preposition: document.getElementById('prepositionsContainer'),
            'either-neither': document.getElementById('eitherNeitherContainer')
        };
        
        Object.values(containers).forEach(c => c.innerHTML = '');

        allContent.forEach(item => {
            if (containers[item.category]) {
                containers[item.category].appendChild(createGrammarCard(item));
            }
        });
    } catch (error) {
        console.error("Could not fetch grammar data:", error);
        alert('Failed to load data from the server. Make sure the backend is running.');
    }
}

async function addNewContent() {
    const newContent = {
        category: document.getElementById('contentType').value,
        title: document.getElementById('contentTitle').value,
        definition: document.getElementById('contentDefinition').value,
        examples: document.getElementById('contentExamples').value.split('\n').filter(e => e.trim() !== ''),
        notes: document.getElementById('contentNotes').value
    };

    if (!newContent.category || !newContent.title || !newContent.definition) {
        alert('Please fill out the Type, Title, and Definition fields.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/grammar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newContent),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server responded with status: ${response.status}`);
        }
        
        const savedContent = await response.json();
        const container = document.getElementById(getContainerId(savedContent.category));
        if (container) {
            container.appendChild(createGrammarCard(savedContent));
        }

        document.getElementById('contentForm').reset();
        alert('New content added successfully!');
        
    } catch (error) {
        console.error('Failed to add new content:', error);
        alert(`Error: ${error.message}`);
    }
}

function getContainerId(category) {
    const map = {
        'tense': 'tensesContainer',
        'part-of-speech': 'partsContainer',
        'be-verb': 'beVerbsContainer',
        'preposition': 'prepositionsContainer',
        'either-neither': 'eitherNeitherContainer'
    };
    return map[category];
}

function createGrammarCard(data) {
    const card = document.createElement('div');
    card.className = 'grammar-card';
    card.innerHTML = `
        <h3>${data.title}</h3>
        <p>${data.definition}</p>
        ${data.examples && data.examples.length > 0 ? `
        <div class="examples">
            <h4>Examples:</h4>
            <ul>
                ${data.examples.map(ex => `<li>${ex}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        ${data.notes ? `<p><strong>Note:</strong> ${data.notes}</p>` : ''}
    `;
    return card;
}