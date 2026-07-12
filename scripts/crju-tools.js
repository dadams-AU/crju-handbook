/*
 * CRJU Handbook interactive tools
 * -------------------------------
 * 1. Career Explorer
 * 2. Course Tracker (progress saved in localStorage)
 * 3. Path Planner (semester road maps)
 *
 * Course data and road maps sourced from the CRJU Undergraduate
 * Advising Handbook, Fall 2026 (Dr. Christie Gardiner et al.).
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeCareerExplorer();
    initializeCourseTracker();
    initializePathPlanner();
});

/* =========================================
   1. Career Explorer
   ========================================= */

const careers = {
    enforce: {
        title: 'Law Enforcement & Investigation',
        roles: ['City/County Police Officer', 'Highway Patrol', 'Deputy Sheriff', 'Detective', 'Campus Police', 'Dispatcher', 'Environmental Conservation Officer', 'Military Officer', 'National Parks Police'],
        courses: [['CRJU 315', 'Police and Society'], ['CRJU 415', 'Policing the City'], ['CRJU 433', 'Controlling Crime'], ['CRJU 462', 'Crime Analysis'], ['CRJU 385', 'Race, Inequality, and the CJS']],
        minors: ['Computer Science — computer forensics (CS-522)', 'Geography — GIS & crime mapping (H-420A)', 'Psychology — behavioral insight (H-830)', 'Foreign Language — advantage in federal hiring (H-835A)'],
        tip: 'Start internship applications 3–6 months early. Federal agencies (FBI, DHS, DEA) require up to a year of advance planning and strong grades.',
        contact: 'Dr. Christie Gardiner — cgardiner@fullerton.edu | CRJU 495 internship'
    },
    law: {
        title: 'Law & Courts',
        roles: ['Paralegal', 'Victim Advocate', 'Court Clerk', 'Mediator', 'Bailiff', 'Court Reporter', 'Court Administrator', 'Attorney (requires J.D.)', 'Judge (requires J.D.)', 'Lawyer (requires J.D.)'],
        courses: [['CRJU 210', 'Concepts of Criminal Law'], ['CRJU 402', 'The Criminal Court Experience'], ['CRJU 471', 'Moot Court'], ['CRJU 480', 'Courtroom Evidence'], ['CRJU 484', 'Criminal Law: Substantive'], ['CRJU 485', 'Search, Seizure & Interrogation I']],
        minors: ['Law, Politics, and Society — 18 units (GH-511)', 'Philosophy — highest national LSAT scores (H-311)', 'Communication Studies — oral advocacy (CP-420)'],
        tip: 'Take ENGL 365 (Legal Writing) for your writing requirement. Join the Pre-Law Society and Moot Court early — both matter on law school applications.',
        contact: 'Dr. Rob Castro — rcastro@fullerton.edu | Pre-law advising & CRJU 492'
    },
    corrections: {
        title: 'Corrections & Rehabilitation',
        roles: ['Correctional Officer', 'Probation Officer', 'Parole Officer', 'Juvenile Justice Counselor', 'Halfway House Manager', 'Corrections Facilities Manager', 'Warden', 'Substance Abuse Specialist', 'Vocational Counselor'],
        courses: [['CRJU 325', 'Juvenile Justice Administration'], ['CRJU 345', 'Complexities in Corrections'], ['CRJU 410', 'Restorative Justice'], ['CRJU 440', 'Correctional Rehabilitation']],
        minors: ['Psychology — 21 units (H-830)', 'Human Services — 21 units with fieldwork (EC-405)', 'Child & Adolescent Studies — 21 units (EC-503)'],
        tip: 'Internships with county probation and juvenile hall are strong résumé builders. OC and LA County both have active programs.',
        contact: 'Dr. Christie Gardiner — cgardiner@fullerton.edu | CRJU 495 internship'
    },
    forensics: {
        title: 'Forensic Science & CSI',
        roles: ['Crime Scene Investigator', 'Forensic Lab Analyst', 'Ballistics Specialist', 'Arson Specialist', 'Medical Examiner Investigator', 'Document Specialist'],
        courses: [['CRJU 305', 'Introduction to Criminalistics'], ['CRJU 340', 'Research Methodology'], ['CRJU 462', 'Crime Analysis']],
        minors: ['Chemistry — 24 units, lab & instrumentation (MH-580)', 'Biology — 22–23 units (MH-282)', 'Anthropology — 21 units + Forensic Anthropology Certificate (MH-426)'],
        tip: 'The Forensic Anthropology Certificate (12 units: ANTH 343, 443, 444 + electives) is a distinctive credential. The Chemistry minor offers strong lab and instrumentation tracks.',
        contact: 'Anthropology dept. (MH-426) or Chemistry dept. (MH-580) for minor advising'
    },
    victims: {
        title: 'Victim Services & Advocacy',
        roles: ['Victim Advocate', 'Crisis Counselor', 'Non-Profit Advocate', 'Child Support Agency Worker', 'Social Worker (M.S.W. for licensed)', 'Child Protective Services', 'Domestic Violence Staff'],
        courses: [['CRJU 327', 'Victims of Crime'], ['CRJU 325', 'Juvenile Justice Administration'], ['CRJU 370', 'Sex, Crime, and Culture'], ['CRJU 410', 'Restorative Justice'], ['CRJU 430', 'Women and Crime']],
        minors: ['Human Services — 21 units with fieldwork (EC-405)', 'Psychology — 21 units (H-830)', 'Child & Adolescent Studies — 21 units (EC-503)', 'Sociology — 21 units (CP-900)'],
        tip: 'Domestic violence internship agencies require a 40-hour volunteer training, usually held in summer. Plan accordingly.',
        contact: 'Dr. Alissa Ackerman — aackerman@fullerton.edu'
    },
    policy: {
        title: 'Policy, Research & Academia',
        roles: ['Crime Analyst (requires advanced study)', 'Policy Analyst', 'Research Coordinator', 'Non-Profit Director', 'Security Intelligence Analyst', 'Private Investigator', 'Criminologist (doctoral)', 'Professor (Ph.D. required)'],
        courses: [['CRJU 340', 'Research Methodology'], ['CRJU 405', 'Criminal Justice Policy'], ['CRJU 462', 'Crime Analysis'], ['CRJU 491', 'Applied Policy Research'], ['CRJU 499', 'Independent Study with Faculty']],
        minors: ['Public Policy — 21 units (GH-511)', 'Sociology — 21 units (CP-900)', 'Geography — GIS focus, 18 units (H-420A)', 'Business Data Analytics — 21 units (SMGH-4113)'],
        tip: 'The McNair Scholars Program supports students aiming for doctoral study. Talk to faculty early about research opportunities listed in the Faculty Roster.',
        contact: 'Dr. Christie Gardiner — cgardiner@fullerton.edu | Dr. Sarah Hill — Chair'
    },
    federal: {
        title: 'Federal Agencies',
        roles: ['FBI Special Agent', 'CIA Analyst', 'DEA Special Agent', 'Secret Service Agent', 'U.S. Marshal', 'ATF Agent', 'Border Patrol Agent', 'Homeland Security Officer', 'Inspector General', 'IRS Criminal Investigator'],
        courses: [['CRJU 360', 'Comparative & International CJ Systems'], ['CRJU 385', 'Race, Inequality, and the CJS'], ['CRJU 462', 'Crime Analysis'], ['CRJU 474', 'Civil Liberties']],
        minors: ['Foreign Language — bilingualism is a major advantage (H-835A)', 'Computer Science — tech/cyber roles (CS-522)', 'Business Data Analytics — intelligence analysis (SMGH-4113)', 'IC Scholars Program — structured national security pathway'],
        tip: 'Federal agencies are highly competitive. Plan a full year ahead. Aim for a 3.0+ GPA. The IC Scholars Program (min. 3.2 GPA) provides mentoring and a structured pathway.',
        contact: "IC Scholars Program: Dr. Valerie O'Regan — voregan@fullerton.edu"
    }
};

function initializeCareerExplorer() {
    const pills = document.querySelectorAll('.career-pill');
    if (!pills.length) return;

    pills.forEach((pill) => {
        pill.addEventListener('click', () => {
            pills.forEach((p) => {
                p.classList.remove('active');
                p.setAttribute('aria-pressed', 'false');
            });
            pill.classList.add('active');
            pill.setAttribute('aria-pressed', 'true');
            renderCareer(pill.getAttribute('data-career'));
        });
        pill.setAttribute('aria-pressed', 'false');
    });
}

function renderCareer(key) {
    const data = careers[key];
    const detail = document.getElementById('career-detail');
    const prompt = document.getElementById('career-prompt');
    if (!data || !detail) return;

    if (prompt) prompt.hidden = true;
    detail.hidden = false;
    detail.innerHTML = `
        <div class="card">
            <h3><i class="fas fa-bullseye" aria-hidden="true"></i> ${data.title}</h3>
            <div class="badge-wrap">${data.roles.map((r) => `<span class="badge">${r}</span>`).join('')}</div>
            <h4>Key courses to prioritize</h4>
            ${data.courses.map(([code, name]) => `<div class="course-row static"><span class="c-code">${code}</span><span class="c-name">${name}</span></div>`).join('')}
        </div>
        <div class="card">
            <h3><i class="fas fa-plus-circle" aria-hidden="true"></i> Recommended minors</h3>
            ${data.minors.map((m) => `<div class="course-row static"><i class="fas fa-thumbtack c-code" aria-hidden="true"></i><span class="c-name">${m}</span></div>`).join('')}
        </div>
        <div class="alert-box info"><i class="fas fa-lightbulb" aria-hidden="true"></i><span>${data.tip}</span></div>
        <p class="text-sm text-gray-600"><i class="fas fa-user" aria-hidden="true"></i> Contact: ${data.contact}</p>
    `;
}

/* =========================================
   2. Course Tracker
   ========================================= */

const trackerCourses = {
    core: [
        ['CRJU 101', 'Introduction to Criminal Justice', 3],
        ['CRJU 210', 'Concepts of Criminal Law', 3],
        ['CRJU 301', 'Mythology of Crime and Justice', 3],
        ['CRJU 330', 'Theories of Crime and Delinquency', 3],
        ['CRJU 340', 'CJ Research Methodology', 3],
        ['CRJU 385', 'Race, Inequality, and the CJS', 3]
    ],
    breadth: [
        ['CRJU 302', 'Introduction to Courts', 3],
        ['CRJU 315', 'Police and Society', 3],
        ['CRJU 345', 'Complexities in Corrections', 3]
    ],
    electives: [
        ['CRJU 305', 'Introduction to Criminalistics', 3],
        ['CRJU 320', 'Intro to Public Management & Policy', 3],
        ['CRJU 322', 'Leadership for Public Service', 3],
        ['CRJU 325', 'Juvenile Justice Administration', 3],
        ['CRJU 327', 'Victims of Crime', 3],
        ['CRJU 333', 'Indigenous Justice', 3],
        ['CRJU 355', 'White Collar Crime', 3],
        ['CRJU 360', 'Comparative & International CJ Systems', 3],
        ['CRJU 362', 'Immigration and Crime', 3],
        ['CRJU 370', 'Sex, Crime, and Culture', 3],
        ['CRJU 402', 'The Criminal Court Experience', 3],
        ['CRJU 404', 'Capital Punishment', 3],
        ['CRJU 405', 'Criminal Justice Policy', 3],
        ['CRJU 406', 'Crime & Popular Culture', 3],
        ['CRJU 410', 'Restorative Justice', 3],
        ['CRJU 415', 'Policing the City', 3],
        ['CRJU 417', 'Mass Murder', 3],
        ['CRJU 420', 'Drugs and Crime', 3],
        ['CRJU 422', 'Human Resource Management', 3],
        ['CRJU 430', 'Women and Crime', 3],
        ['CRJU 433', 'Controlling Crime', 3],
        ['CRJU 435', 'Civil Disobedience and Social Justice', 3],
        ['CRJU 440', 'Correctional Rehabilitation', 3],
        ['CRJU 455', 'Gangs & the Criminal Justice System', 3],
        ['CRJU 462', 'Crime Analysis', 3],
        ['CRJU 465', 'Law, Punishment and Justice', 3],
        ['CRJU 471', 'Moot Court', 3],
        ['CRJU 474', 'Civil Liberties', 3],
        ['CRJU 475T', 'Various Topics in Admin. of Justice', 3],
        ['CRJU 477', 'Mock Trial: Legal Practicum II', 3],
        ['CRJU 478', 'Animals, Law, & Society', 3],
        ['CRJU 480', 'Courtroom Evidence', 3],
        ['CRJU 484', 'Criminal Law: Substantive', 3],
        ['CRJU 485', 'Search, Seizure & Interrogation I', 3],
        ['CRJU 486', 'Search, Seizure & Interrogation II', 3],
        ['CRJU 491', 'Applied Policy Research', 3],
        ['CRJU 492', 'Pre-law Internship', 3],
        ['CRJU 495', 'Criminal Justice Internship', 3],
        ['CRJU 499', 'Independent Study (1–3 units)', 3]
    ],
    writing: [
        ['ENGL 301', 'Advanced College Writing', 3],
        ['ENGL 365', 'Legal Writing (recommended for pre-law)', 3]
    ]
};

const TRACKER_TOTAL_UNITS = 54;
const TRACKER_STORAGE_KEY = 'crju_checked_final';
let trackerChecked = {};

function initializeCourseTracker() {
    if (!document.getElementById('core-courses')) return;

    try {
        trackerChecked = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || '{}');
    } catch (e) {
        trackerChecked = {};
    }

    renderCourseList('core-courses', trackerCourses.core);
    renderCourseList('breadth-courses', trackerCourses.breadth);
    renderCourseList('elective-courses', trackerCourses.electives);
    renderCourseList('writing-courses', trackerCourses.writing);
    updateTrackerProgress();
}

function renderCourseList(containerId, courses) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    courses.forEach(([code, name, units]) => {
        const id = code.replace(/[\s\/]/g, '_');
        const done = !!trackerChecked[id];
        const row = document.createElement('div');
        row.className = 'course-row' + (done ? ' done' : '');
        row.id = 'row_' + id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'cb_' + id;
        checkbox.checked = done;
        checkbox.setAttribute('aria-label', code + ' ' + name + ', ' + units + ' units');
        checkbox.addEventListener('change', () => toggleCourse(id, row));

        const codeSpan = document.createElement('span');
        codeSpan.className = 'c-code';
        codeSpan.textContent = code;

        const nameLabel = document.createElement('label');
        nameLabel.className = 'c-name';
        nameLabel.setAttribute('for', 'cb_' + id);
        nameLabel.textContent = name;

        const unitsSpan = document.createElement('span');
        unitsSpan.className = 'c-units';
        unitsSpan.textContent = units + 'u';

        row.append(checkbox, codeSpan, nameLabel, unitsSpan);
        container.appendChild(row);
    });
}

function toggleCourse(id, row) {
    trackerChecked[id] = !trackerChecked[id];
    const checkbox = document.getElementById('cb_' + id);
    if (checkbox) checkbox.checked = trackerChecked[id];
    row.classList.toggle('done', !!trackerChecked[id]);
    try {
        localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(trackerChecked));
    } catch (e) {
        /* private-browsing modes may block storage; tracker still works for the session */
    }
    updateTrackerProgress();
}

function updateTrackerProgress() {
    const done = Object.values(trackerChecked).filter(Boolean).length * 3;
    const pct = Math.min(100, Math.round((done / TRACKER_TOTAL_UNITS) * 100));
    const doneEl = document.getElementById('t-done');
    const leftEl = document.getElementById('t-left');
    const pctEl = document.getElementById('t-pct');
    const barEl = document.getElementById('t-bar');
    if (doneEl) doneEl.textContent = done;
    if (leftEl) leftEl.textContent = Math.max(0, TRACKER_TOTAL_UNITS - done);
    if (pctEl) pctEl.textContent = pct + '%';
    if (barEl) {
        barEl.style.width = pct + '%';
        const barBg = barEl.parentElement;
        if (barBg) barBg.setAttribute('aria-valuenow', String(pct));
    }
}

/* =========================================
   3. Path Planner
   ========================================= */

const roadMaps = {
    f4: {
        heads: ['Year 1 Fall', 'Year 1 Spring', 'Year 2 Fall', 'Year 2 Spring', 'Year 3 Fall', 'Year 3 Spring', 'Year 4 Fall', 'Year 4 Spring'],
        rows: [
            ['GE Area 1B or 1C', 'GE Area 1A, 1B, or 1C', 'GE Area 1A, 1B, or 1C', 'GE Area 2U/5U', 'CRJU 385 (GE Area Z)', 'Major Breadth (302/315/345)', 'CRJU Elective 400-lvl', 'CRJU Elective 400-lvl'],
            ['GE Area 2A', 'GE Area 5A or 5B/5C', 'GE Area 5A or 5B/5C', 'GE Area 3U', 'CRJU 330 (Major Req)', 'CRJU Elective 300-lvl', 'CRJU Elective 300-lvl', 'CRJU Elective 400-lvl'],
            ['GE Area 3A or 3B', 'GE Area 3A or 3B', 'POSC 100 (Grad Req)', 'GE Area 4U', 'CRJU 340 (Major Req)', 'Related Fields Course', 'Related Fields Course', 'Related Fields Course'],
            ['GE Area 4A or 4B', 'GE Area 4A or 4B', 'CRJU 210 (Major Req)', 'CRJU 301 (Major Req)', 'Major Breadth (302/315/345)', 'Related Fields Course', 'Free Elective', 'Free Elective'],
            ['CRJU 101 (Major Req)', 'GE Area 6', 'Free Elective', 'ENGL 301 or ENGL 365', 'Free Elective', 'Free Elective', 'Free Elective', 'Free Elective'],
            ['15 units', '15–16 units', '15–16 units', '15 units', '15 units', '15 units', '15 units', '15 units']
        ]
    },
    f5: {
        heads: ['Yr1 Fall', 'Yr1 Spring', 'Yr2 Fall', 'Yr2 Spring', 'Yr3 Fall', 'Yr3 Spring', 'Yr4 Fall', 'Yr4 Spring', 'Yr5 Fall', 'Yr5 Spring'],
        rows: [
            ['GE 1B/1C', 'GE 1A/1B/1C', 'GE 1A/1B/1C', 'GE Area 6', 'GE Area 2U/5U', 'ENGL 301 or 365', 'CRJU 330', 'CRJU Elective 300-lvl', 'CRJU Elective 400-lvl', 'CRJU Elective 400-lvl'],
            ['GE Area 2A', 'GE 5A/5B/5C', 'GE 5A/5B/5C', 'POSC 100', 'GE Area 3U', 'CRJU 385 (GE Area Z)', 'CRJU 340', 'CRJU Elective 300-lvl', 'CRJU Elective 400-lvl', 'Free Elective'],
            ['GE 3A or 3B', 'GE 3A or 3B', 'GE 4A or 4B', 'GE 4A or 4B', 'GE Area 4U', 'CRJU 301', 'Major Breadth', 'Related Fields', 'Related Fields', 'Related Fields'],
            ['Free Elective', 'CRJU 101', 'CRJU 210', 'Free Elective', 'Free Elective', 'Major Breadth', 'Free Elective', 'Related Fields', 'Free Elective', 'Free Elective'],
            ['12 units', '12–13 units', '12–13 units', '12 units', '12 units', '12 units', '12 units', '12 units', '12 units', '12 units']
        ]
    },
    t2: {
        heads: ['Year 1 Fall', 'Year 1 Spring', 'Year 2 Fall', 'Year 2 Spring'],
        rows: [
            ['CRJU 101* (or Free Elective)', 'GE Area 4U / CRJU Elective 300-lvl', 'CRJU 330 (Major Req)', 'CRJU Elective 300-lvl'],
            ['CRJU 210** (or Free Elective)', 'Related Fields Elective', 'CRJU 340 (Major Req)', 'CRJU Elective 400-lvl'],
            ['ENGL 301 or ENGL 365', 'Related Fields Elective', 'Major Breadth (302/315/345)', 'CRJU Elective 400-lvl'],
            ['GE Area 2U/5U', 'CRJU 301 (Major Req)', 'Major Breadth (302/315/345)', 'CRJU Elective 400-lvl'],
            ['GE Area 3U', 'CRJU 385 (GE Area Z)', 'Related Fields Course', 'Related Fields Course'],
            ['15 units', '15 units', '15 units', '15 units']
        ]
    },
    t3: {
        heads: ['Year 1 Fall', 'Year 1 Spring', 'Year 2 Fall', 'Year 2 Spring', 'Year 3 Fall', 'Year 3 Spring'],
        rows: [
            ['CRJU 101* (or Free Elective)', 'CRJU 301 (Major Req)', 'CRJU 330 (Major Req)', 'Major Breadth (302/315/345)', 'CRJU Elective 400-lvl', 'CRJU Elective 400-lvl'],
            ['CRJU 210** (or Free Elective)', 'CRJU 385 (GE Area Z)', 'CRJU 340 (Major Req)', 'Related Fields Course', 'CRJU Elective 400-lvl', 'Related Fields Course'],
            ['ENGL 301 or ENGL 365', 'GE Area 4U / CRJU Elective 300-lvl', 'Major Breadth (302/315/345)', 'CRJU Elective 300-lvl', 'Related Fields Course', 'Free Elective'],
            ['GE Area 3U', 'GE Area 2U/5U', 'Free Elective', 'Related Fields Course', 'CRJU Elective 300-lvl', 'Free Elective'],
            ['12 units', '12 units', '12 units', '12 units', '12 units', '12 units']
        ]
    }
};

const planState = {};

function initializePathPlanner() {
    const plannerSection = document.getElementById('planner');
    if (!plannerSection) return;

    plannerSection.addEventListener('click', (event) => {
        const button = event.target.closest('.opt-btn');
        if (!button) return;
        pickPlanOption(button.getAttribute('data-key'), button.getAttribute('data-val'), button);
    });
}

function pickPlanOption(key, val, button) {
    planState[key] = val;
    button.closest('.plan-step').querySelectorAll('.opt-btn').forEach((b) => {
        b.classList.remove('sel');
        b.querySelector('.opt-check').textContent = '';
    });
    button.classList.add('sel');
    button.querySelector('.opt-check').textContent = '✓';

    if (key === 'entry') {
        const stepOne = document.getElementById('ps-1');
        stepOne.classList.remove('plan-step-hidden');
        const isFreshman = val === 'freshman';
        const options = isFreshman
            ? [['4', '4 years (30+ units/year)'], ['5', '5 years (24+ units/year)']]
            : [['2', '2 years (30+ units/year)'], ['3', '3 years (24+ units/year)']];
        document.getElementById('ps-1-opts').innerHTML = options
            .map(([v, label]) => `<button type="button" class="opt-btn" data-key="years" data-val="${v}"><span class="opt-check" aria-hidden="true"></span><span>${label}</span></button>`)
            .join('');
    }
    if (key === 'years') {
        document.getElementById('ps-2').classList.remove('plan-step-hidden');
    }
    if (key === 'hours') {
        renderPlanResult(val);
    }
}

function renderPlanResult(hours) {
    const maxUnits = { '0-9': '14–16', '10-19': '13–14', '20-29': '9–12', '30-39': '6–9' }[hours];
    const mapKey = (planState.entry === 'freshman' ? 'f' : 't') + planState.years;
    const map = roadMaps[mapKey] || roadMaps.f4;
    const colWidth = Math.floor(100 / map.heads.length);

    document.getElementById('plan-result').innerHTML = `
        <div class="alert-box success"><i class="fas fa-circle-check" aria-hidden="true"></i><span>Recommended load: <strong>${maxUnits} units/semester</strong> given your outside commitments. Remember: max 18 units/semester (petition to exceed). Consult your advisor regularly.</span></div>
        <div class="table-wrap">
            <table class="rm-table">
                <tr>${map.heads.map((h) => `<th scope="col" style="width:${colWidth}%;">${h}</th>`).join('')}</tr>
                ${map.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}
            </table>
        </div>
        <p class="text-sm text-gray-600 mt-1">* Take CRJU 101 only if you have not completed an equivalent Intro to CJ course at community college.<br>** Take CRJU 210 only if you have not completed an equivalent Concepts of Criminal Law course at community college.<br>This is a sample only — bring your Titan Degree Audit to every advising session.</p>
    `;
}
