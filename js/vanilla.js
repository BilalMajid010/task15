"use strict";

const assignmentList = document.getElementById("assignmentList");
const searchInput = document.getElementById("assignmentSearch");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const toastRegion = document.getElementById("toastRegion");

let assignments = [];
let applications = JSON.parse(localStorage.getItem("portalApplications") || "[]");
let currentMode = "vanilla";
let activeAssignmentId = null;

window.portalState = {
    get assignments() { return assignments; },
    set assignments(value) { assignments = value; },
    get mode() { return currentMode; },
    set mode(value) { currentMode = value; },
    renderVanilla: renderAssignmentsVanilla,
    openVanillaModal: openAssignmentModalVanilla,
    showToast: showToast
};

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function statusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "-");
}

function assignmentCardHTML(assignment) {
    return `
        <article class="assignment-card" data-assignment-id="${assignment.id}">
            <div class="card-top">
                <span class="category-tag">${escapeHTML(assignment.category)}</span>
                <span class="status-badge status-${statusClass(assignment.status)}">${escapeHTML(assignment.status)}</span>
            </div>
            <h3>${escapeHTML(assignment.title)}</h3>
            <p class="description">${escapeHTML(assignment.description)}</p>
            <div class="card-meta"><span>◷ ${escapeHTML(assignment.duration)}</span><span>${escapeHTML(assignment.level)}</span></div>
            <div class="card-actions">
                <button class="small-button view-button" data-action="view" data-id="${assignment.id}">View details</button>
                <button class="small-button primary apply-button" data-action="apply" data-id="${assignment.id}">Apply now</button>
            </div>
        </article>`;
}

function getFilteredAssignments() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const status = statusFilter.value;

    return assignments.filter(assignment => {
        const matchesSearch = assignment.title.toLowerCase().includes(searchTerm) ||
            assignment.description.toLowerCase().includes(searchTerm);
        const matchesCategory = category === "all" || assignment.category === category;
        const matchesStatus = status === "all" || assignment.status === status;
        return matchesSearch && matchesCategory && matchesStatus;
    });
}

function renderAssignmentsVanilla() {
    const filtered = getFilteredAssignments();
    assignmentList.innerHTML = filtered.map(assignmentCardHTML).join("");
    document.getElementById("resultCount").textContent =
        `${filtered.length} assignment${filtered.length === 1 ? "" : "s"} found`;
    document.getElementById("modeLabel").textContent = "Rendered with Vanilla JavaScript";
    document.getElementById("emptyState").classList.toggle("hidden", filtered.length !== 0);
}

function renderDashboard() {
    const total = assignments.length;
    const completed = assignments.filter(item => item.status === "Completed").length;
    const inProgress = assignments.filter(item => item.status === "In Progress").length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("progressCount").textContent = inProgress;
    document.getElementById("completedCount").textContent = completed;
    document.getElementById("applicationCount").textContent = applications.length;
    document.getElementById("completionPercent").textContent = `${percentage}%`;
    document.getElementById("completionBar").style.width = `${percentage}%`;

    const recent = assignments.slice(0, 4);
    document.getElementById("recentAssignments").innerHTML = recent.map(item => `
        <div class="compact-item">
            <div class="compact-icon">${escapeHTML(item.category.slice(0, 1))}</div>
            <div class="compact-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.category)} · ${escapeHTML(item.duration)}</span></div>
            <span class="status-badge status-${statusClass(item.status)}">${escapeHTML(item.status)}</span>
        </div>`).join("");
}

function renderApplications() {
    const table = document.getElementById("applicationTable");

    if (!applications.length) {
        table.innerHTML = '<tr><td colspan="5" class="table-empty">No applications submitted yet.</td></tr>';
        return;
    }

    table.innerHTML = applications.map(application => `
        <tr>
            <td>${escapeHTML(application.name)}</td>
            <td>${escapeHTML(application.assignmentTitle)}</td>
            <td>${escapeHTML(application.email)}</td>
            <td>${escapeHTML(application.date)}</td>
            <td><span class="status-badge status-pending">Submitted</span></td>
        </tr>`).join("");
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.textContent = message;
    toastRegion.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3200);
}

function openModal(title, content) {
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modalBackdrop.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    modalBackdrop.classList.add("hidden");
    document.body.style.overflow = "";
    activeAssignmentId = null;
}

function applicationFormHTML(assignmentTitle) {
    return `
        <form id="applicationForm" novalidate>
            <div class="form-grid">
                <div class="form-field"><label for="applicantName">Full name *</label><input id="applicantName" name="name" type="text" required maxlength="70" placeholder="Your full name"></div>
                <div class="form-field"><label for="applicantEmail">Email address *</label><input id="applicantEmail" name="email" type="email" required placeholder="name@example.com"></div>
                <div class="form-field"><label for="applicantPhone">Phone number</label><input id="applicantPhone" name="phone" type="tel" placeholder="Optional"></div>
                <div class="form-field"><label for="applicantRole">Preferred role</label><input id="applicantRole" name="role" type="text" placeholder="e.g. Frontend Developer"></div>
                <div class="form-field full"><label for="applicantMessage">Why are you applying? *</label><textarea id="applicantMessage" name="message" required maxlength="500" placeholder="Briefly describe your interest..."></textarea></div>
            </div>
            <p class="muted small">* Required fields. This demo saves applications in your browser only.</p>
            <div class="form-actions"><button type="button" class="small-button cancel-modal">Cancel</button><button type="submit" class="primary-button">Submit application</button></div>
        </form>`;
}

function openApplicationModal(assignmentTitle) {
    const title = assignmentTitle || "General Internship Application";
    activeAssignmentId = assignmentTitle ? assignments.find(item => item.title === assignmentTitle)?.id ?? null : null;
    openModal("Submit an application", `<p class="modal-description">Applying for: <strong>${escapeHTML(title)}</strong></p>${applicationFormHTML(title)}`);
}

function openAssignmentModalVanilla(id) {
    const assignment = assignments.find(item => item.id === Number(id));
    if (!assignment) return;

    const requirements = assignment.requirements.map(item => `<li>${escapeHTML(item)}</li>`).join("");
    openModal(assignment.title, `
        <div class="detail-meta"><span>${escapeHTML(assignment.category)}</span><span>${escapeHTML(assignment.level)}</span><span>${escapeHTML(assignment.duration)}</span><span>${escapeHTML(assignment.status)}</span></div>
        <p class="modal-description">${escapeHTML(assignment.description)}</p>
        <h3 class="small-heading">Requirements</h3><ul class="requirements">${requirements}</ul>
        <div class="form-actions"><button class="small-button cancel-modal">Close</button><button class="primary-button modal-apply" data-id="${assignment.id}">Apply for this task</button></div>
    `);
}

function submitApplication(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !message) {
        showToast("Please complete all required fields.", "error");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast("Please enter a valid email address.", "error");
        return;
    }

    const application = {
        id: Date.now(),
        name,
        email,
        phone: String(formData.get("phone") || "").trim(),
        role: String(formData.get("role") || "").trim(),
        message,
        assignmentTitle: form.dataset.assignmentTitle || "General Internship Application",
        date: new Date().toLocaleDateString()
    };

    applications.push(application);
    localStorage.setItem("portalApplications", JSON.stringify(applications));
    renderApplications();
    renderDashboard();
    closeModal();
    showToast("Your application was submitted successfully.");
}

async function loadAssignmentsVanilla() {
    try {
        const response = await fetch("data/assignments.json");
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        assignments = await response.json();
        renderAssignmentsVanilla();
        renderDashboard();
        renderApplications();
    } catch (error) {
        console.error("Vanilla fetch error:", error);
        assignmentList.innerHTML = "";
        document.getElementById("resultCount").textContent = "Assignments could not be loaded.";
        showToast("Could not load assignments. Run this project with a local server.", "error");
    }
}

assignmentList.addEventListener("click", event => {
    if (currentMode !== "vanilla") return;
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    if (button.dataset.action === "view") openAssignmentModalVanilla(id);
    if (button.dataset.action === "apply") {
        const assignment = assignments.find(item => item.id === Number(id));
        if (assignment) openApplicationModal(assignment.title);
    }
});

searchInput.addEventListener("input", () => {
    if (currentMode === "vanilla") renderAssignmentsVanilla();
});
categoryFilter.addEventListener("change", () => {
    if (currentMode === "vanilla") renderAssignmentsVanilla();
});
statusFilter.addEventListener("change", () => {
    if (currentMode === "vanilla") renderAssignmentsVanilla();
});

document.getElementById("closeModal").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", event => {
    if (event.target === modalBackdrop) closeModal();
});
modalBody.addEventListener("click", event => {
    if (event.target.closest(".cancel-modal")) closeModal();
    if (event.target.closest(".modal-apply")) {
        const assignment = assignments.find(item => item.id === Number(event.target.closest(".modal-apply").dataset.id));
        if (assignment) openApplicationModal(assignment.title);
    }
});
modalBody.addEventListener("submit", event => {
    if (event.target.id !== "applicationForm") return;
    event.preventDefault();
    submitApplication(event.target);
});

document.getElementById("openGeneralApplication").addEventListener("click", () => openApplicationModal(""));
document.getElementById("notificationButton").addEventListener("click", () => showToast("You're all caught up. Check your assignments for updates."));
document.getElementById("themeButton").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("portalTheme", isDark ? "dark" : "light");
    document.getElementById("themeIcon").textContent = isDark ? "☀" : "☾";
    document.getElementById("themeText").textContent = isDark ? "Light mode" : "Dark mode";
});
document.getElementById("menuButton").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
        link.classList.add("active");
        const section = link.dataset.section;
        document.getElementById("breadcrumbCurrent").textContent =
            section.charAt(0).toUpperCase() + section.slice(1);
        document.getElementById("sidebar").classList.remove("open");
    });
});

document.getElementById("implementationMode").addEventListener("change", event => {
    currentMode = event.target.value;
    if (currentMode === "vanilla") {
        renderAssignmentsVanilla();
        document.getElementById("modeLabel").textContent = "Rendered with Vanilla JavaScript";
    } else {
        window.renderAssignmentsJQuery();
    }
});

(function initializeTheme() {
    const savedTheme = localStorage.getItem("portalTheme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeIcon").textContent = "☀";
        document.getElementById("themeText").textContent = "Light mode";
    }
})();

loadAssignmentsVanilla();
