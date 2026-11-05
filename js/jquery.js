"use strict";

$(function () {
    const $assignmentList = $("#assignmentList");
    const $search = $("#assignmentSearch");
    const $category = $("#categoryFilter");
    const $status = $("#statusFilter");
    const $modalBackdrop = $("#modalBackdrop");
    const $modalTitle = $("#modalTitle");
    const $modalBody = $("#modalBody");

    function jqueryEscapeHTML(value) {
        return $("<div>").text(String(value)).html();
    }

    function jqueryStatusClass(status) {
        return status.toLowerCase().replace(/\s+/g, "-");
    }

    function renderAssignmentsJQuery() {
        const searchText = $search.val().trim().toLowerCase();
        const categoryValue = $category.val();
        const statusValue = $status.val();

        const filtered = window.portalState.assignments.filter(function (assignment) {
            const matchesSearch = assignment.title.toLowerCase().includes(searchText) ||
                assignment.description.toLowerCase().includes(searchText);
            const matchesCategory = categoryValue === "all" || assignment.category === categoryValue;
            const matchesStatus = statusValue === "all" || assignment.status === statusValue;
            return matchesSearch && matchesCategory && matchesStatus;
        });

        const cards = filtered.map(function (assignment) {
            return `
                <article class="assignment-card" data-assignment-id="${assignment.id}">
                    <div class="card-top">
                        <span class="category-tag">${jqueryEscapeHTML(assignment.category)}</span>
                        <span class="status-badge status-${jqueryStatusClass(assignment.status)}">${jqueryEscapeHTML(assignment.status)}</span>
                    </div>
                    <h3>${jqueryEscapeHTML(assignment.title)}</h3>
                    <p class="description">${jqueryEscapeHTML(assignment.description)}</p>
                    <div class="card-meta"><span>◷ ${jqueryEscapeHTML(assignment.duration)}</span><span>${jqueryEscapeHTML(assignment.level)}</span></div>
                    <div class="card-actions">
                        <button class="small-button view-button" data-action="view" data-id="${assignment.id}">View details</button>
                        <button class="small-button primary apply-button" data-action="apply" data-id="${assignment.id}">Apply now</button>
                    </div>
                </article>`;
        }).join("");

        $assignmentList.html(cards);
        $("#resultCount").text(`${filtered.length} assignment${filtered.length === 1 ? "" : "s"} found`);
        $("#modeLabel").text("Rendered with jQuery");
        $("#emptyState").toggleClass("hidden", filtered.length !== 0);
    }

    function openAssignmentModalJQuery(id) {
        const assignment = window.portalState.assignments.find(item => item.id === Number(id));
        if (!assignment) return;

        const requirementItems = assignment.requirements.map(item =>
            `<li>${jqueryEscapeHTML(item)}</li>`
        ).join("");

        $modalTitle.text(assignment.title);
        $modalBody.html(`
            <div class="detail-meta"><span>${jqueryEscapeHTML(assignment.category)}</span><span>${jqueryEscapeHTML(assignment.level)}</span><span>${jqueryEscapeHTML(assignment.duration)}</span><span>${jqueryEscapeHTML(assignment.status)}</span></div>
            <p class="modal-description">${jqueryEscapeHTML(assignment.description)}</p>
            <h3 class="small-heading">Requirements</h3><ul class="requirements">${requirementItems}</ul>
            <div class="form-actions"><button class="small-button cancel-modal">Close</button><button class="primary-button modal-apply" data-id="${assignment.id}">Apply for this task</button></div>
        `);
        $modalBackdrop.removeClass("hidden").hide().fadeIn(180);
        $("body").css("overflow", "hidden");
    }

    function closeJQueryModal() {
        $modalBackdrop.fadeOut(160, function () {
            $modalBackdrop.addClass("hidden").show();
            $("body").css("overflow", "");
        });
    }

    window.renderAssignmentsJQuery = function () {
        $.getJSON("data/assignments.json")
            .done(function (data) {
                window.portalState.assignments = data;
                renderAssignmentsJQuery();
                $("#modeLabel").text("Rendered with jQuery AJAX + jQuery DOM methods");
            })
            .fail(function () {
                window.portalState.showToast("jQuery could not load assignments. Check the local server.", "error");
            })
            .always(function () {
                $("#resultCount").attr("data-request-finished", "true");
            });
    };

    $search.on("input", function () {
        if (window.portalState.mode === "jquery") renderAssignmentsJQuery();
    });
    $category.add($status).on("change", function () {
        if (window.portalState.mode === "jquery") renderAssignmentsJQuery();
    });

    $assignmentList.on("click", "button[data-action]", function (event) {
        if (window.portalState.mode !== "jquery") return;
        event.preventDefault();

        const action = $(this).data("action");
        const id = $(this).attr("data-id");

        if (action === "view") {
            openAssignmentModalJQuery(id);
        } else if (action === "apply") {
            const assignment = window.portalState.assignments.find(item => item.id === Number(id));
            if (assignment) {
                window.portalState.openVanillaModal(assignment.id);
            }
        }
    });

    $assignmentList.on("click", ".view-button", function () {
        if (window.portalState.mode !== "jquery") return;
        $(this).closest(".assignment-card").find(".status-badge").toggleClass("highlighted");
    });

    $modalBody.on("submit", "#applicationForm", function (event) {
        if (window.portalState.mode !== "jquery") return;
        event.preventDefault();

        const name = $("#applicantName").val().trim();
        const email = $("#applicantEmail").val().trim();
        const message = $("#applicantMessage").val().trim();

        if (!name || !email || !message) {
            window.portalState.showToast("Please complete all required fields.", "error");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            window.portalState.showToast("Please enter a valid email address.", "error");
            return;
        }

        const serialized = $(this).serializeArray();
        const formValues = Object.fromEntries(serialized.map(item => [item.name, item.value]));
        const saved = JSON.parse(localStorage.getItem("portalApplications") || "[]");
        const assignmentTitle = $(".modal-description strong").text() || "General Internship Application";

        saved.push({
            id: Date.now(),
            name: formValues.name,
            email: formValues.email,
            phone: formValues.phone || "",
            role: formValues.role || "",
            message: formValues.message,
            assignmentTitle,
            date: new Date().toLocaleDateString()
        });

        localStorage.setItem("portalApplications", JSON.stringify(saved));
        closeJQueryModal();
        window.portalState.showToast("Application submitted using the jQuery form handler.");
        window.location.reload();
    });

    $modalBackdrop.on("click", ".close-modal, .cancel-modal", closeJQueryModal);
    $modalBackdrop.on("click", function (event) {
        if (event.target === this) closeJQueryModal();
    });
    $modalBody.on("click", ".modal-apply", function () {
        const id = Number($(this).data("id"));
        const assignment = window.portalState.assignments.find(item => item.id === id);
        if (!assignment) return;
        const formHTML = `
            <p class="modal-description">Applying for: <strong>${jqueryEscapeHTML(assignment.title)}</strong></p>
            <form id="applicationForm" novalidate>
                <div class="form-grid">
                    <div class="form-field"><label for="applicantName">Full name *</label><input id="applicantName" name="name" required maxlength="70"></div>
                    <div class="form-field"><label for="applicantEmail">Email address *</label><input id="applicantEmail" name="email" type="email" required></div>
                    <div class="form-field"><label for="applicantPhone">Phone number</label><input id="applicantPhone" name="phone" type="tel"></div>
                    <div class="form-field"><label for="applicantRole">Preferred role</label><input id="applicantRole" name="role" type="text"></div>
                    <div class="form-field full"><label for="applicantMessage">Why are you applying? *</label><textarea id="applicantMessage" name="message" required maxlength="500"></textarea></div>
                </div>
                <div class="form-actions"><button type="button" class="small-button cancel-modal">Cancel</button><button type="submit" class="primary-button">Submit application</button></div>
            </form>`;
        $modalTitle.text("Submit an application");
        $modalBody.html(formHTML);
    });

    $(".nav-link").each(function (index) {
        $(this).attr("data-nav-index", index);
    });

    $("#notificationButton").one("click", function () {
        $(this).addClass("used");
    });
});
